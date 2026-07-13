# test-audio-flow.ps1
# Simulate audio flow lengkap dari LOCKED → UNLOCKING → UNLOCKED → back to LOCKED

$base = "http://localhost:8080/api/sim/fsm"

Write-Host "===============================================" -ForegroundColor Magenta
Write-Host "  AUDIO FLOW TEST — /kamera FSM Simulation" -ForegroundColor Magenta
Write-Host "===============================================" -ForegroundColor Magenta

Write-Host "`n[1] Set state LOCKED (initial)" -ForegroundColor Yellow
Invoke-RestMethod -Uri "$base`?state=LOCKED&progress=0" -Method POST
Write-Host "    Expected audio: (silent, waiting for layar.mp3 → jari_mulai.mp3 sequence)"
Start-Sleep -Seconds 10

Write-Host "`n[2] User angkat telapak — UNLOCKING progressive" -ForegroundColor Cyan
foreach ($p in @(0.1, 0.25, 0.5, 0.75, 1.0)) {
    Write-Host "    Progress: $p"
    Invoke-RestMethod -Uri "$base`?state=UNLOCKING&progress=$p" -Method POST | Out-Null
    Start-Sleep -Milliseconds 500
}

Write-Host "`n[3] Robot UNLOCKED" -ForegroundColor Green
Invoke-RestMethod -Uri "$base`?state=UNLOCKED&progress=1.0" -Method POST
Write-Host "    Expected audio: unlocked.mp3 (auto-play saat transisi)"
Start-Sleep -Seconds 4

Write-Host "`n[4] User pilih preset — trigger sim preset" -ForegroundColor Cyan
Invoke-RestMethod -Uri "http://localhost:8080/api/sim/toggle?on=true" -Method POST | Out-Null
Invoke-RestMethod -Uri "http://localhost:8080/api/sim/preset?n=3" -Method POST
Write-Host "    Expected audio: 4.mp3 + countdown (tiga, dua, satu)"
Start-Sleep -Seconds 5

Write-Host "`n[5] Balik ke LOCKED (siklus baru)" -ForegroundColor Yellow
Invoke-RestMethod -Uri "$base`?state=LOCKED&progress=0" -Method POST
Write-Host "    Expected audio: jari_mulai.mp3 (replay setelah 500ms)"
Start-Sleep -Seconds 5

Write-Host "`n[6] Sim off + reset" -ForegroundColor Yellow
Invoke-RestMethod -Uri "http://localhost:8080/api/sim/toggle?on=false" -Method POST | Out-Null

Write-Host "`n===============================================" -ForegroundColor Magenta
Write-Host "  TEST COMPLETE" -ForegroundColor Magenta
Write-Host "===============================================" -ForegroundColor Magenta
Write-Host "`nCek Console browser buat verify audio play log."