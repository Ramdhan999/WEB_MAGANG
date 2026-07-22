package controllers

import (
	"backend-photobooth/database"
	"backend-photobooth/models"
	"backend-photobooth/services"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ===== REQUEST STRUCTS =====
type UpsertSessionRequest struct {
	TransactionID string `json:"transaction_id" binding:"required"`
	FrameID       string `json:"frame_id"`
	TemplateName  string `json:"template_name"`
}

type CaptureUploadRequest struct {
	Image string `json:"image" binding:"required"` // data URL base64 dari frontend
}

// =====================================================================
// POST /api/photo-session/upsert
// Bikin atau update PhotoSession by transaction_id (RACE-SAFE)
// =====================================================================
func UpsertPhotoSession(c *gin.Context) {
	var req UpsertSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Validasi: transaksi harus exist & udah lunas
	var tx models.Transaction
	if err := database.DB.Where("transaction_id = ?", req.TransactionID).First(&tx).Error; err != nil {
		c.JSON(404, gin.H{"error": "Transaksi tidak ditemukan"})
		return
	}
	if tx.Status != "success" {
		c.JSON(400, gin.H{"error": "Transaksi belum dibayar"})
		return
	}

	// Coba cari session yang udah ada dulu
	var session models.PhotoSession
	findErr := database.DB.Where("transaction_id = ?", req.TransactionID).First(&session).Error

	if findErr != nil && errors.Is(findErr, gorm.ErrRecordNotFound) {
		// Belum ada → coba CREATE
		session = models.PhotoSession{
			TransactionID: req.TransactionID,
			FrameID:       req.FrameID,
			TemplateName:  req.TemplateName,
			PaymentStatus: "none",
		}
		createErr := database.DB.Create(&session).Error

		if createErr != nil {
			// RACE CONDITION GUARD:
			// Bisa jadi ada request lain yang baru aja CREATE record yang sama.
			// Coba fetch lagi — kalo ketemu, fall through ke update path.
			refetchErr := database.DB.Where("transaction_id = ?", req.TransactionID).First(&session).Error
			if refetchErr != nil {
				// Beneran gagal — bukan race condition
				c.JSON(500, gin.H{"error": "Gagal buat session: " + createErr.Error()})
				return
			}
			// Race condition: lanjut ke smart update di bawah
			fmt.Printf("⚠️  Race condition di UpsertPhotoSession buat txn %s, fall back ke update\n", req.TransactionID)
		} else {
			// CREATE sukses — langsung return
			c.JSON(200, session)
			return
		}
	} else if findErr != nil {
		// Error lain (bukan record not found)
		c.JSON(500, gin.H{"error": "Gagal cek session: " + findErr.Error()})
		return
	}

	// UPDATE PATH (session udah ada — entah karena memang exist, atau race condition tadi)
	// Smart update: cuma overwrite kalo value baru gak kosong
	changed := false
	if req.FrameID != "" && req.FrameID != session.FrameID {
		session.FrameID = req.FrameID
		changed = true
	}
	if req.TemplateName != "" && req.TemplateName != session.TemplateName {
		session.TemplateName = req.TemplateName
		changed = true
	}

	if changed {
		if err := database.DB.Save(&session).Error; err != nil {
			c.JSON(500, gin.H{"error": "Gagal update session: " + err.Error()})
			return
		}
	}

	c.JSON(200, session)
}

// =====================================================================
// POST /api/photo-session/:session_id/capture[?dummy=true]
// =====================================================================
func CapturePhoto(c *gin.Context) {
	sessionIDStr := c.Param("session_id")
	isDummy := c.Query("dummy") == "true"

	var session models.PhotoSession
	if err := database.DB.First(&session, sessionIDStr).Error; err != nil {
		c.JSON(404, gin.H{"error": "Session tidak ditemukan"})
		return
	}

	var photoCount int64
	database.DB.Model(&models.Photo{}).Where("session_id = ?", session.ID).Count(&photoCount)
	slotNumber := int(photoCount) + 1

	var urlPath string
	var diskPath string // 🎯 path disk mentah — dipakai buat upload ke Drive (kosong kalau dummy)

	if isDummy {
		urlPath = fmt.Sprintf("https://picsum.photos/seed/%d/1200/800", time.Now().UnixNano())
		fmt.Printf("📸 [DUMMY] Photo created: %s\n", urlPath)
	} else {
		dp, err := services.TriggerCapture(session.TransactionID)
		if err != nil {
			c.JSON(500, gin.H{"error": "Gagal trigger kamera: " + err.Error()})
			return
		}
		diskPath = dp
		urlPath = convertDiskPathToURL(diskPath)
	}

	photo := models.Photo{
		SessionID:  session.ID,
		PhotoPath:  urlPath,
		SlotNumber: slotNumber,
	}
	if err := database.DB.Create(&photo).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal simpen photo ke DB: " + err.Error()})
		return
	}

	// 🎯 Upload foto mentah ke Google Drive (background, non-blocking).
	//    Skip buat dummy (nggak ada file fisik di disk).
	if !isDummy && diskPath != "" {
		EnqueueRawPhotoUpload(session.TransactionID, photo.ID, diskPath)
	}

	c.JSON(200, gin.H{
		"id":           photo.ID,
		"photo_path":   photo.PhotoPath,
		"slot_number":  photo.SlotNumber,
		"total_photos": slotNumber,
		"is_dummy":     isDummy,
	})
}

// =====================================================================
// POST /api/photo-session/:session_id/capture-upload
// Nerima 1 frame webcam (base64) dari frontend, simpen sebagai foto sesi.
// Dipake di MODE SIMULASI (webcam laptop) biar preview nampilin foto ASLI,
// bukan random. Cara nyimpen + format URL sama persis kayak capture DSLR.
// =====================================================================
func CaptureUpload(c *gin.Context) {
	sessionIDStr := c.Param("session_id")

	var req CaptureUploadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Body gak valid: " + err.Error()})
		return
	}

	var session models.PhotoSession
	if err := database.DB.First(&session, sessionIDStr).Error; err != nil {
		c.JSON(404, gin.H{"error": "Session tidak ditemukan"})
		return
	}

	// Buang prefix "data:image/jpeg;base64," kalo ada
	raw := req.Image
	if idx := strings.Index(raw, ","); idx != -1 {
		raw = raw[idx+1:]
	}
	imgBytes, err := base64.StdEncoding.DecodeString(raw)
	if err != nil {
		c.JSON(400, gin.H{"error": "Gagal decode gambar: " + err.Error()})
		return
	}

	// Simpan ke folder sesi (pola sama kayak DSLR: hasil_foto_dslr/sessions/<txn>/)
	sessionDir := filepath.Join("hasil_foto_dslr", "sessions", session.TransactionID)
	if err := os.MkdirAll(sessionDir, 0755); err != nil {
		c.JSON(500, gin.H{"error": "Gagal buat folder: " + err.Error()})
		return
	}
	fileName := fmt.Sprintf("webcam_%d.jpg", time.Now().UnixNano())
	diskPath := filepath.Join(sessionDir, fileName)
	if err := os.WriteFile(diskPath, imgBytes, 0644); err != nil {
		c.JSON(500, gin.H{"error": "Gagal simpan file: " + err.Error()})
		return
	}

	urlPath := convertDiskPathToURL(diskPath)

	var photoCount int64
	database.DB.Model(&models.Photo{}).Where("session_id = ?", session.ID).Count(&photoCount)
	slotNumber := int(photoCount) + 1

	photo := models.Photo{
		SessionID:  session.ID,
		PhotoPath:  urlPath,
		SlotNumber: slotNumber,
	}
	if err := database.DB.Create(&photo).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal simpen photo ke DB: " + err.Error()})
		return
	}

	// 🎯 Upload foto webcam (sim) ke Google Drive juga (background, non-blocking).
	EnqueueRawPhotoUpload(session.TransactionID, photo.ID, diskPath)

	fmt.Printf("📸 [WEBCAM] Photo saved: %s\n", diskPath)
	c.JSON(200, gin.H{
		"id":           photo.ID,
		"photo_path":   photo.PhotoPath,
		"slot_number":  photo.SlotNumber,
		"total_photos": slotNumber,
		"is_webcam":    true,
	})
}

// =====================================================================
// GET /api/photo-session/:session_id/photos
// =====================================================================
func GetSessionPhotos(c *gin.Context) {
	sessionIDStr := c.Param("session_id")

	var photos []models.Photo
	database.DB.Where("session_id = ?", sessionIDStr).Order("slot_number ASC").Find(&photos)

	c.JSON(200, photos)
}

// =====================================================================
// GET /api/photo-session/by-transaction/:transaction_id
// =====================================================================
func GetSessionByTransaction(c *gin.Context) {
	transactionID := c.Param("transaction_id")

	var session models.PhotoSession
	err := database.DB.Preload("Photos").
		Where("transaction_id = ?", transactionID).
		First(&session).Error
	if err != nil {
		c.JSON(404, gin.H{"error": "Session tidak ditemukan untuk transaksi ini"})
		return
	}

	var template models.Template
	templateFound := database.DB.Where("name = ?", session.TemplateName).First(&template).Error == nil

	var transaction models.Transaction
	database.DB.Where("transaction_id = ?", transactionID).First(&transaction)

	var pkg models.Package
	packageFound := database.DB.Where("package_id = ?", transaction.PackageID).First(&pkg).Error == nil

	response := gin.H{
		"session": session,
	}
	if templateFound {
		response["template"] = template
	} else {
		response["template"] = nil
	}
	if packageFound {
		response["package"] = pkg
		response["duration_seconds"] = pkg.Duration * 60
	} else {
		response["package"] = nil
		response["duration_seconds"] = 300
	}

	c.JSON(200, response)
}

// ===== HELPER =====
func convertDiskPathToURL(diskPath string) string {
	normalized := strings.ReplaceAll(diskPath, "\\", "/")
	for _, prefix := range []string{"./hasil_foto_dslr/", "hasil_foto_dslr/"} {
		if strings.HasPrefix(normalized, prefix) {
			normalized = strings.TrimPrefix(normalized, prefix)
			break
		}
	}
	return fmt.Sprintf("http://localhost:8080/photos/%s", normalized)
}

var _ = http.StatusOK
