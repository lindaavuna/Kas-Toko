/**
 * KasToko — Utilitas Ekspor Dokumen Ritel UMKM (Tahap 4)
 * Mendukung ekspor spreadsheet .CSV (kompatibel Excel dengan UTF-8 BOM)
 * dan cetak laporan print-friendly / PDF browser.
 */

/** Membersihkan string dan membungkus dengan kutip bila mengandung pemisah CSV */
export function formatSelCsv(nilai: unknown): string {
  if (nilai === null || nilai === undefined) return "";
  const str = String(nilai);
  // Bila mengandung koma, titik koma, tanda kutip, atau newline, bungkus kutip ganda
  if (/[",\n\r;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Menyusun baris-baris array menjadi string CSV UTF-8 valid */
export function bangunCsv(kolom: string[], baris: (string | number)[][]): string {
  const barisHeader = kolom.map(formatSelCsv).join(",");
  const barisData = baris.map((b) => b.map(formatSelCsv).join(",")).join("\r\n");
  return `\uFEFF${barisHeader}\r\n${barisData}`;
}

/** Memicu unduhan file di browser klien */
export function unduhCsv(namaFile: string, kolom: string[], baris: (string | number)[][]): void {
  if (typeof window === "undefined") return;
  const kontenCsv = bangunCsv(kolom, baris);
  const blob = new Blob([kontenCsv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", namaFile.endsWith(".csv") ? namaFile : `${namaFile}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface OpsiCetakDokumen {
  judul: string;
  subjudul?: string;
  periode?: string;
  namaToko?: string;
  ringkasan?: { label: string; nilai: string }[];
  kolom: string[];
  baris: (string | number)[][];
  kolomKanan?: number[]; // index kolom yang rata kanan (misal kolom nominal uang)
  catatan?: string;
}

/** Membuka jendela print browser dengan layout cetak kasir/toko yang rapi */
export function cetakDokumen(opsi: OpsiCetakDokumen): void {
  if (typeof window === "undefined") return;

  const jendela = window.open("", "_blank", "width=850,height=900");
  if (!jendela) {
    alert("Pop-up diblokir peramban. Mohon izinkan pop-up untuk mencetak dokumen.");
    return;
  }

  const tanggalCetak = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const htmlRingkasan = opsi.ringkasan && opsi.ringkasan.length > 0
    ? `
      <div class="ringkasan-grid">
        ${opsi.ringkasan
          .map(
            (r) => `
          <div class="ringkasan-card">
            <div class="ringkasan-label">${r.label}</div>
            <div class="ringkasan-nilai">${r.nilai}</div>
          </div>
        `
          )
          .join("")}
      </div>
    `
    : "";

  const htmlTabel = `
    <table>
      <thead>
        <tr>
          ${opsi.kolom
            .map((k, idx) => {
              const kanan = opsi.kolomKanan?.includes(idx) ? "text-right" : "text-left";
              return `<th class="${kanan}">${k}</th>`;
            })
            .join("")}
        </tr>
      </thead>
      <tbody>
        ${opsi.baris
          .map(
            (b) => `
          <tr>
            ${b
              .map((sel, idx) => {
                const kanan = opsi.kolomKanan?.includes(idx) ? "text-right font-mono" : "text-left";
                return `<td class="${kanan}">${sel ?? "—"}</td>`;
              })
              .join("")}
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;

  const html = `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>${opsi.judul} — ${opsi.namaToko || "KasToko"}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            background: #ffffff;
            padding: 28px;
            font-size: 12px;
            line-height: 1.5;
          }
          .kop {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #059669;
            padding-bottom: 14px;
            margin-bottom: 20px;
          }
          .nama-toko {
            font-size: 20px;
            font-weight: 800;
            color: #047857;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .tagline {
            font-size: 11px;
            color: #64748b;
          }
          .info-laporan {
            text-align: right;
          }
          .judul-laporan {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
          }
          .periode {
            font-size: 11px;
            color: #475569;
            font-weight: 500;
          }
          .ringkasan-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
            gap: 10px;
            margin-bottom: 20px;
          }
          .ringkasan-card {
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px;
            background: #f8fafc;
          }
          .ringkasan-label {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .ringkasan-nilai {
            font-size: 14px;
            font-weight: 700;
            color: #047857;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          th {
            background: #f1f5f9;
            color: #334155;
            font-size: 11px;
            font-weight: 700;
            padding: 8px 10px;
            border: 1px solid #cbd5e1;
            text-transform: uppercase;
          }
          td {
            padding: 7px 10px;
            border: 1px solid #e2e8f0;
            font-size: 11px;
          }
          tr:nth-child(even) {
            background: #f8fafc;
          }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
          .footer {
            margin-top: 30px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #94a3b8;
          }
          @media print {
            body { padding: 12px; }
            th { background: #e2e8f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .ringkasan-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="kop">
          <div>
            <div class="nama-toko">${opsi.namaToko || "KasToko UMKM"}</div>
            <div class="tagline">Sistem Kasir &amp; Manajemen Toko Pintar</div>
          </div>
          <div class="info-laporan">
            <div class="judul-laporan">${opsi.judul}</div>
            ${opsi.subjudul ? `<div>${opsi.subjudul}</div>` : ""}
            ${opsi.periode ? `<div class="periode">Periode: ${opsi.periode}</div>` : ""}
          </div>
        </div>

        ${htmlRingkasan}

        ${htmlTabel}

        ${opsi.catatan ? `<p style="font-size: 11px; color: #64748b; margin-top: -12px; margin-bottom: 16px;">* ${opsi.catatan}</p>` : ""}

        <div class="footer">
          <span>Dicetak otomatis pada: ${tanggalCetak}</span>
          <span>Dokumen Resmi KasToko POS — Halaman 1/1</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  jendela.document.open();
  jendela.document.write(html);
  jendela.document.close();
}
