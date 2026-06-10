package services

import (
	"fmt"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"time"
)

// =====================================================================
// PRINTER SERVICE
// ---------------------------------------------------------------------
// Wrapper buat trigger print ke printer Windows (sekarang) atau Linux
// (CUPS — nanti pas migrate).
// =====================================================================

// PrinterName — Nama persis printer di Windows (case-sensitive!).
// Hasil dari: Get-Printer | Select-Object Name
var PrinterName = "EPSON SL-D500 Series"

// PrintTimeout — total timeout buat 1 print job
const PrintTimeout = 60 * time.Second

// PrintImage — trigger print sebuah gambar dengan qty copies.
// Return error kalau gagal (timeout, printer offline, dll).
func PrintImage(imagePath string, qty int) error {
	if qty < 1 {
		qty = 1
	}
	if qty > 10 {
		qty = 10 // safety cap
	}

	absPath, err := filepath.Abs(imagePath)
	if err != nil {
		return fmt.Errorf("path resolve gagal: %w", err)
	}

	switch runtime.GOOS {
	case "windows":
		return printWindows(absPath, qty)
	case "linux":
		return printLinux(absPath, qty)
	default:
		return fmt.Errorf("OS belum di-support: %s", runtime.GOOS)
	}
}

// printWindows — pake PowerShell + System.Drawing.Printing
func printWindows(imagePath string, qty int) error {
	scriptPath, err := filepath.Abs("scripts/print_image.ps1")
	if err != nil {
		return fmt.Errorf("script path: %w", err)
	}

	cmd := exec.Command("powershell",
		"-NoProfile",
		"-ExecutionPolicy", "Bypass",
		"-File", scriptPath,
		"-ImagePath", imagePath,
		"-PrinterName", PrinterName,
		"-Copies", strconv.Itoa(qty),
	)

	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("print error: %v | output: %s", err, strings.TrimSpace(string(out)))
	}
	return nil
}

// printLinux — pake CUPS `lp` command (buat nanti pas migrate)
func printLinux(imagePath string, qty int) error {
	cmd := exec.Command("lp",
		"-d", PrinterName,
		"-n", strconv.Itoa(qty),
		imagePath,
	)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("lp print error: %v | output: %s", err, strings.TrimSpace(string(out)))
	}
	return nil
}
