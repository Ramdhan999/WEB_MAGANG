package services

import (
	"sync"
)

var (
	// Saklar buat ngasih aba-aba ke Next.js
	readyToShoot bool
	triggerMutex sync.Mutex
)

// SetTrigger dipanggil pas robot nembak ke /api/robot/done
func SetTrigger() {
	triggerMutex.Lock()
	readyToShoot = true
	triggerMutex.Unlock()
}

// CheckAndResetTrigger ditanya sama Next.js, kalau true langsung direset biar ga jepret terus
func CheckAndResetTrigger() bool {
	triggerMutex.Lock()
	defer triggerMutex.Unlock()

	status := readyToShoot
	if status {
		readyToShoot = false
	}

	return status
}
