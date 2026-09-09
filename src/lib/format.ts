export interface BarisRincian {
  price: number;
  qty: number;
}

/** Format angka menjadi Rupiah dengan pemisah ribuan Indonesia: 25000 -> "Rp 25.000" */
export function formatRupiah(nilai: number): string {
  const bulat = Math.round(nilai);
  const tanda = bulat < 0 ? "-" : "";
  const digit = Math.abs(bulat).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${tanda}Rp ${digit}`;
}

/** Ambil angka bersih dari teks input uang ("Rp 25.000" / "25.000" / "25000") -> 25000 */
export function parseInputUang(teks: string): number {
  const bersih = teks.replace(/[^\d-]/g, "");
  const angka = Number.parseInt(bersih, 10);
  return Number.isNaN(angka) ? 0 : angka;
}

/** Total satu baris belanja */
export function totalBaris(price: number, qty: number): number {
  return Math.round(price * qty);
}

/** Subtotal keranjang */
export function hitungSubtotal(items: BarisRincian[]): number {
  return items.reduce((akumulasi, baris) => akumulasi + totalBaris(baris.price, baris.qty), 0);
}

/** Nilai diskon (fixed rupiah atau persentase), dibatasi tidak melebihi subtotal */
export function hitungDiskon(
  subtotal: number,
  nilai: number,
  tipe: "fixed" | "percentage"
): number {
  const kasar = tipe === "percentage" ? Math.round((subtotal * nilai) / 100) : Math.round(nilai);
  return Math.min(Math.max(kasar, 0), subtotal);
}

/** Total yang harus dibayar */
export function hitungTotal(subtotal: number, diskon: number): number {
  return Math.max(subtotal - Math.max(diskon, 0), 0);
}

/** Uang kembalian: tidak pernah negatif */
export function hitungKembalian(uangDiterima: number, totalTagihan: number): number {
  return Math.max(Math.round(uangDiterima) - Math.round(totalTagihan), 0);
}

/** Cek apakah uang pelanggan cukup untuk membayar */
export function uangCukup(uangDiterima: number, totalTagihan: number): boolean {
  return Math.round(uangDiterima) >= Math.round(totalTagihan);
}

/** Konversi qty dari satuan besar ke satuan dasar (1 Dus = 40 Pcs) */
export function konversiKeSatuanDasar(jumlah: number, faktorKonversi: number): number {
  return Math.round(jumlah * faktorKonversi * 100) / 100;
}

/** Tanggal jam lokal ringkas: "09/09/2026 14:32" */
export function formatWaktu(iso: string): string {
  const d = new Date(iso);
  const ppn = (n: number) => n.toString().padStart(2, "0");
  return `${ppn(d.getDate())}/${ppn(d.getMonth() + 1)}/${d.getFullYear()} ${ppn(d.getHours())}:${ppn(d.getMinutes())}`;
}

/** Tanggal lokal: "09/09/2026" */
export function formatTanggal(iso: string): string {
  return formatWaktu(iso).slice(0, 10);
}

/** Label hari untuk grafik: "Sen, 08 Sep" */
export function labelHariLokal(d: Date): string {
  const nama = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  return `${nama[d.getDay()]}, ${d.getDate().toString().padStart(2, "0")} ${bulan[d.getMonth()]}`;
}

/** Kunci hari YYYY-MM-DD waktu lokal untuk pengelompokan laporan */
export function kunciHari(d: Date): string {
  const ppn = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${ppn(d.getMonth() + 1)}-${ppn(d.getDate())}`;
}

export function hariIni(): string {
  return kunciHari(new Date());
}

/** Nominal uang instan yang ditawarkan di layar kasir */
export const NOMINAL_INSTAN = [25000, 50000, 100000];

/** Tampilkan QRIS/WhatsApp phone: 0812-3333-4444 -> 6281233334444 */
export function nomorWa(phone: string | undefined): string {
  if (!phone) return "";
  const digit = phone.replace(/\D/g, "");
  if (digit.startsWith("0")) return `62${digit.slice(1)}`;
  if (digit.startsWith("8")) return `62${digit}`;
  return digit;
}
