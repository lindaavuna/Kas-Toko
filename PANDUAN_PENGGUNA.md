# 📋 PANDUAN PENGGUNAAN KASTOKO POS (CHEAT-SHEET UMKM)

Dokumen ringkas satu lembar panduan operasional harian untuk **Kasir** dan **Pemilik Toko**.

---

## 🟢 1. PANDUAN OPERASIONAL KASIR (LOKET PENJUALAN)

### A. Membuka Shift Kasir
1. Buka browser (Chrome / Edge) ke alamat: `http://localhost:9991/kasir` (atau domain HTTPS toko).
2. Masukkan **Email Kasir** dan **PIN 4–6 digit**.
3. Masukkan **Modal Awal Kasir** (uang kembalian di laci kasir, mis. Rp 100.000), lalu klik **Buka Shift**.

### B. Memproses Transaksi Penjualan
1. **Scan atau Pilih Barang**:
   - Tembakkan barcode scanner USB/Bluetooth ke kemasan produk, ATAU
   - Cari nama barang di kolom pencarian / klik kartu produk langsung di layar.
2. **Atur Jumlah & Diskon**:
   - Klik `+` atau `-` untuk mengubah jumlah pesanan di keranjang belanja.
   - Pilih satuan (Pcs, Renceng, Dus) bila produk memiliki multi-satuan grosir.
3. **Pilih Metode Pembayaran**:
   - **Tunai**: Klik nominal uang pas (Rp 10rb, Rp 50rb, Rp 100rb) atau ketik uang diterima. Sistem otomatis menghitung kembalian.
   - **QRIS Dinamis (Duitku)**: Tampilkan QR code di layar. Pelanggan scan via BCA/GoPay/OVO/ShopeePay/DANA. Lunas otomatis begitu pembayaran diterima!
   - **QRIS Statis / Transfer Bank**: Masukkan 4 digit nomor referensi struk transfer.
   - **Kasbon**: Pilih nama pelanggan terdaftar. Transaksi langsung tercatat ke Buku Kasbon.
4. **Cetak Struk & Selesai**:
   - Klik **Cetak Struk Thermal** (Bluetooth 58mm/80mm), ATAU
   - Klik **Kirim Nota WhatsApp** untuk mengirim ringkasan belanja langsung ke chat WA pelanggan tanpa boros kertas.

### C. Menutup Shift Kasir
1. Klik tombol **Tutup Kasir** di bilah atas.
2. Hitung fisik uang di laci, masukkan **Kas Akhir Aktual**.
3. Sistem menghitung selisih uang kas fisik vs catatan sistem secara akurat. Klik **Konfirmasi Tutup Shift**.

---

## 🏢 2. PANDUAN PEMILIK TOKO (BACKOFFICE DASBOR)

### A. Memantau Omset & Laba Bersih
- Buka `/dashboard`: Lihat grafik omset harian, laba kotor (Omset − HPP), dan laba bersih secara real-time.

### B. Pembatalan Transaksi (Void)
- Masuk ke `/dashboard/transaksi`: Klik transaksi yang salah input, lalu klik tombol **Batalkan (Void)**.
- Masukkan **PIN Void Pemilik** (4 digit rahasia). Stok barang otomatis dikembalikan ke etalase dan omset disesuaikan.

### C. Buku Kasbon & Terima Cicilan Pelanggan
- Masuk ke `/dashboard/kasbon`:
  - Lihat daftar pembeli yang masih menunggak beserta sisa piutang.
  - Saat pelanggan mencicil: klik **Terima Pembayaran**, masukkan nominal cicilan (mis. Rp 50.000). Sisa hutang langsung berkurang otomatis.
  - Klik **Export Excel** atau **Export PDF** untuk mengunduh rekap piutang toko.

### D. Manajemen Stok & Mutasi
- Masuk ke `/dashboard/stok` untuk tambah produk baru (hanya butuh 3 data kilat: Nama, Harga Beli, Harga Jual).
- Masuk ke `/dashboard/mutasi` untuk melihat riwayat arus barang masuk/keluar lengkap dengan audit petugas.

### E. Tanya Asisten AI Hermes
- Klik tombol **Hermes AI** di pojok kanan bawah:
  - *"Berapa omset hari ini?"* -> Dijawab beserta laba bersih.
  - *"Barang apa yang mau habis?"* -> Menampilkan daftar produk di bawah stok minimum.
  - *"Siapa saja yang masih kasbon?"* -> Merinci nama pelanggan & nominal kasbon belum lunas.
  - *"Tolong catat beli bensin Rp 20.000"* -> Otomatis mencatat pengeluaran toko dan memotong kas shift.

---

## ⚡ 3. TROUBLESHOOTING & PENANGANAN CEPAT

| Masalah | Penyebab Umum | Solusi Cepat |
| :--- | :--- | :--- |
| **Printer Bluetooth tidak muncul** | Browser tidak memakai HTTPS / Bluetooth mati | Buka via HTTPS resmi atau `localhost`. Pastikan Bluetooth laptop/HP dan printer aktif. |
| **Internet mati mendadak** | Jaringan ISP padam | **KasToko tetap jalan normal!** Data tersimpan aman di browser (IndexedDB). Saat internet hidup kembali, sistem otomatis sinkronisasi ke server. |
| **Uang fisik laci selisih** | Salah kembalian atau lupa catat pengeluaran kasir | Cek menu Pengeluaran Kasir atau audit mutasi shift sebelum tutup kasir. |
| **Lupa PIN Void** | Proteksi keamanan pemilik | Hubungi admin teknis untuk pemulihan hash PIN di database server. |
