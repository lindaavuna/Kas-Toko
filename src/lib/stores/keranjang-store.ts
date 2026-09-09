"use client";

import { create } from "zustand";
import type { CartLine, Product, ProductUnit } from "@/lib/types";

export interface KeranjangState {
  items: CartLine[];
  diskonNilai: number;
  diskonTipe: "fixed" | "percentage";
  tambahProduk: (produk: Product, qty?: number, satuan?: ProductUnit) => void;
  ubahQty: (productId: string, unit: string, delta: number) => void;
  hapusItem: (productId: string, unit: string) => void;
  kosongkan: () => void;
  setDiskon: (nilai: number, tipe: "fixed" | "percentage") => void;
}

export const useKeranjangStore = create<KeranjangState>((set) => ({
  items: [],
  diskonNilai: 0,
  diskonTipe: "fixed",

  tambahProduk: (produk, qty = 1, satuan) =>
    set((state) => {
      const unit = satuan?.unitName ?? produk.unit;
      const harga = satuan?.sellingPrice ?? produk.sellingPrice;
      const indeks = state.items.findIndex(
        (baris) => baris.productId === produk.id && baris.unit === unit
      );
      if (indeks >= 0) {
        const items = [...state.items];
        items[indeks] = { ...items[indeks], qty: items[indeks].qty + qty };
        return { items };
      }
      const baris: CartLine = {
        productId: produk.id,
        name: produk.name,
        unit,
        price: harga,
        qty,
        emoji: produk.emoji,
      };
      return { items: [...state.items, baris] };
    }),

  ubahQty: (productId, unit, delta) =>
    set((state) => ({
      items: state.items
        .map((baris) =>
          baris.productId === productId && baris.unit === unit
            ? { ...baris, qty: Math.max(baris.qty + delta, 0) }
            : baris
        )
        .filter((baris) => baris.qty > 0),
    })),

  hapusItem: (productId, unit) =>
    set((state) => ({
      items: state.items.filter(
        (baris) => !(baris.productId === productId && baris.unit === unit)
      ),
    })),

  kosongkan: () => set({ items: [], diskonNilai: 0, diskonTipe: "fixed" }),

  setDiskon: (nilai, tipe) => set({ diskonNilai: Math.max(nilai, 0), diskonTipe: tipe }),
}));
