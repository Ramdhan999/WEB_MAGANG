package controllers

import (
	"backend-photobooth/database"
	"backend-photobooth/models"
	"strings"

	"github.com/gin-gonic/gin"
)

// =====================================================================
// GET /api/admin/filters
// Ambil semua filter (buat admin — termasuk yang nonaktif)
// =====================================================================
func GetFilters(c *gin.Context) {
	var filters []models.Filter
	database.DB.Order("id ASC").Find(&filters)
	c.JSON(200, filters)
}

// =====================================================================
// GET /api/filters
// Ambil filter AKTIF aja (buat user-facing filter page)
// Original selalu di-paling-depan biar konsisten.
// =====================================================================
func GetActiveFilters(c *gin.Context) {
	var filters []models.Filter
	database.DB.Where("is_active = ?", true).Order("id ASC").Find(&filters)

	// Pastiin "Original" selalu ada & paling depan, walau admin gak bikin
	hasOriginal := false
	for _, f := range filters {
		if strings.EqualFold(f.Name, "Original") {
			hasOriginal = true
			break
		}
	}

	result := make([]gin.H, 0, len(filters)+1)
	if !hasOriginal {
		// Inject Original virtual (gak ada di DB tapi selalu tersedia)
		result = append(result, gin.H{
			"id":        0,
			"name":      "Original",
			"css":       "none",
			"bg_color":  "bg-[#F3F3F3]",
			"is_active": true,
		})
	}

	for _, f := range filters {
		result = append(result, gin.H{
			"id":        f.ID,
			"name":      f.Name,
			"css":       f.CSS,
			"bg_color":  f.BgColor,
			"is_active": f.IsActive,
		})
	}

	c.JSON(200, result)
}

// =====================================================================
// POST /api/admin/filters
// Tambah filter baru
// =====================================================================
func CreateFilter(c *gin.Context) {
	var f models.Filter
	if err := c.ShouldBindJSON(&f); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	f.Name = strings.TrimSpace(f.Name)
	if f.Name == "" {
		c.JSON(400, gin.H{"error": "Nama filter wajib diisi"})
		return
	}
	if strings.TrimSpace(f.CSS) == "" {
		c.JSON(400, gin.H{"error": "CSS filter value wajib diisi"})
		return
	}

	// Cek duplikat nama
	var existing models.Filter
	if database.DB.Where("name = ?", f.Name).First(&existing).Error == nil {
		c.JSON(400, gin.H{"error": "Filter dengan nama ini sudah ada"})
		return
	}

	if err := database.DB.Create(&f).Error; err != nil {
		c.JSON(500, gin.H{"error": "Gagal simpan filter: " + err.Error()})
		return
	}
	c.JSON(200, f)
}

// =====================================================================
// PUT /api/admin/filters/:id
// Edit filter
// =====================================================================
func UpdateFilter(c *gin.Context) {
	id := c.Param("id")
	var f models.Filter
	if err := database.DB.First(&f, id).Error; err != nil {
		c.JSON(404, gin.H{"error": "Filter gak ketemu"})
		return
	}
	if err := c.ShouldBindJSON(&f); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	f.Name = strings.TrimSpace(f.Name)
	database.DB.Save(&f)
	c.JSON(200, f)
}

// =====================================================================
// DELETE /api/admin/filters/:id
// Hapus filter (Original gak boleh dihapus)
// =====================================================================
func DeleteFilter(c *gin.Context) {
	id := c.Param("id")

	var f models.Filter
	if err := database.DB.First(&f, id).Error; err != nil {
		c.JSON(404, gin.H{"error": "Filter gak ketemu"})
		return
	}

	// Protect: Original gak boleh dihapus
	if strings.EqualFold(f.Name, "Original") {
		c.JSON(400, gin.H{"error": "Filter 'Original' tidak bisa dihapus"})
		return
	}

	database.DB.Delete(&models.Filter{}, id)
	c.JSON(200, gin.H{"message": "Filter berhasil dihapus"})
}
