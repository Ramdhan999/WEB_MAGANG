package controllers

import (
	"backend-photobooth/database"
	"backend-photobooth/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// =====================================================================
// GET /api/admin/dashboard/stats
// Stats kotak atas di dashboard admin
// =====================================================================
func GetDashboardStats(c *gin.Context) {
	var totalSessions int64
	var totalRevenue int64
	var printedCount int64
	var digitalCount int64

	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	database.DB.Model(&models.Transaction{}).
		Where("created_at >= ? AND status = ?", today, "success").
		Count(&totalSessions)

	database.DB.Model(&models.Transaction{}).
		Select("COALESCE(SUM(amount), 0)").
		Where("created_at >= ? AND status = ?", today, "success").
		Scan(&totalRevenue)

	database.DB.Model(&models.PhotoSession{}).
		Where("created_at >= ? AND output_type = ?", today, "Cetak").
		Count(&printedCount)

	database.DB.Model(&models.PhotoSession{}).
		Where("created_at >= ? AND output_type = ?", today, "Digital").
		Count(&digitalCount)

	c.JSON(http.StatusOK, gin.H{
		"sesi_hari_ini": totalSessions,
		"pendapatan":    totalRevenue,
		"foto_dicetak":  printedCount,
		"kirim_digital": digitalCount,
	})
}

// =====================================================================
// GET /api/admin/dashboard/revenue-chart
// Pendapatan 7 hari terakhir (Senin–Minggu minggu ini), buat grafik batang.
// Return: array 7 hari dengan { day, label, revenue }
// =====================================================================
func GetRevenueChart(c *gin.Context) {
	now := time.Now()
	loc := now.Location()

	// Cari hari Senin minggu ini (Go: Sunday=0, Monday=1, ..., Saturday=6)
	weekday := int(now.Weekday())
	// Konversi biar Senin jadi awal minggu. Kalau Minggu (0), mundur 6 hari.
	daysFromMonday := weekday - 1
	if weekday == 0 {
		daysFromMonday = 6
	}
	monday := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc).
		AddDate(0, 0, -daysFromMonday)

	dayLabels := []string{"Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Min"}
	results := make([]gin.H, 7)

	for i := 0; i < 7; i++ {
		dayStart := monday.AddDate(0, 0, i)
		dayEnd := dayStart.AddDate(0, 0, 1)

		var dayRevenue int64
		database.DB.Model(&models.Transaction{}).
			Select("COALESCE(SUM(amount), 0)").
			Where("created_at >= ? AND created_at < ? AND status = ?", dayStart, dayEnd, "success").
			Scan(&dayRevenue)

		results[i] = gin.H{
			"day":     dayLabels[i],
			"label":   dayLabels[i],
			"revenue": dayRevenue,
			"date":    dayStart.Format("2006-01-02"),
		}
	}

	c.JSON(http.StatusOK, results)
}

// =====================================================================
// GET /api/admin/dashboard/popular-templates
// Top 5 template paling sering dipake (dari PhotoSession, group by template_name).
// Return: array { name, sessions } urut dari terbanyak.
// =====================================================================
func GetPopularTemplates(c *gin.Context) {
	type TemplateCount struct {
		TemplateName string `json:"template_name"`
		Total        int64  `json:"total"`
	}

	var counts []TemplateCount

	// Group by template_name, hitung jumlah session per template
	// Skip yang kosong (placeholder session yang belum pilih template)
	database.DB.Model(&models.PhotoSession{}).
		Select("template_name, COUNT(*) as total").
		Where("template_name != ? AND template_name IS NOT NULL", "").
		Group("template_name").
		Order("total DESC").
		Limit(5).
		Scan(&counts)

	// Format response
	results := make([]gin.H, 0, len(counts))
	for _, c := range counts {
		results = append(results, gin.H{
			"name":     c.TemplateName,
			"sessions": c.Total,
		})
	}

	c.JSON(http.StatusOK, results)
}
