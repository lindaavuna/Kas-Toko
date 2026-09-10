# RANGKUMAN ARSITEKTUR & STATUS KASTOKO SAAS
Dokumen ini adalah *Single Source of Truth* (titik acuan utama) agar sesi chat baru langsung nyambung 100% tanpa ada konteks yang hilang.

---

## 1. Identitas Server & Jaringan
- **Server Debian `kasir`**: IP `172.22.22.18` (SSH aktif).
- **Aplikasi KasToko (Next.js 16 + React 19 + Turbopack)**:
  - Direktori: `/var/www/kastoko`
  - Port Internal: `http://172.18.0.1:9991` (Mode Produksi PM2 `pm2 start npm --name "kastoko" -- start -- -p 9991`)
  - Status PM2: `kastoko` (Online).
- **Database (PostgreSQL 16 Alpine Docker)**:
  - Kontainer: `kastoko-db`
  - Port: `5433` di host Debian -> `5432` internal.
  - User: `kastoko` (DB Owner), `kastoko_app` (App Pool User).
  - Nama DB: `kastoko`
- **Nginx Proxy Manager (NPM)**:
  - Web Admin NPM: `http://172.22.22.18:81` / `https://npm.billinghmb.site`
  - Domain KasToko POS & Superadmin: `https://toko.billinghmb.site` (SSL Cloudflare Full Strict).
  - Domain Kasirku: `https://kasir.billinghmb.site`
- **Repositori Publik GitHub**:
  - URL: `https://github.com/lindaavuna/Kas-Toko.git`
  - Branch: `master`
  - CI Status: GitHub Actions passing (64 unit tests passing).

---

## 2. Pemisahan Peran: Super Admin Platform vs Toko Penyewa (Tenant)

### A. Super Admin Platform (Platform Owner)
- **Akun**: `admin@billinghmb.site`
- **Kata Sandi**: `Landrely559!`
- **Akses Halaman**: Otomatis langsung masuk ke `/superadmin`.
- **Karakteristik**: Murni pengelola platform SaaS (tidak memiliki toko sembako, tidak jualan, tidak mengelola stok/kasir warung).
- **Fitur Utama di `/superadmin`**:
  1. **Dashboard Pelanggan SaaS**:
     - Metrik real-time: Total Pelanggan, Toko Online Saat Ini (indikator hijau berdenyut), Toko Aktif, Masa Uji Coba, Kedaluwarsa, dan Omset Bulanan Uang Sewa.
     - Tabel Pelanggan: Nama Toko, Pemilik, Alamat, Status Online/Offline (dengan jam terakhir aktif), tautan WhatsApp langsung (`wa.me/`), Masa Aktif Sewa, dan Sisa Hari.
     - Aksi Cepat Tagihan: Tombol `+30 Hari`, `+1 Tahun`, dan Dropdown Reset Status Cerdas (Reset ke Trial 7 hari dari sekarang, Set Aktif 30 hari dari hari ini, Set Aktif 1 tahun dari hari ini, dan Kunci/Suspend Toko).
  2. **Paket & Tarif Langganan (Pricing Plans)**:
     - Tarif Paket Bulanan (Rp 50.000).
     - Tarif Paket 1 Tahun (Rp 550.000 — Diskon 1 Bulan Sewa Gratis).
     - Durasi Masa Uji Coba (7 Hari Gratis).
  3. **Payment Gateway & Rekening Owner (Uang Sewa Masuk ke Mas)**:
     - Dukungan Dual Gateway: **Paywuz** dan **Duitku** tersimpan berdampingan tanpa saling menimpa.
     - Tombol Penentu: `⭐ Gateway Utama (Primary)` dan `🛡️ Gateway Cadangan (Backup)`.
     - Sakelar `Aktifkan Cadangan Otomatis (Failover)`: jika gateway utama gangguan, tagihan sewa otomatis dialihkan ke gateway cadangan.
     - Fitur **QRIS Manual & Rekening Bank (0% Fee Gateway)**: Mas bisa upload foto stiker QRIS bank sendiri (BCA/Nobu/GoPay) dan info no rekening bank.
     - Proteksi Anti-Autofill Chrome terpasang aktif.

### B. Toko Ritel Penyewa (Tenant POS)
- **Akun Demo Toko**: `budi@tokoberkah.id` (Password: `password123`)
- **Toko**: Toko Berkah Jaya (Jl. Melati No. 12, Surabaya).
- **Akses Halaman**: Masuk ke `/dashboard` (Pemilik Toko) dan `/kasir` (Kasir Toko).
- **Karakteristik**: Mengelola inventaris sembako, barcode scanner, kasir POS, nota cetak Bluetooth ESC/POS, ekspor laporan Excel/PDF, dan kasbon.
- **QRIS Toko**: Toko juga bisa mengunggah stiker QRIS toko mereka sendiri di `/dashboard/pengaturan` agar muncul di kasir saat pembeli belanja.

---

## 3. Catatan Arsitektur Penting (Anti-Bug)
1. **PostgreSQL RLS Bypass**:
   - Seluruh operasi Super Admin yang mengakses data lintas toko (seperti `ambilDataPlatform`, `ubahStatusToko`, `perpanjangSewa`, dan `ambilKonteksSesi`) menggunakan fungsi PostgreSQL berjenis `SECURITY DEFINER` (misal `kas_get_user_by_id`, `kas_superadmin_get_platform_data`, `kas_superadmin_set_store_status`, `kas_superadmin_extend_store`). Jangan gunakan kueri SQL biasa langsung ke tabel `stores`/`users` tanpa fungsi security definer agar tidak terblokir RLS.
2. **Kredensial Aman**:
   - `.env` dan `.env.local` dilarang keras di-commit ke repositori Git publik.
3. **Cloudflare & NPM**:
   - NPM diatur ke `HTTP Only` pada port internal (`172.18.0.1:9991`), sedangkan SSL dienkripsi penuh di edge Cloudflare.
