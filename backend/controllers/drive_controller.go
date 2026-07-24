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
	"os"
	"path"
	"path/filepath"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
)

// =====================================================================
// Google Drive orchestration
//
// Struktur: SATU folder flat per sesi (tanpa subfolder):
//   Hasil foto kamu — <txn>/  ← QR ngarah ke sini
//    ├── foto-1.jpg, foto-2.jpg, ...  (urut nomor jepretan)
//    ├── strip.png                    (frame final dari /result)
//    └── live-preview.gif             (GIF slideshow live preview)
//
// Alur:
//  - Tiap jepretan di /kamera → EnqueueRawPhotoUpload (background). Foto
//    PERTAMA yang masuk bikin folder sesi sekali (ensureSessionFolder).
//  - Frame final di /result → FinalizeDrive (upload strip + SWEEP ulang foto
//    yang gagal upload pas sesi), balikin drive_url buat QR.
//  - GIF live preview di /result → FinalizeLivePreviewGIF.
//
// Upload per-capture bisa aja gagal (koneksi/timeout). Itu BUKAN akhir:
// foto yang drive_uploaded-nya masih false di-upload ulang pas FinalizeDrive
// (sweepUnuploadedPhotos) — jadi jumlah di Drive == jumlah jepretan.
// =====================================================================

// ensureMu mencegah folder dibuat dobel kalau beberapa upload foto mentah jalan
// barengan (tiap capture nge-fire goroutine sendiri).
var ensureMu sync.Mutex

// ensureSessionFolder idempotent: bikin folder sesi SEKALI lalu simpan ID +
// URL-nya ke DB. Kalau udah ada, langsung balikin.
func ensureSessionFolder(txn string) (*models.PhotoSession, error) {
	ensureMu.Lock()
	defer ensureMu.Unlock()

	var session models.PhotoSession
	if err := database.DB.Where("transaction_id = ?", txn).First(&session).Error; err != nil {
		return nil, fmt.Errorf("session %s gak ketemu: %w", txn, err)
	}
	if session.DriveFolderID != "" {
		return &session, nil
	}
	if !services.IsDriveEnabled() {
		return &session, fmt.Errorf("google drive belum dikonfigurasi")
	}

	ctx, cancel := services.DriveContext()
	defer cancel()

	name := fmt.Sprintf("Hasil foto kamu — %s", txn)
	folderID, link, err := services.CreateSharedFolder(ctx, name)
	if err != nil {
		return &session, err
	}

	if err := database.DB.Model(&session).Updates(map[string]interface{}{
		"drive_folder_id": folderID,
		"drive_url":       link,
	}).Error; err != nil {
		log.Printf("⚠️  gagal simpan drive info (%s): %v", txn, err)
	}

	session.DriveFolderID = folderID
	session.DriveURL = link

	log.Printf("📁 Drive folder sesi dibikin (%s): %s", txn, link)
	return &session, nil
}

// rawPhotoDriveName nama file foto mentah di Drive: foto-<slot>.<ext>.
func rawPhotoDriveName(slotNumber int, absPath string) string {
	ext := strings.ToLower(filepath.Ext(absPath))
	if ext == "" {
		ext = ".jpg"
	}
	return fmt.Sprintf("foto-%d%s", slotNumber, ext)
}

// EnqueueRawPhotoUpload upload SATU foto mentah ke folder sesi secara
// non-blocking (dipanggil dari CapturePhoto/CaptureUpload). No-op kalau Drive
// nggak aktif. `absPath` = path file di disk (bukan URL). Kalau gagal, foto
// bakal ke-sapu ulang pas FinalizeDrive (lihat sweepUnuploadedPhotos).
func EnqueueRawPhotoUpload(txn string, photoID uint, absPath string, slotNumber int) {
	if !services.IsDriveEnabled() || txn == "" || absPath == "" {
		return
	}
	go func() {
		session, err := ensureSessionFolder(txn)
		if err != nil || session.DriveFolderID == "" {
			log.Printf("⚠️  drive folder belum siap (%s): %v — foto nyusul pas finalize", txn, err)
			return
		}

		ctx, cancel := services.DriveContext()
		defer cancel()

		name := rawPhotoDriveName(slotNumber, absPath)
		if err := services.UploadFileToFolder(ctx, session.DriveFolderID,
			services.DriveUpload{LocalPath: absPath, Name: name}); err != nil {
			log.Printf("⚠️  upload foto mentah ke Drive gagal (%s, %s): %v — nyusul pas finalize", txn, name, err)
			return
		}

		if photoID != 0 {
			database.DB.Model(&models.Photo{}).Where("id = ?", photoID).Update("drive_uploaded", true)
		}
		log.Printf("☁️  foto mentah → Drive (%s): %s", txn, name)
	}()
}

// sweepUnuploadedPhotos JARING PENGAMAN: upload ulang semua foto sesi yang
// drive_uploaded-nya masih false (upload per-capture-nya sempat gagal, atau
// Drive baru aktif di tengah sesi). Dipanggil background dari FinalizeDrive.
// Inilah yang mastiin 12 jepretan = 12 file di Drive.
func sweepUnuploadedPhotos(txn string) {
	session, err := ensureSessionFolder(txn)
	if err != nil || session.DriveFolderID == "" {
		log.Printf("⚠️  sweep drive gagal (%s): folder belum siap — %v", txn, err)
		return
	}

	var photos []models.Photo
	if err := database.DB.
		Where("session_id = ? AND drive_uploaded = ?", session.ID, false).
		Order("slot_number ASC").Find(&photos).Error; err != nil {
		log.Printf("⚠️  sweep drive gagal query foto (%s): %v", txn, err)
		return
	}
	if len(photos) == 0 {
		return
	}
	log.Printf("🧹 sweep drive (%s): %d foto belum keupload, dicoba ulang", txn, len(photos))

	for _, p := range photos {
		diskPath := photoURLToDiskPath(p.PhotoPath)
		if diskPath == "" {
			continue // foto dummy (picsum) — nggak ada file lokal
		}
		if _, err := os.Stat(diskPath); err != nil {
			log.Printf("⚠️  sweep drive (%s): file %s gak ketemu di disk", txn, diskPath)
			continue
		}

		ctx, cancel := services.DriveContext()
		name := rawPhotoDriveName(p.SlotNumber, diskPath)
		err := services.UploadFileToFolder(ctx, session.DriveFolderID,
			services.DriveUpload{LocalPath: diskPath, Name: name})
		cancel()
		if err != nil {
			log.Printf("⚠️  sweep drive (%s, %s): masih gagal — %v", txn, name, err)
			continue
		}
		database.DB.Model(&models.Photo{}).Where("id = ?", p.ID).Update("drive_uploaded", true)
		log.Printf("☁️  sweep drive (%s): %s akhirnya keupload", txn, name)
	}
}

// FinalizeDrive — POST /api/photo-session/by-transaction/:txn/drive/finalize
// Body JSON: { "image": "data:image/png;base64,...." }  (frame final dari result)
// Upload strip ke folder sesi + sweep ulang foto yang belum keupload, lalu
// balikin drive_url buat QR.
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

	session, err := ensureSessionFolder(txn)
	if err != nil || session.DriveFolderID == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("drive folder belum siap: %v", err)})
		return
	}

	ctx, cancel := services.DriveContext()
	defer cancel()

	name := fmt.Sprintf("strip.%s", ext)
	if err := services.UploadBytesToFolder(ctx, session.DriveFolderID, name, data); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "upload frame ke drive gagal: " + err.Error()})
		return
	}
	log.Printf("☁️  strip final → Drive (%s): %s", txn, name)

	// Jaring pengaman: foto jepretan yang upload per-capture-nya gagal
	// disapu ulang di background — jangan blokir respons QR.
	go sweepUnuploadedPhotos(txn)

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

	session, err := ensureSessionFolder(txn)
	if err != nil || session.DriveFolderID == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("drive folder belum siap: %v", err)})
		return
	}

	ctx, cancel := services.DriveContext()
	defer cancel()

	name := "live-preview.gif"
	if err := services.UploadBytesToFolder(ctx, session.DriveFolderID, name, data); err != nil {
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
