import { beforeEach, describe, expect, it } from "vitest";
import { useKeranjangStore } from "../stores/keranjang-store";
import type { Product } from "../types";

const beras: Product = {
  id: "p-beras",
  name: "Beras Premium 5Kg",
  sku: "BRS-0001",
  unit: "pcs",
  purchasePrice: 55000,
  sellingPrice: 62000,
  stockQty: 40,
  minStock: 10,
  emoji: "🍚",
  isActive: true,
};

const indomie: Product = {
  id: "p-indomie",
  name: "Indomie Goreng",
  sku: "DIM-0001",
  unit: "pcs",
  purchasePrice: 2400,
  sellingPrice: 3000,
  stockQty: 200,
  minStock: 40,
  emoji: "🍜",
  units: [
    { unitName: "Pcs", conversionFactor: 1, sellingPrice: 3000 },
    { unitName: "Dus", conversionFactor: 40, sellingPrice: 108000 },
  ],
  isActive: true,
};

function ambil() {
  return useKeranjangStore.getState();
}

describe("State keranjang belanja Zustand", () => {
  beforeEach(() => {
    useKeranjangStore.setState({ items: [], diskonNilai: 0, diskonTipe: "fixed" });
  });

  it("menambah produk membuat satu baris keranjang", () => {
    ambil().tambahProduk(beras);
    expect(ambil().items).toHaveLength(1);
    expect(ambil().items[0]).toMatchObject({ productId: "p-beras", qty: 1, price: 62000 });
  });

  it("menambah produk sama menggabungkan qty dalam satu baris", () => {
    ambil().tambahProduk(beras);
    ambil().tambahProduk(beras, 2);
    expect(ambil().items).toHaveLength(1);
    expect(ambil().items[0].qty).toBe(3);
  });

  it("satuan berbeda menjadi baris berbeda", () => {
    ambil().tambahProduk(indomie);
    ambil().tambahProduk(indomie, 1, indomie.units![1]);
    expect(ambil().items).toHaveLength(2);
    const dus = ambil().items.find((i) => i.unit === "Dus");
    expect(dus?.price).toBe(108000);
  });

  it("ubahQty menambah/mengurangi, qty 0 menghapus baris", () => {
    ambil().tambahProduk(beras);
    ambil().ubahQty("p-beras", "pcs", 4);
    expect(ambil().items[0].qty).toBe(5);
    ambil().ubahQty("p-beras", "pcs", -3);
    expect(ambil().items[0].qty).toBe(2);
    ambil().ubahQty("p-beras", "pcs", -2);
    expect(ambil().items).toHaveLength(0);
  });

  it("hapusItem & kosongkan bekerja", () => {
    ambil().tambahProduk(beras);
    ambil().tambahProduk(indomie);
    ambil().hapusItem("p-indomie", "pcs");
    expect(ambil().items.map((i) => i.productId)).toEqual(["p-beras"]);
    ambil().kosongkan();
    expect(ambil().items).toHaveLength(0);
  });

  it("setDiskon menolak nilai negatif", () => {
    ambil().setDiskon(-5000, "fixed");
    expect(ambil().diskonNilai).toBe(0);
    ambil().setDiskon(10, "percentage");
    expect(ambil().diskonTipe).toBe("percentage");
  });
});
