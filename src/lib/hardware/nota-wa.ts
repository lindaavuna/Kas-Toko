import type { Sale, InfoToko } from "../types";
import { formatRupiah, formatWaktu, nomorWa } from "../format";
import { namaMetodeBayar } from "../nota";

/**
 * Membentuk string nota digital yang ramah dibaca di chat WhatsApp.
 */
export function formatNotaWhatsApp(sale: Sale, toko: InfoToko): string {
  const baris: string[] = [
    `*${toko.nama.toUpperCase()}*`,
    toko.alamat ? `📍 ${toko.alamat}` : "",
    toko.telepon ? `📞 ${toko.telepon}` : "",
    "--------------------------------",
    `*No. Struk*  : ${sale.receiptNumber}`,
    `*Waktu*      : ${formatWaktu(sale.createdAt)}`,
    `*Kasir*      : ${sale.cashierName}`,
    sale.customerName ? `*Pelanggan*  : ${sale.customerName}` : "",
    "--------------------------------",
    "*RINCIAN BELANJA:*",
  ];

  for (const item of sale.items) {
    baris.push(`• *${item.name}*`);
    baris.push(`  ${item.qty} ${item.unit} × ${formatRupiah(item.price)} = ${formatRupiah(item.total)}`);
  }

  baris.push("--------------------------------");
  baris.push(`Subtotal : ${formatRupiah(sale.subtotal)}`);
  if (sale.discount > 0) {
    baris.push(`Diskon   : -${formatRupiah(sale.discount)}`);
  }
  baris.push(`*TOTAL    : ${formatRupiah(sale.total)}*`);

  if (sale.paymentMethod === "cash") {
    baris.push(`Tunai    : ${formatRupiah(sale.amountPaid)}`);
    baris.push(`Kembalian: ${formatRupiah(sale.changeAmount)}`);
  } else if (sale.paymentMethod === "credit") {
    baris.push(`Status   : *KASBON / HUTANG*`);
  } else {
    baris.push(`Metode   : ${namaMetodeBayar(sale.paymentMethod)}`);
    if (sale.transferRef) {
      baris.push(`Ref      : ${sale.transferRef}`);
    }
  }

  baris.push("--------------------------------");
  if (toko.kakiStruk) {
    baris.push(toko.kakiStruk);
  } else {
    baris.push("Terima kasih sudah berbelanja di toko kami! 🙏");
  }

  return baris.filter(Boolean).join("\n");
}

/**
 * Membuat URL wa.me dengan nomor tujuan dan pesan teks yang sudah ter-encode
 */
export function buatTautanNotaWa(nomorTujuan: string, pesan: string): string {
  const bersih = nomorWa(nomorTujuan);
  return `https://wa.me/${bersih}?text=${encodeURIComponent(pesan)}`;
}
