# 🛒 KasToko — Sistem Kasir & Manajemen Toko Pintar UMKM

[![CI KasToko](https://github.com/lindaavuna/Kas-Toko/actions/workflows/ci.yml/badge.svg)](https://github.com/lindaavuna/Kas-Toko/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.4-black.svg)](https://nextjs.org/)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)


KasToko adalah sistem Point of Sale (POS) dan manajemen operasional toko ritel modern yang dirancang khusus untuk toko kelontong, sembako, dan UMKM di Indonesia. Mengutamakan kecepatan kasir kilat, keandalan tanpa koneksi internet (Offline-First), kompatibilitas hardware Bluetooth thermal, dan asisten AI pintar.

---

## 🌟 Fitur Utama

- 🎨 **Desain Modern (v0.2+)**: UI _Landing Page_ menggunakan tata letak Bento Grid yang responsif dengan efek _Glassmorphism_ yang elegan dan ramah pengguna (Android & Apple iOS).
- 📱 **PWA Native (Anti-Dinosaurus)**: Menggunakan _Native Service Worker_ khusus untuk meng-cache aset. Kasir tetap bisa berjualan dan memuat aplikasi tanpa internet sama sekali (benar-benar 100% offline-first).
- 💬 **WhatsApp CS Widget**: Terintegrasi langsung dengan tombol melayang WhatsApp untuk pelayanan pelanggan instan.

- ⚡ **Kasir Kilat (Quick POS)**: Desain sentuh intuitif, responsif layar HP 360px–412px hingga tablet dan layar desktop kasir.
- 🖨️ **Hardware Kasir Ritel**:
  - Direct Web Bluetooth ESC/POS printing (58mm & 80mm).
  - Generator nota digital WhatsApp langsung ke nomor pembeli.
  - Global barcode listener untuk scanner USB / Bluetooth HID.
- 📶 **Offline-First (IndexedDB & Dexie)**: Kasir tetap bisa berjualan saat internet padam. Transaksi tersimpan lokal dan otomatis tersinkronisasi saat koneksi pulih.
- 💳 **Metode Pembayaran Fleksibel**:
  - Tunai (dengan kalkulator kembalian instan).
  - QRIS Dinamis Otomatis terintegrasi gateway Duitku (MD5 signature anti-tampering).
  - QRIS Statis Toko & Transfer Bank.
  - Buku Kasbon (Piutang Pelanggan).
- 🔒 **Keamanan & Multi-Tenant**:
  - PostgreSQL 16 dengan Row Level Security (RLS) per tenant toko.
  - Cookie sesi terenkripsi (SHA-256 / HMAC) dengan otorisasi berbasis peran (Owner vs Cashier).
  - Proteksi PIN Void untuk pembatalan transaksi dengan pengembalian stok otomatis.
- 🤖 **Asisten AI Toko Hermes (Nous Research)**:
  - Berinteraksi langsung melalui chat: cek omset hari ini, deteksi stok menipis, pantau piutang kasbon, dan catat pengeluaran kasir via function calling.
  - Biaya API Rp 0 via FreeLLM / OpenRouter, atau Ollama lokal tanpa internet.
- 📊 **Ekspor Dokumen Nyata**:
  - Ekspor CSV spreadsheet terstruktur (kompatibel Excel dengan UTF-8 BOM).
  - Cetak dokumen print-friendly / PDF untuk Laporan Keuangan, Rekap Kasbon, dan Mutasi Stok.
- 📱 **Progressive Web App (PWA)**: Mendukung *Add to Home Screen* di Android & Desktop dengan tema hijau emerald dan ikon resolusi tinggi.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: React 19, [Tailwind CSS v4](https://tailwindcss.com/), Radix UI, Lucide Icons, Sonner
- **Database**: PostgreSQL 16 dengan pgcrypto & Row Level Security
- **Penyimpanan Lokal**: Dexie.js (IndexedDB)
- **Testing & Keamanan**: Vitest, Playwright, CodeQL Security Scanner, dan Dependabot
- **Deployment**: Docker Multi-Stage (`node:22-alpine`), PM2, Nginx Proxy Manager

---

## 🚀 Memulai (Quick Start)

### 1. Prasyarat
- Node.js versi 20+ atau 22+
- PostgreSQL 16 (atau Docker & Docker Compose)

### 2. Konfigurasi Lingkungan
Salin berkas template environment:
```bash
cp .env.example .env.local
```
Sesuaikan `DATABASE_URL` dan buat kunci rahasia `SESSION_SECRET` di `.env.local`.

### 3. Migrasi Database & Seed Data Demo
```bash
npm install
npm run db:migrate
npm run db:seed
```
*Akun Demo bawaan:*
- **Pemilik**: `budi@tokoberkah.id` | Kata sandi: `rahasia` | PIN Void: `8765`
- **Kasir**: `siti@tokoberkah.id` | PIN: `1234`

### 4. Menjalankan Aplikasi
```bash
# Mode Development
npm run dev

# Atau Mode Produksi
npm run build
npm run start
```
Buka peramban ke: `http://localhost:9991`

---

## 💻 Script Launcher 1-Klik Multi-OS

KasToko menyertakan script launcher instan untuk mempermudah toko:
- **Linux (Debian/Ubuntu)**:
  ```bash
  ./start-kastoko.sh
  # Atau jalankan via docker:
  ./start-kastoko.sh --docker
  ```
- **Windows**:
  Klik ganda pada berkas `start-kastoko.bat`.

---

## 🐳 Menjalankan dengan Docker Compose (Turnkey Ready)

Jalankan seluruh stack (Next.js Standalone + PostgreSQL 16) hanya dengan satu perintah:
```bash
docker compose up -d --build
```
Database otomatis menginisialisasi skema DDL lengkap, RLS, index, serta data demo produk & akun kasir via `db/init-complete.sql` tanpa perlu perintah tambahan:
- **Aplikasi KasToko**: `http://localhost:9991`
- **Database PostgreSQL 16**: Port `5433`
- **Akun Demo**: `budi@tokoberkah.id` (Kata Sandi: `rahasia`) & `siti@tokoberkah.id` (PIN: `1234`)

---

## 🌐 Panduan Nginx Proxy Manager & Domain HTTPS

Web Bluetooth API dan instalasi PWA mewajibkan koneksi aman (HTTPS). Lihat panduan lengkap setup reverse proxy, WebSocket support, dan sertifikat SSL Let's Encrypt di:
👉 **[PANDUAN_NPM_DOMAIN.md](./PANDUAN_NPM_DOMAIN.md)**

Untuk panduan operasional kasir dan pemilik toko:
👉 **[PANDUAN_PENGGUNA.md](./PANDUAN_PENGGUNA.md)**

---

## 🧪 Pengujian Otomatis

KasToko mematuhi prinsip validasi 100% PASS sebelum rilis:
```bash
# Menjalankan 64 Unit & Integration Tests (Vitest)
npm run test

# Menjalankan 12 End-to-End Browser Tests (Playwright)
npm run test:e2e

# Memeriksa kompilasi Next.js produksi
npm run build
```

---

## 📄 Lisensi

Hak Cipta © 2026 [KasToko Contributors](./LICENSE). Didistribusikan di bawah lisensi resmi [MIT License](./LICENSE).

