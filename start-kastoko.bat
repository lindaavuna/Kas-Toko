@echo off
REM ==============================================================================
REM KasToko POS & Backoffice UMKM — 1-Click Launcher (Windows)
REM ==============================================================================

title KasToko POS UMKM
color 0A
cls

echo ======================================================================
echo                 KASTOKO POS ^& MANAJEMEN TOKO UMKM
echo ======================================================================
echo.

REM 1. Periksa berkas konfigurasi .env.local
if not exist ".env.local" (
    echo [-] Berkas .env.local belum ditemukan.
    if exist ".env.example" (
        echo [+] Membuat .env.local dari template .env.example...
        copy .env.example .env.local >nul
        echo [v] Berkas .env.local berhasil dibuat.
    ) else (
        echo [!] Peringatan: .env.example tidak ditemukan.
    )
)

REM 2. Opsi Docker Desktop jika terpasang
where docker >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [+] Docker terdeteksi. Memeriksa status Docker engine...
    docker info >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        echo [+] Menjalankan stack KasToko via Docker Compose...
        docker compose up -d
        goto SELESAI
    )
)

REM 3. Eksekusi Berbasis Node.js Lokal
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    color 0C
    echo.
    echo [X] Node.js belum terpasang di komputer ini!
    echo Silakan unduh dan pasang Node.js LTS dari https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM Cek node_modules
if not exist "node_modules\" (
    echo [+] Mengunduh dependensi (npm install)...
    call npm install
)

REM Migrasi Database
echo [+] Memeriksa migrasi database PostgreSQL...
call node db/migrate.mjs

REM Jalankan Aplikasi
echo [+] Memulai server KasToko di port 9991...
start "" http://localhost:9991/kasir
call npm run start

:SELESAI
echo.
echo ======================================================================
echo  [v] KASTOKO POS SIAP DIGUNAKAN!
echo  Akses Kasir  : http://localhost:9991/kasir
echo  Akses Dasbor : http://localhost:9991/dashboard
echo ======================================================================
echo.
pause
