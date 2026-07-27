@echo off
REM ============================================
REM   GLAMBOT - Start All Services (1 klik)
REM   0. MySQL  -> auto-nyala kalau belum jalan
REM   1. Backend Go (:8080)
REM   2. Frontend Next.js (:3000)
REM   3. Robot Flask (:5001)
REM   Tutup jendela / Ctrl+C buat matiin satuan
REM ============================================

REM (Opsional) isi manual kalau auto-detect gagal nemuin MySQL:
set "MYSQLD="
set "MYSQL_DATADIR="

REM --- [0/3] MySQL ---
netstat -an | findstr ":3306" | findstr "LISTENING" >nul
if not errorlevel 1 goto mysql_ok

echo [0/3] MySQL belum nyala - nyalain otomatis...

if defined MYSQLD goto mysql_start

REM auto-detect Laragon (butuh --datadir)
for %%R in ("C:\laragon" "D:\laragon" "C:\laragon\laragon" "D:\laragon\laragon") do (
    if exist "%%~R\bin\mysql\" (
        for /d %%M in ("%%~R\bin\mysql\mysql-*") do set "MYSQLD=%%M\bin\mysqld.exe"
        for /d %%D in ("%%~R\data\mysql*") do set "MYSQL_DATADIR=%%D"
    )
)
if defined MYSQLD goto mysql_start

REM auto-detect XAMPP (datadir udah diatur my.ini bawaannya)
if exist "C:\xampp\mysql\bin\mysqld.exe" set "MYSQLD=C:\xampp\mysql\bin\mysqld.exe"
if defined MYSQLD goto mysql_start

echo.
echo  [!] mysqld.exe nggak ketemu (Laragon/XAMPP nggak kedeteksi).
echo      Isi variabel MYSQLD di bagian atas file ini secara manual.
echo.
pause
exit /b 1

:mysql_start
if defined MYSQL_DATADIR (
    start "MYSQL (:3306)" /min "%MYSQLD%" --datadir="%MYSQL_DATADIR%" --port=3306 --console
) else (
    start "MYSQL (:3306)" /min "%MYSQLD%" --console
)

set /a MYSQL_TRIES=0
:mysql_wait
timeout /t 2 >nul
netstat -an | findstr ":3306" | findstr "LISTENING" >nul
if not errorlevel 1 goto mysql_ok
set /a MYSQL_TRIES+=1
if %MYSQL_TRIES% lss 15 goto mysql_wait
echo.
echo  [!] MySQL nggak kunjung nyala setelah 30 detik - cek jendela MYSQL.
echo.
pause
exit /b 1

:mysql_ok
echo     MySQL OK (port 3306)

echo [1/3] Backend Go (:8080)...
start "BACKEND (Go :8080)" cmd /k "cd /d %~dp0backend && go run ."

echo [2/3] Frontend Next.js (:3000)...
start "FRONTEND (Next :3000)" cmd /k "cd /d %~dp0photobooth-frontend && npm run dev"

echo [3/3] Robot Flask (:5001)...
REM Pakai venv kalau ada DAN beneran jalan (venv copy-an dari PC lain suka rusak)
"%~dp0Glambot-Automation\venv\Scripts\python.exe" --version >nul 2>&1
if errorlevel 1 (
    start "ROBOT (Flask :5001)" cmd /k "cd /d %~dp0Glambot-Automation && python main.py"
) else (
    start "ROBOT (Flask :5001)" cmd /k "cd /d %~dp0Glambot-Automation && venv\Scripts\python.exe main.py"
)

echo.
echo Semua service dijalankan. Jendela ini boleh ditutup.
echo (Jendela MYSQL yang minimize JANGAN ditutup selama masih dipakai.)
timeout /t 5 >nul
