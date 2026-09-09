#!/usr/bin/env bash
# ==============================================================================
# KasToko POS & Backoffice UMKM — 1-Click Launcher (Linux / Debian / Ubuntu)
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "========================================================"
echo "          KASTOKO POS & MANAJEMEN TOKO UMKM             "
echo "========================================================"
echo ""

# 1. Periksa berkas environment (.env.local)
if [ ! -f .env.local ]; then
  echo "[-] Berkas .env.local belum ditemukan."
  if [ -f .env.example ]; then
    echo "[+] Menyalin dari .env.example ke .env.local..."
    cp .env.example .env.local
    # Generate random secret if openssl available
    if command -v openssl >/dev/null 2>&1; then
      RAND_SECRET=$(openssl rand -hex 16)
      sed -i "s/SESSION_SECRET=xxxxxxxx/SESSION_SECRET=${RAND_SECRET}/g" .env.local
      sed -i "s/ganti_dengan_string_acak_panjang_minimal_32_karakter/${RAND_SECRET}/g" .env.local
    fi
    echo "[✓] .env.local berhasil dibuat."
  else
    echo "[!] Peringatan: .env.example tidak ditemukan. Pastikan konfigurasi env diisi."
  fi
fi

# 2. Cek Mode Eksekusi (Docker vs Native PM2/Node)
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1 && [ "$1" == "--docker" ]; then
  echo "[+] Menjalankan KasToko melalui Docker Compose..."
  docker compose up -d --build
  echo "[✓] Container KasToko berjalan di latar belakang."
else
  # Mode Standar Server Debian / Local Node.js
  echo "[+] Memeriksa kesiapan database PostgreSQL..."
  if command -v node >/dev/null 2>&1; then
    node db/migrate.mjs || echo "[!] Catatan migrasi selesai / dilewati."
  fi

  # Cek apakah PM2 terpasang
  if command -v pm2 >/dev/null 2>&1; then
    echo "[+] Menjalankan/Me-restart layanan melalui PM2..."
    if pm2 describe kastoko >/dev/null 2>&1; then
      pm2 restart kastoko
    else
      pm2 start npm --name "kastoko" -- run start
    fi
    pm2 save || true
    echo "[✓] Layanan KasToko aktif di PM2."
  else
    echo "[+] Menjalankan KasToko (npm run start)..."
    npm run start &
  fi
fi

# 3. Informasi Akses
HOST_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")
PORT=9991

echo ""
echo "========================================================"
echo " [✓] KASTOKO POS SIAP DIGUNAKAN!                        "
echo "--------------------------------------------------------"
echo " Akses Lokal Komputer : http://localhost:${PORT}"
echo " Akses HP / Tablet LAN: http://${HOST_IP}:${PORT}"
echo " Loket Kasir Langsung : http://localhost:${PORT}/kasir"
echo " Dasbor Pemilik Toko  : http://localhost:${PORT}/dashboard"
echo "========================================================"
echo ""
