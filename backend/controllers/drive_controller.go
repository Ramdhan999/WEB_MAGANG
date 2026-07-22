package controllers

import (
	"backend-photobooth/database"
	"backend-photobooth/models"
	"backend-photobooth/services"
	"encoding/base64"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"path"
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
//    3 subfolder sekali (ensureSessionFolders), lalu foto2 nyusul.
//  - Frame final di /result → FinalizeDrive (upload ke "Hasil frame"),
//    balikin drive_url buat QR.
//  - GIF live preview di /result → FinalizeLivePreviewGIF (upload ke
//    "Hasil live preview").
//
// QR di frontend ngarah ke folder induk (DriveURL) — di dalamnya udah ada
// "Hasil jepretan" (foto mentah), "Hasil frame" (frame final), dan
// "Hasil live preview" (GIF slideshow).
// =====================================================================

// ensureMu mencegah folder dibuat dobel kalau beberapa upload foto mentah jalan
// barengan (tiap capture nge-fire goroutine sendiri).
var ensureMu sync.Mutex

// ensureSessionFolders idempotent: bikin folder induk + 3 subfolder SEKALI per
// sesi lalu simpan ID + URL-nya ke DB. Kalau udah ada, langsung balikin.
func ensureSessionFolders(txn string) (*models.PhotoSession, error) {
	ensureMu.Lock()
	defer ensureMu.Unlock()

	var session models.PhotoSession
	if err := database.DB.Where("transaction_id = ?", txn).First(&session).Error; err != nil {
		return nil, fmt.Errorf("session %s gak ketemu: %w", txn, err)
	}

	// Udah pernah dibuat → pakai yang ada, tapi lengkapin dulu subfolder yang
	// belum ada (sesi yang keburu jalan sebelum fitur live preview nongol).
	if session.DriveFolderID != "" {
		backfillLivePreviewFolder(&session)
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
		"drive_folder_id":              folders.ParentID,
		"drive_url":                    folders.WebViewLink,
		"drive_jepretan_folder_id":     folders.JepretanID,
		"drive_frame_folder_id":        folders.FrameID,
		"drive_live_preview_folder_id": folders.LivePreviewID,
	}).Error; err != nil {
		log.Printf("⚠️  gagal simpan drive info (%s): %v", txn, err)
	}

	session.DriveFolderID = folders.ParentID
	session.DriveURL = folders.WebViewLink
	session.DriveJepretanFolderID = folders.JepretanID
	session.DriveFrameFolderID = folders.FrameID
	session.DriveLivePreviewFolderID = folders.LivePreviewID

	log.Printf("📁 Drive folder sesi dibikin (%s): %s", txn, folders.WebViewLink)
	return &session, nil
}

// backfillLivePreviewFolder bikin subfolder "Hasil live preview" buat sesi yang
// folder induknya udah kebikin sebelum fitur ini ada. No-op kalau udah punya.
// Dipanggil dari dalam ensureSessionFolders (udah kepegang ensureMu).
func backfillLivePreviewFolder(session *models.PhotoSession) {
	if session.DriveLivePreviewFolderID != "" || !services.IsDriveEnabled() {
		return
	}

	ctx, cancel := services.DriveContext()
	defer cancel()

	id, err := services.CreateSubfolder(ctx, session.DriveFolderID, services.FolderLivePreview)
	if err != nil {
		log.Printf("⚠️  gagal bikin subfolder %q (%s): %v", services.FolderLivePreview, session.TransactionID, err)
		return
	}

	if err := database.DB.Model(session).Update("drive_live_preview_folder_id", id).Error; err != nil {
		log.Printf("⚠️  gagal simpan ID subfolder live preview (%s): %v", session.TransactionID, err)
	}
	session.DriveLivePreviewFolderID = id
	log.Printf("📁 subfolder %q nyusul dibikin (%s)", services.FolderLivePreview, session.TransactionID)
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

// FinalizeLivePreviewGIF — POST /api/photo-session/by-transaction/:txn/drive/live-preview
// Body JSON: { "photos": ["http://localhost:8080/photos/sessions/<txn>/a.jpg", ...], "delay_ms": 500 }
//
// Bikin GIF animasi dari foto-foto yang tadi diputer di Live Preview (urutan &
// kecepatannya ngikutin yang di layar), terus upload ke subfolder
// "Hasil live preview".
func FinalizeLivePreviewGIF(c *gin.Context) {
	txn := c.Param("transaction_id")

	var body struct {
		Photos  []string `json:"photos"`
		DelayMs int      `json:"delay_ms"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || len(body.Photos) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "daftar photos kosong"})
		return
	}

	if !services.IsDriveEnabled() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "google drive belum dikonfigurasi"})
		return
	}

	// URL foto → file di disk. Foto dummy (picsum) nggak punya file lokal, jadi
	// otomatis ke-skip di sini.
	var paths []string
	for _, u := range body.Photos {
		if p := photoURLToDiskPath(u); p != "" {
			paths = append(paths, p)
		}
	}
	if len(paths) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "nggak ada foto lokal yang bisa dijadiin GIF"})
		return
	}

	data, err := services.BuildLivePreviewGIF(paths, body.DelayMs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "bikin GIF gagal: " + err.Error()})
		return
	}

	session, err := ensureSessionFolders(txn)
	if err != nil || session.DriveLivePreviewFolderID == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("drive folder belum siap: %v", err)})
		return
	}

	ctx, cancel := services.DriveContext()
	defer cancel()

	name := fmt.Sprintf("live-preview-%d.gif", time.Now().Unix())
	if err := services.UploadBytesToFolder(ctx, session.DriveLivePreviewFolderID, name, data); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "upload GIF ke drive gagal: " + err.Error()})
		return
	}

	log.Printf("☁️  live preview GIF → Drive (%s): %s (%d foto, %d KB)", txn, name, len(paths), len(data)/1024)
	c.JSON(http.StatusOK, gin.H{
		"drive_url": session.DriveURL,
		"photos":    len(paths),
		"size_kb":   len(data) / 1024,
	})
}

// photoURLToDiskPath ubah URL foto (".../photos/sessions/<txn>/x.jpg") jadi path
// file di disk. Balikin "" kalau bukan foto lokal (mis. dummy picsum).
func photoURLToDiskPath(rawURL string) string {
	n := strings.ReplaceAll(rawURL, "\\", "/")

	i := strings.Index(n, "/photos/")
	if i < 0 {
		return ""
	}
	rel := n[i+len("/photos/"):]

	if q := strings.IndexAny(rel, "?#"); q >= 0 {
		rel = rel[:q]
	}
	if unescaped, err := url.PathUnescape(rel); err == nil {
		rel = unescaped
	}

	// Clean di atas "/" biar ".." kebuang — path dari request nggak boleh
	// nyasar keluar dari folder foto.
	rel = strings.TrimPrefix(path.Clean("/"+rel), "/")
	if rel == "" || rel == "." {
		return ""
	}
	return filepath.Join("hasil_foto_dslr", filepath.FromSlash(rel))
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
