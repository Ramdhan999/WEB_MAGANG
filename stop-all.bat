@echo off
REM ============================================
REM   GLAMBOT - Stop All Services (1 klik)
REM   Nutup BACKEND + FRONTEND + ROBOT sekaligus.
REM   MySQL SENGAJA dibiarin nyala (aman & start-all
REM   bakal otomatis skip). Restart = stop-all lalu start-all.
REM ============================================

echo Nutup semua service...

REM 1) Tutup jendela berdasarkan judul (beserta anak prosesnya)
taskkill /F /T /FI "WINDOWTITLE eq BACKEND*"  >nul 2>&1
taskkill /F /T /FI "WINDOWTITLE eq FRONTEND*" >nul 2>&1
taskkill /F /T /FI "WINDOWTITLE eq ROBOT*"    >nul 2>&1

REM 2) Jaring pengaman: matiin proses yang masih megang port service
for %%P in (8080 3000 5001) do (
    for /f "tokens=5" %%I in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":%%P "') do (
        taskkill /PID %%I /T /F >nul 2>&1
    )
)

echo Beres. Backend, frontend, dan robot udah dimatiin.
echo (MySQL tetap nyala - itu memang sengaja, nggak papa.)
timeout /t 3 >nul
