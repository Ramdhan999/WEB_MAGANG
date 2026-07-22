package controllers

import (
	"backend-photobooth/database"
	"backend-photobooth/models"
	"backend-photobooth/services"
	"encoding/base64"
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// =====================================================================
// Google Drive orchestration
//
// Alur (opsi B):
//  - Foto mentah tiap kali di-jepret di /kamera → EnqueueRawPhotoUpload
//    (background). Foto PERTAMA yang masuk bakal bikin folder induk +
//    2 subfolder sekali (ensureSessionFolders), lalu foto2 nyusul.
//  - Frame final di /result → FinalizeDrive (upload ke "Hasil frame"),
//    balikin drive_url buat QR.
//
// QR di frontend ngarah ke folder induk (DriveURL) — di dalamnya udah ada
// "Hasil jepretan" (foto mentah) + "Hasil frame" (frame final).
// =====================================================================

// ensureMu mencegah folder dibuat dobel kalau beberapa upload foto mentah jalan
// barengan (tiap capture nge-fire goroutine sendiri).
var ensureMu sync.Mutex

// ensureSessionFolders idempotent: bikin folder induk + 2 subfolder SEKALI per
// sesi lalu simpan ID + URL-nya ke DB. Kalau udah ada, langsung balikin.
func ensureSessionFolders(txn string) (*models.PhotoSession, error) {
	ensureMu.Lock()
	defer ensureMu.Unlock()

	var session models.PhotoSession
	if err := database.DB.Where("transaction_id = ?", txn).First(&session).Error; err != nil {
		return nil, fmt.Errorf("session %s gak ketemu: %w", txn, err)
	}

	// Udah pernah dibuat → pakai yang ada.
	if session.DriveFolderID != "" {
		return &session, nil
	}
	if !services.IsDriveEnabled() {
		return &session, fmt.Errorf("google drive belum dikonfigurasi")
	}

	ctx, cancel := services.DriveContext()
	defer cancel()

	name := fmt.Sprintf("Hasil foto kamu — %s", txn)
	folders, err := services.CreateSessionFolders(ctx, name)
	if err != nil {
		return &session, err
	}

	// Simpan ke DB.
	if err := database.DB.Model(&session).Updates(map[string]interface{}{
		"drive_folder_id":          folders.ParentID,
		"drive_url":                folders.WebViewLink,
		"drive_jepretan_folder_id": folders.JepretanID,
		"drive_frame_folder_id":    folders.FrameID,
	}).Error; err != nil {
		log.Printf("⚠️  gagal simpan drive info (%s): %v", txn, err)
	}

	session.DriveFolderID = folders.ParentID
	session.DriveURL = folders.WebViewLink
	session.DriveJepretanFolderID = folders.JepretanID
	session.DriveFrameFolderID = folders.FrameID

	log.Printf("📁 Drive folder sesi dibikin (%s): %s", txn, folders.WebViewLink)
	return &session, nil
}

// EnqueueRawPhotoUpload upload SATU foto mentah ke subfolder "Hasil jepretan"
// secara non-blocking (dipanggil dari CapturePhoto/CaptureUpload). No-op kalau
// Drive nggak aktif. `absPath` = path file di disk (bukan URL). `photoID` boleh
// 0 kalau nggak mau nandain drive_uploaded.
func EnqueueRawPhotoUpload(txn string, photoID uint, absPath string) {
	if !services.IsDriveEnabled() || txn == "" || absPath == "" {
		return
	}
	go func() {
		session, err := ensureSessionFolders(txn)
		if err != nil || session.DriveJepretanFolderID == "" {
			log.Printf("⚠️  drive folder belum siap (%s): %v — foto di-skip", txn, err)
			return
		}

		ctx, cancel := services.DriveContext()
		defer cancel()

		name := filepath.Base(absPath)
		if err := services.UploadFileToFolder(ctx, session.DriveJepretanFolderID,
			services.DriveUpload{LocalPath: absPath, Name: name}); err != nil {
			log.Printf("⚠️  upload foto mentah ke Drive gagal (%s, %s): %v", txn, name, err)
			return
		}

		if photoID != 0 {
			database.DB.Model(&models.Photo{}).Where("id = ?", photoID).Update("drive_uploaded", true)
		}
		log.Printf("☁️  foto mentah → Drive (%s): %s", txn, name)
	}()
}

// FinalizeDrive — POST /api/photo-session/by-transaction/:txn/drive/finalize
// Body JSON: { "image": "data:image/png;base64,...." }  (frame final dari result)
// Upload frame ke subfolder "Hasil frame", lalu balikin drive_url buat QR.
func FinalizeDrive(c *gin.Context) {
	txn := c.Param("transaction_id")

	var body struct {
		Image string `json:"image"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || strings.TrimSpace(body.Image) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "image kosong"})
		return
	}

	if !services.IsDriveEnabled() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "google drive belum dikonfigurasi"})
		return
	}

	data, ext, err := decodeDataURL(body.Image)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "format image invalid: " + err.Error()})
		return
	}

	session, err := ensureSessionFolders(txn)
	if err != nil || session.DriveFrameFolderID == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("drive folder belum siap: %v", err)})
		return
	}

	ctx, cancel := services.DriveContext()
	defer cancel()

	name := fmt.Sprintf("frame-final-%d.%s", time.Now().Unix(), ext)
	if err := services.UploadBytesToFolder(ctx, session.DriveFrameFolderID, name, data); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "upload frame ke drive gagal: " + err.Error()})
		return
	}

	log.Printf("☁️  frame final → Drive (%s): %s", txn, name)
	c.JSON(http.StatusOK, gin.H{
		"drive_url": session.DriveURL,
		"ready":     session.DriveURL != "",
	})
}

// GetSessionDrive — GET /api/photo-session/by-transaction/:txn/drive
// Buat frontend ngambil drive_url (mis. buat nampilin QR duluan tanpa nunggu
// finalize, karena folder + foto mentah udah dibikin pas /kamera).
func GetSessionDrive(c *gin.Context) {
	txn := c.Param("transaction_id")

	var session models.PhotoSession
	if err := database.DB.Where("transaction_id = ?", txn).First(&session).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session gak ketemu"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"drive_url":       session.DriveURL,
		"drive_folder_id": session.DriveFolderID,
		"ready":           session.DriveURL != "",
	})
}

// decodeDataURL parse "data:image/png;base64,XXXX" → ([]byte, ext).
func decodeDataURL(dataURL string) ([]byte, string, error) {
	i := strings.Index(dataURL, ",")
	if i < 0 {
		return nil, "", fmt.Errorf("bukan data URL")
	}
	meta := dataURL[:i]
	b64 := dataURL[i+1:]

	ext := "png"
	switch {
	case strings.Contains(meta, "image/jpeg"), strings.Contains(meta, "image/jpg"):
		ext = "jpg"
	case strings.Contains(meta, "image/webp"):
		ext = "webp"
	case strings.Contains(meta, "image/png"):
		ext = "png"
	}

	data, err := base64.StdEncoding.DecodeString(strings.TrimSpace(b64))
	if err != nil {
		return nil, "", err
	}
	return data, ext, nil
}
