package main

import (
	"backend-photobooth/controllers"
	"backend-photobooth/database"
	"backend-photobooth/models"
	"backend-photobooth/services"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/midtrans/midtrans-go"
)

// --- FUNGSI BUAT NGE-STREAM KE NEXT.JS ---
// Frame dikirim APA ADANYA (natural, tanpa flip). Efek cermin di layar diurus
// frontend pakai CSS `scaleX(-1)` — dulu tiap frame di-decode + encode ulang
// cuma buat mirror, buang-buang CPU dan bikin hasil jepret ikut ke-flip.
func StreamLiveView(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "multipart/x-mixed-replace; boundary=frame")
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")

	for {
		select {
		case <-r.Context().Done():
			return
		default:
			frame, err := services.GetLiveViewFrame()
			if err != nil {
				time.Sleep(500 * time.Millisecond)
				continue
			}

			fmt.Fprintf(w, "--frame\r\nContent-Type: image/jpeg\r\n\r\n")
			w.Write(frame)
			fmt.Fprintf(w, "\r\n")

			if f, ok := w.(http.Flusher); ok {
				f.Flush()
			}

			time.Sleep(100 * time.Millisecond) // ~10 fps biar laptop ga ngeden
		}
	}
}

func main() {
	r := gin.Default()
	database.ConnectDB()
	godotenv.Load()

	// --- CORS MIDDLEWARE ---
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// --- ROUTE ADMIN PAKET ---
	admin := r.Group("/api/admin")
	{
		admin.GET("/packages", controllers.GetPackages)
		admin.POST("/packages", controllers.CreatePackage)
		admin.PUT("/packages/:id", controllers.UpdatePackage)
		admin.DELETE("/packages/:id", controllers.DeletePackage)
	}

	// Pastikan folder uploads ada
	os.MkdirAll("./uploads", 0755)

	// Endpoint upload gambar
	r.POST("/api/admin/upload", func(c *gin.Context) {
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(400, gin.H{"error": "File tidak ditemukan"})
			return
		}

		// Validasi tipe file (image only)
		contentType := file.Header.Get("Content-Type")
		if !strings.HasPrefix(contentType, "image/") {
			c.JSON(400, gin.H{"error": "File harus berupa gambar"})
			return
		}

		// Generate filename unik
		ext := filepath.Ext(file.Filename)
		filename := fmt.Sprintf("paket_%d%s", time.Now().UnixNano(), ext)
		savePath := "./uploads/" + filename

		if err := c.SaveUploadedFile(file, savePath); err != nil {
			c.JSON(500, gin.H{"error": "Gagal simpan file: " + err.Error()})
			return
		}

		// Return URL absolute biar bisa diakses dari Next.js
		c.JSON(200, gin.H{
			"url": "http://localhost:8080/uploads/" + filename,
		})
	})

	// Serve static files dari folder uploads
	r.Static("/uploads", "./uploads")

	// --- ROUTE ADMIN DASHBOARD ---
	adminDashboard := r.Group("/api/admin")
	{
		adminDashboard.GET("/dashboard/stats", controllers.GetDashboardStats)
		adminDashboard.GET("/dashboard/revenue-chart", controllers.GetRevenueChart)         // ⬅️ TAMBAH
		adminDashboard.GET("/dashboard/popular-templates", controllers.GetPopularTemplates) // ⬅️ TAMBAH
		adminDashboard.GET("/transactions/recent", controllers.GetRecentTransactions)
		adminDashboard.GET("/transactions", controllers.GetAllTransactions)

		// --- Route Template & Frame ---
		admin.GET("/templates", controllers.GetTemplates)
		admin.POST("/templates", controllers.CreateTemplate)
		admin.PUT("/templates/:id", controllers.UpdateTemplate)
		admin.DELETE("/templates/:id", controllers.DeleteTemplate)

		// --- ROUTE PHOTO SESSION ---
		r.POST("/api/photo-session/upsert", controllers.UpsertPhotoSession)
		r.POST("/api/photo-session/:session_id/capture", controllers.CapturePhoto)
		r.GET("/api/photo-session/:session_id/photos", controllers.GetSessionPhotos)
		r.POST("/api/photo-session/:session_id/capture-upload", controllers.CaptureUpload)
		r.GET("/api/photo-session/by-transaction/:transaction_id", controllers.GetSessionByTransaction)

		// --- 🎯 ROUTE GOOGLE DRIVE (QR ke gdrive) ---
		// Finalize: upload frame final ke subfolder "Hasil frame", balikin drive_url buat QR
		r.POST("/api/photo-session/by-transaction/:transaction_id/drive/finalize", controllers.FinalizeDrive)
		// Live preview: bikin GIF dari foto slideshow → subfolder "Hasil live preview"
		r.POST("/api/photo-session/by-transaction/:transaction_id/drive/live-preview", controllers.FinalizeLivePreviewGIF)
		// Get: ambil drive_url (buat nampilin QR duluan tanpa nunggu finalize)
		r.GET("/api/photo-session/by-transaction/:transaction_id/drive", controllers.GetSessionDrive)

		// --- SERVE FOTO HASIL DSLR ke Next.js ---
		r.Static("/photos", "./hasil_foto_dslr")

		// --- Route Filter ---
		admin.GET("/filters", controllers.GetFilters)
		admin.POST("/filters", controllers.CreateFilter)
		admin.PUT("/filters/:id", controllers.UpdateFilter)
		admin.DELETE("/filters/:id", controllers.DeleteFilter)

		// USER-FACING filter (active only)
		r.GET("/api/filters", controllers.GetActiveFilters)

		// USER-FACING voucher
		r.POST("/api/voucher/validate", controllers.ValidateVoucher)
		r.POST("/api/payment/free", controllers.CreateFreeTransaction)

		// ADMIN voucher CRUD (skip kalo udah ada)
		r.GET("/api/admin/vouchers", controllers.GetVouchers)
		r.POST("/api/admin/vouchers", controllers.CreateVoucher)
		r.PUT("/api/admin/vouchers/:id", controllers.UpdateVoucher)
		r.DELETE("/api/admin/vouchers/:id", controllers.DeleteVoucher)

		// --- Route Hardware ---
		admin.GET("/hardware", controllers.GetHardwareStatus)
		admin.PUT("/hardware", controllers.UpdateHardwareStatus)
	}

	// --- MIDTRANS SETUP ---
	midtrans.ServerKey = os.Getenv("MIDTRANS_SERVER_KEY")
	midtrans.Environment = midtrans.Sandbox

	robotBaseURL := "http://localhost:5001"

	// --- ENDPOINT DSLR (Panggil dari services/digicam.go) ---

	// 2. Trigger Jepret DSLR
	r.POST("/api/camera/capture", func(c *gin.Context) {
		sessionID := fmt.Sprintf("SESS-%d", time.Now().Unix())
		path, err := services.TriggerCapture(sessionID)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, gin.H{
			"status":  "success",
			"path":    path,
			"message": "Cekrek! Foto tersimpan di server",
		})
	})

	// --- ENDPOINT ROBOT ---

	r.GET("/api/camera/stream", func(c *gin.Context) {
		// Panggil fungsi StreamLiveView, passing Writer dan Request dari Gin
		StreamLiveView(c.Writer, c.Request)
	})

	// Snapshot 1 frame live view (JPEG tunggal). Dipakai /kamera buat PREVIEW INSTAN
	// tepat setelah shutter, TANPA nunggu file full-res (~beberapa dtk).
	// PENTING: utamakan frame TERAKHIR YANG UDAH TAMPIL di layar (cache dari
	// /api/camera/stream) — bukan fetch baru ke digiCamControl. Fetch baru bisa
	// balapan sama shutter dan dapet frame basi/beku → preview "gatau ngambilnya
	// kapan". Fetch langsung cuma fallback kalau stream lagi nggak jalan.
	r.GET("/api/camera/snapshot", func(c *gin.Context) {
		frame, ok := services.GetLastStreamFrame(2 * time.Second)
		if !ok {
			var err error
			frame, err = services.GetLiveViewFrame()
			if err != nil {
				c.JSON(503, gin.H{"error": "live view belum siap: " + err.Error()})
				return
			}
		}
		c.Header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
		c.Data(200, "image/jpeg", frame)
	})

	r.GET("/api/robot/detection", func(c *gin.Context) {
		resp, err := http.Get(robotBaseURL + "/detection")
		if err != nil {
			c.JSON(500, gin.H{"error": "err"})
			return
		}
		defer resp.Body.Close()
		body, _ := io.ReadAll(resp.Body)
		c.Data(resp.StatusCode, "application/json", body)
	})

	r.POST("/api/robot/enable", func(c *gin.Context) {
		services.RobotSetEnabled(true) // ⬅️ buat background poller
		http.Post(robotBaseURL+"/robot/enable", "application/json", nil)
		fmt.Println("🤖 [ROBOT] Enabled — poller aktif")
		c.JSON(200, gin.H{"status": "success", "message": "Robot diaktifkan"})
	})

	// ============================================================
	// ⬇️ ROUTE BARU: DISABLE ROBOT (dipanggil pas timer sesi habis)
	// ============================================================
	r.POST("/api/robot/disable", func(c *gin.Context) {
		services.RobotSetEnabled(false)                                   // ⬅️ poller bakal skip iterasi
		http.Post(robotBaseURL+"/robot/disable", "application/json", nil) // best-effort: kasih tau robot juga
		fmt.Println("🛑 [ROBOT] Disabled — poller skip iterasi, robot diberi sinyal stop")
		c.JSON(200, gin.H{"status": "success", "message": "Robot dinonaktifkan"})
	})

	r.POST("/api/robot/done", func(c *gin.Context) {
		services.SetTrigger()    // saklar lama (backward compat)
		services.RobotFireDone() // ⬅️ trigger countdown via /api/robot/state

		fmt.Println("🤖 [ROBOT] Sinyal Done masuk! Robot siap dijepret.")
		c.JSON(200, gin.H{
			"status":  "success",
			"message": "Trigger aktif, Next.js akan segera mulai countdown",
		})
	})

	// --- Pintu buat Next.js nanya status trigger ---
	// Next.js nanya GET ke sini tiap 1 detik
	r.GET("/api/trigger/status", func(c *gin.Context) {
		isReady := services.CheckAndResetTrigger()
		c.JSON(200, gin.H{"start_countdown": isReady})
	})

	// =====================================================================
	// ROBOT WEBHOOK + SIMULASI + STATE (buat suara & countdown)
	// =====================================================================

	// Webhook: robot lagi gerak ke preset → preset confirmed (suara 4)
	r.POST("/api/robot/moving", func(c *gin.Context) {
		var req struct {
			Preset int `json:"preset"`
		}
		c.ShouldBindJSON(&req)
		if req.Preset > 0 {
			services.RobotConfirmPreset(req.Preset)
		}
		c.JSON(200, gin.H{"status": "moving", "current_preset": req.Preset})
	})

	// Simulasi (dipanggil lewat curl buat testing tanpa robot)
	r.POST("/api/sim/on", func(c *gin.Context) {
		services.SimSetEnabled(true)
		c.JSON(200, gin.H{"sim": "on"})
	})
	r.POST("/api/sim/off", func(c *gin.Context) {
		services.SimSetEnabled(false)
		c.JSON(200, gin.H{"sim": "off"})
	})
	r.POST("/api/sim/palm", func(c *gin.Context) {
		services.RobotFirePalm()
		c.JSON(200, gin.H{"event": "palm"})
	})
	r.POST("/api/sim/gesture", func(c *gin.Context) {
		name := c.Query("name")
		if name == "" {
			name = "gesture"
		}
		services.RobotFireGesture(name)
		c.JSON(200, gin.H{"event": "gesture", "name": name})
	})
	r.POST("/api/sim/preset", func(c *gin.Context) {
		n, _ := strconv.Atoi(c.Query("n"))
		if n == 0 {
			n = 1
		}
		services.RobotConfirmPreset(n) // suara 4 (preset confirmed)

		// Auto lanjut: setelah jeda, robot "done" → countdown 3-2-1 → jepret
		// (niru robot beneran: gerak ke preset dulu, baru siap foto)
		go func() {
			time.Sleep(3 * time.Second) // jeda biar suara 4 sempet bunyi dulu
			services.RobotFireDone()
		}()

		c.JSON(200, gin.H{"event": "preset", "n": n, "auto_done": true})
	})

	// 🔒 SIM: set FSM state + unlock progress (untuk test frontend tanpa Flask)
	// Curl:
	//   Invoke-RestMethod -Uri "http://localhost:8080/api/sim/fsm?state=UNLOCKING&progress=0.5" -Method POST
	r.POST("/api/sim/fsm", func(c *gin.Context) {
		state := c.Query("state")          // "LOCKED" | "UNLOCKING" | "UNLOCKED" | "CONFIRMING" | "MOVING" | "COOLDOWN"
		progressStr := c.Query("progress") // "0.0" - "1.0"

		progress := 0.0
		if progressStr != "" {
			if p, err := strconv.ParseFloat(progressStr, 64); err == nil {
				progress = p
			}
		}

		services.SimSetFsm(state, progress)
		c.JSON(200, gin.H{
			"ok":              true,
			"fsm_state":       state,
			"unlock_progress": progress,
		})
	})

	// State buat frontend polling (suara + countdown)
	r.GET("/api/robot/state", func(c *gin.Context) {
		c.JSON(200, services.RobotStateJSON())
	})

	r.POST("/api/print/execute", controllers.PrintExecute)

	// =====================================================================
	// ROUTE PAYMENT (Midtrans + Transaction tracking)
	// Sekarang udah dipindah ke controllers/payment.go
	// =====================================================================
	r.POST("/api/payment", controllers.CreatePayment)
	r.POST("/api/payment/confirm", controllers.ConfirmPayment)
	r.GET("/api/transactions/:transaction_id", controllers.GetTransaction)

	// --- CETAK TAMBAHAN & OUTPUT TRACKING ---  ⬅️ TAMBAH 3 INI
	r.POST("/api/print/extra", controllers.CreatePrintPayment)
	r.POST("/api/print/done", controllers.ConfirmPrint)
	r.POST("/api/digital/done", controllers.ConfirmDigital)

	// =====================================================================
	// 🎯 GALLERY ROUTES (public — buat QR scan dari HP)
	// CATATAN: sejak pindah ke Google Drive, /result nggak manggil galeri ini
	// lagi buat QR. Route dibiarin ada biar nggak ngerusak apa-apa (bisa dihapus
	// nanti kalau udah yakin nggak kepake).
	// =====================================================================

	// GET /api/gallery/:txn — public gallery view (no auth)
	r.GET("/api/gallery/:txn", func(c *gin.Context) {
		txn := c.Param("txn")

		var session models.PhotoSession
		if err := database.DB.Preload("Photos").
			Where("transaction_id = ?", txn).
			First(&session).Error; err != nil {
			c.JSON(404, gin.H{"error": "Galeri tidak ditemukan"})
			return
		}

		// Cek apakah frame editan udah di-upload
		frameEditedURL := ""
		framePath := filepath.Join("uploads", "frames", txn+".jpg")
		if _, err := os.Stat(framePath); err == nil {
			frameEditedURL = "/uploads/frames/" + txn + ".jpg"
		}

		photos := []gin.H{}
		for _, p := range session.Photos {
			photos = append(photos, gin.H{
				"id":          p.ID,
				"photo_path":  p.PhotoPath,
				"slot_number": p.SlotNumber,
			})
		}

		c.JSON(200, gin.H{
			"transaction_id": session.TransactionID,
			"template_name":  session.TemplateName,
			"created_at":     session.CreatedAt,
			"photos":         photos,
			"frame_edited":   frameEditedURL,
		})
	})

	// POST /api/gallery/save-frame — upload html2canvas output dari client
	r.POST("/api/gallery/save-frame", func(c *gin.Context) {
		var req struct {
			TransactionID string `json:"transaction_id" binding:"required"`
			ImageBase64   string `json:"image_base64" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		// Strip "data:image/...,base64" prefix kalo ada
		raw := req.ImageBase64
		if idx := strings.Index(raw, ","); idx > -1 {
			raw = raw[idx+1:]
		}

		data, err := base64.StdEncoding.DecodeString(raw)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid base64: " + err.Error()})
			return
		}

		// Validasi: ukuran wajar (max 20MB) buat hindari DoS
		if len(data) > 20*1024*1024 {
			c.JSON(400, gin.H{"error": "Image terlalu besar (>20MB)"})
			return
		}

		framesDir := filepath.Join("uploads", "frames")
		if err := os.MkdirAll(framesDir, 0755); err != nil {
			c.JSON(500, gin.H{"error": "Gagal bikin folder: " + err.Error()})
			return
		}

		framePath := filepath.Join(framesDir, req.TransactionID+".jpg")
		if err := os.WriteFile(framePath, data, 0644); err != nil {
			c.JSON(500, gin.H{"error": "Gagal simpen file: " + err.Error()})
			return
		}

		fmt.Printf("📸 [GALLERY] Frame editan tersimpan: %s (%d bytes)\n", framePath, len(data))
		c.JSON(200, gin.H{
			"url":  "/uploads/frames/" + req.TransactionID + ".jpg",
			"size": len(data),
			"at":   time.Now().Format(time.RFC3339),
		})
	})

	// DELETE /api/gallery/:txn — cleanup frame editan (buat cron / privacy)
	r.DELETE("/api/gallery/:txn", func(c *gin.Context) {
		txn := c.Param("txn")
		framePath := filepath.Join("uploads", "frames", txn+".jpg")
		if err := os.Remove(framePath); err != nil && !os.IsNotExist(err) {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"deleted": true, "txn": txn})
	})

	go services.StartRobotDetectionPoller() // ⬅️ poller deteksi robot (mode real)

	fmt.Println("🚀 Backend Golang DSLR + Robot nyala di http://localhost:8080")
	r.Run(":8080")
}
