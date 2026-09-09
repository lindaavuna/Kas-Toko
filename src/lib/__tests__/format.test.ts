import { describe, expect, it } from "vitest";
import {
  formatRupiah,
  hitungDiskon,
  hitungKembalian,
  hitungSubtotal,
  hitungTotal,
  konversiKeSatuanDasar,
  nomorWa,
  parseInputUang,
  totalBaris,
  uangCukup,
} from "../format";

describe("Pemisah ribuan Rupiah Indonesia", () => {
  it("memformat angka bulat dengan titik ribuan", () => {
    expect(formatRupiah(25000)).toBe("Rp 25.000");
    expect(formatRupiah(1500000)).toBe("Rp 1.500.000");
    expect(formatRupiah(500)).toBe("Rp 500");
    expect(formatRupiah(0)).toBe("Rp 0");
  });

  it("menangani nilai negatif dan pecahan (dibulatkan)", () => {
    expect(formatRupiah(-49900)).toBe("-Rp 49.900");
    expect(formatRupiah(1999.6)).toBe("Rp 2.000");
  });

  it("parse input uang mengabaikan non-angka", () => {
    expect(parseInputUang("Rp 25.000")).toBe(25000);
    expect(parseInputUang("25000")).toBe(25000);
    expect(parseInputUang("abc")).toBe(0);
  });
});

describe("Kalkulasi keranjang & diskon", () => {
  const items = [
    { price: 62000, qty: 1 },
    { price: 19000, qty: 2 },
  ];

  it("subtotal menghitung qty x price", () => {
    expect(hitungSubtotal(items)).toBe(100000);
    expect(totalBaris(3000, 4)).toBe(12000);
  });

  it("diskon fixed rupiah", () => {
    expect(hitungDiskon(100000, 5000, "fixed")).toBe(5000);
  });

  it("diskon persentase", () => {
    expect(hitungDiskon(100000, 10, "percentage")).toBe(10000);
    expect(hitungDiskon(17500, 5, "percentage")).toBe(875);
  });

  it("diskon tidak boleh melebihi subtotal / negatif", () => {
    expect(hitungDiskon(50000, 80000, "fixed")).toBe(50000);
    expect(hitungDiskon(50000, -10, "fixed")).toBe(0);
  });

  it("total = subtotal - diskon", () => {
    expect(hitungTotal(100000, 10000)).toBe(90000);
    expect(hitungTotal(100000, 999999)).toBe(0);
  });
});

describe("Kalkulasi uang kembalian kasir", () => {
  it("kembalian positif saat uang lebih", () => {
    expect(hitungKembalian(100000, 91500)).toBe(8500);
  });

  it("uang pas = kembalian nol", () => {
    expect(hitungKembalian(62000, 62000)).toBe(0);
  });

  it("kembalian tidak pernah negatif saat uang kurang", () => {
    expect(hitungKembalian(50000, 62000)).toBe(0);
  });

  it("cek kecukupan uang", () => {
    expect(uangCukup(50000, 50000)).toBe(true);
    expect(uangCukup(49900, 50000)).toBe(false);
  });
});

describe("Konversi multi-satuan produk", () => {
  it("1 Dus @40 pcs = 40 pcs satuan dasar", () => {
    expect(konversiKeSatuanDasar(1, 40)).toBe(40);
    expect(konversiKeSatuanDasar(2.5, 40)).toBe(100);
  });

  it("1 Pack @12 = 12, satuan dasar faktor 1 tetap", () => {
    expect(konversiKeSatuanDasar(3, 12)).toBe(36);
    expect(konversiKeSatuanDasar(5, 1)).toBe(5);
  });
});

describe("Nomor WhatsApp untuk kirim nota", () => {
  it("mengubah 08xx menjadi 628xx", () => {
    expect(nomorWa("0812-3333-4444")).toBe("6281233334444");
    expect(nomorWa("8123456")).toBe("628123456");
    expect(nomorWa(undefined)).toBe("");
  });
});
