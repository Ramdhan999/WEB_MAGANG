package controllers

import (
	"encoding/base64"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"backend-photobooth/database"
	"backend-photobooth/models"
	"backend-photobooth/services"

	"github.com/gin-gonic/gin"
	"github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/snap"
)

// =====================================================================
// PRINT CONTROLLER
// ---------------------------------------------------------------------
// Endpoints:
//   POST /api/print/extra    → CreatePrintPayment (Midtrans token cetak tambahan)
//   POST /api/print/done     → ConfirmPrint (mark output_type=Cetak)
//   POST /api/digital/done   → ConfirmDigital (mark output_type=Digital)
//   POST /api/print/execute  → PrintExecute (trigger printer beneran)
// =====================================================================

// ── REQUEST TYPES ────────────────────────────────────────────────────

type PrintExtraRequest struct {
	TransactionID string `json:"transaction_id" binding:"required"`
	Qty           int    `json:"qty" binding:"required,min=1,max=5"`
}

type PrintDoneRequest struct {
	TransactionID string `json:"transaction_id" binding:"required"`
	Qty           int    `json:"qty"`
}

type DigitalDoneRequest struct {
	TransactionID string `json:"transaction_id" binding:"required"`
	Qty           int    `json:"qty"`
}

type PrintExecuteRequest struct {
	TransactionID string `json:"transaction_id" binding:"required"`
	Qty           int    `json:"qty" binding:"required,min=1,max=10"`
	ImageBase64   string `json:"image_base64" binding:"required"`
}

// =====================================================================
// POST /api/print/extra
// Generate Midtrans token buat cetak tambahan
// =====================================================================
func CreatePrintPayment(c *gin.Context) {
	var req PrintExtraRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Cek transaksi ada
	var tx models.Transaction
	if err := database.DB.Where("transaction_id = ?", req.TransactionID).First(&tx).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaksi gak ketemu"})
		return
	}

	// Harga per cetakan tambahan
	const hargaPerExtra = 10000
	totalAmount := int64(req.Qty * hargaPerExtra)

	// Generate Midtrans Snap token langsung pakai SDK
	orderID := fmt.Sprintf("PRINT-%s-%d", req.TransactionID, time.Now().Unix())

	snapClient := snap.Client{}
	snapClient.New(midtrans.ServerKey, midtrans.Environment)

	snapReq := &snap.Request{
		TransactionDetails: midtrans.TransactionDetails{
			OrderID:  orderID,
			GrossAmt: totalAmount,
		},
		Items: &[]midtrans.ItemDetails{
			{
				ID:    "PRINT-EXTRA",
				Name:  fmt.Sprintf("Cetak Tambahan %d lembar", req.Qty),
				Price: hargaPerExtra,
				Qty:   int32(req.Qty),
			},
		},
	}

	resp, errMidtrans := snapClient.CreateTransaction(snapReq)
	if errMidtrans != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate token: " + errMidtrans.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":    resp.Token,
		"order_id": orderID,
		"amount":   totalAmount,
		"qty":      req.Qty,
	})
}

// =====================================================================
// POST /api/print/done
// Tandai PhotoSession output_type=Cetak
// =====================================================================
func ConfirmPrint(c *gin.Context) {
	var req PrintDoneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var ps models.PhotoSession
	if err := database.DB.Where("transaction_id = ?", req.TransactionID).First(&ps).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session gak ketemu"})
		return
	}

	ps.OutputType = "Cetak"
	if err := database.DB.Save(&ps).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update session"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "qty": req.Qty})
}

// =====================================================================
// POST /api/digital/done
// Tandai PhotoSession output_type=Digital
// =====================================================================
func ConfirmDigital(c *gin.Context) {
	var req DigitalDoneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var ps models.PhotoSession
	if err := database.DB.Where("transaction_id = ?", req.TransactionID).First(&ps).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Session gak ketemu"})
		return
	}

	ps.OutputType = "Digital"
	if err := database.DB.Save(&ps).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update session"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// =====================================================================
// POST /api/print/execute  ⭐ BARU
// Trigger printer beneran — terima image base64 + qty
// Body: { transaction_id, qty, image_base64 }
// qty = 1 + extraCetak (default 1 + tambahan)
// =====================================================================
func PrintExecute(c *gin.Context) {
	var req PrintExecuteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Cek transaksi ada
	var tx models.Transaction
	if err := database.DB.Where("transaction_id = ?", req.TransactionID).First(&tx).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaksi gak ketemu"})
		return
	}

	// 2. Decode base64 image — format "data:image/jpeg;base64,xxxxx" — strip prefix
	b64 := req.ImageBase64
	if idx := strings.Index(b64, ","); idx >= 0 {
		b64 = b64[idx+1:]
	}
	imgBytes, errDecode := base64.StdEncoding.DecodeString(b64)
	if errDecode != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image base64 invalid: " + errDecode.Error()})
		return
	}

	// 3. Save ke disk
	sessionDir := filepath.Join("hasil_foto_dslr", "sessions", req.TransactionID)
	if err := os.MkdirAll(sessionDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal bikin folder: " + err.Error()})
		return
	}

	ts := time.Now().UnixMilli()
	filename := fmt.Sprintf("print_%d.jpg", ts)
	filePath := filepath.Join(sessionDir, filename)

	if err := os.WriteFile(filePath, imgBytes, 0644); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal save image: " + err.Error()})
		return
	}

	// 4. Trigger printer
	if errPrint := services.PrintImage(filePath, req.Qty); errPrint != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":     "Print gagal: " + errPrint.Error(),
			"file_path": filePath,
			"hint":      "Cek nama printer di services/printer.go atau pastiin printer nyala",
		})
		return
	}

	// 5. Update DB
	var ps models.PhotoSession
	if err := database.DB.Where("transaction_id = ?", req.TransactionID).First(&ps).Error; err == nil {
		ps.OutputType = "Cetak"
		database.DB.Save(&ps)
	}

	_ = tx // dipake buat validasi exists, gak perlu return

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"qty":       req.Qty,
		"printer":   services.PrinterName,
		"file_path": filePath,
	})
}
