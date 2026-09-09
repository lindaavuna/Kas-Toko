import type { Sale, InfoToko } from "../types";
import { formatRupiah, formatWaktu } from "../format";

export const PERINTAH = {
  RESET: new Uint8Array([0x1b, 0x40]), // ESC @
  ALIGN_KIRI: new Uint8Array([0x1b, 0x61, 0x00]), // ESC a 0
  ALIGN_TENGAH: new Uint8Array([0x1b, 0x61, 0x01]), // ESC a 1
  ALIGN_KANAN: new Uint8Array([0x1b, 0x61, 0x02]), // ESC a 2
  TEBAL_ON: new Uint8Array([0x1b, 0x45, 0x01]), // ESC E 1
  TEBAL_OFF: new Uint8Array([0x1b, 0x45, 0x00]), // ESC E 0
  UKURAN_NORMAL: new Uint8Array([0x1d, 0x21, 0x00]), // GS ! 0
  UKURAN_BESAR: new Uint8Array([0x1d, 0x21, 0x11]), // GS ! 17 (Double width & height)
  UKURAN_TINGGI: new Uint8Array([0x1d, 0x21, 0x01]), // GS ! 1 (Double height)
  FEED_3: new Uint8Array([0x1b, 0x64, 0x03]), // ESC d 3
  POTONG_KERTAS: new Uint8Array([0x1d, 0x56, 0x42, 0x00]), // GS V 66 0 (Cut with feed)
  BUKA_LACI: new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]), // ESC p 0 25 250 (Pulse cash drawer)
};

export class EscposBuilder {
  private chunks: Uint8Array[] = [];
  private encoder = new TextEncoder();

  constructor() {
    this.tambah(PERINTAH.RESET);
  }

  tambah(bytes: Uint8Array): this {
    this.chunks.push(bytes);
    return this;
  }

  teks(str: string): this {
    this.chunks.push(this.encoder.encode(str));
    return this;
  }

  baris(str = ""): this {
    this.teks(str + "\n");
    return this;
  }

  align(arah: "kiri" | "tengah" | "kanan"): this {
    if (arah === "tengah") this.tambah(PERINTAH.ALIGN_TENGAH);
    else if (arah === "kanan") this.tambah(PERINTAH.ALIGN_KANAN);
    else this.tambah(PERINTAH.ALIGN_KIRI);
    return this;
  }

  tebal(aktif: boolean): this {
    this.tambah(aktif ? PERINTAH.TEBAL_ON : PERINTAH.TEBAL_OFF);
    return this;
  }

  ukuran(tipe: "normal" | "besar" | "tinggi"): this {
    if (tipe === "besar") this.tambah(PERINTAH.UKURAN_BESAR);
    else if (tipe === "tinggi") this.tambah(PERINTAH.UKURAN_TINGGI);
    else this.tambah(PERINTAH.UKURAN_NORMAL);
    return this;
  }

  garisPemisah(lebar: number): this {
    this.align("kiri");
    this.baris("-".repeat(lebar));
    return this;
  }

  duaKolom(kiri: string, kanan: string, lebar: number): this {
    this.align("kiri");
    const sisa = lebar - kiri.length - kanan.length;
    if (sisa > 0) {
      this.baris(kiri + " ".repeat(sisa) + kanan);
    } else {
      this.baris(kiri);
      this.align("kanan");
      this.baris(kanan);
    }
    return this;
  }

  bukaLaci(): this {
    this.tambah(PERINTAH.BUKA_LACI);
    return this;
  }

  potong(): this {
    this.tambah(PERINTAH.FEED_3);
    this.tambah(PERINTAH.POTONG_KERTAS);
    return this;
  }

  build(): Uint8Array {
    let totalPanjang = 0;
    for (const c of this.chunks) totalPanjang += c.length;
    const hasil = new Uint8Array(totalPanjang);
    let offset = 0;
    for (const c of this.chunks) {
      hasil.set(c, offset);
      offset += c.length;
    }
    return hasil;
  }
}

export interface OpsiStrukEscpos {
  lebarKarakter?: 32 | 48; // 32 utk 58mm, 48 utk 80mm
  bukaLaci?: boolean;
  potongKertas?: boolean;
}

export function bangunStrukEscpos(
  sale: Sale,
  toko: InfoToko,
  opsi: OpsiStrukEscpos = {}
): Uint8Array {
  const lebar = opsi.lebarKarakter ?? 32;
  const builder = new EscposBuilder();

  if (opsi.bukaLaci && sale.paymentMethod === "cash") {
    builder.bukaLaci();
  }

  // Header Toko
  builder.align("tengah").tebal(true).ukuran("tinggi").baris(toko.nama.toUpperCase());
  builder.ukuran("normal").tebal(false);
  if (toko.alamat) builder.baris(toko.alamat);
  if (toko.telepon) builder.baris(`Telp: ${toko.telepon}`);

  // Info Transaksi
  builder.garisPemisah(lebar);
  builder.duaKolom(`No: ${sale.receiptNumber}`, "", lebar);
  builder.duaKolom(`Tgl: ${formatWaktu(sale.createdAt)}`, "", lebar);
  builder.duaKolom(`Kasir: ${sale.cashierName}`, "", lebar);
  if (sale.customerName) {
    builder.duaKolom(`Plg: ${sale.customerName}`, "", lebar);
  }
  builder.garisPemisah(lebar);

  // Item Belanja
  for (const item of sale.items) {
    builder.align("kiri").baris(item.name);
    const rincian = `  ${item.qty} ${item.unit} x ${formatRupiah(item.price)}`;
    const subtotal = formatRupiah(item.total);
    builder.duaKolom(rincian, subtotal, lebar);
  }

  // Total & Pembayaran
  builder.garisPemisah(lebar);
  builder.duaKolom("Subtotal", formatRupiah(sale.subtotal), lebar);
  if (sale.discount > 0) {
    builder.duaKolom("Diskon", `-${formatRupiah(sale.discount)}`, lebar);
  }
  builder.tebal(true).duaKolom("TOTAL", formatRupiah(sale.total), lebar).tebal(false);

  if (sale.paymentMethod === "cash") {
    builder.duaKolom("Tunai", formatRupiah(sale.amountPaid), lebar);
    builder.duaKolom("Kembali", formatRupiah(sale.changeAmount), lebar);
  } else if (sale.paymentMethod === "credit") {
    builder.duaKolom("Metode", "KASBON", lebar);
  } else {
    builder.duaKolom("Metode", "NON-TUNAI", lebar);
    if (sale.transferRef) {
      builder.duaKolom("Ref", sale.transferRef, lebar);
    }
  }

  // Footer & Kaki Struk
  builder.garisPemisah(lebar);
  if (toko.kakiStruk) {
    builder.align("tengah").baris(toko.kakiStruk);
  }
  builder.align("tengah").baris("Terima Kasih atas Kunjungan Anda");

  if (opsi.potongKertas !== false) {
    builder.potong();
  }

  return builder.build();
}
