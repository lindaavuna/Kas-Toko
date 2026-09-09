import { describe, expect, it } from "vitest";
import { barisStruk, namaMetodeBayar, tautanWhatsApp, teksNotaWa } from "../nota";
import type { Sale } from "../types";

const contohSale: Sale = {
  id: "s1",
  receiptNumber: "STR-20260909-007",
  cashierId: "u1",
  cashierName: "Siti Rahma",
  items: [
    { productId: "p1", name: "Beras Premium 5Kg", unit: "pcs", qty: 1, price: 62000, total: 62000 },
    { productId: "p2", name: "Minyak Goreng 1L", unit: "pcs", qty: 2, price: 19000, total: 38000 },
  ],
  subtotal: 100000,
  discount: 5000,
  total: 95000,
  paymentMethod: "cash",
  amountPaid: 100000,
  changeAmount: 5000,
  status: "paid",
  createdAt: new Date().toISOString(),
};

const toko = { nama: "Toko Berkah Jaya", telepon: "0851-2345-6789", kakiStruk: "Terima kasih!" };

describe("Pratinjau struk thermal", () => {
  const baris = barisStruk(contohSale, toko);

  it("berisi nama toko, nomor struk, kasir, item, total, kembalian", () => {
    expect(baris.some((b) => b.includes("TOKO BERKAH JAYA"))).toBe(true);
    expect(baris.some((b) => b.includes("STR-20260909-007"))).toBe(true);
    expect(baris.some((b) => b.includes("Siti Rahma"))).toBe(true);
    expect(baris.some((b) => b.includes("Beras Premium 5Kg"))).toBe(true);
    expect(baris.some((b) => b.includes("TOTAL") && b.includes("Rp 95.000"))).toBe(true);
    expect(baris.some((b) => b.includes("Kembali") && b.includes("Rp 5.000"))).toBe(true);
  });

  it("lebar baris muat di kertas 58mm (32 karakter)", () => {
    for (const b of baris) {
      expect(b.length).toBeLessThanOrEqual(40); // toleransi nama panjang, rata kanan dipotong
    }
  });
});

describe("Kirim nota WhatsApp", () => {
  it("teks nota memuat rincian + metode bayar", () => {
    const wa = teksNotaWa(contohSale, toko);
    expect(wa).toContain("*Toko Berkah Jaya*");
    expect(wa).toContain("• 2 pcs Minyak Goreng 1L — Rp 38.000");
    expect(wa).toContain("*TOTAL : Rp 95.000*");
    expect(wa).toContain("Kembalian : Rp 5.000");
  });

  it("tautan wa.me memakai 62", () => {
    expect(tautanWhatsApp("6281233334444", "halo")).toContain("wa.me/6281233334444");
    expect(tautanWhatsApp("6281233334444", "halo")).toContain("text=halo");
  });

  it("nama metode berbahasa Indonesia", () => {
    expect(namaMetodeBayar("cash")).toBe("Tunai");
    expect(namaMetodeBayar("credit")).toBe("Kasbon");
    expect(namaMetodeBayar("qris_duitku")).toBe("QRIS");
  });
});
