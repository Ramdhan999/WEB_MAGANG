package services

import (
	"bytes"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"image"
	_ "image/jpeg" // register decoder buat jpegDimensions
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
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

	// Jatah nunggu kamera selesai nulis + transfer file ke PC (jalur HTTP
	// /lastcaptured).
	captureFileTimeout = 6 * time.Second

	// Jatah nunggu SINKRON file nongol di folder capture. Sengaja pendek:
	// di kamera lawas (EOS 1100D) transfer bisa 30-90 dtk — yang segitu
	// ditangkep jalur RECOVERY di background (fullResRecoveryLoop), bukan
	// ditungguin di sini. Tunggu sinkron cuma buat nangkep transfer cepat,
	// biar jepretan berikutnya nggak kelamaan ke-blok.
	captureDiskTimeout = 5 * time.Second
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
// 🎯 MIRROR SEKARANG URUSAN CSS, BUKAN BACKEND
// Dulu live view & hasil jepret sama-sama di-flip di sini (decode + encode
// ulang JPEG). Buat file full-res 24 MP itu makan 1-2 detik per jepretan.
// Sekarang SEMUA frame disimpan & dikirim apa adanya (natural); efek cermin
// di layar diurus frontend pakai CSS `scaleX(-1)` — gratis, nggak ada
// decode-encode sama sekali. File yang dicetak/di-Drive jadi natural
// (tulisan di kaos nggak kebalik).
// =====================================================================

// =====================================================================
// 🖼️ CACHE FRAME STREAM TERAKHIR
// Frame terakhir yang dikirim ke layar lewat /api/camera/stream. Dipakai
// endpoint /api/camera/snapshot buat PREVIEW INSTAN: preview harus nampilin
// frame yang PERSIS lagi tampil pas cekrek, bukan hasil fetch baru ke
// digiCamControl yang waktunya bisa meleset (frame basi/beku).
// =====================================================================
var streamFrameCache = struct {
	mu    sync.Mutex
	frame []byte
	at    time.Time
}{}

func cacheStreamFrame(frame []byte) {
	streamFrameCache.mu.Lock()
	defer streamFrameCache.mu.Unlock()
	streamFrameCache.frame = frame
	streamFrameCache.at = time.Now()
}

// GetLastStreamFrame balikin frame live view terakhir yang sempat diambil,
// asalkan umurnya belum lewat maxAge. ok=false artinya belum ada / kelamaan.
func GetLastStreamFrame(maxAge time.Duration) ([]byte, bool) {
	streamFrameCache.mu.Lock()
	defer streamFrameCache.mu.Unlock()
	if streamFrameCache.frame == nil || time.Since(streamFrameCache.at) > maxAge {
		return nil, false
	}
	return streamFrameCache.frame, true
}

// =====================================================================
// 📸 PREVIEW MOMEN SHUTTER
// Frame yang lagi tampil TEPAT waktu perintah shutter sukses dikirim.
// Preview 3 detik di /kamera pertama muncul dari frame saat hitungan habis
// (instan), lalu di-swap ke frame ini — jadi pose preview == pose foto asli
// walau orangnya sempet gerak antara hitungan habis dan shutter kejepret.
// =====================================================================
var shotPreviewState = struct {
	mu    sync.Mutex
	frame []byte
	at    time.Time
}{}

func setShotPreview(frame []byte) {
	shotPreviewState.mu.Lock()
	defer shotPreviewState.mu.Unlock()
	shotPreviewState.frame = frame
	shotPreviewState.at = time.Now()
}

// GetShotPreview balikin frame momen shutter terakhir, tapi CUMA kalau lebih
// baru dari `after` (frontend ngirim waktu dia mulai capture) — biar nggak
// kejebak preview milik jepretan sebelumnya.
func GetShotPreview(after time.Time) ([]byte, bool) {
	shotPreviewState.mu.Lock()
	defer shotPreviewState.mu.Unlock()
	if shotPreviewState.frame == nil || !shotPreviewState.at.After(after) {
		return nil, false
	}
	return shotPreviewState.frame, true
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

// captureMu memastikan cuma SATU capture DSLR jalan pada satu waktu. Tanpa ini,
// dua TriggerCapture yang tumpang tindih bakal saling rebut file /lastcaptured
// (fingerprint ketuker) → foto ketuker/ilang. Pengaman lapis-2 di sisi backend;
// frontend juga sudah menyerialisasi lewat state isCapturing.
var captureMu sync.Mutex

// captureBusy true selama TriggerCapture lagi nungguin file jepretan.
// Selama true, stream live view TIDAK narik frame baru dari digiCamControl
// (dilayani dari cache) — live view & transfer file rebutan satu jalur
// USB/PTP; kalau tetep di-poll ~10 fps, transfer full-res di kamera lawas
// bisa molor belasan detik bahkan nggak kelar-kelar.
var captureBusy atomic.Bool

// resumeHook = cara frontend "nyalain lagi" live view di tengah masa hening
// capture (lihat TriggerCapture). Di-set tiap capture mulai, di-nil-kan pas
// capture kelar.
var (
	resumeHookMu sync.Mutex
	resumeHook   func()
)

func setResumeHook(f func()) {
	resumeHookMu.Lock()
	resumeHook = f
	resumeHookMu.Unlock()
}

// ResumeLiveViewNow dipanggil endpoint /api/camera/resume-liveview — frontend
// manggil ini TEPAT sebelum layar DSLR tampil lagi (preset terkonfirmasi),
// biar live view nyala pas dibutuhkan doang dan masa hening buat transfer
// file jadi semaksimal mungkin.
func ResumeLiveViewNow() {
	resumeHookMu.Lock()
	f := resumeHook
	resumeHookMu.Unlock()
	if f != nil {
		f()
		return
	}
	// Nggak ada capture yang lagi jalan — pastiin aja live view nyala.
	captureBusy.Store(false)
	_ = digiCamTryCommand([]string{digiCamRootURL() + "/?CMD=LiveViewWnd_Show"})
}

// digiCamCaptureDir = folder di PC tempat digiCamControl NYIMPEN file jepretan
// full-res (setting "Transfer → Save to PC" di digiCamControl). Dari env
// DIGICAM_CAPTURE_DIR. Kosong = belum diset → jatuh ke jalur HTTP /lastcaptured.
func digiCamCaptureDir() string {
	return strings.TrimSpace(os.Getenv("DIGICAM_CAPTURE_DIR"))
}

func isJPEGName(name string) bool {
	ext := strings.ToLower(filepath.Ext(name))
	return ext == ".jpg" || ext == ".jpeg"
}

// isRAWName buat deteksi kamera yang ternyata nyimpen RAW, bukan JPEG —
// biar pesan error-nya langsung nunjuk ke setting Image Quality kamera.
func isRAWName(name string) bool {
	switch strings.ToLower(filepath.Ext(name)) {
	case ".cr2", ".cr3", ".nef", ".arw", ".raf", ".orf", ".rw2", ".dng":
		return true
	}
	return false
}

// listJPEGNames kumpulin path file JPEG yang ADA SEKARANG di dir, REKURSIF —
// digiCamControl bisa aja naruh hasil di subfolder (template session per
// tanggal, dll). Dipanggil sebelum shutter; file jepretan baru = path yang
// nggak ada di set ini.
func listJPEGNames(dir string) map[string]struct{} {
	set := make(map[string]struct{})
	if dir == "" {
		return set
	}
	_ = filepath.WalkDir(dir, func(p string, d os.DirEntry, err error) error {
		if err != nil {
			return nil // folder nggak kebaca? skip aja, jangan gagalin scan
		}
		if !d.IsDir() && isJPEGName(d.Name()) {
			set[p] = struct{}{}
		}
		return nil
	})
	return set
}

// waitForNewFileOnDisk nungguin file JPEG BARU (path yang belum ada di `before`)
// muncul di folder capture digiCamControl (rekursif, subfolder ikut) DAN
// transfernya kelar (ukuran stabil). Deteksi via file baru ini lebih
// anti-ketuker daripada fingerprint /lastcaptured: nggak mungkin kejebak foto
// lama. Kalau yang nongol malah file RAW, error-nya bilang eksplisit.
func waitForNewFileOnDisk(dir string, before map[string]struct{}, timeout time.Duration) (string, error) {
	deadline := time.Now().Add(timeout)
	rawFound := ""
	for {
		var candidate string
		var candMod time.Time
		_ = filepath.WalkDir(dir, func(p string, d os.DirEntry, err error) error {
			if err != nil || d.IsDir() {
				return nil
			}
			if isRAWName(d.Name()) {
				rawFound = p // dicatat buat pesan diagnosa pas timeout
				return nil
			}
			if !isJPEGName(d.Name()) {
				return nil
			}
			if _, seen := before[p]; seen {
				return nil
			}
			info, iErr := d.Info()
			if iErr != nil {
				return nil
			}
			// Kalau ada beberapa file baru, ambil yang paling akhir ditulis.
			if candidate == "" || info.ModTime().After(candMod) {
				candMod = info.ModTime()
				candidate = p
			}
			return nil
		})
		if candidate != "" && isFileSizeStable(candidate) {
			return candidate, nil
		}

		if time.Now().After(deadline) {
			if rawFound != "" {
				return "", fmt.Errorf("timeout di %s — yang ketemu file RAW (%s), bukan JPEG. "+
					"Ganti Image Quality kamera / Compression di digiCamControl ke JPEG", dir, filepath.Base(rawFound))
			}
			return "", fmt.Errorf("timeout nunggu file capture baru di %s", dir)
		}
		time.Sleep(150 * time.Millisecond)
	}
}

// isFileSizeStable true kalau ukuran file > 0 dan nggak berubah di dua pembacaan
// berjarak ~120ms — tandanya digiCamControl udah selesai nulis/transfer.
func isFileSizeStable(path string) bool {
	info1, err := os.Stat(path)
	if err != nil || info1.Size() == 0 {
		return false
	}
	time.Sleep(120 * time.Millisecond)
	info2, err := os.Stat(path)
	if err != nil {
		return false
	}
	return info1.Size() == info2.Size()
}

// copyCapturedFile nyalin file full-res APA ADANYA (byte-for-byte, tanpa
// re-encode) dari folder capture digiCamControl ke folder sesi.
func copyCapturedFile(src, sessionDir string) (string, error) {
	in, err := os.Open(src)
	if err != nil {
		return "", fmt.Errorf("gagal buka file capture: %w", err)
	}
	defer in.Close()

	fileName := fmt.Sprintf("dslr_%d.jpg", time.Now().UnixMilli())
	dstPath := filepath.Join(sessionDir, fileName)

	out, err := os.Create(dstPath)
	if err != nil {
		return "", fmt.Errorf("gagal buat file: %w", err)
	}
	defer out.Close()

	n, err := io.Copy(out, in)
	if err != nil {
		return "", fmt.Errorf("gagal salin file capture: %w", err)
	}
	log.Printf("📸 [DSLR] %s disalin dari folder capture (%d KB)", fileName, n/1024)
	return dstPath, nil
}

// TriggerCapture trigger shutter Canon via digiCamControl.
// Return kedua (*RecoveryPending) TIDAK nil kalau yang kesimpen baru frame
// kecil dan file full-res-nya masih bisa nyusul dari folder capture —
// caller wajib lanjutin ke StartFullResRecovery.
func TriggerCapture(sessionID string) (string, *RecoveryPending, error) {
	// Serial: tunggu capture sebelumnya beneran kelar (file ke-transfer) baru
	// baseline "sebelum jepret" diambil di bawah — biar deteksi file akurat.
	captureMu.Lock()
	defer captureMu.Unlock()

	sessionDir := filepath.Join(StoragePath, "sessions", sessionID)
	if err := os.MkdirAll(sessionDir, 0755); err != nil {
		return "", nil, fmt.Errorf("gagal buat direktori: %w", err)
	}

	root := digiCamRootURL()
	base := digiCamBaseURL()

	beforeLive, _ := getLastLiveFrameHash()
	beforeShot := lastCapturedFingerprint()
	captureDir := digiCamCaptureDir()
	beforeNames := listJPEGNames(captureDir)

	_ = digiCamTryCommand([]string{root + "/?CMD=LiveViewWnd_Show"})

	// Urutan perintah shutter sengaja nggak diubah: LiveView_Capture emang
	// yang cocok pas jendela live view lagi kebuka, dan dia tetep ngasilin
	// file full-res di digiCamControl.
	if err := digiCamTryCommand([]string{
		root + "/?CMD=LiveView_Capture",
		root + "/?CMD=Capture",
		base + "/capture",
	}); err != nil {
		return "", nil, fmt.Errorf("gagal trigger kamera: %w", err)
	}
	shotTime := time.Now()

	// newPending = tiket recovery buat foto yang kesimpen versi kecil:
	// file full-res-nya bakal diintai di background (lihat fullResRecoveryLoop).
	newPending := func(savedPath string) *RecoveryPending {
		if captureDir == "" || savedPath == "" {
			return nil
		}
		return &RecoveryPending{smallPath: savedPath, baseline: beforeNames, shotAt: shotTime}
	}

	// 📸 Simpan frame yang lagi tampil TEPAT setelah perintah shutter sukses —
	//    ini momen jepret sesungguhnya. Frontend nge-swap preview ke frame ini,
	//    dan frame ini juga jadi fallback terakhir kalau file asli gagal diambil.
	var shutterFrame []byte
	if frame, ok := GetLastStreamFrame(2 * time.Second); ok {
		shutterFrame = frame
		setShotPreview(frame)
	}

	// 🚦 Bebasin kamera buat transfer file. Dua-duanya perlu:
	//    (1) captureBusy → backend berhenti nge-poll frame (dilayani cache);
	//    (2) LiveViewWnd_Hide → jendela live view digiCamControl DITUTUP.
	//    Bukti lapangan (EOS 1100D): file BARU ditransfer kalau live view
	//    bener-bener berhenti — pas sesi berakhir & stream mati, file langsung
	//    nongol. Hening 6 detik doang kemarin nggak cukup.
	//    Makanya SEKARANG heningnya sampai salah satu dari:
	//    (a) file dapet / capture kelar (defer di bawah), atau
	//    (b) frontend manggil /api/camera/resume-liveview — dipanggil TEPAT
	//        pas layar DSLR mau tampil lagi (preset dikonfirmasi). Jadi hening
	//        maksimal TANPA pernah bikin layar beku.
	captureBusy.Store(true)
	_ = digiCamTryCommand([]string{root + "/?CMD=LiveViewWnd_Hide"})
	var resumeOnce sync.Once
	resumeLiveView := func() {
		captureBusy.Store(false)
		_ = digiCamTryCommand([]string{root + "/?CMD=LiveViewWnd_Show"})
	}
	setResumeHook(func() { resumeOnce.Do(resumeLiveView) })
	defer func() {
		setResumeHook(nil)
		resumeOnce.Do(resumeLiveView)
	}()

	// Prioritas 1 — file full-res langsung dari folder simpan digiCamControl
	// (paling akurat: file baru = nama baru, nggak mungkin foto lama).
	if captureDir != "" {
		src, err := waitForNewFileOnDisk(captureDir, beforeNames, captureDiskTimeout)
		if err == nil {
			p, cErr := copyCapturedFile(src, sessionDir)
			return p, nil, cErr
		}
		log.Printf("⚠️  [DSLR] file baru nggak muncul di folder capture (%v) — coba /lastcaptured", err)
	}

	// Prioritas 2 — /lastcaptured via HTTP dengan cek fingerprint + resolusi.
	// Kalau jalur folder disk barusan udah nunggu penuh, di sini cukup sebentar.
	httpTimeout := captureFileTimeout
	if captureDir != "" {
		httpTimeout = 2 * time.Second
	}
	frame, err := waitForNewCapturedFile(beforeShot, httpTimeout)
	if err == nil {
		p, sErr := saveCaptureFrame(sessionDir, frame)
		return p, nil, sErr
	}
	log.Printf("⚠️  [DSLR] file full-res nggak keambil (%v) — jatuh ke frame live view", err)

	// Prioritas 3 — frame MOMEN SHUTTER (yang sama kayak preview). Resolusinya
	// kecil, tapi pose-nya BENER. Dulu fallback ini ngambil frame live view
	// "sekarang" — padahal "sekarang" itu udah beberapa detik setelah jepret,
	// orangnya udah bubar pose. Frame momen shutter nggak mungkin geser.
	// File full-res-nya bakal nyusul lewat recovery (newPending).
	if shutterFrame != nil {
		log.Printf("⚠️  [DSLR] pakai frame momen shutter sebagai foto (resolusi live view)")
		p, sErr := saveCaptureFrame(sessionDir, shutterFrame)
		if sErr != nil {
			return "", nil, sErr
		}
		return p, newPending(p), nil
	}

	// Prioritas 4 — frame live view terbaru (kalau frame momen shutter pun
	// nggak sempet kesimpen). Mending foto seadanya daripada sesi gagal total.
	frame, err = waitForFreshFrameAfterCapture(beforeLive, 2*time.Second)
	if err == nil {
		p, sErr := saveCaptureFrame(sessionDir, frame)
		if sErr != nil {
			return "", nil, sErr
		}
		return p, newPending(p), nil
	}

	time.Sleep(120 * time.Millisecond)
	p, dErr := downloadLastCaptured(sessionDir, beforeShot)
	if dErr != nil {
		return "", nil, dErr
	}
	return p, newPending(p), nil
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

// downloadLastCaptured = fallback paling terakhir. Coba /lastcaptured dulu,
// TAPI TOLAK kalau fingerprint-nya masih sama kayak sebelum jepret — itu foto
// LAMA, dan nyimpen foto lama lebih parah daripada nyimpen frame preview
// (inilah biang "foto di print-preview beda sama yang dijepret"). Kalau
// ketahuan lama, pakai frame preview/live view aja: minimal itu pose yang
// beneran keliatan di layar.
func downloadLastCaptured(sessionDir string, beforeShot [16]byte) (string, error) {
	nonce := fmt.Sprintf("%d", time.Now().UnixNano())

	if body, err := digiCamReadFirstAvailable(lastCapturedURLs(nonce)); err == nil {
		if frameFingerprint(body) != beforeShot {
			return saveCaptureFrame(sessionDir, body)
		}
		log.Printf("⚠️  [DSLR] /lastcaptured masih foto lama — dilewati, pakai frame preview")
	}

	body, err := digiCamReadFirstAvailable(previewFallbackURLs(nonce))
	if err != nil {
		return "", fmt.Errorf("gagal download foto: %w", err)
	}
	return saveCaptureFrame(sessionDir, body)
}

// GetLiveViewFrame ambil 1 frame dari live view Canon
func GetLiveViewFrame() ([]byte, error) {
	// 🚦 Lagi nunggu file jepretan? Jangan ganggu digiCamControl — layani dari
	//    frame cache biar USB fokus transfer file full-res. Layar aman: momen
	//    ini ketutup overlay preview.
	if captureBusy.Load() {
		if frame, ok := GetLastStreamFrame(30 * time.Second); ok {
			return frame, nil
		}
	}

	frame, err := fetchLiveViewFrameBytes()
	if err != nil {
		return nil, err
	}
	captureLiveFrameHash(frame)
	// Simpan sebagai "frame yang lagi tampil" — dipakai /api/camera/snapshot
	// biar preview instan = persis yang keliatan di layar pas cekrek.
	cacheStreamFrame(frame)
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

// =====================================================================
// 🔁 RECOVERY FULL-RES TELAT
// Bukti lapangan (EOS 1100D): transfer file full-res ke PC bisa molor
// 30-90 detik — nggak peduli live view di-pause atau enggak. Nungguin
// segitu secara sinkron bakal ngeblok jepretan berikutnya. Jadi:
// capture langsung balikin frame momen shutter (kecil, pose bener),
// lalu recovery ini ngintai folder capture di background — begitu file
// aslinya nongol, file kecil di folder sesi DITIMPA full-res (path sama,
// jadi print-preview/frame/GIF otomatis dapet versi bagus), baru setelah
// itu foto diupload ke Drive (sekali, langsung versi final).
// =====================================================================

// RecoveryPending = satu foto yang nunggu di-upgrade ke full-res.
type RecoveryPending struct {
	smallPath string              // file kecil di folder sesi yang mau ditimpa
	baseline  map[string]struct{} // isi folder capture SEBELUM shutter (full path)
	shotAt    time.Time
	onDone    func(upgraded bool)
}

const recoverTimeout = 90 * time.Second

var (
	recoverMu       sync.Mutex
	recoverQueue    []*RecoveryPending
	recoverConsumed = map[string]struct{}{} // file capture yang udah dipasangin foto
	recoverWorker   sync.Once
)

// RecoveryInFlight true kalau foto ini masih nunggu upgrade — dipakai sweep
// Drive biar nggak keburu upload versi kecilnya.
func RecoveryInFlight(photoPath string) bool {
	recoverMu.Lock()
	defer recoverMu.Unlock()
	for _, p := range recoverQueue {
		if p.smallPath == photoPath {
			return true
		}
	}
	return false
}

// StartFullResRecovery daftarin foto buat diintai. onDone dipanggil SEKALI:
// upgraded=true kalau file berhasil ditimpa full-res, false kalau nyerah.
// Aman dipanggil dengan p == nil (langsung onDone(false)).
func StartFullResRecovery(p *RecoveryPending, onDone func(upgraded bool)) {
	if p == nil {
		if onDone != nil {
			onDone(false)
		}
		return
	}
	p.onDone = onDone
	recoverMu.Lock()
	recoverQueue = append(recoverQueue, p)
	recoverMu.Unlock()
	recoverWorker.Do(func() { go fullResRecoveryLoop() })
}

// fullResRecoveryLoop = worker tunggal. Entri diproses FIFO — capture
// di-serialize (captureMu), jadi file baru yang nongol duluan pasti punya
// jepretan yang lebih dulu.
func fullResRecoveryLoop() {
	for {
		time.Sleep(2 * time.Second)

		recoverMu.Lock()
		var head *RecoveryPending
		if len(recoverQueue) > 0 {
			head = recoverQueue[0]
		}
		recoverMu.Unlock()
		if head == nil {
			continue
		}

		if time.Since(head.shotAt) > recoverTimeout {
			log.Printf("⚠️  [RECOVERY] nyerah nunggu full-res buat %s — foto tetep versi kecil", filepath.Base(head.smallPath))
			popRecovery(head, false)
			continue
		}

		dir := digiCamCaptureDir()
		if dir == "" {
			popRecovery(head, false)
			continue
		}

		// Cari file BARU paling tua (bukan baseline, belum kepake foto lain).
		var oldestPath string
		var oldestMod time.Time
		_ = filepath.WalkDir(dir, func(pth string, d os.DirEntry, wErr error) error {
			if wErr != nil || d.IsDir() || !isJPEGName(d.Name()) {
				return nil
			}
			if _, seen := head.baseline[pth]; seen {
				return nil
			}
			recoverMu.Lock()
			_, used := recoverConsumed[pth]
			recoverMu.Unlock()
			if used {
				return nil
			}
			info, iErr := d.Info()
			if iErr != nil {
				return nil
			}
			if oldestPath == "" || info.ModTime().Before(oldestMod) {
				oldestPath = pth
				oldestMod = info.ModTime()
			}
			return nil
		})
		if oldestPath == "" || !isFileSizeStable(oldestPath) {
			continue
		}

		data, rErr := os.ReadFile(oldestPath)
		if rErr != nil {
			continue // mungkin masih ditulis — coba tick berikutnya
		}
		if wErr := os.WriteFile(head.smallPath, data, 0644); wErr != nil {
			log.Printf("⚠️  [RECOVERY] gagal nimpa %s: %v", head.smallPath, wErr)
			popRecovery(head, false)
			continue
		}

		recoverMu.Lock()
		recoverConsumed[oldestPath] = struct{}{}
		recoverMu.Unlock()

		if w, h, dErr := jpegDimensions(data); dErr == nil {
			log.Printf("📸 [RECOVERY] %s di-upgrade ke full-res %dx%d (%d KB, dari %s)",
				filepath.Base(head.smallPath), w, h, len(data)/1024, filepath.Base(oldestPath))
		} else {
			log.Printf("📸 [RECOVERY] %s di-upgrade dari %s", filepath.Base(head.smallPath), filepath.Base(oldestPath))
		}
		popRecovery(head, true)
	}
}

func popRecovery(p *RecoveryPending, upgraded bool) {
	recoverMu.Lock()
	if len(recoverQueue) > 0 && recoverQueue[0] == p {
		recoverQueue = recoverQueue[1:]
	}
	recoverMu.Unlock()
	if p.onDone != nil {
		p.onDone(upgraded)
	}
}
