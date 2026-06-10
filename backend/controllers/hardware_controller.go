package controllers

import (
	"backend-photobooth/database"
	"backend-photobooth/models"

	"github.com/gin-gonic/gin"
)

// GET: Ambil status hardware saat ini
func GetHardwareStatus(c *gin.Context) {
	var h models.Hardware
	// Cari data dengan ID 1. Kalau gak ada, otomatis bikin pakai nilai default
	database.DB.FirstOrCreate(&h, models.Hardware{ID: 1})
	c.JSON(200, h)
}

// PUT: Update status hardware (misal ngeklik tombol on/off lampu di admin)
func UpdateHardwareStatus(c *gin.Context) {
	var h models.Hardware
	if err := database.DB.First(&h, 1).Error; err != nil {
		c.JSON(404, gin.H{"error": "Data hardware gak ketemu"})
		return
	}
	if err := c.ShouldBindJSON(&h); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	database.DB.Save(&h)
	c.JSON(200, h)
}
