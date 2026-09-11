# Panduan Kontribusi KasToko 🤝

Terima kasih telah tertarik untuk berkontribusi di KasToko! Karena proyek ini bersifat open-source dan melayani ratusan UMKM, kami sangat menghargai sekecil apapun bantuan Anda, baik itu melaporkan bug, memperbaiki desain, atau menambahkan fitur baru.

## 🛠️ Proses Kontribusi

1. **Fork Repositori**: Klik tombol `Fork` di pojok kanan atas halaman repositori ini.
2. **Clone ke Lokal**:
   ```bash
   git clone https://github.com/USERNAME_ANDA/Kas-Toko.git
   cd Kas-Toko
   ```
3. **Buat Branch Baru**: Gunakan format penamaan branch yang jelas (misal: `feat/fitur-baru`, `fix/perbaikan-bug`).
   ```bash
   git checkout -b feat/fitur-baru
   ```
4. **Lakukan Perubahan**: Pastikan kode Anda mengikuti standar `eslint` dan arsitektur Next.js 16 App Router.
5. **Jalankan Linter dan Testing**:
   ```bash
   npm run lint
   npm run test
   ```
   *Pastikan 0 Errors & 0 Warnings sebelum membuat commit!*
6. **Commit Perubahan**: Gunakan format [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
   ```bash
   git commit -m "feat: tambahkan fitur kalkulator diskon"
   ```
7. **Push ke Fork Anda**:
   ```bash
   git push origin feat/fitur-baru
   ```
8. **Buat Pull Request (PR)**: Buka GitHub dan buat PR ke branch `master` kami.

## 🛡️ Standar Kode (Code of Conduct)
- **TypeScript**: Hindari penggunaan tipe `any`. Gunakan tipe data yang spesifik.
- **PWA & Offline-First**: Jangan merusak logika Service Worker (`public/sw.js`) dan Dexie.
- **Keamanan**: Kami menggunakan `CodeQL` untuk memindai setiap Pull Request. Pastikan kode Anda tidak memiliki celah keamanan (XSS, SQL Injection).

Kami menantikan kontribusi Anda! 🎉
