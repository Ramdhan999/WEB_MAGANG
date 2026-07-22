package services

import (
	"bytes"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"image"
	"image/draw"
	"image/jpeg"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// Timeout sengaja tetep pendek: client ini juga dipakai buat narik frame live
// view, jadi kalau digiCamControl nyangkut, stream-nya harus cepet nyerah.
// Narik file full-res lewat localhost cuma butuh <1 detik, jadi 8 detik aman.
var digiCamHTTPClient = &http.Client{Timeout: 8 * time.Second}

// Folder buat nyimpen hasil jepretan kamera
const StoragePath = "./hasil_foto_dslr"

// =====================================================================
// 🎯 FULL-RES vs FRAME LIVE VIEW
//
// digiCamControl nyediain dua hal yang gampang ketuker:
//   - /liveview.jpg & /preview.jpg → cuplikan stream live view. Kecil
//     (sekitar 1000px), muncul instan.
//   - /lastcaptured                → FILE hasil jepretan beneran dari
//     kamera. Full-res, tapi baru ada setelah kamera nulis + transfer
//     (1–3 detik).
//
// Yang disimpen HARUS yang kedua. Frame live view cuma dipakai kalau
// file aslinya beneran nggak bisa diambil — mending foto seadanya
// daripada sesi customer gagal total.
// =====================================================================

const (
	// Ambang lebar buat mastiin yang keambil emang hasil jepretan, bukan
	// frame live view. Live view ~1000px; setting JPEG terkecil Canon (S3)
	// masih 2400px, jadi 1600 aman di tengah.
	minCaptureWidth = 1600

	// Jatah nunggu kamera selesai nulis + transfer file ke PC.
	captureFileTimeout = 6 * time.Second
)

// lastCapturedURLs = endpoint yang ngasih file jepretan beneran.
func lastCapturedURLs(nonce string) []string {
	return []string{
		digiCamBaseURL() + "/lastcaptured?_ts=" + nonce,
		digiCamRootURL() + "/lastcaptured?_ts=" + nonce,
	}
}

// previewFallbackURLs = endpoint cadangan, resolusinya kecil.
func previewFallbackURLs(nonce string) []string {
	root := digiCamRootURL()
	return []string{
		root + "/preview.jpg?_ts=" + nonce,
		root + "/liveview.jpg?_ts=" + nonce,
	}
}

// frameFingerprint = sidik jari murah buat bedain dua file. Cukup 64 KB
// pertama — header + baris awal JPEG udah pasti beda antar jepretan, dan
// nggak perlu nyedot file 25 MB cuma buat ngecek.
func frameFingerprint(b []byte) [16]byte {
	if len(b) > 64<<10 {
		b = b[:64<<10]
	}
	return md5.Sum(b)
}

// lastCapturedFingerprint ambil sidik jari file jepretan yang ADA SEKARANG,
// dipanggil sebelum shutter ditekan. Dipakai buat mastiin file yang keambil
// setelahnya emang yang baru, bukan foto sebelumnya yang belum ketimpa.
func lastCapturedFingerprint() [16]byte {
	nonce := fmt.Sprintf("%d", time.Now().UnixNano())
	for _, u := range lastCapturedURLs(nonce) {
		resp, err := digiCamHTTPClient.Get(u)
		if err != nil {
			continue
		}
		head, _ := io.ReadAll(io.LimitReader(resp.Body, 64<<10))
		resp.Body.Close() // sengaja nggak dihabisin — sisanya nggak kepake
		if resp.StatusCode == http.StatusOK && len(head) > 0 {
			return frameFingerprint(head)
		}
	}
	return [16]byte{} // belum ada jepretan sama sekali
}

// jpegDimensions baca dimensi dari header doang, nggak decode penuh.
func jpegDimensions(b []byte) (w, h int, err error) {
	cfg, _, err := image.DecodeConfig(bytes.NewReader(b))
	if err != nil {
		return 0, 0, err
	}
	return cfg.Width, cfg.Height, nil
}

// waitForNewCapturedFile nungguin file jepretan BARU muncul di digiCamControl.
// Nolak file yang (a) sama kayak sebelum jepret, atau (b) resolusinya kekecilan
// — dua-duanya nandain kita kejebak ngambil yang salah.
func waitForNewCapturedFile(before [16]byte, timeout time.Duration) ([]byte, error) {
	deadline := time.Now().Add(timeout)
	attempt := 0
	var lastErr error

	for {
		attempt++
		nonce := fmt.Sprintf("%d_%d", time.Now().UnixNano(), attempt)

		body, err := digiCamReadFirstAvailable(lastCapturedURLs(nonce))
		switch {
		case err != nil:
			lastErr = err
		case frameFingerprint(body) == before:
			lastErr = fmt.Errorf("file belum ganti — kamera masih nulis")
		default:
			w, h, dErr := jpegDimensions(body)
			if dErr != nil {
				lastErr = fmt.Errorf("bukan JPEG valid: %w", dErr)
			} else if w < minCaptureWidth {
				lastErr = fmt.Errorf("cuma %dx%d, ini frame preview bukan hasil jepretan", w, h)
			} else {
				return body, nil
			}
		}

		if time.Now().After(deadline) {
			return nil, lastErr
		}
		time.Sleep(150 * time.Millisecond)
	}
}

var liveFrameState = struct {
	mu   sync.Mutex
	hash [16]byte
	set  bool
}{}

func digiCamBaseURL() string {
	return "http://localhost:5513/api"
}

func digiCamRootURL() string {
	return "http://localhost:5513"
}

func digiCamGet(path string) (*http.Response, error) {
	return digiCamHTTPClient.Get(digiCamBaseURL() + path)
}

func digiCamTryCommand(urls []string) error {
	var lastErr error
	for _, u := range urls {
		u = strings.TrimSpace(u)
		if u == "" {
			continue
		}
		resp, err := digiCamHTTPClient.Get(u)
		if err != nil {
			lastErr = err
			continue
		}
		_, _ = io.Copy(io.Discard, resp.Body)
		resp.Body.Close()
		if resp.StatusCode == http.StatusOK {
			return nil
		}
		lastErr = fmt.Errorf("status %d", resp.StatusCode)
	}
	if lastErr == nil {
		lastErr = fmt.Errorf("command tidak tersedia")
	}
	return lastErr
}

func digiCamReadFirstAvailable(paths []string) ([]byte, error) {
	var lastErr error
	for _, path := range paths {
		path = strings.TrimSpace(path)
		if path == "" {
			continue
		}
		resp, err := digiCamHTTPClient.Get(path)
		if err != nil {
			lastErr = err
			continue
		}
		if resp.StatusCode != http.StatusOK {
			resp.Body.Close()
			lastErr = fmt.Errorf("status %d", resp.StatusCode)
			continue
		}
		body, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			lastErr = err
			continue
		}
		if len(body) == 0 {
			lastErr = fmt.Errorf("empty body")
			continue
		}
		return body, nil
	}
	if lastErr == nil {
		lastErr = fmt.Errorf("no liveview endpoint available")
	}
	return nil, lastErr
}

func captureLiveFrameHash(frame []byte) {
	liveFrameState.mu.Lock()
	defer liveFrameState.mu.Unlock()
	liveFrameState.hash = md5.Sum(frame)
	liveFrameState.set = true
}

func getLastLiveFrameHash() ([16]byte, bool) {
	liveFrameState.mu.Lock()
	defer liveFrameState.mu.Unlock()
	return liveFrameState.hash, liveFrameState.set
}

// =====================================================================
// 🎯 FLIP HORIZONTAL (efek cermin)
// Live view di main.go (StreamLiveView) selalu di-flip pakai flipJPEGHorizontal
// sebelum dikirim ke frontend. Tapi hasil jepret dulu disimpan APA ADANYA,
// jadi foto akhirnya kebalik dari live view (mirror).
// Fungsi ini nyamain: frame yang disimpan juga di-flip sekali, biar hasil
// jepret == live view. Logikanya sama persis kayak yang di main.go.
// =====================================================================
func flipCaptureHorizontal(frame []byte) []byte {
	img, _, err := image.Decode(bytes.NewReader(frame))
	if err != nil {
		return frame // kalau gagal decode, balikin asli aja (jangan bikin error)
	}

	b := img.Bounds()
	w := b.Dx()
	h := b.Dy()
	if w <= 1 || h <= 1 {
		return frame
	}

	// Baca/tulis langsung ke slice Pix, bukan lewat At()/Set(). Sejak yang
	// diproses jadi file full-res (24 MP = 24 juta piksel), dua panggilan
	// interface per piksel itu bikin tiap jepretan molor beberapa detik.
	src := image.NewRGBA(image.Rect(0, 0, w, h))
	draw.Draw(src, src.Bounds(), img, b.Min, draw.Src)
	dst := image.NewRGBA(image.Rect(0, 0, w, h))

	for y := 0; y < h; y++ {
		srcRow := src.Pix[y*src.Stride : y*src.Stride+w*4]
		dstRow := dst.Pix[y*dst.Stride : y*dst.Stride+w*4]
		for x := 0; x < w; x++ {
			// balik pixel kiri ↔ kanan
			s := (w - 1 - x) * 4
			copy(dstRow[x*4:x*4+4], srcRow[s:s+4])
		}
	}

	var out bytes.Buffer
	if err := jpeg.Encode(&out, dst, &jpeg.Options{Quality: 92}); err != nil {
		return frame
	}
	return out.Bytes()
}

type CameraStatus struct {
	Connected    bool   `json:"connected"`
	CameraName   string `json:"camera_name"`
	BatteryLevel string `json:"battery_level"`
}

// CheckCamera cek apakah kamera terhubung ke digiCamControl
func CheckCamera() (*CameraStatus, error) {
	resp, err := digiCamGet("/camera")
	if err != nil {
		return &CameraStatus{Connected: false}, nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return &CameraStatus{Connected: false}, nil
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return &CameraStatus{Connected: false}, nil
	}

	if strings.TrimSpace(string(body)) == "" {
		return &CameraStatus{Connected: true}, nil
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return &CameraStatus{Connected: false}, nil
	}

	name := ""
	if n, ok := result["name"].(string); ok {
		name = n
	}

	return &CameraStatus{
		Connected:  true,
		CameraName: name,
	}, nil
}

// TriggerCapture trigger shutter Canon via digiCamControl
func TriggerCapture(sessionID string) (string, error) {
	sessionDir := filepath.Join(StoragePath, "sessions", sessionID)
	if err := os.MkdirAll(sessionDir, 0755); err != nil {
		return "", fmt.Errorf("gagal buat direktori: %w", err)
	}

	root := digiCamRootURL()
	base := digiCamBaseURL()

	beforeLive, _ := getLastLiveFrameHash()
	beforeShot := lastCapturedFingerprint()

	_ = digiCamTryCommand([]string{root + "/?CMD=LiveViewWnd_Show"})

	// Urutan perintah shutter sengaja nggak diubah: LiveView_Capture emang
	// yang cocok pas jendela live view lagi kebuka, dan dia tetep ngasilin
	// file full-res di digiCamControl.
	if err := digiCamTryCommand([]string{
		root + "/?CMD=LiveView_Capture",
		root + "/?CMD=Capture",
		base + "/capture",
	}); err != nil {
		return "", fmt.Errorf("gagal trigger kamera: %w", err)
	}

	// Prioritas 1 — file jepretan beneran (full-res).
	frame, err := waitForNewCapturedFile(beforeShot, captureFileTimeout)
	if err == nil {
		return saveCaptureFrame(sessionDir, frame)
	}
	log.Printf("⚠️  [DSLR] file full-res nggak keambil (%v) — jatuh ke frame live view", err)

	// Prioritas 2 — frame live view. Resolusinya jauh lebih kecil, tapi
	// mending foto seadanya daripada sesi customer gagal total.
	frame, err = waitForFreshFrameAfterCapture(beforeLive, 2*time.Second)
	if err == nil {
		return saveCaptureFrame(sessionDir, frame)
	}

	time.Sleep(120 * time.Millisecond)
	return downloadLastCaptured(sessionID, sessionDir)
}

func waitForFreshFrameAfterCapture(beforeHash [16]byte, timeout time.Duration) ([]byte, error) {
	deadline := time.Now().Add(timeout)
	for {
		frame, err := fetchLiveViewFrameBytes()
		if err == nil {
			h := md5.Sum(frame)
			captureLiveFrameHash(frame)
			if h != beforeHash {
				return frame, nil
			}
		}
		if time.Now().After(deadline) {
			break
		}
		time.Sleep(80 * time.Millisecond)
	}
	return nil, fmt.Errorf("timeout menunggu frame baru")
}

func saveCaptureFrame(sessionDir string, frame []byte) (string, error) {
	// 🎯 Flip dulu biar hasil jepret sama kayak live view (yg di main.go udah di-flip).
	//    Tanpa ini foto akhirnya kebalik (mirror) dari yang keliatan di layar.
	frame = flipCaptureHorizontal(frame)

	fileName := fmt.Sprintf("dslr_%d.jpg", time.Now().UnixMilli())
	filePath := filepath.Join(sessionDir, fileName)

	f, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("gagal buat file: %w", err)
	}
	defer f.Close()

	if _, err := f.Write(frame); err != nil {
		return "", fmt.Errorf("gagal tulis file: %w", err)
	}

	// Resolusi hasil akhir sengaja di-log: ini satu-satunya cara gampang buat
	// tau kita dapet file full-res atau kejebak frame live view.
	if w, h, err := jpegDimensions(frame); err == nil {
		if w < minCaptureWidth {
			log.Printf("⚠️  [DSLR] %s cuma %dx%d — ini frame live view, BUKAN full-res. "+
				"Cek digiCamControl: kamera kedetek? setting simpan ke PC nyala?", fileName, w, h)
		} else {
			log.Printf("📸 [DSLR] %s tersimpan %dx%d (%d KB)", fileName, w, h, len(frame)/1024)
		}
	}
	return filePath, nil
}

func downloadLastCaptured(sessionID, sessionDir string) (string, error) {
	nonce := fmt.Sprintf("%d", time.Now().UnixNano())

	// File jepretan duluan, preview/live view baru paling belakang — dulu
	// kebalik, jadi yang kesimpen selalu frame kecil walau file full-res-nya
	// sebenernya udah siap.
	urls := append(lastCapturedURLs(nonce), previewFallbackURLs(nonce)...)

	body, err := digiCamReadFirstAvailable(urls)
	if err != nil {
		return "", fmt.Errorf("gagal download foto: %w", err)
	}
	return saveCaptureFrame(sessionDir, body)
}

// GetLiveViewFrame ambil 1 frame dari live view Canon
func GetLiveViewFrame() ([]byte, error) {
	frame, err := fetchLiveViewFrameBytes()
	if err != nil {
		return nil, err
	}
	captureLiveFrameHash(frame)
	return frame, nil
}

func fetchLiveViewFrameBytes() ([]byte, error) {
	root := digiCamRootURL()
	base := digiCamBaseURL()
	nonce := fmt.Sprintf("%d", time.Now().UnixNano())

	frame, err := digiCamReadFirstAvailable([]string{
		root + "/liveview.jpg?_ts=" + nonce,
		root + "/preview.jpg?_ts=" + nonce,
		base + "/liveview?_ts=" + nonce,
	})
	if err != nil {
		return nil, fmt.Errorf("gagal ambil liveview: %w", err)
	}
	return frame, nil
}
