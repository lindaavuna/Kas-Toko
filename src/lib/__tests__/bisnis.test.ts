import { describe, expect, it } from "vitest";
import { usePosStore } from "../stores/pos-store";
import { useSesiStore } from "../stores/sesi-store";
import { AKUN } from "../dummy-data";

function reset() {
  usePosStore.setState(usePosStore.getInitialState());
  useSesiStore.setState({ user: null });
}

describe("Login dummy & peran", () => {
  it("pemilik login dengan email + password benar", () => {
    reset();
    const hasil = useSesiStore.getState().loginPemilik("budi@tokoberkah.id", "rahasia");
    expect(hasil.ok).toBe(true);
    expect(useSesiStore.getState().user?.role).toBe("owner");
  });

  it("kasir login dengan PIN benar", () => {
    reset();
    const hasil = useSesiStore.getState().loginKasir("siti@tokoberkah.id", "1234");
    expect(hasil.ok).toBe(true);
    expect(useSesiStore.getState().user?.role).toBe("cashier");
  });

  it("PIN salah ditolak", () => {
    reset();
    expect(useSesiStore.getState().loginKasir("siti@tokoberkah.id", "9999").ok).toBe(false);
    expect(useSesiStore.getState().user).toBeNull();
  });
});

describe("Buka / Tutup Kasir", () => {
  it("buka shift lalu tutup: kas seharusnya & selisih tercatat", () => {
    reset();
    const owner = AKUN.owner.user;
    expect(usePosStore.getState().bukaShift(150000, owner).ok).toBe(true);
    expect(usePosStore.getState().shift?.startingCash).toBe(150000);
    expect(usePosStore.getState().bukaShift(10000, owner).ok).toBe(false);

    // transaksi tunai 100.000, bayar pas
    usePosStore.getState().catatPenjualan(
      {
        items: [
          { productId: "p-gula", name: "Gula Pasir 1Kg", unit: "pcs", qty: 2, price: 17500, total: 35000 },
          { productId: "p-kopi", name: "Kopi Sachet", unit: "pcs", qty: 10, price: 2000, total: 20000 },
          { productId: "p-air", name: "Air Mineral 600ml", unit: "pcs", qty: 13, price: 3500, total: 45000 },
        ],
        subtotal: 100000,
        discount: 0,
        total: 100000,
        metode: "cash",
        uangDiterima: 100000,
      },
      owner
    );
    // pengeluaran kas 50.000
    usePosStore.getState().catatPengeluaran("Beli token listrik toko", 50000, owner);

    // seharusnya = 150.000 + 100.000 - 50.000 = 200.000
    const hasil = usePosStore.getState().tutupShift(200000);
    expect(hasil.ok).toBe(true);
    expect(hasil.hasil?.seharusnya).toBe(200000);
    expect(hasil.hasil?.status).toBe("seimbang");
    expect(usePosStore.getState().shift).toBeNull();
    expect(usePosStore.getState().shiftHistory[0]?.difference).toBe(0);
  });
});

describe("Engine penjualan (stok, kasbon, void PIN)", () => {
  it("transaksi lunas memotong stok & mencatat mutasi keluar", () => {
    reset();
    const owner = AKUN.owner.user;
    const sebelum = usePosStore.getState().products.find((p) => p.id === "p-gula")!.stockQty;
    const sale = usePosStore.getState().catatPenjualan(
      {
        items: [{ productId: "p-gula", name: "Gula Pasir 1Kg", unit: "pcs", qty: 5, price: 17500, total: 87500 }],
        subtotal: 87500,
        discount: 0,
        total: 87500,
        metode: "cash",
        uangDiterima: 100000,
      },
      owner
    );
    const sesudah = usePosStore.getState().products.find((p) => p.id === "p-gula")!.stockQty;
    expect(sesudah).toBe(sebelum - 5);
    expect(sale.changeAmount).toBe(12500);
    expect(usePosStore.getState().mutations[0]).toMatchObject({ type: "out", reason: "sale", qty: 5 });
  });

  it("penjualan kasbon membuat piutang di buku kasbon", () => {
    reset();
    const owner = AKUN.owner.user;
    usePosStore.getState().catatPenjualan(
      {
        items: [{ productId: "p-beras", name: "Beras Premium 5Kg", unit: "pcs", qty: 1, price: 62000, total: 62000 }],
        subtotal: 62000,
        discount: 0,
        total: 62000,
        metode: "credit",
        uangDiterima: 0,
        customerId: "c-buani",
        customerName: "Bu Ani",
      },
      owner
    );
    const rc = usePosStore.getState().receivables[0];
    expect(rc.customerName).toBe("Bu Ani");
    expect(rc.status).toBe("unpaid");
    expect(rc.originalAmount).toBe(62000);
  });

  it("void butuh PIN pemilik; salah PIN ditolak, benar PIN mengembalikan stok", () => {
    reset();
    const owner = AKUN.owner.user;
    const sale = usePosStore.getState().catatPenjualan(
      {
        items: [{ productId: "p-sabun", name: "Sabun Mandi 240ml", unit: "pcs", qty: 3, price: 4500, total: 13500 }],
        subtotal: 13500,
        discount: 0,
        total: 13500,
        metode: "cash",
        uangDiterima: 15000,
      },
      owner
    );
    expect(usePosStore.getState().batalkanPenjualan(sale.id, "salah", "0000").ok).toBe(false);
    const hasil = usePosStore.getState().batalkanPenjualan(sale.id, "salah input", AKUN.owner.pin);
    expect(hasil.ok).toBe(true);
    const saleVoid = usePosStore.getState().sales.find((s) => s.id === sale.id);
    expect(saleVoid?.status).toBe("void");
    const stok = usePosStore.getState().products.find((p) => p.id === "p-sabun")!.stockQty;
    expect(stok).toBe(35); // seed 35, keluar 3 lalu kembali 3
  });
});

describe("Manajemen produk & stok (data Toko Berkah Jaya)", () => {
  it("produk baru otomatis dibuatkan SKU, barcode opsional", () => {
    reset();
    const p = usePosStore.getState().tambahProduk({ name: "Kerupuk Udang", sellingPrice: 5000, stockQty: 30 });
    expect(p.sku).toMatch(/^KER-\d{4}$/);
    expect(p.barcode).toBeUndefined();
  });

  it("catat barang masuk & keluar memvalidasi stok", () => {
    reset();
    const owner = AKUN.owner.user;
    const target = usePosStore.getState().products.find((p) => p.id === "p-gula")!;
    usePosStore.getState().catatBarangMasuk("p-gula", 10, "kulakan", owner);
    expect(usePosStore.getState().products.find((p) => p.id === "p-gula")!.stockQty).toBe(target.stockQty + 10);
    const gagal = usePosStore.getState().catatBarangKeluar("p-gula", 9999, "damage", "", owner);
    expect(gagal.ok).toBe(false);
    const oke = usePosStore.getState().catatBarangKeluar("p-gula", 3, "damage", "sobek", owner);
    expect(oke.ok).toBe(true);
  });
});
