package controllers

import (
	"backend-photobooth/database"
	"backend-photobooth/models"
	"fmt"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// =====================================================================
// ===== ADMIN CRUD (dari kode lama, dipertahankan) =====
// =====================================================================

// GET: Ambil semua voucher
func GetVouchers(c *gin.Context) {
	var vouchers []models.Voucher
	database.DB.Order("created_at DESC").Find(&vouchers)
	c.JSON(200, vouchers)
}

// POST: Tambah voucher baru
func CreateVoucher(c *gin.Context) {
	var v models.Voucher
	if err := c.ShouldBindJSON(&v); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	v.Code = strings.ToUpper(strings.TrimSpace(v.Code))
	if v.Code == "" {
		c.JSON(400, gin.H{"error": "Kode voucher wajib diisi"})
		return
	}

	var existing models.Voucher
	if database.DB.Where("code = ?", v.Code).First(&existing).Error == nil {
		c.JSON(400, gin.H{"error": "Kode voucher sudah ada"})
		return
	}

	if err := database.DB.Create(&v).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal simpan voucher: " + err.Error()})
		return
	}
	c.JSON(200, v)
}

// PUT: Edit status/kuota voucher
func UpdateVoucher(c *gin.Context) {
	id := c.Param("id")
	var v models.Voucher
	if err := database.DB.First(&v, id).Error; err != nil {
		c.JSON(404, gin.H{"error": "Voucher gak ketemu"})
		return
	}
	if err := c.ShouldBindJSON(&v); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	v.Code = strings.ToUpper(strings.TrimSpace(v.Code))
	database.DB.Save(&v)
	c.JSON(200, v)
}

// DELETE: Hapus voucher
func DeleteVoucher(c *gin.Context) {
	id := c.Param("id")
	database.DB.Delete(&models.Voucher{}, id)
	c.JSON(200, gin.H{"message": "Voucher berhasil dihapus"})
}

// =====================================================================
// ===== USER-FACING: VALIDATE VOUCHER =====
// =====================================================================

type ValidateVoucherRequest struct {
	Code  string `json:"code" binding:"required"`
	Paket string `json:"paket" binding:"required"`
}

// =====================================================================
// POST /api/voucher/validate
// Cek voucher valid + hitung harga setelah diskon untuk paket tertentu.
// =====================================================================
func ValidateVoucher(c *gin.Context) {
	var req ValidateVoucherRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Body request gak valid: " + err.Error()})
		return
	}

	code := strings.ToUpper(strings.TrimSpace(req.Code))

	// 1. Cari voucher by code
	var voucher models.Voucher
	if err := database.DB.Where("code = ?", code).First(&voucher).Error; err != nil {
		c.JSON(404, gin.H{"valid": false, "error": "Kode voucher tidak ditemukan"})
		return
	}

	// 2. Cek aktif
	if !voucher.IsActive {
		c.JSON(400, gin.H{"valid": false, "error": "Voucher tidak aktif"})
		return
	}

	// 3. Cek expired
	if !voucher.ExpiredAt.IsZero() && time.Now().After(voucher.ExpiredAt) {
		c.JSON(400, gin.H{"valid": false, "error": "Voucher sudah kadaluwarsa"})
		return
	}

	// 4. Cek kuota
	if voucher.Quota > 0 && voucher.Used >= voucher.Quota {
		c.JSON(400, gin.H{"valid": false, "error": "Kuota voucher sudah habis"})
		return
	}

	// 5. Lookup paket
	var pkg models.Package
	if err := database.DB.Where("package_id = ? AND is_active = ?", req.Paket, true).First(&pkg).Error; err != nil {
		c.JSON(404, gin.H{"valid": false, "error": "Paket tidak ditemukan"})
		return
	}

	// 6. Hitung harga setelah diskon
	originalPrice := pkg.Price
	finalPrice, discountAmount := applyVoucherDiscount(originalPrice, voucher)
	isFree := finalPrice <= 0

	c.JSON(200, gin.H{
		"valid":           true,
		"code":            voucher.Code,
		"discount_type":   voucher.DiscountType,
		"discount_value":  voucher.DiscountValue,
		"original_price":  originalPrice,
		"discount_amount": discountAmount,
		"final_price":     finalPrice,
		"is_free":         isFree,
		"package_name":    pkg.Name,
		"package_id":      pkg.PackageID,
	})
}

// =====================================================================
// HELPER: Hitung harga akhir + jumlah potongan (semua int — rupiah)
// Return: (finalPrice, discountAmount)
// =====================================================================
func applyVoucherDiscount(originalPrice int, voucher models.Voucher) (int, int) {
	switch voucher.DiscountType {
	case "free":
		// Gratis total
		return 0, originalPrice

	case "percentage":
		// Potongan persen (DiscountValue = 50 berarti 50%)
		discount := originalPrice * voucher.DiscountValue / 100
		final := originalPrice - discount
		if final < 0 {
			final = 0
		}
		return final, discount

	case "nominal":
		// Potongan nominal (DiscountValue = 20000 berarti potong Rp 20.000)
		discount := voucher.DiscountValue
		final := originalPrice - discount
		if final < 0 {
			// Diskon lebih gede dari harga → gratis, potongan = harga asli
			return 0, originalPrice
		}
		return final, discount

	default:
		return originalPrice, 0
	}
}

// =====================================================================
// HELPER: Increment counter "Used" voucher (exported, dipanggil dari payment.go)
// =====================================================================
func IncrementVoucherUsage(code string) error {
	code = strings.ToUpper(strings.TrimSpace(code))
	if code == "" {
		return nil
	}
	result := database.DB.Model(&models.Voucher{}).
		Where("code = ?", code).
		UpdateColumn("used", gorm.Expr("used + 1"))
	if result.Error != nil {
		return fmt.Errorf("gagal increment voucher usage: %w", result.Error)
	}
	return nil
}
