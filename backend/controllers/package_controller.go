package controllers

import (
	"backend-photobooth/database"
	"backend-photobooth/models"

	"github.com/gin-gonic/gin"
)

// GetPackages: Nampilin semua paket
func GetPackages(c *gin.Context) {
	var packages []models.Package
	database.DB.Find(&packages)
	c.JSON(200, packages)
}

// CreatePackage: Nambah paket baru
func CreatePackage(c *gin.Context) {
	var p models.Package
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	database.DB.Create(&p)
	c.JSON(200, p)
}

// UpdatePackage: Edit paket
func UpdatePackage(c *gin.Context) {
	id := c.Param("id")
	var p models.Package
	if err := database.DB.First(&p, id).Error; err != nil {
		c.JSON(404, gin.H{"error": "Paket gak ketemu"})
		return
	}
	c.ShouldBindJSON(&p)
	database.DB.Save(&p)
	c.JSON(200, p)
}

// DeletePackage: Hapus paket
func DeletePackage(c *gin.Context) {
	id := c.Param("id")
	database.DB.Delete(&models.Package{}, id)
	c.JSON(200, gin.H{"message": "Paket dihapus"})
}
