package controllers

import (
	"backend-photobooth/database"
	"backend-photobooth/models"

	"github.com/gin-gonic/gin"
)

// GET: Ambil semua template
func GetTemplates(c *gin.Context) {
	var templates []models.Template
	database.DB.Find(&templates)
	c.JSON(200, templates)
}

// POST: Tambah template baru
func CreateTemplate(c *gin.Context) {
	var t models.Template
	if err := c.ShouldBindJSON(&t); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	database.DB.Create(&t)
	c.JSON(200, t)
}

// PUT: Edit template
func UpdateTemplate(c *gin.Context) {
	id := c.Param("id")
	var t models.Template
	if err := database.DB.First(&t, id).Error; err != nil {
		c.JSON(404, gin.H{"error": "Template gak ketemu"})
		return
	}
	c.ShouldBindJSON(&t)
	database.DB.Save(&t)
	c.JSON(200, t)
}

// DELETE: Hapus template
func DeleteTemplate(c *gin.Context) {
	id := c.Param("id")
	database.DB.Delete(&models.Template{}, id)
	c.JSON(200, gin.H{"message": "Template berhasil dihapus"})
}
