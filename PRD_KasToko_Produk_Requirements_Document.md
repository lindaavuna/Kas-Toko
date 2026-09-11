# KasToko — Produk Requirements Document (PRD) Master
*(Sistem Kasir & Manajemen Toko Pintar Ramah UMKM, Asisten AI Hermes, Arsitektur Modern 2026 & Dukungan Dual-Mode SaaS / Self-Hosted)*

---

## 1. Ringkasan & Tujuan Aplikasi

- **Nama Aplikasi**: KasToko — Sistem Manajemen Toko & Kasir Pintar Ramah UMKM
- **Penjelasan Singkat**: KasToko adalah aplikasi web & PWA manajemen toko dan kasir yang membantu pemilik toko mencatat pemasukan dan pengeluaran uang sekaligus pergerakan barang secara otomatis. Dilengkapi dengan mode kasir cepat berbasis katalog sentuh & pemindai barcode, pembayaran tunai/QRIS/transfer/kasbon, notifikasi stok menipis, pencatatan kasbon pelanggan dan hutang supplier, perhitungan buka/tutup kasir harian, cetak struk Bluetooth thermal 58mm/80mm, kirim nota via WhatsApp, serta **Asisten AI Pintar Toko (Hermes Agent by Nous Research)** untuk mengontrol dan menanyakan laporan toko melalui chat. Aplikasi ini ramah Android dan dapat dipasang seperti aplikasi biasa sehingga kasir tetap bisa bertransaksi dengan lancar saat internet terputus.
- **Filosofi Produk ("Anti-Ribet & Ramah Pengguna Awam / Gaptek")**:
  - Pengguna *gaptek* (gagap teknologi) adalah mereka yang kurang mahir atau canggung menggunakan teknologi, menu rumit, dan aplikasi berbelit-belit.
  - **Bukan Teks Raksasa (Tulisan Terlalu Besar Justru Merusak Tampilan HP)**: Ukuran font tetap proporsional dan rapi (14px–16px) agar informasi muat pas di layar HP tanpa membuat antarmuka sempit, berantakan, atau teks terpotong.
  - **Tampilan Bersih & Tidak Membingungkan**: Tata letak simpel, langsung to-the-point, tidak ada menu bersarang yang tersembunyi, dan tidak ada popup konfirmasi bertingkat yang membuat pengguna bingung.
  - **Alur Cepat (2–3 Ketukan Selesai)**: "3 Menit Langsung Bisa Jualan" tanpa perlu belajar berhari-hari.
  - **Bahasa Pasar Sehari-hari**: Mengganti istilah asing seperti *SKU, Void, Petty Cash, Rekonsiliasi, Receivables* menjadi *Kode Barang, Koreksi/Batal Jual, Uang Kembalian, Cocokkan Uang Laci, Buku Kasbon*.
  - **Tambah Barang Kilat (Cuma 3 Kolom Wajib)**: Pedagang hanya perlu memasukkan *Nama Barang*, *Harga Jual*, dan *Stok*. Kolom lainnya otomatis atau opsional.
- **Masalah yang Diselesaikan**: Pencatatan transaksi toko yang manual dan sering terlambat; pemilik tidak memiliki laporan pemasukan/pengeluaran uang dan barang secara real-time; stok toko tidak akurat karena tidak terintegrasi dengan penjualan; kasir kesulitan menghitung total belanja dan kembalian; risiko lupa mencatat kasbon pelanggan maupun hutang supplier; kekhawatiran uang laci kasir selisih saat tutup toko; serta kebutuhan tetap bisa berjualan walaupun koneksi internet padam.
- **Pengguna Aplikasi**:
  - **Pemilik Toko**: Membutuhkan data keuangan, laba rugi, dan stok untuk pengambilan keputusan. Dapat berinteraksi lewat dasbor visual yang bersih atau langsung mengobrol dengan Asisten AI Hermes.
  - **Kasir Toko**: Membutuhkan alat kasir cepat, alur simpel to-the-point, tombol uang pas instan, kalkulasi kembalian otomatis yang jelas, pemindai barcode, cetak struk mini Bluetooth, atau kirim nota via WhatsApp.
  - **Pelanggan Toko**: Transaksi belanja lebih cepat, tersedia pembayaran tunai, QRIS, transfer bank, maupun kasbon tercatat rapi.
- **Target Keberhasilan**: Seluruh transaksi penjualan dan pembelian tercatat otomatis setiap hari; laporan pemasukan/pengeluaran uang dan laba rugi tersaji otomatis tanpa hitung manual; selisih stok fisik ditekan di bawah 5%; notifikasi stok menipis diterima sebelum barang habis; rekonsiliasi kas laci kasir akurat tiap shift; dan layanan toko tetap berjalan normal saat internet mati melalui mode offline PWA.
- **Dua Model Distribusi (Dual-Mode)**:
  - **Mode Sewa Bulanan (Cloud SaaS)**: Toko tinggal daftar di website cloud, bayar biaya sewa bulanan terjangkau, seluruh server dan database diurus terpusat.
  - **Mode Instalasi Sendiri (Self-Hosted Standalone)**: Disediakan paket Docker Compose 1-klik untuk dipasang di komputer kasir toko, data tersimpan di komputer sendiri, bebas biaya sewa seumur hidup (*lifetime*), dan bisa berjalan 100% di jaringan lokal (LAN) tanpa internet.

---

## 2. Batasan Pembuatan Sistem

> [!IMPORTANT]
> **PERINGATAN WAJIB MULTI-PLATFORM (Cross-Platform: Windows, Ubuntu/Debian, & Docker)**:
> Seluruh kode sumber, dependensi, skrip launcher, dan konfigurasi sistem **WAJIB mendukung 3 lingkungan secara mulus**:
> 1. **Windows** (PC/Laptop kasir toko via Node.js native & launcher `start-kastoko.bat`).
> 2. **Linux (Ubuntu & Debian)** (Server cloud VPS & mini PC kasir via script `start-kastoko.sh` & systemd).
> 3. **Docker & Docker Compose** (Container multi-stage universal yang bisa dijalankan dengan 1 perintah `docker compose up -d` di semua OS).
> **Pantangan Mutlak**: Dilarang keras melakukan *hardcode* path separator Windows (`\`) di kode backend (wajib gunakan POSIX path `/` atau `path.join()`), dan seluruh berkas skrip shell/teks wajib berformat baris Unix `LF`.

### ✅ Yang Dikerjakan:
1. **Dua Mode Distribusi**: Dukungan konfigurasi saklar `APP_MODE=saas` (Multi-Tenant) atau `APP_MODE=self-hosted` (Single-Tenant Standalone).
2. **Login dan Pembagian Peran**: Login Pemilik Toko (*owner*) dan Kasir (*cashier*) menggunakan email, password, dan opsi PIN kasir 4 digit.
3. **Dasbor Pemilik Real-time**: Menampilkan ringkasan omset harian, keuntungan kotor, pengeluaran, notifikasi stok menipis, kasbon belum lunas, dan grafik tren penjualan dalam tata letak yang bersih dan tidak membingungkan.
4. **Modul Kasir Cepat (POS)**:
   - Katalog sentuh produk berfoto, pencarian instan nama, scan barcode kamera, dan penangkap sinyal scanner barcode tembak USB/Bluetooth.
   - Tombol nominal uang instan (`[Uang Pas]`, `[Rp 25.000]`, `[Rp 50.000]`, `[Rp 100.000]`) dan tampilan nominal kembalian yang jelas dan tegas.
   - Metode pembayaran: Tunai, QRIS Otomatis (Duitku), QRIS Statis Toko, Transfer Bank Manual, dan Kasbon (Hutang).
5. **Buka / Tutup Kasir (Shift Kasir & Uang Laci)**:
   - Input modal awal uang kembalian saat buka kasir.
   - Hitung uang fisik laci saat tutup kasir dengan laporan selisih otomatis (Seimbang, Kurang, atau Lebih) dan cetak struk rekap shift (Z-Report).
6. **Cetak Struk Thermal & Nota Digital**:
   - Cetak langsung ke printer mini thermal Bluetooth/USB ukuran 58mm dan 80mm via Web Bluetooth API.
   - Tombol kirim rincian nota belanja instan ke WhatsApp pembeli.
7. **Manajemen Produk Kilat & Multi-Satuan**:
   - Form tambah barang 3 kolom wajib (Nama, Harga Jual, Stok).
   - Fitur opsional: Barcode, harga beli, foto produk, dan harga grosir/multi-satuan (Dus, Renceng, Pcs).
8. **Manajemen Stok Otomatis**: Barang masuk dari pembelian supplier, barang keluar dari penjualan, stok rusak/hilang, serta riwayat mutasi stok lengkap.
9. **Buku Kasbon Pelanggan & Hutang ke Supplier**: Catatan kasbon pembeli langganan beserta riwayat pembayaran cicilan/pelunasan bertahap, serta rekap hutang belanja toko ke supplier sembako.
10. **Laporan Keuangan Otomatis & Export Data**: Pemasukan, pengeluaran, laba kotor, arus kas toko, dan tombol ekspor data ke format **Excel (.xlsx)** dan **PDF**.
11. **Asisten AI Toko Pintar (Hermes Agent by Nous Research)**:
    - Widget chat asisten berbahasa Indonesia untuk tanya omset, cek stok menipis, catat pengeluaran lewat chat, dan cek buku kasbon via *Function Calling* (biaya API Rp 0 via FreeLLM / OpenRouter).
12. **Mode Offline Tenang (PWA & Dexie.js)**: Transaksi kasir tetap berjalan lancar saat internet mati/kuota habis, lalu otomatis sinkron saat koneksi kembali terhubung.
13. **Proteksi Koreksi Transaksi (Void)**: Pembatalan transaksi yang sudah selesai wajib memasukkan PIN otorisasi Pemilik Toko untuk mencegah manipulasi uang kasir.

### ⛔ Yang Tidak Dikerjakan di Versi Awal:
- Sistem penggajian karyawan (*payroll* lengkap dengan BPJS/PPh 21) dan absensi biometrik wajah.
- Manajemen toko multi-cabang terdistribusi atau multi-gudang antar-kota (fokus pada satu toko fisik per instalasi/toko).
- Integrasi marketplace pihak ketiga (Shopee/Tokopedia/TikTok Shop API sync).
- Program loyalitas kartu member berbayar atau kupon diskon bertingkat ala hipermarket.

---

## 3. Daftar Halaman & Struktur Menu (Pages & Routing)

### A. Area Autentikasi & Umum
- `/`: Halaman pengarah otomatis — jika belum login diarahkan ke `/login`, jika sudah login diarahkan ke `/dashboard` (Pemilik) atau `/kasir` (Kasir).
- `/login`: Halaman masuk untuk Pemilik Toko (Email & Password) dan Kasir (Email Toko & PIN 4-6 angka).
- `/register`: Halaman pendaftaran toko baru (aktif pada `APP_MODE=saas`). Pada mode `self-hosted`, halaman ini diarahkan ke inisialisasi profil toko pertama kali.

### B. Area Kasir (Cashier POS) — Antarmuka Cepat & Fullscreen
- `/kasir`: Halaman kasir utama untuk memilih produk, scan barcode, keranjang belanja, tombol uang pas, pemilihan metode bayar, dan penyelesaian transaksi.
- `/kasir/shift`: Modal/halaman Buka Kasir (input modal uang kembalian) dan Tutup Kasir (hitung fisik uang laci & cek selisih).
- `/kasir/riwayat`: Riwayat transaksi shift kasir yang sedang aktif dengan total penjualan dan tombol cetak ulang struk / kirim ulang WhatsApp.
- `/kasir/kasbon`: Loket ringkas untuk memilih atau membuat nama pelanggan baru saat pelanggan belanja dengan kasbon.

### C. Area Pemilik Toko (Owner Backoffice)
- `/dashboard`: Dasbor utama berisi kartu KPI (omset hari ini, laba kotor, pengeluaran, kasbon belum lunas, barang stok tipis), grafik tren penjualan, transaksi terbaru, lonceng notifikasi, dan floating widget Asisten AI Hermes.
- `/dashboard/transaksi`: Riwayat seluruh transaksi penjualan dari semua kasir, filter tanggal, status bayar, detail struk, dan proteksi tombol batal transaksi (Void PIN).
- `/dashboard/produk`: Manajemen katalog produk (tambah kilat 3 kolom, edit, barcode, harga beli, harga jual, stok minimum, kategori, dan foto).
- `/dashboard/stok`: Status stok aktual semua produk, filter stok menipis, tombol catat barang masuk dan catat barang rusak/hilang.
- `/dashboard/mutasi`: Riwayat semua arus pergerakan barang (masuk, keluar, rusak, retur) berdasarkan waktu, alasan, dan penanggung jawab.
- `/dashboard/pembelian`: Catatan pembelian stok dari sales supplier (tunai maupun kredit/hutang).
- `/dashboard/kasbon`: Buku catatan kasbon pelanggan (daftar nama, nomor telepon, sisa kasbon, dan tombol terima pembayaran cicilan).
- `/dashboard/supplier`: Data supplier/sales dan daftar sisa hutang belanja toko yang belum lunas.
- `/dashboard/laporan`: Laporan keuangan otomatis (omset, HPP, pengeluaran kasir, laba kotor, laba bersih) dengan filter tanggal dan tombol ekspor **Excel & PDF**.
- `/dashboard/pengaturan`:
  - Pengaturan toko (nama, alamat, telepon, teks ucapan di kaki struk).
  - Pengelolaan akun kasir dan pengaturan PIN kasir.
  - Pengaturan metode pembayaran (Tunai, QRIS Duitku, QRIS Statis Toko, Transfer Bank).
  - Konfigurasi Asisten AI Hermes (input API Key FreeLLM / OpenRouter / Ollama lokal untuk mode self-hosted).
  - Status sewa toko (khusus mode SaaS).

---

## 4. Pedoman UI/UX & Design System Ramah UMKM

- **Skema Warna Korporat & Ramah UMKM**:
  - Primary (Aksi Utama / Navigasi): `HSL(215, 90%, 35%)` (Biru tua solid)
  - Primary Hover: `HSL(215, 85%, 28%)`
  - Sidebar Background: `HSL(222, 47%, 11%)` (Navy gelap elegan)
  - Background Utama: `HSL(210, 20%, 98%)` (Abu terang sejuk, tidak bikin lelah mata)
  - Card Surface: `HSL(0, 0%, 100%)` (Putih bersih dengan border tipis tegas)
  - Text Utama: `HSL(222, 47%, 11%)` (Kontras tinggi, terbaca jelas)
  - Text Sekunder / Muted: `HSL(215, 20%, 45%)`
  - Border: `HSL(214, 32%, 91%)`
  - Success (Uang / Bayar / Pas): `HSL(142, 64%, 40%)` (Hijau segar kontras)
  - Danger (Batal / Hapus): `HSL(0, 84%, 60%)` (Merah tegas)
  - Warning (Kasbon / Stok Menipis): `HSL(38, 92%, 50%)` (Kuning oranye jelas)
- **Tipografi Proporsional & Pas di Layar HP**: Menggunakan font **Inter** dengan ukuran proporsional (14px–16px) agar teks rapi dan tidak memboroskan ruang layar HP. Dilarang memakai font raksasa yang merusak tata letak atau menyebabkan teks terpotong. Angka uang menggunakan format pemisah ribuan Rupiah Indonesia (contoh: `Rp 25.000`). Angka kembalian di dialog kasir cukup diberi penegasan tebal (*bold*) dan ukuran proporsional (`text-xl` atau 20px) agar terbaca jelas tanpa merusak layout popup.
- **Aturan Komponen**: Menggunakan komponen shadcn/ui sebagai fondasi. Kartu menggunakan sudut membulat kecil (`rounded-lg`), border tipis `1px`, shadow halus (`shadow-sm`) untuk panel biasa, dan `shadow-md` saat interaksi aktif. Tabel menggunakan ukuran teks rapat yang mudah dibaca (*compact & clear*).
- **Aturan Mobile / Android & Ramah Jari (Touch Targets)**:
  - Seluruh tombol utama, input uang, dan kartu produk memiliki tinggi yang nyaman disentuh jari (`h-11` / 44px) dengan padding longgar agar tidak salah pencet, namun tetap proporsional dan hemat ruang layar HP.
  - Di layar HP kasir, sidebar disembunyikan total agar ruang layar terfokus pada katalog produk dan keranjang belanja (muncul sebagai panel bottom sheet fleksibel).
- **Form Sederhana (Progressive Disclosure)**:
  - Form tambah produk mengutamakan 3 kolom utama di bagian atas. Kolom opsional (barcode, harga beli, foto) dirapikan di dalam akordeon lipat *"Informasi Tambahan (Boleh Dikosongkan)"* agar pengguna awam tidak terintimidasi.

---

## 5. Pembagian Hak Akses Pengguna

| Menu / Halaman | Publik (Tanpa Login) | Kasir Toko | Pemilik Toko (Owner) |
| :--- | :---: | :---: | :---: |
| Halaman Login & Register | ✅ | ✅ | ✅ |
| Pos Kasir Cepat `/kasir` | ❌ | ✅ | ✅ |
| Buka / Tutup Kasir `/kasir/shift` | ❌ | ✅ (Shift sendiri) | ✅ (Semua shift) |
| Riwayat Kasir `/kasir/riwayat` | ❌ | ✅ | ✅ |
| Cetak Struk Bluetooth & WhatsApp | ❌ | ✅ | ✅ |
| Catat Kasbon Pelanggan di Kasir | ❌ | ✅ | ✅ |
| Dasbor Utama `/dashboard` | ❌ | ❌ | ✅ |
| Riwayat Transaksi Seluruh Toko `/dashboard/transaksi` | ❌ | ❌ | ✅ |
| Batal Transaksi Selesai (Void) | ❌ | ❌ (Wajib PIN Pemilik) | ✅ |
| Laporan Keuangan & Export Data `/dashboard/laporan` | ❌ | ❌ | ✅ |
| Tambah / Edit / Hapus Produk `/dashboard/produk` | ❌ | ❌ | ✅ |
| Manajemen Stok & Mutasi Barang `/dashboard/stok` | ❌ | ❌ | ✅ |
| Pembelian Supplier & Hutang `/dashboard/pembelian` | ❌ | ❌ | ✅ |
| Buku Kasbon Pelanggan `/dashboard/kasbon` | ❌ | ❌ | ✅ |
| Chat Asisten Pintar AI Hermes | ❌ | ✅ (Fitur kasir & panduan) | ✅ (Akses penuh laporan & kontrol) |
| Pengaturan Toko & Kasir `/dashboard/pengaturan` | ❌ | ❌ | ✅ |

---

## 6. Alur Kerja dan Fitur Utama

### A. Registrasi Akun dan Pembentukan Toko
1. **Cara Kerja**: Pemilik toko membuka `/register`, mengisi nama pemilik, email, password, nama toko, alamat, dan nomor telepon. Sistem membuat data toko dan menetapkan pemilik sebagai role `owner`. Setelah pendaftaran berhasil, pemilik langsung diarahkan ke `/dashboard`.
2. **Aturan Sistem**:
   - Pada mode `APP_MODE=saas`, email harus unik dan valid; status sewa toko langsung aktif masa uji coba (*trial*).
   - Pada mode `APP_MODE=self-hosted`, form registrasi menjadi setup awal toko mandiri tanpa pembatasan masa sewa.
   - Kasir tidak dapat mendaftar sendiri; akun dan PIN kasir hanya dibuatkan oleh pemilik melalui `/dashboard/pengaturan`.

### B. Login dan Pemilihan Area Sesuai Peran
1. **Cara Kerja**: Pengguna membuka `/login`. Pemilik memasukkan email & password. Kasir dapat login cepat dengan memilih nama kasir dan mengetik 4 angka PIN kasir.
2. **Aturan Sistem**:
   - Role `owner` diarahkan ke `/dashboard`.
   - Role `cashier` diarahkan ke `/kasir`. Jika kasir belum melakukan Buka Kasir di hari tersebut, muncul otomatis dialog Buka Kasir.
   - Jika akun tidak aktif atau status toko kedaluwarsa (pada SaaS), akses ditolak dengan pesan yang ramah.

### C. Alur Buka & Tutup Kasir (Uang Kembalian & Uang Laci)
1. **Cara Kerja**:
   - **Buka Kasir**: Saat memulai shift, kasir memasukkan nominal modal awal uang kembalian di laci (contoh: `Rp 150.000`) lalu klik **[Mulai Jualan]**. Sistem mencatat waktu buka dan kasir yang bertugas di tabel `cashier_shifts`.
   - **Operasional**: Selama kasir bertransaksi, sistem secara otomatis mencatat seluruh uang tunai masuk dari penjualan, pembayaran kasbon tunai, dan pengeluaran kasir.
   - **Tutup Kasir**: Di akhir shift, kasir membuka menu Tutup Kasir dan memasukkan jumlah uang fisik yang ada di laci. Sistem membandingkan uang fisik dengan catatan sistem:
     - `Kas Seharusnya = Modal Awal + Penjualan Tunai + Bayar Kasbon Tunai - Pengeluaran Tunai`.
     - Sistem menampilkan status: **Uang Cocok (Seimbang)**, atau menampilkan selisih **Kurang / Lebih**.
     - Kasir mencetak Struk Rekap Tutup Shift (Z-Report).

### D. Manajemen Produk Kilat & Multi-Satuan
1. **Cara Kerja**: Pemilik membuka `/dashboard/produk`, klik "Tambah Produk", dan cukup mengisi 3 kolom: **Nama Barang**, **Harga Jual**, dan **Jumlah Stok**. Kolom lain seperti barcode, harga beli, kategori, dan foto bersifat opsional di menu lipat.
2. **Aturan Sistem**:
   - Jika barcode tidak diisi, sistem otomatis membuatkan kode barang (SKU) unik.
   - Jika barcode diisi (atau discan dari barcode kemasan barang), kasir dapat langsung memindai produk saat checkout.
   - Tersedia tabel multi-satuan opsional (`product_units`) untuk toko yang menjual grosir (misal: 1 Dus = 40 Pcs dengan harga grosir khusus).

### E. Modul Kasir / POS Super Cepat dengan Tombol Uang Pas
1. **Cara Kerja**: Kasir membuka `/kasir`. Produk dapat dipilih dengan menyentuh foto produk di katalog sentuh, mengetik nama pada pencarian instan, atau scan barcode lewat kamera / scanner tembak USB.
2. **Aturan Sistem**:
   - Item masuk ke keranjang belanja instan (0 milidetik via Zustand & React 19 `useOptimistic`).
   - Kasir menekan tombol hijau `[Bayar]`.
   - Muncul panel pembayaran dengan tombol nominal instan: `[Uang Pas]`, `[Rp 25.000]`, `[Rp 50.000]`, `[Rp 100.000]`.
   - Kasir menyentuh nominal yang diterima pembeli ➔ Angka kembalian langsung tampil jelas dan tegas.
   - Kasir menekan **[Selesai & Cetak Struk]** atau **[Kirim Nota ke WhatsApp]**. Transaksi selesai dalam 5–10 detik.

### F. Metode Pembayaran Lengkap (Tunai, QRIS Duitku, QRIS Toko, Transfer & Kasbon)
1. **Tunai**: Kasir mengklik nominal uang ➔ sistem menghitung kembalian ➔ uang kas masuk dicatat ke shift kasir aktif.
2. **QRIS Duitku (Otomatis)**: Sistem membuat invoice melalui API Duitku, menampilkan QRIS dinamis di layar, dan otomatis lunas saat callback diterima.
3. **QRIS Statis Toko & Transfer Bank Manual**: Kasir menampilkan QRIS statis pemilik toko atau nomor rekening toko, lalu memasukkan 4 digit nomor referensi bukti transfer.
4. **Kasbon (Hutang Pelanggan)**: Kasir memilih nama pelanggan langganan ➔ total belanja dicatat sebagai piutang pelanggan di buku kasbon.

### G. Cetak Struk Thermal Bluetooth 58mm/80mm & Kirim WhatsApp
1. **Cetak Bluetooth**: Menggunakan Web Bluetooth API untuk mengirim perintah raw ESC/POS langsung ke printer kasir mini Bluetooth (58mm/80mm) tanpa dialog print browser OS.
2. **Format Print Browser Cadangan**: Jika tidak memakai bluetooth, disediakan CSS print khusus ukuran 58mm/80mm yang otomatis menghilangkan header/footer URL browser.
3. **Kirim WhatsApp**: Tombol instan yang membuka tautan resmi WhatsApp Web / WhatsApp Mobile (`https://wa.me/...`) dengan pesan berisi rincian nota belanja rapi.

### H. Manajemen Stok Barang Masuk dan Keluar
1. **Cara Kerja**: Setiap pergerakan barang dicatat otomatis pada tabel `stock_mutations`.
   - Barang masuk terjadi saat pemilik mencatat pembelian dari sales supplier atau stok opname tambah.
   - Barang keluar terjadi saat transaksi penjualan berhasil, atau pencatatan barang rusak/hilang/kedaluwarsa.
2. **Aturan Sistem**:
   - Setiap mutasi mencatat produk, jumlah, tipe (`in`/`out`), alasan (`sale`, `purchase`, `damage`, `adjustment`), waktu, dan user penanggung jawab.
   - Ketika stok produk kurang dari atau sama dengan batas minimum, sistem otomatis memunculkan notifikasi "Stok Menipis".

### I. Pembelian dari Sales Supplier dan Hutang Toko
1. **Cara Kerja**: Pemilik membuka `/dashboard/pembelian`, memilih supplier, memasukkan barang yang dibeli, jumlah, dan harga beli. Pemilik dapat memilih pembayaran Tunai atau Kredit (Hutang Tempo).
2. **Aturan Sistem**:
   - Pembelian tunai langsung menambah stok barang dan mengurangi kas toko.
   - Pembelian kredit menambah stok barang dan mencatat saldo hutang supplier di tabel `payables`. Pemilik dapat mencatat pembayaran hutang secara bertahap saat sales datang menagih.

### J. Buku Kasbon / Hutang Pelanggan Tradisional
1. **Cara Kerja**: Pemilik membuka `/dashboard/kasbon` untuk melihat daftar pembeli langganan yang memiliki kasbon, total hutang, dan tanggal belanja.
2. **Aturan Sistem**:
   - Pemilik/kasir dapat mengklik tombol **[Terima Pembayaran]** untuk mencatat cicilan atau pelunasan kasbon.
   - Pembayaran kasbon dicatat sebagai pemasukan kas pada shift kasir yang aktif dan mengurangi saldo kasbon pembeli.

### K. Pengeluaran Operasional Toko
1. **Cara Kerja**: Kasir atau pemilik dapat mencatat pengeluaran kas toko seperti uang listrik, sampah, air minum, bensin motor, atau konsumsi melalui tombol "Catat Pengeluaran" di kasir atau dasbor.
2. **Aturan Sistem**:
   - Pengeluaran wajib mencatat judul, nominal, dan penanggung jawab. Pengeluaran tunai langsung memotong saldo kas laci kasir pada shift berjalan.

### L. Laporan Keuangan Otomatis & Export Data
1. **Cara Kerja**: Pemilik membuka `/dashboard/laporan`, memilih rentang tanggal (Hari Ini, 7 Hari Terakhir, Bulan Ini, atau Kustom).
2. **Aturan Sistem**:
   - Menampilkan total omset penjualan, total pengeluaran kasir, HPP (Harga Pokok Penjualan), laba kotor, dan laba bersih.
   - Tersedia tombol **Export to Excel (.xlsx)** dan **Export to PDF** untuk pembukuan bulanan pemilik toko.

### M. Notifikasi Stok Menipis dan Transaksi Realtime
1. **Cara Kerja**: Notifikasi muncul di ikon lonceng header dasbor pemilik secara real-time via Supabase Realtime saat ada barang yang menipis atau transaksi penjualan kasir baru.

### N. Asisten AI Toko Pintar (Hermes Agent by Nous Research)
1. **Cara Kerja**: Pemilik toko mengklik ikon Asisten AI di sudut layar dan bertanya dalam bahasa Indonesia sehari-hari:
   - *"Min, omset jualan kita hari ini berapa?"* ➔ AI memanggil fungsi `get_daily_sales()` dan membalas nominal omset serta laba hari ini.
   - *"Tolong catat beli bensin Rp 20.000 dari kasir"* ➔ AI memanggil fungsi `create_expense()` dan mengonfirmasi pengeluaran berhasil dicatat.
   - *"Barang apa saja yang stoknya mau habis?"* ➔ AI memanggil `get_low_stock_products()` dan merincikan barang yang harus segera dibeli.
   - *"Siapa saja yang masih punya kasbon?"* ➔ AI memanggil `get_debtor_list()` dan merincikan nama pelanggan serta nominal kasbonnya.
2. **Aturan Sistem**:
   - Model yang digunakan adalah **Hermes Agent (Nous Research)** via API FreeLLM / OpenRouter free tier (Biaya API Rp 0).
   - Setiap eksekusi fungsi (*Function Calling*) disuntikkan `store_id` dari sesi login yang sah sehingga AI mustahil mengakses data toko lain.

### O. Mode Offline Tenang dan Sinkronisasi Otomatis
1. **Cara Kerja**: Aplikasi berjalan sebagai PWA (Progressive Web App). Seluruh katalog barang dan pelanggan disalin ke database lokal HP kasir (**IndexedDB via Dexie.js**).
2. **Aturan Sistem**:
   - Saat internet toko mati, kasir tetap bisa scan barang dan checkout transaksi tunai / kasbon dengan lancar.
   - Transaksi offline ditampung di antrean *outbox* IndexedDB dengan status `pending_sync`.
   - Begitu internet terhubung kembali, sistem secara otomatis mengunggah seluruh transaksi ke server Supabase melalui endpoint `/api/offline/sync`.

### P. Proteksi Koreksi / Pembatalan Transaksi (Void)
1. **Cara Kerja**: Jika ada transaksi penjualan yang salah input dan perlu dibatalkan, kasir tidak bisa langsung menghapus transaksi.
2. **Aturan Sistem**:
   - Kasir wajib meminta Pemilik Toko memasukkan **PIN Otorisasi Pemilik**.
   - Setiap transaksi yang dibatalkan (*void*) akan mengembalikan stok barang ke sistem, memotong catatan kas, dan mencatat riwayat pembatalan serta alasan di log audit.

---

## 7. Alur Navigasi & Arsitektur Layout

### Arsitektur Layout (Persisten)
- **Auth Layout**: Layout bersih untuk halaman `/login` dan `/register` dengan logo KasToko, panel branding di desktop, dan form ramah sentuh di mobile.
- **Backoffice Layout (Owner)**: Sidebar kiri persisten berisi menu navigasi pemilik toko, header atas dengan judul halaman, saldo toko, lonceng notifikasi, profil dropdown, serta area konten utama. Pada layar HP, sidebar menyempit menjadi drawer hamburger.
- **POS Layout (Kasir)**: Layout fullscreen tanpa sidebar yang memakan tempat. Di desktop: area katalog produk di tengah dan panel keranjang belanja permanen di kanan. Di HP: katalog produk tampil penuh dengan tombol melayang keranjang belanja yang membuka panel bottom sheet.

### Bagan Alur Sistem (Flowchart)
```mermaid
flowchart TD
  A[Buka KasToko] --> B{Sudah Login?}
  B -- Belum --> C[/Halaman Login atau Register/]
  B -- Sudah --> D{Peran Akun}
  C --> D
  D -- Kasir --> E{Apakah Sudah Buka Kasir?}
  E -- Belum --> E1[/Dialog Buka Kasir - Input Modal Awal/]
  E1 --> E2[/Layar POS Kasir Cepat/]
  E -- Sudah --> E2
  D -- Pemilik --> F[/Dasbor Utama Owner/]

  E2 --> G1[Pilih Produk / Scan Barcode]
  G1 --> G2[Keranjang Belanja]
  G2 --> G3[Pilih Nominal Uang Pas / Pembayaran]
  G3 --> G4{Metode Bayar}
  G4 -- Tunai/Transfer/QRIS --> G5[Hitung Kembalian & Cetak Struk/WA]
  G4 -- Kasbon --> G6[Catat ke Buku Kasbon Pelanggan]
  G5 --> H[Potong Stok & Catat Kas Masuk]
  G6 --> H

  F --> F1[/Ringkasan Omset & Laba/]
  F --> F2[/Manajemen Produk Kilat/]
  F --> F3[/Buku Kasbon Pelanggan/]
  F --> F4[/Pembelian & Hutang Supplier/]
  F --> F5[/Laporan Keuangan & Export Excel/PDF/]
  F --> F6[/Widget Asisten AI Hermes/]
```

---

## 8. Kebutuhan Non-Fungsional (SEO, Keamanan & Performa)

- **SEO**: Seluruh halaman aplikasi internal KasToko diberi header `X-Robots-Tag: noindex` agar data privat toko tidak terindeks oleh mesin pencari Google. Halaman `/login` dan `/register` tetap memiliki tag meta deskripsi dan Open Graph yang rapi.
- **Keamanan Data Multi-Tenant**: Seluruh akses database dilindungi oleh kebijakan Row Level Security (RLS) PostgreSQL. Data toko terisolasi 100% berdasarkan `store_id`. Kunci rahasia `SUPABASE_SERVICE_ROLE_KEY` hanya berjalan di sisi server Next.js. Seluruh Server Actions divalidasi menggunakan Zod dan dilindungi dari celah XSS/CSRF.
- **Performa & Kecepatan**: Menggunakan Next.js 16 React Server Components (RSC) untuk dasbor dan laporan keuangan agar render instan. Halaman kasir menggunakan client state Zustand v5 dengan reaksi 0 milidetik.
- **Kompatibilitas Hardware**: Berjalan optimal di browser Chrome Android, Microsoft Edge, Safari iOS, serta mendukung printer thermal Bluetooth/USB ESC-POS dan scanner barcode USB plug-and-play.
- **Dukungan Multi-Platform OS (Windows, Ubuntu/Debian, & Docker)**:
  - **Windows (PC/Laptop Kasir Toko)**: Berjalan *native* menggunakan Node.js 22 LTS di Windows 10/11 atau mini PC kasir Windows, dilengkapi launcher 1-klik `start-kastoko.bat`.
  - **Linux (Ubuntu / Debian / Cloud VPS)**: Berjalan *native* di distro Linux populer (Ubuntu 22.04/24.04 LTS, Debian 11/12) untuk server cloud mode SaaS atau mini PC kasir hemat daya (Raspberry Pi/Linux), dilengkapi script launcher `start-kastoko.sh` dan konfigurasi service systemd/PM2.
  - **Docker & Docker Compose (Multi-Platform Universal)**: Menggunakan `Dockerfile` multi-stage build (Node 22 Alpine ultra-ringan ~120MB) dengan Next.js `output: 'standalone'`, dipadukan dengan `docker-compose.yml` (Next.js + PostgreSQL lokal) yang dapat dijalankan secara identik di Windows (Docker Desktop) maupun Ubuntu/Debian Server dengan 1 perintah: `docker compose up -d`.
  - **Standar Kode Cross-Platform**: Dilarang menggunakan *hardcoded backslash* path Windows `\` (wajib menggunakan `path.join()` atau POSIX path `/`), dan konfigurasi `.gitattributes` dengan `eol=lf` agar script bash di Ubuntu/Debian tidak error akibat format baris CRLF Windows.
- **Standar Kualitas & Kewajiban Test Suite (Unit, Integration & E2E Testing)**:
  - **Unit & Component Testing (Vitest + React Testing Library)**: Menguji fungsi kalkulasi uang kembalian, diskon, state keranjang belanja Zustand, pemisah ribuan Rupiah, dan konversi multi-satuan produk.
  - **Integration Testing (Vitest)**: Menguji Server Actions dan logika bisnis utama (validasi saldo shift kasir, pemotongan stok atomik `createSale`, pencatatan kasbon `receivables`, verifikasi signature MD5 Duitku, dan keamanan RLS per `store_id`).
  - **End-to-End Testing (Playwright)**: Mensimulasikan alur kasir di browser nyata (login kasir ➔ buka kasir ➔ pilih produk ➔ tekan tombol uang pas ➔ kalkulasi kembalian ➔ simpan struk ➔ tutup kasir).
  - **Aturan Eksekusi Test**: Wajib tersedia perintah `npm run test` (Vitest) dan `npm run test:e2e` (Playwright). Seluruh pengujian wajib **100% PASS** sebelum sebuah fase dilaporkan selesai.

---

## 9. Panduan Bahasa, Copywriting, & Data Dummy

- **Gaya Bahasa**: Ramah, santun, bersahabat, dan menggunakan bahasa pasar sehari-hari. Menghindari istilah asing atau teknis yang kaku.
- **Instruksi Data Dummy**: DILARANG MENGGUNAKAN "Lorem Ipsum". Seluruh data pengujian wajib menggunakan data realistis toko sembako di Indonesia:
  - **Toko**: "Toko Berkah Jaya", Jl. Melati No. 12, Surabaya, HP: `0851-2345-6789`.
  - **Pemilik**: Budi Santoso (`budi@tokoberkah.id`).
  - **Kasir**: Siti Rahma (`siti@tokoberkah.id`, PIN: `1234`).
  - **Produk 1**: "Beras Premium 5Kg", SKU `BRS-0001`, Barcode `8991002111111`, Harga Beli Rp55.000, Harga Jual Rp62.000, Stok 40, Min Stok 10, Satuan `pcs`.
  - **Produk 2**: "Minyak Goreng 1L", SKU `MNY-0001`, Barcode `8991002222222`, Harga Beli Rp16.500, Harga Jual Rp19.000, Stok 2 (Status: Stok Menipis!), Min Stok 5, Satuan `pcs`.
  - **Produk 3**: "Gula Pasir 1Kg", SKU `GLA-0001`, Barcode `8991002333333`, Harga Beli Rp15.000, Harga Jual Rp17.500, Stok 25, Min Stok 5, Satuan `pcs`.
  - **Supplier**: "UD Sinar Mas" (Pemasok sembako).
  - **Pelanggan Kasbon**: "Bu Ani", HP: `0812-3333-4444`, saldo kasbon Rp 150.000.
  - **Pengeluaran Kasir Hari Ini**: "Beli token listrik toko" Rp 50.000.

---

## 10. Fondasi Teknis & Skema Database Lengkap

- **Framework Web**: Next.js 16 (App Router) + TypeScript 5.7+ + Turbopack
- **UI Library**: React 19 (`useOptimistic`, `useActionState`), Tailwind CSS v4 (v4.3.x), shadcn/ui New Registry, Lucide React Icons
- **State Management**: Zustand v5
- **Database & Auth**: PostgreSQL 15+ via Supabase SSR (`@supabase/ssr`)
- **Penyimpanan Lokal**: Dexie.js v4 (IndexedDB)
- **PWA**: Serwist PWA
- **Asisten AI**: Hermes Agent (Nous Research) via API FreeLLM / OpenRouter
- **Hardware POS**: Web Bluetooth ESC-POS & USB Keyboard Barcode Listener
- **Payment Gateway**: Duitku (QRIS dinamis)
- **Testing Suite**: Vitest + React Testing Library (Unit & Integration Test) & Playwright (End-to-End E2E Test)

### Skema Database PostgreSQL Lengkap
```sql
-- ============================================================
-- KasToko Master Database Migration (PostgreSQL 15+)
-- ============================================================
create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  receipt_footer text default 'Terima kasih atas kunjungan Anda!',
  currency text not null default 'IDR',
  subscription_status text not null default 'active' check (subscription_status in ('trial', 'active', 'expired')),
  subscription_expires_at timestamptz,
  ai_enabled boolean not null default true,
  custom_ai_api_key text,
  custom_ai_base_url text,
  created_at timestamptz not null default now()
);

create table public.store_members (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'cashier')),
  cashier_pin text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  unique(store_id, user_id)
);

create table public.cashier_shifts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  cashier_id uuid not null references auth.users(id),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  starting_cash numeric(12,2) not null default 0,
  expected_cash numeric(12,2),
  actual_cash numeric(12,2),
  cash_difference numeric(12,2),
  notes text,
  status text not null default 'open' check (status in ('open', 'closed'))
);

create index idx_cashier_shifts_store on public.cashier_shifts(store_id, opened_at desc);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique(store_id, name)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  phone text,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  phone text,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  sku text not null,
  barcode text,
  unit text not null default 'pcs',
  purchase_price numeric(12,2) not null default 0,
  selling_price numeric(12,2) not null default 0,
  stock_qty numeric(12,2) not null default 0,
  min_stock numeric(12,2) not null default 5,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, sku),
  unique(store_id, barcode)
);

create index idx_products_store_barcode on public.products(store_id, barcode);

create table public.product_units (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  unit_name text not null,
  conversion_factor numeric(10,2) not null,
  selling_price numeric(12,2) not null,
  barcode text,
  is_base_unit boolean not null default false
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  shift_id uuid references public.cashier_shifts(id) on delete set null,
  receipt_number text not null,
  cashier_id uuid not null references auth.users(id),
  customer_id uuid references public.customers(id) on delete set null,
  status text not null default 'paid'
    check (status in ('awaiting_payment', 'paid', 'credit', 'void')),
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  discount_type text default 'fixed' check (discount_type in ('fixed', 'percentage')),
  total numeric(12,2) not null default 0,
  payment_method text not null
    check (payment_method in ('cash', 'qris_duitku', 'qris_manual', 'bank_transfer', 'credit')),
  amount_paid numeric(12,2) not null default 0,
  change_amount numeric(12,2) not null default 0,
  transfer_ref text,
  paid_at timestamptz,
  void_reason text,
  voided_by uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, receipt_number)
);

create index idx_sales_store_created on public.sales(store_id, created_at desc);
create index idx_sales_receipt on public.sales(receipt_number);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_unit_id uuid references public.product_units(id),
  quantity numeric(12,2) not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  total numeric(12,2) not null
);

create index idx_sale_items_sale on public.sale_items(sale_id);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id),
  invoice_number text not null,
  status text not null default 'paid'
    check (status in ('paid', 'credit', 'void')),
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  paid_at timestamptz,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(store_id, invoice_number)
);

create table public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity numeric(12,2) not null check (quantity > 0),
  unit_cost numeric(12,2) not null,
  total numeric(12,2) not null
);

create table public.stock_mutations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id),
  mutation_type text not null check (mutation_type in ('in', 'out')),
  reason text not null
    check (reason in ('sale', 'sale_void', 'purchase', 'purchase_void', 'adjustment', 'damage', 'return_in', 'return_out')),
  quantity numeric(12,2) not null check (quantity > 0),
  sale_id uuid references public.sales(id) on delete set null,
  purchase_id uuid references public.purchases(id) on delete set null,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_stock_mutations_product on public.stock_mutations(product_id, created_at desc);

create table public.receivables (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  sale_id uuid not null unique references public.sales(id) on delete cascade,
  customer_id uuid not null references public.customers(id),
  original_amount numeric(12,2) not null,
  paid_amount numeric(12,2) not null default 0,
  due_date date,
  status text not null default 'unpaid' check (status in ('unpaid', 'partial', 'paid')),
  notes text,
  created_at timestamptz not null default now()
);

create table public.receivable_payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  receivable_id uuid not null references public.receivables(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null default 'cash',
  note text,
  accepted_by uuid references auth.users(id),
  paid_at timestamptz not null default now()
);

create table public.payables (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  purchase_id uuid not null unique references public.purchases(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id),
  original_amount numeric(12,2) not null,
  paid_amount numeric(12,2) not null default 0,
  due_date date,
  status text not null default 'unpaid' check (status in ('unpaid', 'partial', 'paid')),
  notes text,
  created_at timestamptz not null default now()
);

create table public.payable_payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  payable_id uuid not null references public.payables(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null default 'cash',
  note text,
  accepted_by uuid references auth.users(id),
  paid_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  title text not null,
  category text not null default 'Operasional',
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null default 'cash',
  note text,
  paid_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.cash_flows (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  flow_type text not null check (flow_type in ('in', 'out')),
  amount numeric(12,2) not null,
  category text not null
    check (category in ('sale_payment', 'receivable_payment', 'purchase_payment', 'payable_payment', 'expense', 'other_income')),
  method text not null check (method in ('cash', 'qris_duitku', 'qris_manual', 'bank_transfer')),
  reference_type text,
  reference_id uuid,
  created_at timestamptz not null default now()
);

create index idx_cash_flows_store_created on public.cash_flows(store_id, created_at desc);

create table public.duitku_payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  merchant_order_id text not null unique,
  amount numeric(12,2) not null,
  status text not null default 'pending'
    check (status in ('pending', 'success', 'cancelled', 'expired')),
  payment_method text,
  payment_code text,
  payment_url text,
  qr_content text,
  expiry_time timestamptz,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('stock_low', 'sale_paid', 'sync_error')),
  title text not null,
  message text not null,
  data jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_read on public.notifications(user_id, is_read, created_at desc);
```

### Variabel Lingkungan (`.env.example`)
```env
# Mode Aplikasi ('saas' atau 'self-hosted')
APP_MODE=saas
NEXT_PUBLIC_APP_URL=http://localhost:9991 # Menggunakan port 9991 atau 3100 (Bebas dari bentrok port 3000)
PORT=9991

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
SUPABASE_DB_URL=postgresql://postgres:password@db.xxxxxxxxxxxx.supabase.co:5432/postgres

# Asisten AI Toko (Hermes via FreeLLM / OpenRouter / Ollama)
AI_PROVIDER_BASE_URL=https://openrouter.ai/api/v1
AI_PROVIDER_API_KEY=sk-or-v1-xxxxxxxxxxxx
AI_MODEL_NAME=nousresearch/hermes-3-llama-3.1-8b:free

# Integrasi Duitku (Opsional Gateway QRIS)
DUITKU_MERCHANT_CODE=xxxx
DUITKU_API_KEY=xxxxxxxx
DUITKU_API_URL=https://sandbox-duitku.com/webapi/api/merchant/createInvoice
DUITKU_TRANSACTION_STATUS_URL=https://sandbox-duitku.com/webapi/api/merchant/transactionStatus
DUITKU_CALLBACK_URL=https://your-domain.com/api/payment/duitku/callback
DUITKU_RETURN_URL=https://your-domain.com/kasir/riwayat
```

### Pemetaan Port Server & Panduan Integrasi Nginx Proxy Manager (NPM)

Agar aplikasi KasToko **tidak bentrok** dengan aplikasi yang sudah ada di server target (`172.22.22.18`), berikut adalah hasil audit port dan alokasi port resmi:

#### 1. Port yang SUDAH TERPAKAI di Server (DILARANG DIPAKAI):
| Port Host | Protokol | Layanan / Aplikasi | Keterangan |
| :---: | :---: | :--- | :--- |
| **`22`** | TCP | `sshd` | Remote SSH Server |
| **`80`** | TCP | `nginx-proxy-manager` | Web Traffic HTTP Utama |
| **`81`** | TCP | `nginx-proxy-manager` | **Web Admin Dashboard NPM** |
| **`443`** | TCP | `nginx-proxy-manager` | Web Traffic HTTPS / SSL |
| **`8080`** | TCP | `kasirku-api` | Backend API Kasirku lama |
| **`9990`** | TCP | `kasirku-web` | Frontend Web Kasirku lama |
| *(Internal)* | TCP | `kasirku-mariadb` (3306) & `kasirku-redis` (6379) | Database internal Docker |
| **`3000`** | TCP | *(Default Next.js / Node)* | **RAWAN BENTROK** — Jangan gunakan port ini di server produksi/staging! |

#### 2. Pilihan Port KOSONG & Aman untuk KasToko:
- **Port Web KasToko (Next.js)**:
  - **Opsi Utama (Rekomendasi)**: **`9991`** *(Berdampingan rapi dengan `9990`, teratur dan mudah diingat)*.
  - **Opsi Alternatif 1**: **`3100`** atau **`3080`** *(Aman dari bentrok port default `3000`)*.
  - **Opsi Alternatif 2**: **`8088`** atau **`8880`**.
- **Port PostgreSQL Lokal (Khusus mode Self-Hosted Docker)**:
  - Gunakan port **`5433`** *(Memetakan `5433:5432` agar tidak bentrok dengan Postgres default `5432` jika ada di kemudian hari)*.

#### 3. Panduan Setup di Nginx Proxy Manager (NPM):
Setelah container KasToko berjalan di port pilihan (misal `9991`):
1. Buka dashboard NPM di `http://172.22.22.18:81`.
2. Masuk ke menu **Proxy Hosts** ➔ **Add Proxy Host**.
3. Isi konfigurasi:
   - **Domain Names**: `kastoko.lan` atau `toko.domainanda.com`
   - **Scheme**: `http`
   - **Forward Hostname / IP**: `172.22.22.18` (atau nama container jika dalam 1 docker network)
   - **Forward Port**: `9991`
   - **Websockets Support**: **Aktifkan (ON)** *(Wajib aktif untuk Next.js HMR dan Supabase Realtime)*
   - **Block Common Exploits**: **Aktifkan (ON)**
4. Tab **SSL**: Pilih *"Request a new SSL Certificate"* dengan Let's Encrypt dan aktifkan *"Force SSL"*.

---

## 11. Tahapan Pengerjaan & Task Breakdown Terstruktur

Cara membaca: Tulisan `- [ ] **Task X.Y**` adalah daftar tugas atomik. Seluruh tugas pada satu Fase harus diselesaikan secara tuntas oleh AI Coding Assistant sebelum melaporkan hasil dan menunggu konfirmasi user.

---

### 🟢 TAHAP 1: Fondasi Proyek, UI/UX Ramah UMKM & Semua Halaman Frontend (Dummy Data)

*Tujuan: Membangun seluruh antarmuka visual KasToko secara 100% lengkap, ramah orang awam, responsif di layar HP Android, dan berfungsi interaktif menggunakan data dummy berbahasa Indonesia sebelum menyentuh database.*

- [x] **Task 1.1 (Setup Proyek & Design System)**: Inisialisasi Next.js 16 App Router dengan TypeScript, Tailwind CSS v4 (`@theme`), integrasi shadcn/ui base components (Button, Card, Input, Dialog, Sheet, Tabs, Table, Badge, DropdownMenu, Toast/Sonner), instalasi Lucide Icons, dan konfigurasi font Inter.
- [x] **Task 1.2 (Theme Korporat Ramah UMKM)**: Susun variabel tema di `globals.css` menggunakan palet warna korporat ramah (biru tua solid, background abu sejuk, border abu tegas), atur token `primary`, `sidebar`, `success` (hijau bayar), `danger` (merah koreksi), `warning` (kuning stok tipis), serta pastikan seluruh tombol utama memiliki tinggi minimal `h-11` (44px) yang nyaman disentuh jari.
- [x] **Task 1.3 (Auth Pages & Setup Toko)**: Buat layout auth dan halaman `/login` (dengan pilihan Login Pemilik via Email & Password dan Login Cepat Kasir via Email Toko & PIN 4-digit) serta halaman `/register` untuk pendaftaran toko baru lengkap dengan logo KasToko, panel branding, dan validasi form dummy.
- [x] **Task 1.4 (Root Redirect & Switch Role)**: Buat halaman `/` yang memeriksa status peran dan mengarahkan otomatis ke `/kasir` untuk kasir atau `/dashboard` untuk pemilik toko.
- [x] **Task 1.5 (Layout POS Kasir & Backoffice Owner)**: Buat layout kasir `/kasir` full-screen tanpa sidebar yang memakan tempat di HP Android, dan layout dasbor `/dashboard` dengan sidebar navigasi persisten, drawer hamburger di mobile, header, dropdown profil, dan lonceng notifikasi dummy.
- [x] **Task 1.6 (Layar Kasir POS Cepat)**: Buat halaman `/kasir` dengan katalog sentuh produk berfoto, pencarian instan nama produk, simulasi tombol scan barcode kamera, keranjang belanja interaktif (tambah/kurang qty, subtotal, diskon), dan tombol hijau `[Bayar]`.
- [x] **Task 1.7 (Dialog Buka & Tutup Kasir)**: Buat modal Buka Kasir (input modal uang kembalian pagi hari) dan modal Tutup Kasir (input uang fisik laci kasir, kalkulasi otomatis status selisih Seimbang/Kurang/Lebih, dan tombol cetak struk rekap shift).
- [x] **Task 1.8 (Dialog Pembayaran & Tombol Uang Pas)**: Buat dialog checkout di `/kasir` berisi tombol nominal instan (`[Uang Pas]`, `[Rp 25.000]`, `[Rp 50.000]`, `[Rp 100.000]`), tampilan angka kembalian yang jelas dan tegas, dan pilihan metode pembayaran (Tunai, QRIS Duitku, QRIS Toko, Transfer Manual, dan Kasbon).
- [x] **Task 1.9 (Pratinjau Struk & Tombol WhatsApp)**: Buat dialog rincian struk belanja format kertas thermal 58mm/80mm, tombol cetak Bluetooth dummy, dan tombol kirim rincian nota belanja instan ke nomor WhatsApp pembeli.
- [x] **Task 1.10 (Riwayat Transaksi Kasir)**: Buat halaman `/kasir/riwayat` yang menampilkan riwayat transaksi kasir yang sedang aktif dengan total penjualan hari ini, detail struk, dan tombol cetak ulang struk.
- [x] **Task 1.11 (Dashboard Utama Pemilik)**: Buat halaman `/dashboard` berisi kartu KPI ringkas (Omset Hari Ini, Keuntungan Kotor, Pengeluaran Kasir Hari Ini, Kasbon Belum Lunas, Produk Stok Menipis), grafik tren penjualan, daftar transaksi kasir terbaru, dan panel notifikasi.
- [x] **Task 1.12 (Manajemen Produk Kilat 3 Kolom)**: Buat halaman `/dashboard/produk` lengkap dengan tabel produk, pencarian, filter kategori, dialog tambah/edit produk dengan 3 kolom wajib utama (Nama, Harga Jual, Stok) serta akordeon lipat untuk kolom opsional (barcode, harga beli, foto, multi-satuan), dan tombol status aktif.
- [x] **Task 1.13 (Status Stok & Catat Barang Masuk/Keluar)**: Buat halaman `/dashboard/stok` menampilkan daftar stok semua produk, badge penanda stok menipis, tombol dialog "Catat Barang Masuk" (kulakan) dan "Catat Barang Rusak/Hilang".
- [x] **Task 1.14 (Mutasi Stok)**: Buat halaman `/dashboard/mutasi` berisi tabel riwayat barang masuk/keluar dengan kolom tanggal, produk, tipe mutasi, alasan, jumlah, referensi transaksi, dan penanggung jawab.
- [x] **Task 1.15 (Pembelian Supplier & Catatan Hutang Toko)**: Buat halaman `/dashboard/pembelian` dengan daftar pembelian dari supplier sembako, form pembelian baru yang memilih supplier, produk, harga, dan opsi status tunai atau tempo (hutang toko).
- [x] **Task 1.16 (Buku Kasbon Pelanggan & Supplier)**: Buat halaman `/dashboard/kasbon` berisi daftar pembeli yang memiliki kasbon, sisa tagihan, riwayat cicilan, dan tombol dialog `[Terima Pembayaran]` yang otomatis menghitung sisa hutang dari data dummy.
- [x] **Task 1.17 (Laporan Keuangan Sederhana & Arus Kas)**: Buat halaman `/dashboard/laporan` dengan filter rentang tanggal, kartu ringkasan (Pemasukan, Pengeluaran, HPP, Laba Kotor, Laba Bersih), grafik batang pemasukan vs pengeluaran, tabel arus kas, dan tombol mockup **Export Excel & PDF**.
- [x] **Task 1.18 (Pengaturan Toko, Kasir & Mode Dual-Distribusi)**: Buat halaman `/dashboard/pengaturan` berisi form identitas toko, teks kaki struk, pengelolaan akun & PIN kasir, kategori produk, pengaturan metode bayar, konfigurasi Asisten AI Hermes, serta informasi status lisensi/sewa toko.
- [x] **Task 1.19 (Widget UI Asisten AI Hermes)**: Buat komponen floating widget chat Asisten Pintar Toko di sudut kanan bawah layar dengan antarmuka percakapan ramah dan rekomendasi pertanyaan cepat (*"Omset hari ini berapa?"*, *"Barang apa yang mau habis?"*).
- [x] **Task 1.20 (Uji Responsif & Interaksi Mobile)**: Pastikan seluruh halaman di atas tampil rapi dan nyaman disentuh di ukuran HP Android (360px–412px), tablet, dan desktop; tombol-tombol utama dapat diklik dan semua navigasi berpindah antar halaman secara mulus.
- [x] **Task 1.21 (Unit Test Kalkulasi POS & State Keranjang - Vitest)**: Pasang Vitest dan React Testing Library; buat unit test otomatis untuk memvalidasi fungsi kalkulasi uang kembalian, pemisah ribuan Rupiah, penambahan/pengurangan keranjang belanja Zustand, dan kalkulasi diskon; jalankan `npm run test` dan pastikan 100% PASS.

---

### 🔵 TAHAP 2: Database Supabase, Autentikasi Nyata & Logika Bisnis Core

*Tujuan: Menghubungkan seluruh antarmuka KasToko dengan database PostgreSQL Supabase, autentikasi nyata, kebijakan keamanan RLS, Server Actions, dan data dinamis.*

- [ ] **Task 2.1 (Migrasi Database & Kebijakan RLS)**: Eksekusi script SQL Bab 10 lengkap dengan tabel `cashier_shifts`, `product_units`, `duitku_payments`, index, trigger `updated_at`, dan Row Level Security policies per `store_id` di Supabase.
- [ ] **Task 2.2 (Seed Data Nyata Toko Sembako)**: Masukkan seed data awal untuk toko contoh "Toko Berkah Jaya", akun owner `budi@tokoberkah.id`, akun kasir `siti@tokoberkah.id` (PIN: `1234`), 15 produk sembako dengan barcode nyata, supplier "UD Sinar Mas", kasbon Bu Ani, dan riwayat transaksi dummy.
- [ ] **Task 2.3 (Supabase Client & Auth)**: Setup `@supabase/ssr` (browser client dan server client), middleware pelindung rute Next.js 16, serta hubungkan halaman `/login` dan `/register` agar benar-benar terhubung ke Supabase Auth.
- [ ] **Task 2.4 (Role Guard & Redirect)**: Implementasikan fungsi pembaca role dari tabel `store_members`; middleware mengarahkan owner ke `/dashboard` dan cashier ke `/kasir`; user tanpa toko/tidak aktif ditolak.
- [ ] **Task 2.5 (Logika Buka / Tutup Kasir)**: Buat Server Actions `openShift` dan `closeShift` untuk mencatat modal uang kembalian, menghitung total kas fisik laci, dan mencatat selisih ke tabel `cashier_shifts`.
- [ ] **Task 2.6 (Kelola Kasir & PIN oleh Owner)**: Buat Server Action di `/dashboard/pengaturan` untuk membuat akun kasir melalui `supabase.auth.admin.createUser`, menyimpan PIN kasir ke `store_members`, dan mengaktifkan/menonaktifkan kasir.
- [ ] **Task 2.7 (CRUD Produk Kilat & Multi-Satuan)**: Buat Server Actions untuk menambah, mengedit, menghapus, generate SKU otomatis, dan mengubah status produk, kategori, serta multi-satuan grosir di database; hubungkan halaman `/dashboard/produk`.
- [ ] **Task 2.8 (Upload Gambar Produk)**: Implementasikan upload foto produk ke Supabase Storage bucket `product-images` dengan validasi tipe file, optimasi gambar, dan URL publik aman.
- [ ] **Task 2.9 (Core Engine Transaksi POS)**: Buat Server Action / RPC `createSale` atomik yang menerima data keranjang, membuat header penjualan, sale items, mengurangi stok barang, mencatat `stock_mutations`, mengaitkan ke shift kasir aktif, dan menambahkan `cash_flows`.
- [ ] **Task 2.10 (Integrasi POS Frontend ke Backend)**: Hubungkan halaman `/kasir` dengan backend Supabase sehingga pencarian produk mengambil data asli, keranjang dapat checkout lunas, dan transaksi berhasil tampil di riwayat kasir.
- [ ] **Task 2.11 (Pembelian Supplier & Stok Masuk)**: Buat Server Action `createPurchase` untuk mencatat pembelian supplier, purchase items, stok masuk otomatis, dan cash flow jika tunai atau hutang jika tempo; hubungkan ke `/dashboard/pembelian`.
- [ ] **Task 2.12 (Stok Keluar Manual & Opname)**: Buat Server Action untuk mencatat stok keluar karena rusak/hilang/kedaluwarsa dan stok opname manual; hubungkan ke halaman `/dashboard/stok` dan `/dashboard/mutasi`.
- [ ] **Task 2.13 (Integrasi Buku Kasbon Pelanggan & Hutang Supplier)**: Implementasikan Server Action untuk membuat `receivables` dari penjualan kasbon dan `payables` dari pembelian tempo; buat aksi pembayaran kasbon/hutang yang mencatat cash flow dan mengubah status lunas.
- [ ] **Task 2.14 (Pencatatan Pengeluaran Kasir)**: Buat Server Action pencatatan pengeluaran operasional toko serta integrasikan tombol "Catat Pengeluaran" di kasir, dashboard, dan laporan.
- [ ] **Task 2.15 (Koneksi Dashboard & Laporan Asli)**: Sambungkan seluruh kartu KPI omset, laba kotor, grafik tren, dan tabel laporan di `/dashboard` serta `/dashboard/laporan` menggunakan query agregasi database asli.
- [ ] **Task 2.16 (Notifikasi Stok Menipis Realtime)**: Aktifkan tabel `notifications`, buat trigger/Server Action untuk membuat notifikasi saat stok barang jatuh di bawah batas minimum dan ada penjualan baru, lalu tampilkan real-time via Supabase Realtime di lonceng dasbor.
- [ ] **Task 2.17 (Integration Test Server Actions & RLS - Vitest)**: Buat integration test otomatis menggunakan Vitest untuk menguji Server Actions krusial: pemotongan stok atomik (`createSale`), validasi saldo laci shift (`openShift`/`closeShift`), pencatatan kasbon (`receivables`), dan verifikasi signature MD5 callback Duitku; pastikan seluruh test 100% PASS.

---

### 🟡 TAHAP 3: Asisten AI Hermes, Hardware Kasir, Mode Offline & Payment Duitku

*Tujuan: Menyempurnakan KasToko menjadi aplikasi pintar dengan Asisten AI Hermes (Nous Research), cetak thermal Bluetooth langsung, barcode scanner tembak, integrasi QRIS Duitku, dan ketahanan transaksi saat offline.*

- [ ] **Task 3.1 (Backend Asisten AI Hermes via Route Handler)**: Buat endpoint `/api/ai/chat` yang terhubung ke model Hermes (Nous Research) via API FreeLLM / OpenRouter. Konfigurasikan deklarasi *tools / functions*:
  - `get_daily_sales()`: Menghitung omset dan laba hari ini.
  - `get_low_stock_products()`: Daftar barang yang stoknya menipis.
  - `get_debtor_list()`: Daftar pembeli yang memiliki kasbon belum lunas.
  - `create_expense(title, amount)`: Mencatat pengeluaran kasir langsung dari chat.
- [ ] **Task 3.2 (Widget Chat Asisten AI Terhubung ke Backend)**: Hubungkan komponen widget chat di frontend dengan `/api/ai/chat`, lengkapi dengan efek loading interaktif, dan tampilkan kartu aksi ringkas saat fungsi berhasil dieksekusi.
- [ ] **Task 3.3 (Driver Cetak Thermal Bluetooth 58mm/80mm)**: Implementasikan driver cetak Web Bluetooth API yang mampu mendeteksi printer kasir mini Bluetooth, memformat teks struk via perintah ESC/POS (ukuran 58mm/80mm), dan memotong kertas otomatis.
- [ ] **Task 3.4 (Share Nota ke WhatsApp)**: Implementasikan tautan generator WhatsApp resmi (`https://wa.me/...`) yang memformat teks nota belanja rapi lengkap dengan nomor struk, rincian barang, total, dan nama toko.
- [ ] **Task 3.5 (Listener Barcode Scanner Tembak USB)**: Buat event listener global pada layar kasir untuk menangkap input cepat dari scanner barcode tembak USB/Bluetooth tanpa kasir harus mengarahkan kursor ke input pencarian.
- [ ] **Task 3.6 (Integrasi Duitku Create Invoice)**: Buat service di server yang memanggil API Duitku `createInvoice`; simpan response ke tabel `duitku_payments`; buat endpoint `/api/payment/duitku/create`.
- [ ] **Task 3.7 (UI Pembayaran QRIS di POS & Polling Status)**: Implementasikan dialog pembayaran QRIS di `/kasir` yang menampilkan QRIS dari Duitku, hitung mundur kedaluwarsa, dan polling status transaksi.
- [ ] **Task 3.8 (Callback Webhook Duitku)**: Buat endpoint `/api/payment/duitku/callback` yang memverifikasi signature Duitku menggunakan `md5(merchantCode + merchantOrderId + amount + apiKey)`, memperbarui status sale menjadi `paid`, memotong stok, mencatat cash flow `qris_duitku`, dan memberi notifikasi.
- [x] **Task 3.9 (PWA - [ ] **Task 3.9 (PWA & Service Worker Serwist)**: Pasang Serwist PWA, buat manifest KasToko, ikon aplikasi 192px/512px, service worker yang meng-cache app shell, dan pastikan website dapat diinstal di layar utama Android (*Add to Home Screen*). Native Service Worker)**: Pasang Native Service Worker, buat manifest KasToko, ikon aplikasi 192px/512px, service worker yang meng-cache app shell, dan pastikan website dapat diinstal di layar utama Android (*Add to Home Screen*).
- [ ] **Task 3.10 (Cache Katalog Offline Dexie.js)**: Simpan snapshot produk, kategori, dan pelanggan ke IndexedDB/Dexie setiap kali data berhasil diambil dari Supabase.
- [ ] **Task 3.11 (Transaksi Offline & Outbox)**: Implementasikan alur transaksi tunai/kasbon offline: simpan payload transaksi ke tabel `outbox` IndexedDB, beri tahu kasir bahwa transaksi akan disinkronkan, dan update stok lokal sementara.
- [ ] **Task 3.12 (Sinkronisasi Otomatis)**: Buat endpoint `/api/offline/sync` yang memproses antrean transaksi offline ke Server Action `createSale`; jika berhasil hapus dari outbox; jika gagal tandai `sync_error` dan tampilkan notifikasi.

---

### 🟣 TAHAP 4: Distribusi Ganda (SaaS vs Self-Hosted), Keamanan, Testing & Rilis

*Tujuan: Memastikan sistem dapat berjalan fleksibel dalam mode Sewa Bulanan (SaaS) maupun Instalasi Mandiri (Self-Hosted), audit keamanan data, pengujian menyeluruh, dan rilis siap pakai.*

- [ ] **Task 4.1 (Implementasi Saklar Dual-Mode `APP_MODE`)**: Terapkan logika kondisional berdasarkan `APP_MODE=saas` atau `APP_MODE=self-hosted` (menonaktifkan modul tagihan sewa pada mode self-hosted, mengizinkan input API Key AI sendiri di menu Pengaturan).
- [ ] **Task 4.2 (Paket Docker Compose & Multi-OS Launcher)**: Buat berkas `docker-compose.yml` multi-stage (Next.js + PostgreSQL lokal) dan script launcher 1-klik untuk Windows (`start-kastoko.bat`) serta Ubuntu/Debian Linux (`start-kastoko.sh`) agar toko mandiri dapat menjalankan sistem tanpa pusing konfigurasi manual.
- [ ] **Task 4.3 (Proteksi Void & Otorisasi PIN Pemilik)**: Terapkan perlindungan pembatalan transaksi: kasir tidak dapat membatalkan transaksi yang sudah lunas tanpa memasukkan PIN pemilik toko; seluruh pembatalan tercatat di log audit.
- [ ] **Task 4.4 (Ekspor Data Excel & PDF Asli)**: Implementasikan fungsi unduh file Excel (.xlsx) dan PDF pada halaman Laporan Keuangan, Mutasi Stok, dan Rekap Buku Kasbon.
- [ ] **Task 4.5 (Uji Otomatis Menyeluruh Vitest & Playwright E2E - Wajib 100% PASS)**: Buat skenario pengujian Playwright E2E (`npm run test:e2e`) yang mensimulasikan alur kasir nyata di browser (Login ➔ Buka Kasir & isi modal awal ➔ Pilih barang & scan barcode ➔ Tekan tombol uang pas ➔ Hitung kembalian ➔ Simpan struk ➔ Tutup Kasir & cek selisih uang laci). Jalankan seluruh unit, integration, dan E2E test; wajib 100% PASS bebas kegagalan.
- [ ] **Task 4.6 (Build Produksi & Dokumentasi Penggunaan)**: Lakukan `npm run build` bebas error dan susun panduan penggunaan singkat berbahasa Indonesia untuk pemilik toko dan kasir.

---

## 12. Master Starter Prompt (Siap Coding untuk AI Agent)

```markdown
Halo! Kamu berperan sebagai Senior Fullstack Architect dan Lead Developer.

Saya ingin membangun aplikasi KasToko berdasarkan dokumen PRD Master ini.
Silakan baca seluruh isi dokumen @PRD_KasToko_Produk_Requirements_Document.md terlebih dahulu.

ATURAN EKSEKUSI (WAJIB DIPATUHI):
1. Mode eksekusi yang dipilih adalah "PHASE" / bertahap per fase secara terstruktur tanpa loncat-loncat.
2. JANGAN PERNAH membuat semua kode atau file sekaligus dalam satu waktu agar terhindar dari error dan kehabisan konteks.
3. Kerjakan seluruh Task pada **Tahap 1** dalam Bab 11 secara tuntas dan mandiri dalam satu putaran penuh:
   - Mulai dari Task 1.1 sampai Task 1.21.
   - Gunakan data dummy berbahasa Indonesia yang realistis untuk dunia toko/sembako (Toko Berkah Jaya).
   - Pastikan UI ramah pengguna awam/gaptek: tampilan bersih, alur to-the-point tidak membingungkan, ukuran teks proporsional pas di layar HP, tombol nominal uang pas instan, form tambah barang kilat 3 kolom, dialog buka/tutup kasir, struk format 58mm/WA, dan widget chat AI Hermes.
4. Setelah menyelesaikan Tahap 1, BERHENTI. Laporkan seluruh halaman dan komponen yang berhasil dibuat, lalu MENUNGGU konfirmasi saya sebelum mulai Tahap 2.
5. JANGAN melanjutkan ke Tahap 2 atau membuat database sebelum ada instruksi lanjutan dari saya.
6. Patuhi Tech Stack Modern: Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui, Zustand v5, dan Lucide Icons.
7. Semua halaman wajib dibuat lengkap. DILARANG membuat halaman placeholder atau "coming soon".
8. WAJIB DUKUNG MULTI-PLATFORM (Windows, Ubuntu/Debian, & Docker): Seluruh kode dilarang keras menggunakan hardcoded path separator Windows (`\`), wajib kompatibel saat dijalankan di Windows, Debian/Ubuntu, maupun Docker container dengan launcher `start-kastoko.bat` dan `start-kastoko.sh`.
9. WAJIB TEST SUITE & 100% PASS: Wajib membuat unit test (Vitest) dan E2E test (Playwright) untuk logika krusial (kalkulasi kasir, kembalian, pemotongan stok, otorisasi PIN). AI dilarang menyatakan sebuah tahap selesai jika perintah 'npm run test' dan 'npm run test:e2e' belum dijalankan dan belum 100% PASS.

Jika kamu sudah membaca dan memahami seluruh PRD Master ini, silakan berikan ringkasan kesiapanmu dan konfirmasikan bahwa kamu siap mengeksekusi Tahap 1 mulai dari Task 1.1!
```
