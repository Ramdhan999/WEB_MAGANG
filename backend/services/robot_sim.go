package services

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
)

// =====================================================================
// ROBOT STATE + SIMULASI
// ---------------------------------------------------------------------
// File ini nyimpen "state robot" di memori. Dipake buat 2 mode:
//   1. MODE SIMULASI (sim on)  → state digerakin lewat curl (/api/sim/*)
//   2. MODE ROBOT BENERAN (sim off) → state digerakin webhook robot
//      (/api/robot/moving, /api/robot/done) + background poller /detection
//
// Frontend /kamera tinggal polling GET /api/robot/state → react ke
// perubahan "seq" (palm/gesture/preset/done) buat mainin suara + countdown.
// =====================================================================

// ── KONFIG ──────────────────────────────────────────────────────────────────

// URL robot Flask (lewat ngrok). Samain sama yang di main.go.
var RobotBaseURL = "http://localhost:5001"

// Gesture "telapak / 5 jari" = pemicu suara 2.
// Dari constants.py robot: gesture_id 5 = "All Fingers".
// Gua cocokin pakai DUA cara biar aman: lewat gesture_id ATAU keyword nama.
const TelapakGestureID = 5 // "All Fingers" (5 jari) dari GESTURE_ID_TO_NAME
var TelapakKeywords = []string{"all fingers", "all finger", "palm", "telapak"}

// Delay (detik) antara robot "done" sampai jepret — window buat countdown 3-2-1.
const robotCaptureDelaySec = 3

// ── STATE ───────────────────────────────────────────────────────────────────

type robotStateData struct {
	SimEnabled    bool
	RobotEnabled  bool
	CurrentPreset int
	LastGesture   string

	PalmSeq    int // telapak/5 jari kedeteksi → suara 2
	GestureSeq int // gesture kedeteksi         → suara 3
	PresetSeq  int // preset terkonfirmasi      → suara 4
	DoneSeq    int // robot selesai gerak       → countdown + jepret

	// 🔒 FSM state dari Flask /detection — biar frontend tau kapan
	// robot udah "unlocked" dan siap terima gesture preset.
	// Value: "LOCKED" | "UNLOCKING" | "UNLOCKED" | "CONFIRMING" | "MOVING" | "COOLDOWN"
	FsmState string

	// 📊 Progress unlock (0.0 - 1.0) — user tahan telapak berapa % dari threshold
	UnlockProgress float64

	AutoCaptureAt time.Time
}

var robotState = struct {
	mu sync.RWMutex
	d  robotStateData
}{}

// ── SETTERS ─────────────────────────────────────────────────────────────────

func SimSetEnabled(on bool) {
	robotState.mu.Lock()
	defer robotState.mu.Unlock()
	robotState.d.SimEnabled = on
}

func SimIsEnabled() bool {
	robotState.mu.RLock()
	defer robotState.mu.RUnlock()
	return robotState.d.SimEnabled
}

func RobotSetEnabled(on bool) {
	robotState.mu.Lock()
	defer robotState.mu.Unlock()
	robotState.d.RobotEnabled = on
}

func RobotIsEnabled() bool {
	robotState.mu.RLock()
	defer robotState.mu.RUnlock()
	return robotState.d.RobotEnabled
}

func RobotFirePalm() {
	robotState.mu.Lock()
	defer robotState.mu.Unlock()
	robotState.d.PalmSeq++
}

func RobotFireGesture(name string) {
	robotState.mu.Lock()
	defer robotState.mu.Unlock()
	robotState.d.LastGesture = name
	robotState.d.GestureSeq++
}

func RobotConfirmPreset(n int) {
	robotState.mu.Lock()
	defer robotState.mu.Unlock()
	robotState.d.CurrentPreset = n
	robotState.d.PresetSeq++
}

func RobotFireDone() {
	robotState.mu.Lock()
	defer robotState.mu.Unlock()
	robotState.d.DoneSeq++
	robotState.d.AutoCaptureAt = time.Now().Add(robotCaptureDelaySec * time.Second)
}

// 🔒 SIM SETTER — untuk testing FSM tanpa Flask running
// Bisa dipanggil via curl:
//   Invoke-RestMethod -Uri "http://localhost:8080/api/sim/fsm?state=UNLOCKING&progress=0.5" -Method POST
func SimSetFsm(state string, progress float64) {
	robotState.mu.Lock()
	defer robotState.mu.Unlock()
	robotState.d.FsmState = state
	robotState.d.UnlockProgress = progress
}

// RobotStateJSON — dipake handler GET /api/robot/state
func RobotStateJSON() map[string]interface{} {
	robotState.mu.RLock()
	defer robotState.mu.RUnlock()

	d := robotState.d

	remainingMs := int64(0)
	countdownActive := false
	if !d.AutoCaptureAt.IsZero() {
		rem := time.Until(d.AutoCaptureAt).Milliseconds()
		if rem > 0 {
			remainingMs = rem
			countdownActive = true
		}
	}

	return map[string]interface{}{
		"sim_enabled":            d.SimEnabled,
		"robot_enabled":          d.RobotEnabled,
		"current_preset":         d.CurrentPreset,
		"last_gesture":           d.LastGesture,
		"palm_seq":               d.PalmSeq,
		"gesture_seq":            d.GestureSeq,
		"preset_seq":             d.PresetSeq,
		"done_seq":               d.DoneSeq,
		"countdown_active":       countdownActive,
		"countdown_remaining_ms": remainingMs,

		// 🔒 FSM + unlock progress dari Flask (untuk UI feedback frontend)
		"fsm_state":       d.FsmState,       // "LOCKED" | "UNLOCKING" | "UNLOCKED" | ...
		"unlock_progress": d.UnlockProgress, // 0.0 - 1.0
	}
}

// ── BACKGROUND POLLER (mode robot beneran) ──────────────────────────────────
// Poll /detection robot tiap 0.5 detik, terjemahin jadi event suara.
// Cuma jalan kalau: sim OFF + robot enabled.
//
// Panggil sekali di main(): go services.StartRobotDetectionPoller()
func StartRobotDetectionPoller() {
	client := &http.Client{Timeout: 3 * time.Second}

	var prevPalm bool
	var prevGesture string
	var prevPreset string

	for {
		time.Sleep(500 * time.Millisecond)

		if SimIsEnabled() || !RobotIsEnabled() {
			continue
		}

		resp, err := client.Get(RobotBaseURL + "/detection")
		if err != nil {
			continue
		}
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		var d map[string]interface{}
		if json.Unmarshal(body, &d) != nil {
			continue
		}

		gestureName, _ := d["gesture_name"].(string)
		handDetected, _ := d["hand_detected"].(bool)
		robotPreset, _ := d["robot_preset"].(string)

		// gesture_id bisa berupa float64 (JSON number) atau null
		gestureID := 0
		if gid, ok := d["gesture_id"].(float64); ok {
			gestureID = int(gid)
		}

		// 🔒 FSM state + unlock progress dari Flask
		// - fsm_state: "LOCKED" | "UNLOCKING" | "UNLOCKED" | "CONFIRMING" | "MOVING" | "COOLDOWN"
		// - recognition_progress.arm.percent: 0-100 (progress tahan telapak)
		fsmState, _ := d["fsm_state"].(string)
		var unlockProgress float64
		if recog, ok := d["recognition_progress"].(map[string]interface{}); ok {
			if arm, ok := recog["arm"].(map[string]interface{}); ok {
				if percent, ok := arm["percent"].(float64); ok {
					unlockProgress = percent / 100.0 // convert % → 0.0-1.0
				}
			}
		}

		// Simpan ke robotState biar RobotStateJSON bisa expose ke frontend
		robotState.mu.Lock()
		robotState.d.FsmState = fsmState
		robotState.d.UnlockProgress = unlockProgress
		robotState.mu.Unlock()

		// PALM / 5 JARI ("All Fingers", id=5) — rising edge
		isPalm := handDetected && (gestureID == TelapakGestureID || matchesKeyword(gestureName, TelapakKeywords))
		if isPalm && !prevPalm {
			RobotFirePalm()
		}
		prevPalm = isPalm

		// GESTURE lain (selain palm) — pas nama gesture berubah & kedeteksi
		if handDetected && gestureName != "" && gestureName != prevGesture && !isPalm {
			RobotFireGesture(gestureName)
		}
		prevGesture = gestureName

		// PRESET — pas robot_preset berubah jadi angka (bukan "scan"/kosong)
		if robotPreset != "" && robotPreset != prevPreset && strings.ToLower(robotPreset) != "scan" {
			if n, err := strconv.Atoi(robotPreset); err == nil {
				RobotConfirmPreset(n)
			}
		}
		prevPreset = robotPreset
	}
}

func matchesKeyword(name string, keywords []string) bool {
	n := strings.ToLower(strings.TrimSpace(name))
	if n == "" {
		return false
	}
	for _, k := range keywords {
		if strings.Contains(n, strings.ToLower(k)) {
			return true
		}
	}
	return false
}