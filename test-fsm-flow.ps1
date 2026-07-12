$base = "http://localhost:8080/api/sim/fsm"

Write-Host "1. LOCKED" -ForegroundColor Yellow
Invoke-RestMethod -Uri "$base`?state=LOCKED&progress=0" -Method POST
Start-Sleep -Seconds 3

Write-Host "`n2. UNLOCKING (0% -> 100%)" -ForegroundColor Cyan
foreach ($p in @(0.1, 0.2, 0.4, 0.6, 0.8, 1.0)) {
    Write-Host "   Progress: $p"
    Invoke-RestMethod -Uri "$base`?state=UNLOCKING&progress=$p" -Method POST | Out-Null
    Start-Sleep -Milliseconds 500
}

Write-Host "`n3. UNLOCKED" -ForegroundColor Green
Invoke-RestMethod -Uri "$base`?state=UNLOCKED&progress=1.0" -Method POST
Start-Sleep -Seconds 3

Write-Host "`n4. LOCKED (reset)" -ForegroundColor Yellow
Invoke-RestMethod -Uri "$base`?state=LOCKED&progress=0" -Method POST

Write-Host "`n Test complete" -ForegroundColor Magenta