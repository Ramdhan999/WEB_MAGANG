// Command gdrive-token: ambil OAuth2 refresh token SEKALI consent buat akun
// Gmail booth yang dipakai nyimpen hasil sesi ke Google Drive.
//
// Cara jalanin (dari folder backend):
//
//	go run ./cmd/gdrive-token
//
// Prasyarat (udah dikerjain di Google Cloud Console):
//  1. OAuth Client ID tipe "Web application"
//  2. Authorized redirect URI: http://localhost:8090/callback
//  3. GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET udah diisi di backend/.env
//  4. Gmail booth ditambahin sebagai Test user di OAuth consent screen
//
// Program bakal nyetak URL consent → kamu buka di browser → login pakai Gmail
// booth → Allow → dia nyetak GOOGLE_REFRESH_TOKEN buat ditempel ke backend/.env
package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
	"golang.org/x/oauth2"
)

const redirectURL = "http://localhost:8090/callback"

func main() {
	// Load backend/.env dari folder tempat kamu jalanin perintah ini.
	_ = godotenv.Load()

	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	if clientID == "" || clientSecret == "" {
		fmt.Println("❌ GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET belum ada di .env")
		fmt.Println("   Pastikan kamu jalanin dari folder backend (yang ada file .env-nya).")
		os.Exit(1)
	}

	conf := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURL,
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://accounts.google.com/o/oauth2/auth",
			TokenURL: "https://oauth2.googleapis.com/token",
		},
		// drive.file: app cuma bisa nyentuh file yang dia sendiri bikin.
		Scopes: []string{"https://www.googleapis.com/auth/drive.file"},
	}

	// AccessTypeOffline + prompt=consent WAJIB biar Google balikin refresh token
	// (kalau nggak, cuma dapet access token sekali pakai).
	authURL := conf.AuthCodeURL("glambot-state",
		oauth2.AccessTypeOffline,
		oauth2.SetAuthURLParam("prompt", "consent"),
	)

	codeCh := make(chan string, 1)
	srv := &http.Server{Addr: ":8090"}
	http.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		code := r.URL.Query().Get("code")
		if code == "" {
			http.Error(w, "tidak ada code di callback", http.StatusBadRequest)
			return
		}
		fmt.Fprintln(w, "✅ Berhasil! Balik ke terminal — tab browser ini boleh ditutup.")
		codeCh <- code
	})

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			fmt.Printf("❌ Gagal jalanin server callback: %v\n", err)
			os.Exit(1)
		}
	}()

	fmt.Println("──────────────────────────────────────────────────────────")
	fmt.Println("Buka URL berikut di browser, login pakai Gmail booth, lalu Allow:")
	fmt.Println()
	fmt.Println(authURL)
	fmt.Println()
	fmt.Println("(Kalau muncul \"Google hasn't verified this app\" → klik Advanced →")
	fmt.Println(" \"Go to Glambot Booth (unsafe)\" → Allow. Itu wajar buat app Testing.)")
	fmt.Println()
	fmt.Println("Nunggu consent di " + redirectURL + " ...")
	fmt.Println("──────────────────────────────────────────────────────────")

	var code string
	select {
	case code = <-codeCh:
	case <-time.After(5 * time.Minute):
		fmt.Println("❌ Timeout nunggu consent (5 menit).")
		os.Exit(1)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	tok, err := conf.Exchange(ctx, code)
	if err != nil {
		fmt.Printf("❌ Gagal tukar code jadi token: %v\n", err)
		os.Exit(1)
	}
	if tok.RefreshToken == "" {
		fmt.Println("❌ Nggak ada refresh token di respons. Pastikan:")
		fmt.Println("   - pakai prompt=consent (udah otomatis di sini), dan")
		fmt.Println("   - akun belum pernah grant app ini sebelumnya")
		fmt.Println("     (cabut dulu di https://myaccount.google.com/permissions, ulangi).")
		os.Exit(1)
	}

	_ = srv.Shutdown(ctx)

	fmt.Println()
	fmt.Println("✅ Selesai! Tempel baris ini ke backend/.env :")
	fmt.Println()
	fmt.Printf("GOOGLE_REFRESH_TOKEN=%s\n", tok.RefreshToken)
	fmt.Println()
}
