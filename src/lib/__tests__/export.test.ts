import { describe, expect, it } from "vitest";
import { bangunCsv, formatSelCsv } from "../export";

describe("formatSelCsv", () => {
  it("mengembalikan string kosong untuk null dan undefined", () => {
    expect(formatSelCsv(null)).toBe("");
    expect(formatSelCsv(undefined)).toBe("");
  });

  it("tidak membungkus teks sederhana tanpa karakter khusus", () => {
    expect(formatSelCsv("Beras Premium")).toBe("Beras Premium");
    expect(formatSelCsv(15000)).toBe("15000");
  });

  it("membungkus kutip jika mengandung koma", () => {
    expect(formatSelCsv("Beras, Gula, Minyak")).toBe('"Beras, Gula, Minyak"');
  });

  it("meloloskan kutip ganda di dalam teks", () => {
    expect(formatSelCsv('Kopi "Mantap" Saset')).toBe('"Kopi ""Mantap"" Saset"');
  });

  it("membungkus teks dengan newline", () => {
    expect(formatSelCsv("Baris 1\nBaris 2")).toBe('"Baris 1\nBaris 2"');
  });
});

describe("bangunCsv", () => {
  it("menghasilkan CSV UTF-8 dengan BOM (\\uFEFF) untuk kompatibilitas Excel", () => {
    const kolom = ["Waktu", "Keterangan", "Masuk"];
    const baris = [
      ["2026-09-09 10:00", "Penjualan STR-001", 50000],
      ["2026-09-09 11:00", "Beli ATK, Kertas Struk", 12000],
    ];

    const hasil = bangunCsv(kolom, baris);
    expect(hasil.startsWith("\uFEFF")).toBe(true);
    expect(hasil).toContain("Waktu,Keterangan,Masuk");
    expect(hasil).toContain('11:00,"Beli ATK, Kertas Struk",12000');
  });
});
