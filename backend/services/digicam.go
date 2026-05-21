package services

import (
	"crypto/md5"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

var digiCamHTTPClient = &http.Client{Timeout: 8 * time.Second}

// Folder buat nyimpen hasil jepretan kamera
const StoragePath = "./hasil_foto_dslr"

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
	beforeHash, _ := getLastLiveFrameHash()

	_ = digiCamTryCommand([]string{root + "/?CMD=LiveViewWnd_Show"})

	if err := digiCamTryCommand([]string{
		root + "/?CMD=LiveView_Capture",
		root + "/?CMD=Capture",
		base + "/capture",
	}); err != nil {
		return "", fmt.Errorf("gagal trigger kamera: %w", err)
	}

	frame, err := waitForFreshFrameAfterCapture(beforeHash, 2*time.Second)
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
	return filePath, nil
}

func downloadLastCaptured(sessionID, sessionDir string) (string, error) {
	root := digiCamRootURL()
	base := digiCamBaseURL()
	nonce := fmt.Sprintf("%d", time.Now().UnixNano())

	body, err := digiCamReadFirstAvailable([]string{
		root + "/liveview.jpg?_ts=" + nonce,
		root + "/preview.jpg?_ts=" + nonce,
		root + "/lastcaptured?_ts=" + nonce,
		base + "/lastcaptured?_ts=" + nonce,
	})
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
