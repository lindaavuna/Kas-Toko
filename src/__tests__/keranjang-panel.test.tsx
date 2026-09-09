import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { KeranjangPanel } from "@/components/pos/keranjang-panel";
import { useKeranjangStore } from "@/lib/stores/keranjang-store";
import type { Product } from "@/lib/types";

const minyak: Product = {
  id: "p-minyak",
  name: "Minyak Goreng 1L",
  sku: "MNY-0001",
  unit: "pcs",
  purchasePrice: 16500,
  sellingPrice: 19000,
  stockQty: 10,
  minStock: 5,
  emoji: "🛢️",
  isActive: true,
};

beforeEach(() => {
  useKeranjangStore.setState({ items: [], diskonNilai: 0, diskonTipe: "fixed" });
});

describe("Panel Keranjang (render React)", () => {
  it("tampil kosong saat belum ada barang", () => {
    render(<KeranjangPanel compact />);
    expect(screen.getByText(/Keranjang masih kosong/i)).toBeInTheDocument();
  });

  it("menampilkan subtotal & total setelah barang ditambah", () => {
    useKeranjangStore.getState().tambahProduk(minyak, 2);
    render(<KeranjangPanel compact />);
    expect(screen.getByText("Minyak Goreng 1L")).toBeInTheDocument();
    // 2 x 19.000 = 38.000 (muncul di baris item & subtotal)
    expect(screen.getAllByText("Rp 38.000").length).toBeGreaterThanOrEqual(2);
  });

  it("total ikut berkurang saat diskon persentase dipasang", () => {
    useKeranjangStore.getState().tambahProduk(minyak, 2); // 38.000
    useKeranjangStore.getState().setDiskon(10, "percentage"); // -3.800 => 34.200
    render(<KeranjangPanel compact />);
    expect(screen.getByText("Rp 34.200")).toBeInTheDocument();
  });

  it("tombol Bayar tampil sebagai aksi utama", () => {
    useKeranjangStore.getState().tambahProduk(minyak, 1);
    render(<KeranjangPanel compact />);
    expect(screen.getByRole("button", { name: /Bayar/i })).toBeEnabled();
  });
});
