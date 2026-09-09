# PANDUAN EKSEKUSI TAHAP 4: KASTOKO POS & BACKOFFICE UMKM

Dokumen ini adalah instruksi operasional resmi untuk Antigravity (AGY) yang berjalan langsung di server Debian (`/var/www/kastoko`).

---

## 1. STATUS SISTEM TERKINI
- **Tech Stack**: Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4, PostgreSQL 16 (port `5433`), PM2 (service `kastoko` port `9991`).
- **Tahap 1 (Selesai)**: UI POS, kasir kilat, keranjang, dialog shift kasir, responsive HP 360px–412px.
- **Tahap 2 (Selesai)**: PostgreSQL 16 schema, Row Level Security (RLS) multi-tenant per toko, cookie auth terenkripsi, proteksi PIN void, 13 integration tests.
- **Tahap 3 (Selesai - Commit `1020af5`)**:
  - Driver printer thermal Bluetooth ESC/POS (`src/lib/hardware/escpos.ts` & `bluetooth-printer.ts`).
  - Generator nota WhatsApp (`src/lib/hardware/nota-wa.ts`).
  - Scanner barcode listener global USB/BT HID (`src/components/pos/barcode-listener.tsx`).
  - Mode Offline-First IndexedDB Dexie & background sync (`src/lib/offline/` & `/api/offline/sync`).
  - Asisten AI Hermes 3 Nous Research function calling (`/api/ai/chat` & `src/components/hermes-chat.tsx`).
  - Integrasi QRIS Duitku dengan MD5 signature anti-tampering (`src/lib/server/duitku.ts`).
- **Kondisi Pengujian Terakhir**:
  - `npm run test`: **58/58 unit & integration test PASSED (100%)**
  - `npm run test:e2e`: **12/12 Playwright E2E tests PASSED (100%)**
  - `npm run build`: **SUKSES 100% (23 routes generated)**

---

## 2. PRINSIP KERJA USER (MUTLAK DIPATUHI)
1. **Dilarang keras menyunat atau mengambil jalan pintas**: Semua fitur dibuat nyata, lengkap, dan aman untuk produksi ritel sesungguhnya.
2. **Keamanan Kredensial**: Tidak boleh ada rahasia, password, atau API key yang ter-commit ke Git. File `.env` dan `.env.local` wajib di-ignore.
3. **Multi-Platform Support**: Wajib berjalan mulus di Windows, Debian/Ubuntu, dan Docker (gunakan separator path `/` dan fungsi standar Node.js).
4. **Validasi Wajib 100% PASS**: Setiap perubahan kode harus melewati `npm run test`, `npm run test:e2e`, dan `npm run build` sebelum di-commit.

---

## 3. RENCANA KERJA DETAIL TAHAP 4

### 🔹 Sub-Tahap 4.1: Audit Keamanan & Kesiapan GitHub
1. Pastikan `.gitignore` mengabaikan `.env`, `.env.local`, `.pem`, file log, dan dump data lokal.
2. Buat berkas template `.env.example` yang rapi dan terdokumentasi lengkap dengan variabel default aman.
3. Konfigurasikan remote GitHub resmi dan pastikan branch `master`/`main` bersih dan siap di-push.

### 🔹 Sub-Tahap 4.2: Integrasi Domain & Nginx Proxy Manager (NPM)
1. Periksa konfigurasi port lokal: Aplikasi Next.js pada `http://127.0.0.1:9991`.
2. Panduan/verifikasi setup di Nginx Proxy Manager (NPM):
   - Forward Host: `127.0.0.1`, Port: `9991`.
   - **Websockets Support**: `ON` (wajib untuk auto-sync & AI chat).
   - **Block Common Exploits**: `ON`.
   - **SSL Let's Encrypt**: `Force SSL: ON`, `HTTP/2: ON`.
3. Verifikasi domain publik dapat diakses via HTTPS (karena Web Bluetooth API & PWA Service Worker mewajibkan koneksi HTTPS valid).

### 🔹 Sub-Tahap 4.3: Fitur PWA (Add to Home Screen) & Ekspor Dokumen
1. Pasang Web App Manifest (`public/manifest.json` / `src/app/manifest.ts`) dengan identitas aplikasi, tema hijau emerald, dan icon PWA (192x192 & 512x512).
2. Tambahkan tombol ekspor laporan nyata (.xlsx atau .csv terstruktur dan print-friendly HTML/PDF) pada:
   - Halaman Laporan Keuangan (`/dashboard/laporan`).
   - Halaman Rekap Kasbon (`/dashboard/kasbon`).
   - Halaman Mutasi Stok (`/dashboard/mutasi`).
3. Terapkan saklar `APP_MODE`:
   - `self-hosted`: Menu sewa disembunyikan, input API Key AI mandiri di menu Pengaturan.
   - `saas`: Mode sewa multi-tenant.

### 🔹 Sub-Tahap 4.4: Docker Multi-Stage & Launcher Multi-OS
1. Buat `Dockerfile` multi-stage berbasis `node:22-alpine` (builder + standalone runner ringan).
2. Buat `docker-compose.yml` (Next.js app + PostgreSQL 16 dengan volume persisten data toko).
3. Buat script launcher 1-klik:
   - `start-kastoko.bat` untuk pengguna Windows.
   - `start-kastoko.sh` (chmod +x) untuk Debian/Ubuntu Linux.

### 🔹 Sub-Tahap 4.5: Validasi Menyeluruh & Dokumentasi Rilis
1. Jalankan `npm run test` (58+ test) dan `npm run test:e2e` (12+ test). Wajib 100% PASS.
2. Jalankan `npm run build` dan restart PM2 `pm2 restart kastoko`.
3. Buat panduan singkat penggunaan toko (*cheat-sheet* 1 lembar) di `PANDUAN_PENGGUNA.md`.
4. Commit Git Tahap 4 Final.
