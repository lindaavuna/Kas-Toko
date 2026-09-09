import { offlineDb, type TransaksiOffline } from "./db";
import type { Product, Customer, CartItem, PaymentMethod, Sale } from "../types";

/**
 * Menyimpan katalog produk & pelanggan ke IndexedDB lokal untuk penggunaan offline
 */
export async function cacheKatalogOffline(
  products: Product[],
  customers: Customer[]
): Promise<void> {
  if (!offlineDb) return;
  try {
    await offlineDb.transaction("rw", [offlineDb.products, offlineDb.customers], async () => {
      await offlineDb.products.clear();
      await offlineDb.products.bulkPut(products);

      await offlineDb.customers.clear();
      await offlineDb.customers.bulkPut(customers);
    });
  } catch (err) {
    console.warn("Gagal memperbarui cache offline:", err);
  }
}

/**
 * Mengambil produk dari cache IndexedDB saat koneksi terputus
 */
export async function ambilProdukOffline(): Promise<Product[]> {
  if (!offlineDb) return [];
  try {
    return await offlineDb.products.toArray();
  } catch {
    return [];
  }
}

/**
 * Mengambil pelanggan dari cache IndexedDB saat offline
 */
export async function ambilPelangganOffline(): Promise<Customer[]> {
  if (!offlineDb) return [];
  try {
    return await offlineDb.customers.toArray();
  } catch {
    return [];
  }
}

export interface InputPenjualanOffline {
  storeId: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeAmount: number;
  transferRef?: string;
}

/**
 * Menyimpan transaksi kasir ke IndexedDB saat offline dan mengembalikan objek Sale
 */
export async function simpanPenjualanOffline(
  input: InputPenjualanOffline
): Promise<Sale> {
  if (!offlineDb) {
    throw new Error("IndexedDB tidak tersedia di lingkungan ini");
  }

  const sekarang = new Date();
  const tglStr = sekarang.toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  const localId = `off_${Date.now()}_${randomStr}`;
  const receiptNumber = `OFF-${tglStr}-${randomStr}`;

  const transaksi: TransaksiOffline = {
    localId,
    storeId: input.storeId,
    cashierId: input.cashierId,
    cashierName: input.cashierName,
    customerId: input.customerId,
    customerName: input.customerName,
    items: input.items,
    subtotal: input.subtotal,
    discount: input.discount,
    total: input.total,
    paymentMethod: input.paymentMethod,
    amountPaid: input.amountPaid,
    changeAmount: input.changeAmount,
    transferRef: input.transferRef,
    receiptNumber,
    createdAt: sekarang.toISOString(),
    synced: false,
  };

  await offlineDb.transaction("rw", [offlineDb.offline_sales, offlineDb.products], async () => {
    // 1. Simpan ke antrean outbox
    await offlineDb.offline_sales.put(transaksi);

    // 2. Kurangi stok lokal di cache IndexedDB agar kasir melihat stok terbaru
    for (const item of input.items) {
      const prod = await offlineDb.products.get(item.productId);
      if (prod) {
        const stokBaru = Math.max(0, prod.stockQty - item.qty);
        await offlineDb.products.update(item.productId, { stockQty: stokBaru });
      }
    }
  });

  const sale: Sale = {
    id: localId,
    receiptNumber,
    cashierId: input.cashierId,
    cashierName: input.cashierName,
    customerId: input.customerId,
    customerName: input.customerName,
    items: input.items.map((i) => ({
      productId: i.productId,
      name: i.name,
      unit: i.unit,
      qty: i.qty,
      price: i.price,
      total: i.total,
    })),
    subtotal: input.subtotal,
    discount: input.discount,
    total: input.total,
    paymentMethod: input.paymentMethod,
    amountPaid: input.amountPaid,
    changeAmount: input.changeAmount,
    transferRef: input.transferRef,
    status: input.paymentMethod === "credit" ? "credit" : "paid",
    createdAt: sekarang.toISOString(),
  };

  return sale;
}

/**
 * Menghitung jumlah transaksi offline yang belum tersinkronisasi
 */
export async function hitungAntreanOffline(): Promise<number> {
  if (!offlineDb) return 0;
  try {
    return await offlineDb.offline_sales.where("synced").equals(0).or("synced").equals(false as unknown as number).count();
  } catch {
    return 0;
  }
}

export interface HasilSinkronisasi {
  total: number;
  sukses: number;
  gagal: number;
  pesan: string;
}

/**
 * Mengirim seluruh antrean transaksi offline ke server saat online
 */
export async function sinkronkanAntreanOffline(): Promise<HasilSinkronisasi> {
  if (!offlineDb) {
    return { total: 0, sukses: 0, gagal: 0, pesan: "IndexedDB tidak aktif" };
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { total: 0, sukses: 0, gagal: 0, pesan: "Perangkat sedang offline" };
  }

  // Ambil semua transaksi yang belum tersinkron
  const antrean = await offlineDb.offline_sales
    .filter((tx) => !tx.synced)
    .toArray();

  if (antrean.length === 0) {
    return { total: 0, sukses: 0, gagal: 0, pesan: "Semua transaksi sudah tersinkron" };
  }

  try {
    const res = await fetch("/api/offline/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sales: antrean }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        total: antrean.length,
        sukses: 0,
        gagal: antrean.length,
        pesan: `Server menolak sinkronisasi: ${res.status} ${errText}`,
      };
    }

    const hasil = (await res.json()) as {
      suksesCount: number;
      gagalCount: number;
      results: { localId: string; sukses: boolean; error?: string }[];
    };

    // Update status di Dexie
    await offlineDb.transaction("rw", [offlineDb.offline_sales, offlineDb.sync_logs], async () => {
      for (const r of hasil.results) {
        if (r.sukses) {
          await offlineDb.offline_sales.update(r.localId, { synced: true, syncError: undefined });
        } else {
          await offlineDb.offline_sales.update(r.localId, { syncError: r.error });
        }
      }

      await offlineDb.sync_logs.add({
        waktu: new Date().toISOString(),
        totalDiproses: antrean.length,
        totalSukses: hasil.suksesCount,
        totalGagal: hasil.gagalCount,
        pesan: `Sinkronisasi selesai: ${hasil.suksesCount} berhasil, ${hasil.gagalCount} gagal`,
      });
    });

    return {
      total: antrean.length,
      sukses: hasil.suksesCount,
      gagal: hasil.gagalCount,
      pesan: `Sinkronisasi berhasil: ${hasil.suksesCount} transaksi terunggah ke server`,
    };
  } catch (err: unknown) {
    const pesan = err instanceof Error ? err.message : String(err);
    return {
      total: antrean.length,
      sukses: 0,
      gagal: antrean.length,
      pesan: `Gagal sinkronisasi: ${pesan}`,
    };
  }
}
