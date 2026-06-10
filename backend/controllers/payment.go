package controllers

import (
	"backend-photobooth/database"
	"backend-photobooth/models"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/snap"
)

// ===== REQUEST STRUCTS =====
type PaymentRequest struct {
	Paket   string `json:"paket" binding:"required"`
	Voucher string `json:"voucher"` // optional — kode voucher buat diskon
}

type PaymentConfirmRequest struct {
	TransactionID  string                 `json:"transaction_id" binding:"required"`
	MidtransResult map[string]interface{} `json:"midtrans_result"`
}

type FreeTransactionRequest struct {
	Paket   string `json:"paket" binding:"required"`
	Voucher string `json:"voucher" binding:"required"`
}

// ===== HELPER: Generate Transaction ID Unik =====
func generateTransactionID() string {
	b := make([]byte, 2)
	rand.Read(b)
	return fmt.Sprintf("TXN-%s-%s",
		time.Now().Format("20060102-150405"),
		strings.ToUpper(hex.EncodeToString(b)))
}

// =====================================================================
// POST /api/payment
// Inisiasi pembayaran. Support voucher diskon (optional).
// Body: { paket: "premium", voucher: "GLAMBOT" (optional) }
// =====================================================================
func CreatePayment(c *gin.Context) {
	var req PaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Body request gak valid: " + err.Error()})
		return
	}

	// 1. LOOKUP PAKET DARI DB
	var pkg models.Package
	if err := database.DB.Where("package_id = ? AND is_active = ?", req.Paket, true).First(&pkg).Error; err != nil {
		c.JSON(404, gin.H{"error": "Paket tidak ditemukan atau sudah dinonaktifkan"})
		return
	}

	// 2. HITUNG HARGA — apply voucher kalau ada
	finalPrice := pkg.Price
	discountAmount := 0
	voucherCode := ""

	if strings.TrimSpace(req.Voucher) != "" {
		code := strings.ToUpper(strings.TrimSpace(req.Voucher))
		var voucher models.Voucher
		err := database.DB.Where("code = ?", code).First(&voucher).Error

		if err == nil && voucher.IsActive {
			expiredOK := voucher.ExpiredAt.IsZero() || time.Now().Before(voucher.ExpiredAt)
			quotaOK := voucher.Quota <= 0 || voucher.Used < voucher.Quota

			if expiredOK && quotaOK {
				finalPrice, discountAmount = applyVoucherDiscount(pkg.Price, voucher)
				voucherCode = code
			}
		}
	}

	// Kalau harga jadi 0 (voucher gratis lewat sini), arahkan ke flow gratis
	if finalPrice <= 0 {
		c.JSON(400, gin.H{
			"error":    "Voucher ini gratis total. Pake endpoint /api/payment/free.",
			"is_free":  true,
			"redirect": "free",
		})
		return
	}

	// 3. Generate IDs
	transactionID := generateTransactionID()
	orderID := fmt.Sprintf("GLAMBOT-%d", time.Now().Unix())

	// 4. SIMPEN TRANSACTION (status: pending)
	tx := models.Transaction{
		TransactionID:  transactionID,
		OrderID:        orderID,
		PackageID:      pkg.PackageID,
		Amount:         finalPrice, // harga SETELAH diskon
		PaymentType:    "qris",
		Status:         "pending",
		VoucherCode:    voucherCode,
		DiscountAmount: discountAmount,
	}
	if err := database.DB.Create(&tx).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal simpen transaksi: " + err.Error()})
		return
	}

	// 5. BIKIN MIDTRANS SNAP pake harga SETELAH diskon
	reqSnap := &snap.Request{
		TransactionDetails: midtrans.TransactionDetails{
			OrderID:  orderID,
			GrossAmt: int64(finalPrice),
		},
		CreditCard: &snap.CreditCardDetails{
			Secure: true,
		},
	}

	snapResp, midErr := snap.CreateTransaction(reqSnap)
	if midErr != nil {
		database.DB.Model(&tx).Update("status", "failed")
		fmt.Println("Gagal bikin transaksi Midtrans:", midErr)
		c.JSON(500, gin.H{"error": "Gagal buat transaksi Midtrans"})
		return
	}

	// 6. Return ke frontend
	c.JSON(200, gin.H{
		"token":           snapResp.Token,
		"transaction_id":  transactionID,
		"order_id":        orderID,
		"amount":          finalPrice,
		"original_price":  pkg.Price,
		"discount_amount": discountAmount,
		"voucher_code":    voucherCode,
		"package_name":    pkg.Name,
		"package_id":      pkg.PackageID,
	})
}

// =====================================================================
// POST /api/payment/free
// Buat transaksi GRATIS (voucher free / diskon >= harga). Skip Midtrans.
// =====================================================================
func CreateFreeTransaction(c *gin.Context) {
	var req FreeTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Body request gak valid: " + err.Error()})
		return
	}

	// 1. Lookup paket
	var pkg models.Package
	if err := database.DB.Where("package_id = ? AND is_active = ?", req.Paket, true).First(&pkg).Error; err != nil {
		c.JSON(404, gin.H{"error": "Paket tidak ditemukan"})
		return
	}

	// 2. Validasi voucher
	code := strings.ToUpper(strings.TrimSpace(req.Voucher))
	var voucher models.Voucher
	if err := database.DB.Where("code = ?", code).First(&voucher).Error; err != nil {
		c.JSON(404, gin.H{"error": "Voucher tidak ditemukan"})
		return
	}
	if !voucher.IsActive {
		c.JSON(400, gin.H{"error": "Voucher tidak aktif"})
		return
	}
	if !voucher.ExpiredAt.IsZero() && time.Now().After(voucher.ExpiredAt) {
		c.JSON(400, gin.H{"error": "Voucher sudah kadaluwarsa"})
		return
	}
	if voucher.Quota > 0 && voucher.Used >= voucher.Quota {
		c.JSON(400, gin.H{"error": "Kuota voucher sudah habis"})
		return
	}

	// 3. Hitung harga — harus 0 buat lewat endpoint ini
	finalPrice, discountAmount := applyVoucherDiscount(pkg.Price, voucher)
	if finalPrice > 0 {
		c.JSON(400, gin.H{"error": "Voucher ini bukan gratis. Pake pembayaran QRIS biasa."})
		return
	}

	// 4. Bikin transaksi langsung SUCCESS
	transactionID := generateTransactionID()
	orderID := fmt.Sprintf("GLAMBOT-FREE-%d", time.Now().Unix())

	tx := models.Transaction{
		TransactionID:  transactionID,
		OrderID:        orderID,
		PackageID:      pkg.PackageID,
		Amount:         0,
		PaymentType:    "voucher",
		Status:         "success",
		VoucherCode:    code,
		DiscountAmount: discountAmount,
	}
	if err := database.DB.Create(&tx).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal simpen transaksi: " + err.Error()})
		return
	}

	// 5. Increment pemakaian voucher
	_ = IncrementVoucherUsage(code)

	c.JSON(200, gin.H{
		"transaction_id": transactionID,
		"status":         "success",
		"amount":         0,
		"is_free":        true,
		"voucher_code":   code,
		"package_name":   pkg.Name,
	})
}

// =====================================================================
// POST /api/payment/confirm
// =====================================================================
func ConfirmPayment(c *gin.Context) {
	var req PaymentConfirmRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Body request gak valid"})
		return
	}

	var tx models.Transaction
	if err := database.DB.Where("transaction_id = ?", req.TransactionID).First(&tx).Error; err != nil {
		c.JSON(404, gin.H{"error": "Transaksi tidak ditemukan"})
		return
	}

	if tx.Status == "success" {
		c.JSON(200, gin.H{
			"status":         "success",
			"message":        "Transaksi udah lunas sebelumnya",
			"transaction_id": tx.TransactionID,
		})
		return
	}

	paymentType := "qris"
	if pt, ok := req.MidtransResult["payment_type"].(string); ok && pt != "" {
		paymentType = pt
	}

	if err := database.DB.Model(&tx).Updates(map[string]interface{}{
		"status":       "success",
		"payment_type": paymentType,
	}).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal update status: " + err.Error()})
		return
	}

	// Kalau pake voucher, increment usage-nya
	if tx.VoucherCode != "" {
		_ = IncrementVoucherUsage(tx.VoucherCode)
	}

	c.JSON(200, gin.H{
		"status":         "success",
		"transaction_id": tx.TransactionID,
		"message":        "Pembayaran berhasil dikonfirmasi",
	})
}

// =====================================================================
// GET /api/transactions/:transaction_id
// =====================================================================
func GetTransaction(c *gin.Context) {
	transactionID := c.Param("transaction_id")

	var tx models.Transaction
	if err := database.DB.Where("transaction_id = ?", transactionID).First(&tx).Error; err != nil {
		c.JSON(404, gin.H{"error": "Transaksi tidak ditemukan"})
		return
	}

	c.JSON(200, tx)
}
