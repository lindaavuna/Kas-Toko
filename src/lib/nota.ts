import { formatRupiah, formatWaktu } from "./format";
import type { Sale } from "./types";

const NAMA_METODE: Record<Sale["paymentMethod"], string> = {
  cash: "Tunai",
  qris_duitku: "QRIS",
  qris_manual: "QRIS Statis Toko",
  bank_transfer: "Transfer Bank",
  credit: "Kasbon",
};

function kanan(kiri: string, nilai: string, lebar: number): string {
  const sisa = lebar - kiri.length - nilai.length;
  return sisa > 0 ? `${kiri}${" ".repeat(sisa)}${nilai}` : `${kiri} ${nilai}`;
}

export function namaMetodeBayar(metode: Sale["paymentMethod"]): string {
  return NAMA_METODE[metode];
}

/** Rincian struk dalam bentuk baris teks rata (muat di kertas thermal 58mm = 32 karakter) */
export function barisStruk(sale: Sale, toko: { nama: string; telepon?: string; kakiStruk?: string }, lebar = 32): string[] {
  const garis = "-".repeat(lebar);
  const baris: string[] = [
    toko.nama.toUpperCase(),
    toko.telepon ? `Telp ${toko.telepon}` : "",
    garis,
    `No  : ${sale.receiptNumber}`,
    `Wkt : ${formatWaktu(sale.createdAt)}`,
    `Kasir: ${sale.cashierName}`,
    sale.customerName ? `Pelanggan: ${sale.customerName}` : "",
    garis,
  ];
  for (const item of sale.items) {
    baris.push(item.name);
    baris.push(kanan(`  ${item.qty} ${item.unit} x ${formatRupiah(item.price)}`, formatRupiah(item.total), lebar));
  }
  baris.push(garis);
  baris.push(kanan("Subtotal", formatRupiah(sale.subtotal), lebar));
  if (sale.discount > 0) baris.push(kanan("Diskon", `-${formatRupiah(sale.discount)}`.replace("Rp", "Rp "), lebar));
  baris.push(kanan("TOTAL", formatRupiah(sale.total), lebar));
  if (sale.paymentMethod === "cash") {
    baris.push(kanan("Tunai", formatRupiah(sale.amountPaid), lebar));
    baris.push(kanan("Kembali", formatRupiah(sale.changeAmount), lebar));
  } else {
    baris.push(kanan("Bayar", namaMetodeBayar(sale.paymentMethod), lebar));
    if (sale.transferRef) baris.push(`Ref: ${sale.transferRef}`);
  }
  baris.push(garis);
  if (toko.kakiStruk) baris.push(toko.kakiStruk);
  return baris.filter((b) => b !== "");
}

/** Pesan WhatsApp rapi untuk tombol "Kirim Nota ke WA" (tautan wa.me) */
export function teksNotaWa(sale: Sale, toko: { nama: string; telepon?: string; kakiStruk?: string }): string {
  const garis = "-".repeat(26);
  const baris: string[] = [
    `*${toko.nama}*`,
    garis,
    `No Struk : ${sale.receiptNumber}`,
    `Tanggal  : ${formatWaktu(sale.createdAt)}`,
    `Kasir    : ${sale.cashierName}`,
    sale.customerName ? `Pelanggan: ${sale.customerName}` : "",
    garis,
    "Rincian belanja:",
  ];
  for (const item of sale.items) {
    baris.push(`• ${item.qty} ${item.unit} ${item.name} — ${formatRupiah(item.total)}`);
  }
  baris.push(garis);
  baris.push(`Subtotal : ${formatRupiah(sale.subtotal)}`);
  if (sale.discount > 0) baris.push(`Diskon : -${formatRupiah(sale.discount)}`);
  baris.push(`*TOTAL : ${formatRupiah(sale.total)}*`);
  if (sale.paymentMethod === "cash") {
    baris.push(`Tunai : ${formatRupiah(sale.amountPaid)}`);
    baris.push(`Kembalian : ${formatRupiah(sale.changeAmount)}`);
  } else {
    baris.push(`Bayar via ${namaMetodeBayar(sale.paymentMethod)}`);
  }
  if (toko.kakiStruk) baris.push("", toko.kakiStruk);
  return baris.filter((b) => typeof b === "string" && b !== "").join("\n");
}

/** Bangun tautan resmi wa.me dengan isi pesan terisi otomatis */
export function tautanWhatsApp(nomorWa: string, pesan: string): string {
  const nomor = nomorWa.replace(/\D/g, "");
  return `https://wa.me/${nomor}?text=${encodeURIComponent(pesan)}`;
}
