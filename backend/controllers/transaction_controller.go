package controllers

import (
	"backend-photobooth/database"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Cetakan JSON khusus buat dikirim ke Frontend
type TransactionResponse struct {
	ID       string `json:"id"`
	Time     string `json:"time"`
	Method   string `json:"method"`
	Amount   int    `json:"amount"`
	Template string `json:"template"`
	Output   string `json:"output"`
	Status   string `json:"status"`
}

// Query dasar — di-share antara recent & all
// LEFT JOIN photo_sessions biar template & output kebawa kalau ada
const baseTransactionQuery = `
	SELECT 
		t.transaction_id as id,
		DATE_FORMAT(t.created_at, '%H:%i') as time,
		UPPER(t.payment_type) as method,
		t.amount as amount,
		COALESCE(ps.template_name, '-') as template,
		COALESCE(ps.output_type, '-') as output,
		t.status as status
	FROM transactions t
	LEFT JOIN photo_sessions ps ON t.transaction_id = ps.transaction_id
`

// =====================================================================
// GET /api/admin/transactions/recent
// 10 transaksi terbaru (buat card "Transaksi Terbaru" di dashboard)
// =====================================================================
func GetRecentTransactions(c *gin.Context) {
	var results []TransactionResponse

	query := baseTransactionQuery + ` ORDER BY t.created_at DESC LIMIT 10`
	database.DB.Raw(query).Scan(&results)

	c.JSON(http.StatusOK, results)
}

// =====================================================================
// GET /api/admin/transactions?date=YYYY-MM-DD
// Semua transaksi (bisa difilter tanggal), buat halaman /admin/transaksi
// =====================================================================
func GetAllTransactions(c *gin.Context) {
	dateStr := c.Query("date") // optional, format: YYYY-MM-DD

	var results []TransactionResponse

	if dateStr != "" {
		// Filter by tanggal — DATE() di MySQL ngambil bagian tanggal aja
		query := baseTransactionQuery + ` WHERE DATE(t.created_at) = ? ORDER BY t.created_at DESC`
		database.DB.Raw(query, dateStr).Scan(&results)
	} else {
		// Gak ada filter → return semua transaksi
		query := baseTransactionQuery + ` ORDER BY t.created_at DESC`
		database.DB.Raw(query).Scan(&results)
	}

	c.JSON(http.StatusOK, results)
}
