package main

import (
	"backend-photobooth/controllers"
	"backend-photobooth/services" // Sesuaikan dengan nama module lu
	"bytes"
	"fmt"
	"image"
	"image/draw"
	"image/jpeg"
	"io"
	"net/http"
	"os"
	"time"

	"backend-photobooth/database"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/snap" // WAJIB DITAMBAHIN BUAT BIKIN TOKEN SNAP
)

type PaymentRequest struct {
	Paket string `json:"paket" binding:"required"`
}

// --- FUNGSI BUAT NGE-FLIP GAMBAR (EFEK CERMIN) ---
func flipJPEGHorizontal(frame []byte) []byte {
	img, _, err := image.Decode(bytes.NewReader(frame))
	if err != nil {
		return frame
	}

	b := img.Bounds()
	w := b.Dx()
	h := b.Dy()
	if w <= 1 || h <= 1 {
		return frame
	}

	src := image.NewRGBA(b)
	draw.Draw(src, b, img, b.Min, draw.Src)
	dst := image.NewRGBA(b)

	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			// Rumus membalik pixel kiri ke kanan
			dst.Set(x+b.Min.X, y+b.Min.Y, src.At((w-1-x)+b.Min.X, y+b.Min.Y))
		}
	}

	var out bytes.Buffer
	if err := jpeg.Encode(&out, dst, &jpeg.Options{Quality: 85}); err != nil {
		return frame
	}
	return out.Bytes()
}

// --- FUNGSI BUAT NGE-STREAM KE NEXT.JS ---
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

			// Panggil fungsi flip sebelum dikirim
			frame = flipJPEGHorizontal(frame)

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
	// --- ROUTE ADMIN PAKET ---

	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	admin := r.Group("/api/admin")
	{
		admin.GET("/packages", controllers.GetPackages)
		admin.POST("/packages", controllers.CreatePackage)
		admin.PUT("/packages/:id", controllers.UpdatePackage)
		admin.DELETE("/packages/:id", controllers.DeletePackage)
	}

	midtrans.ServerKey = os.Getenv("MIDTRANS_SERVER_KEY")
	midtrans.Environment = midtrans.Sandbox

	// Setup CORS

	robotBaseURL := "https://activism-buggy-crier.ngrok-free.dev"

	// --- ENDPOINT DSLR (Panggil dari services/digicam.go) ---

	// // 1. Stream Live View DSLR ke Frontend
	// r.GET("/api/camera/stream", func(c *gin.Context) {
	// 	c.Writer.Header().Set("Content-Type", "multipart/x-mixed-replace; boundary=frame")
	// 	for {
	// 		frame, err := services.GetLiveViewFrame()
	// 		if err != nil {
	// 			continue
	// 		}
	// 		c.Writer.Write([]byte("--frame\r\nContent-Type: image/jpeg\r\n\r\n"))
	// 		c.Writer.Write(frame)
	// 		c.Writer.Write([]byte("\r\n"))
	// 		time.Sleep(40 * time.Millisecond) // Sekitar 25 FPS
	// 	}
	// })

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

	// --- ENDPOINT ROBOT & MIDTRANS (Tetap Ada) ---

	r.GET("/api/camera/stream", func(c *gin.Context) {
		// Panggil fungsi StreamLiveView, passing Writer dan Request dari Gin
		StreamLiveView(c.Writer, c.Request)
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
		http.Post(robotBaseURL+"/robot/enable", "application/json", nil)
		c.JSON(200, gin.H{"status": "success"})
	})

	r.POST("/api/robot/done", func(c *gin.Context) {
		services.SetTrigger() // Nyalain saklar di memori

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
	// ENDPOINT BARU BUAT MIDTRANS (QRIS POPUP)
	// =====================================================================
	r.POST("/api/payment", func(c *gin.Context) {
		var req PaymentRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		// Nentuin harga berdasarkan parameter paket dari Next.js
		var harga int64
		switch req.Paket {
		case "solo":
			harga = 35000
		case "duo":
			harga = 45000
		case "group":
			harga = 55000
		case "premium":
			harga = 75000
		default:
			harga = 75000 // Harga default kalau paket ga kedetek
		}

		// Bikin Order ID unik pake timestamp
		orderID := fmt.Sprintf("GLAMBOT-%d", time.Now().Unix())

		// Setup request Snap Midtrans
		reqSnap := &snap.Request{
			TransactionDetails: midtrans.TransactionDetails{
				OrderID:  orderID,
				GrossAmt: harga,
			},
			CreditCard: &snap.CreditCardDetails{
				Secure: true,
			},
		}

		// Minta token ke server Midtrans
		snapResp, midErr := snap.CreateTransaction(reqSnap)
		if midErr != nil {
			fmt.Println("Gagal bikin transaksi Midtrans:", midErr)
			c.JSON(500, gin.H{"error": "Gagal buat transaksi"})
			return
		}

		// Balikin token ke Next.js biar bisa nampilin popup
		c.JSON(200, gin.H{"token": snapResp.Token})
	})

	fmt.Println("🚀 Backend Golang DSLR + Robot nyala di http://localhost:8080")
	r.Run(":8080")
}
