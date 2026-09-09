import { describe, it, expect } from "vitest";
import {
  EscposBuilder,
  bangunStrukEscpos,
  PERINTAH,
} from "../escpos";
import { formatNotaWhatsApp, buatTautanNotaWa } from "../nota-wa";
import type { Sale, InfoToko } from "../../types";

const mockToko: InfoToko = {
  nama: "Toko Sembako Berkah",
  alamat: "Jl. Merdeka No. 45",
  telepon: "081234567890",
  kakiStruk: "Barang yang sudah dibeli tidak dapat ditukar",
};

const mockSale: Sale = {
  id: "sale-123",
  receiptNumber: "KT-20260909-0001",
  cashierId: "user-1",
  cashierName: "Budi Santoso",
  customerId: "cust-1",
  customerName: "Pak RT Hendra",
  items: [
    {
      productId: "p1",
      name: "Beras Pandan Wangi 5kg",
      unit: "karung",
      qty: 1,
      price: 75000,
      total: 75000,
    },
    {
      productId: "p2",
      name: "Minyak Goreng 1L",
      unit: "pcs",
      qty: 2,
      price: 18000,
      total: 36000,
    },
  ],
  subtotal: 111000,
  discount: 1000,
  total: 110000,
  paymentMethod: "cash",
  amountPaid: 150000,
  changeAmount: 40000,
  status: "paid",
  createdAt: "2026-09-09T10:00:00.000Z",
};

describe("Driver Printer Thermal ESC/POS", () => {
  it("EscposBuilder dapat menyusun perintah dan teks secara berurutan", () => {
    const builder = new EscposBuilder();
    builder.teks("Halo Kasir").potong();
    const bytes = builder.build();

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(10);
    // Harus diawali dengan ESC @ (0x1b, 0x40)
    expect(bytes[0]).toBe(PERINTAH.RESET[0]);
    expect(bytes[1]).toBe(PERINTAH.RESET[1]);
  });

  it("bangunStrukEscpos menyusun struk belanja 58mm dengan pemotong kertas dan laci uang", () => {
    const bytes = bangunStrukEscpos(mockSale, mockToko, {
      lebarKarakter: 32,
      bukaLaci: true,
      potongKertas: true,
    });

    expect(bytes.length).toBeGreaterThan(100);

    // Decode teks untuk verifikasi isi
    const decoder = new TextDecoder("utf-8");
    const str = decoder.decode(bytes);

    expect(str).toContain("TOKO SEMBAKO BERKAH");
    expect(str).toContain("KT-20260909-0001");
    expect(str).toContain("Beras Pandan Wangi");
    expect(str).toContain("Minyak Goreng");
    expect(str).toContain("Rp 110.000");
    expect(str).toContain("Kembali");
  });

  it("formatNotaWhatsApp merapikan teks rincian belanja pelanggan", () => {
    const teks = formatNotaWhatsApp(mockSale, mockToko);

    expect(teks).toContain("*TOKO SEMBAKO BERKAH*");
    expect(teks).toContain("No. Struk");
    expect(teks).toContain("KT-20260909-0001");
    expect(teks).toContain("Beras Pandan Wangi 5kg");
    expect(teks).toContain("TOTAL");
    expect(teks).toContain("Rp 110.000");
  });

  it("buatTautanNotaWa menghasilkan URL wa.me yang valid dan dinormalisasi", () => {
    const url = buatTautanNotaWa("0812-3456-7890", "Halo belanjaan Anda");
    expect(url).toMatch(/^https:\/\/wa\.me\/6281234567890\?text=Halo%20belanjaan%20Anda/);
  });
});
