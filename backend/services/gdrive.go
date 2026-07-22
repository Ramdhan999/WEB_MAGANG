package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"os"
	"path/filepath"
	"strings"
	"time"

	"golang.org/x/oauth2"
)

// =====================================================================
// Integrasi Google Drive: upload hasil sesi ke Drive akun Gmail booth.
//
// Struktur per sesi:
//   Hasil foto kamu — <txn>        (di-share "anyone with link" → reader) ← QR
//    ├── Hasil jepretan/           (semua foto mentah dari /kamera)
//    ├── Hasil frame/              (frame final hasil edit di /result)
//    └── Hasil live preview/       (GIF animasi dari slideshow live preview)
//
// Auth: OAuth2 refresh-token akun Gmail (lihat cmd/gdrive-token). Scope minimal
// `drive.file` — app cuma bisa lihat/ubah file yang dia sendiri bikin.
//
// Kredensial dibaca langsung dari env (godotenv udah di-load di main.go):
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN,
//   GOOGLE_DRIVE_FOLDER_ID (opsional; kosong = root My Drive)
// =====================================================================

const (
	driveAPIBase    = "https://www.googleapis.com/drive/v3"
	driveUploadBase = "https://www.googleapis.com/upload/drive/v3"
	driveFolderMIME = "application/vnd.google-apps.folder"
)

// Nama subfolder per sesi. Dipakai bareng sama drive_controller (termasuk
// buat backfill sesi lama), jadi jangan di-hardcode ulang di tempat lain.
const (
	FolderJepretan    = "Hasil jepretan"
	FolderFrame       = "Hasil frame"
	FolderLivePreview = "Hasil live preview"
)

// DriveUpload = satu file lokal yang mau di-upload + nama tampil di Drive.
type DriveUpload struct {
	LocalPath string // path file di disk
	Name      string // nama file yang tampil di Drive
}

// SessionFolders = hasil bikin struktur folder 1 sesi.
type SessionFolders struct {
	ParentID      string // folder induk "Hasil foto kamu — <txn>"
	WebViewLink   string // link folder induk (buat QR)
	JepretanID    string // subfolder "Hasil jepretan"
	FrameID       string // subfolder "Hasil frame"
	LivePreviewID string // subfolder "Hasil live preview"
}

// IsDriveEnabled true kalau kredensial OAuth Drive lengkap di env.
func IsDriveEnabled() bool {
	return os.Getenv("GOOGLE_CLIENT_ID") != "" &&
		os.Getenv("GOOGLE_CLIENT_SECRET") != "" &&
		os.Getenv("GOOGLE_REFRESH_TOKEN") != ""
}

// driveOAuthConfig bangun oauth2.Config buat endpoint Google. Sengaja nggak
// pakai golang.org/x/oauth2/google biar dependensi ringan.
func driveOAuthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://accounts.google.com/o/oauth2/auth",
			TokenURL: "https://oauth2.googleapis.com/token",
		},
		Scopes: []string{"https://www.googleapis.com/auth/drive.file"},
	}
}

// driveClient = *http.Client yang otomatis refresh access token dari refresh
// token (nggak ada access token awal → di-refresh pas dipakai).
func driveClient(ctx context.Context) *http.Client {
	conf := driveOAuthConfig()
	tok := &oauth2.Token{RefreshToken: os.Getenv("GOOGLE_REFRESH_TOKEN")}
	return conf.Client(ctx, tok)
}

// DriveContext = context dengan timeout wajar buat operasi upload.
func DriveContext() (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), 3*time.Minute)
}

// =====================================================================
// HIGH-LEVEL: bikin struktur folder 1 sesi
// =====================================================================

// CreateSessionFolders bikin folder induk (di-share publik) + 3 subfolder
// "Hasil jepretan", "Hasil frame", & "Hasil live preview". Subfolder mewarisi
// izin share dari induk, jadi nggak perlu di-share lagi satu-satu. Dipanggil
// SEKALI per sesi.
func CreateSessionFolders(ctx context.Context, parentName string) (*SessionFolders, error) {
	if !IsDriveEnabled() {
		return nil, fmt.Errorf("google drive belum dikonfigurasi")
	}
	client := driveClient(ctx)
	rootParent := os.Getenv("GOOGLE_DRIVE_FOLDER_ID") // opsional

	parentID, link, err := createDriveFolder(ctx, client, parentName, rootParent)
	if err != nil {
		return nil, fmt.Errorf("gagal bikin folder induk: %w", err)
	}
	// Share folder induk: anyone with link → reader. Isi di dalamnya mewarisi.
	if err := setAnyoneReader(ctx, client, parentID); err != nil {
		return nil, fmt.Errorf("gagal share folder induk: %w", err)
	}

	jepretanID, _, err := createDriveFolder(ctx, client, FolderJepretan, parentID)
	if err != nil {
		return nil, fmt.Errorf("gagal bikin subfolder %s: %w", FolderJepretan, err)
	}
	frameID, _, err := createDriveFolder(ctx, client, FolderFrame, parentID)
	if err != nil {
		return nil, fmt.Errorf("gagal bikin subfolder %s: %w", FolderFrame, err)
	}
	livePreviewID, _, err := createDriveFolder(ctx, client, FolderLivePreview, parentID)
	if err != nil {
		return nil, fmt.Errorf("gagal bikin subfolder %s: %w", FolderLivePreview, err)
	}

	return &SessionFolders{
		ParentID:      parentID,
		WebViewLink:   link,
		JepretanID:    jepretanID,
		FrameID:       frameID,
		LivePreviewID: livePreviewID,
	}, nil
}

// CreateSubfolder bikin satu subfolder di dalam folder induk yang udah ada.
// Dipakai buat backfill sesi lama yang folder induknya dibikin sebelum
// subfolder "Hasil live preview" ada.
func CreateSubfolder(ctx context.Context, parentID, name string) (string, error) {
	if !IsDriveEnabled() {
		return "", fmt.Errorf("google drive belum dikonfigurasi")
	}
	if parentID == "" {
		return "", fmt.Errorf("folder induk kosong")
	}
	id, _, err := createDriveFolder(ctx, driveClient(ctx), name, parentID)
	return id, err
}

// =====================================================================
// UPLOAD
// =====================================================================

// UploadFileToFolder upload SATU file dari disk ke folder Drive yang udah ada.
func UploadFileToFolder(ctx context.Context, folderID string, f DriveUpload) error {
	if !IsDriveEnabled() {
		return fmt.Errorf("google drive belum dikonfigurasi")
	}
	if folderID == "" {
		return fmt.Errorf("folder ID kosong")
	}
	client := driveClient(ctx)
	src, err := os.Open(f.LocalPath)
	if err != nil {
		return err
	}
	defer src.Close()
	_, err = uploadDriveReader(ctx, client, folderID, f.Name, src)
	return err
}

// UploadBytesToFolder upload SATU file dari []byte (mis. hasil decode base64)
// ke folder Drive yang udah ada.
func UploadBytesToFolder(ctx context.Context, folderID, name string, data []byte) error {
	if !IsDriveEnabled() {
		return fmt.Errorf("google drive belum dikonfigurasi")
	}
	if folderID == "" {
		return fmt.Errorf("folder ID kosong")
	}
	client := driveClient(ctx)
	_, err := uploadDriveReader(ctx, client, folderID, name, bytes.NewReader(data))
	return err
}

// =====================================================================
// DELETE (buat cleanup sesi expired biar storage Drive nggak numpuk)
// =====================================================================

// DeleteDriveFolder hapus folder sesi (beserta isinya). 404 dianggap sukses
// (idempoten terhadap cleanup berulang).
func DeleteDriveFolder(ctx context.Context, folderID string) error {
	if !IsDriveEnabled() {
		return fmt.Errorf("google drive belum dikonfigurasi")
	}
	if folderID == "" {
		return fmt.Errorf("folder ID kosong")
	}
	client := driveClient(ctx)
	url := fmt.Sprintf("%s/files/%s?supportsAllDrives=true", driveAPIBase, folderID)
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, url, nil)
	if err != nil {
		return err
	}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusNotFound {
		return nil
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		data, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
		return fmt.Errorf("drive API %s: %s", resp.Status, strings.TrimSpace(string(data)))
	}
	return nil
}

// =====================================================================
// LOW-LEVEL helpers
// =====================================================================

// createDriveFolder bikin folder. parentID boleh kosong (folder di root My Drive).
func createDriveFolder(ctx context.Context, client *http.Client, name, parentID string) (id, webViewLink string, err error) {
	meta := map[string]interface{}{
		"name":     name,
		"mimeType": driveFolderMIME,
	}
	if parentID != "" {
		meta["parents"] = []string{parentID}
	}
	body, _ := json.Marshal(meta)

	url := driveAPIBase + "/files?fields=id,webViewLink&supportsAllDrives=true"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return "", "", err
	}
	req.Header.Set("Content-Type", "application/json")

	var out struct {
		ID          string `json:"id"`
		WebViewLink string `json:"webViewLink"`
	}
	if err := doDriveJSON(client, req, &out); err != nil {
		return "", "", err
	}
	return out.ID, out.WebViewLink, nil
}

// setAnyoneReader kasih izin baca publik (anyone with link) ke file/folder.
func setAnyoneReader(ctx context.Context, client *http.Client, fileID string) error {
	body, _ := json.Marshal(map[string]string{
		"role": "reader",
		"type": "anyone",
	})
	url := fmt.Sprintf("%s/files/%s/permissions?supportsAllDrives=true", driveAPIBase, fileID)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	return doDriveJSON(client, req, nil)
}

// uploadDriveReader upload konten dari io.Reader ke folder (multipart: metadata + isi).
func uploadDriveReader(ctx context.Context, client *http.Client, parentID, name string, r io.Reader) (string, error) {
	mimeType := mime.TypeByExtension(strings.ToLower(filepath.Ext(name)))
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)

	// Part 1: metadata JSON
	metaHeader := textproto.MIMEHeader{}
	metaHeader.Set("Content-Type", "application/json; charset=UTF-8")
	metaPart, err := mw.CreatePart(metaHeader)
	if err != nil {
		return "", err
	}
	meta := map[string]interface{}{
		"name":    name,
		"parents": []string{parentID},
	}
	if err := json.NewEncoder(metaPart).Encode(meta); err != nil {
		return "", err
	}

	// Part 2: konten file
	contentHeader := textproto.MIMEHeader{}
	contentHeader.Set("Content-Type", mimeType)
	contentPart, err := mw.CreatePart(contentHeader)
	if err != nil {
		return "", err
	}
	if _, err := io.Copy(contentPart, r); err != nil {
		return "", err
	}
	if err := mw.Close(); err != nil {
		return "", err
	}

	url := driveUploadBase + "/files?uploadType=multipart&fields=id&supportsAllDrives=true"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, &buf)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "multipart/related; boundary="+mw.Boundary())

	var out struct {
		ID string `json:"id"`
	}
	if err := doDriveJSON(client, req, &out); err != nil {
		return "", err
	}
	return out.ID, nil
}

// doDriveJSON jalanin request, cek status, decode body JSON ke `out` (boleh nil).
func doDriveJSON(client *http.Client, req *http.Request, out interface{}) error {
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	data, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("drive API %s: %s", resp.Status, strings.TrimSpace(string(data)))
	}
	if out == nil || len(data) == 0 {
		return nil
	}
	return json.Unmarshal(data, out)
}
