# PANDUAN INTEGRASI DOMAIN & NGINX PROXY MANAGER (NPM)

Panduan ini mendokumentasikan langkah-langkah resmi menghubungkan domain publik ke aplikasi **KasToko POS & Backoffice UMKM** melalui **Nginx Proxy Manager (NPM)** yang berjalan pada server.

---

## 1. Verifikasi Port Lokal & Layanan
- **Aplikasi KasToko (Next.js)** berjalan di port lokal host:
  ```bash
  http://127.0.0.1:9991
  ```
- **PM2 Service**: `kastoko` (id 0) berjalan aktif (`online`).
- **Nginx Proxy Manager**: Container Docker `nginx-proxy-manager` berjalan di port `80`, `81` (Admin Dashboard), dan `443` (HTTPS).

---

## 2. Langkah Setup Proxy Host di Dashboard NPM (Port 81)

1. Buka browser dan akses antarmuka admin NPM:
   ```text
   http://<IP_SERVER>:81
   # Contoh lokal: http://172.22.22.18:81
   ```
2. Masuk ke menu **Hosts** > **Proxy Hosts** > klik tombol **Add Proxy Host**.
3. Pada tab **Details**, isi formulir berikut:
   - **Domain Names**: `pos.tokoanda.com` (atau domain/subdomain toko Anda yang sudah di-pointing DNS A record ke IP publik server ini).
   - **Scheme**: `http`
   - **Forward Hostname / IP**:
     - Gunakan IP bridge Docker host: `172.18.0.1` (atau IP antarmuka server `172.22.22.18`).
     - *Catatan teknis*: Jangan gunakan `127.0.0.1` jika NPM berada dalam container Docker terisolasi, karena `127.0.0.1` akan merujuk ke container NPM itu sendiri.
   - **Forward Port**: `9991`
   - **Cache Assets**: Opsional (`OFF` disarankan untuk data POS real-time).
   - **Block Common Exploits**: Centang **ON** (Wajib untuk keamanan injeksi SQL/XSS).
   - **Websockets Support**: Centang **ON** (Wajib untuk auto-sync IndexedDB Dexie dan streaming AI chat).
4. Pada tab **SSL**:
   - **SSL Certificate**: Pilih **Request a new SSL Certificate** (Let's Encrypt).
   - **Force SSL**: Centang **ON** (Wajib — Web Bluetooth API & PWA Service Worker mewajibkan konteks HTTPS aman).
   - **HTTP/2 Support**: Centang **ON** (Mempercepat loading aset static & chunk JS kasir kilat).
   - **HSTS Enabled**: Centang **ON** (Opsional tapi disarankan).
   - **I Agree to the Let's Encrypt Terms of Service**: Centang **ON**.
   - Masukkan alamat email penanggung jawab domain.
5. Klik tombol **Save**.

---

## 3. Konfigurasi Nginx Alternatif (Reverse Proxy Manual)

Bila tidak menggunakan GUI NPM, konfigurasi manual file `/etc/nginx/sites-available/kastoko` setara adalah:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name pos.tokoanda.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name pos.tokoanda.com;

    ssl_certificate /etc/letsencrypt/live/pos.tokoanda.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pos.tokoanda.com/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    location / {
        proxy_pass http://127.0.0.1:9991;
        proxy_http_version 1.1;

        # WebSocket & Streaming Chat Support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Forwarding Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for Long Requests (AI / Sync)
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
}
```

---

## 4. Mengapa HTTPS Wajib untuk KasToko POS?
1. **Web Bluetooth API** (`navigator.bluetooth`): Browser (Chrome / Edge di Android & Desktop) secara ketat menolak koneksi Bluetooth printer thermal jika halaman tidak dilayani via HTTPS resmi (atau `localhost`).
2. **PWA Service Worker & Manifest**: Tombol instalasi *Add to Home Screen* hanya muncul di perangkat kasir Android/iOS jika origin berstatus aman (HTTPS).
3. **Kerahasiaan Transaksi**: Enkripsi TLS melindungi cookie sesi kasir, token otorisasi, dan PIN void pemilik dari penyadapan pada jaringan WiFi toko.
