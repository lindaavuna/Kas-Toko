"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  AKUN,
  HUTANG_AWAL,
  KASBON_AWAL,
  KATEGORI,
  MUTASI_AWAL,
  NOTIFIKASI_AWAL,
  PELANGGAN,
  PENGELUARAN_AWAL,
  PENJUALAN_AWAL,
  PRODUK,
  PEMBELIAN_AWAL,
  SUPPLIER,
  AKUN_KASIR,
  uid,
} from "@/lib/dummy-data";
import { hitungKembalian } from "@/lib/format";
import { kasSeharusnya, rekonsiliasiKas } from "@/lib/kas";
import type {
  AppNotification,
  CashierAccount,
  Category,
  Customer,
  Expense,
  Payable,
  PaymentMethod,
  Product,
  Purchase,
  Receivable,
  Sale,
  SaleItem,
  SessionUser,
  Shift,
  StockMutation,
  Supplier,
} from "@/lib/types";

function setelah(iso: string, batas: string): boolean {
  return new Date(iso).getTime() >= new Date(batas).getTime();
}

export interface InputPenjualan {
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  metode: PaymentMethod;
  uangDiterima: number;
  customerId?: string;
  customerName?: string;
  transferRef?: string;
}

interface PosDataState {
  products: Product[];
  categories: Category[];
  customers: Customer[];
  suppliers: Supplier[];
  cashierAccounts: CashierAccount[];
  sales: Sale[];
  shift: Shift | null;
  shiftHistory: Shift[];
  expenses: Expense[];
  mutations: StockMutation[];
  purchases: Purchase[];
  receivables: Receivable[];
  payables: Payable[];
  notifications: AppNotification[];
  nomorUrutStruk: number;

  bukaShift: (modalAwal: number, user: SessionUser) => { ok: boolean; pesan: string };
  tutupShift: (uangFisik: number) => {
    ok: boolean;
    pesan: string;
    hasil?: ReturnType<typeof rekonsiliasiKas>;
    shift?: Shift;
  };
  catatPenjualan: (input: InputPenjualan, user: SessionUser) => Sale;
  batalkanPenjualan: (saleId: string, alasan: string, pinPemilik: string) => { ok: boolean; pesan: string };

  tambahProduk: (data: Partial<Product>) => Product;
  ubahProduk: (id: string, data: Partial<Product>) => void;
  toggleProdukAktif: (id: string) => void;
  tambahKategori: (nama: string) => void;

  catatBarangMasuk: (productId: string, qty: number, catatan: string, user: SessionUser) => void;
  catatBarangKeluar: (
    productId: string,
    qty: number,
    reason: "damage" | "adjustment",
    catatan: string,
    user: SessionUser
  ) => { ok: boolean; pesan: string };

  catatPengeluaran: (title: string, amount: number, user: SessionUser, category?: string) => void;
  tambahPelanggan: (nama: string, telepon?: string) => Customer;
  tambahSupplier: (nama: string, telepon?: string) => Supplier;

  catatPembelian: (
    supplierId: string,
    items: { productId: string; qty: number; unitCost: number }[],
    status: "paid" | "credit",
    user: SessionUser
  ) => { ok: boolean; pesan: string; invoice?: string };
  bayarHutangSupplier: (payableId: string, amount: number, user: SessionUser) => void;

  terimaPembayaranKasbon: (receivableId: string, amount: number, user: SessionUser) => void;

  tambahKasirAkun: (nama: string, email: string, pin: string) => { ok: boolean; pesan: string };
  toggleKasirAkun: (id: string) => void;

  tandaiNotifDibaca: () => void;
}

function buatNotif(
  type: AppNotification["type"],
  title: string,
  message: string
): AppNotification {
  return { id: uid("nt"), type, title, message, isRead: false, createdAt: new Date().toISOString() };
}

export const usePosStore = create<PosDataState>()(
  persist(
    (set, get) => ({
  products: PRODUK.map((p) => ({ ...p })),
  categories: [...KATEGORI],
  customers: [...PELANGGAN],
  suppliers: [...SUPPLIER],
  cashierAccounts: [...AKUN_KASIR],
  sales: [...PENJUALAN_AWAL],
  shift: null,
  shiftHistory: [],
  expenses: [...PENGELUARAN_AWAL],
  mutations: [...MUTASI_AWAL],
  purchases: [...PEMBELIAN_AWAL],
  receivables: [...KASBON_AWAL],
  payables: [...HUTANG_AWAL],
  notifications: [...NOTIFIKASI_AWAL],
  nomorUrutStruk: 5,

  bukaShift: (modalAwal, user) => {
    if (get().shift) return { ok: false, pesan: "Kasir sudah dibuka. Tutup dulu sebelum buka baru." };
    const shift: Shift = {
      id: uid("shift"),
      cashierId: user.id,
      cashierName: user.name,
      openedAt: new Date().toISOString(),
      startingCash: Math.max(modalAwal, 0),
      status: "open",
    };
    set({ shift });
    return { ok: true, pesan: "Kasir dibuka. Semoga hari ini laris!" };
  },

  tutupShift: (uangFisik) => {
    const state = get();
    const shift = state.shift;
    if (!shift) return { ok: false, pesan: "Tidak ada shift kasir yang sedang buka." };

    const penjualanTunai = state.sales
      .filter(
        (s) =>
          s.status === "paid" &&
          s.paymentMethod === "cash" &&
          s.cashierId === shift.cashierId &&
          setelah(s.createdAt, shift.openedAt)
      )
      .reduce((a, s) => a + s.total, 0);

    const bayarKasbonTunai = state.receivables
      .flatMap((r) => r.payments)
      .filter((p) => setelah(p.paidAt, shift.openedAt))
      .reduce((a, p) => a + p.amount, 0);

    const pengeluaranTunai = state.expenses
      .filter((e) => setelah(e.createdAt, shift.openedAt))
      .reduce((a, e) => a + e.amount, 0);

    const seharusnya = kasSeharusnya({
      startingCash: shift.startingCash,
      penjualanTunai,
      bayarKasbonTunai,
      pengeluaranTunai,
    });
    const hasil = rekonsiliasiKas(uangFisik, seharusnya);
    const tertutup: Shift = {
      ...shift,
      closedAt: new Date().toISOString(),
      expectedCash: seharusnya,
      actualCash: hasil.actual,
      difference: hasil.selisih,
      status: "closed",
    };
    set({
      shift: null,
      shiftHistory: [tertutup, ...state.shiftHistory],
    });
    return { ok: true, pesan: "Shift ditutup.", hasil, shift: tertutup };
  },

  catatPenjualan: (input, user) => {
    const state = get();
    const now = new Date();
    const ppn = (n: number) => n.toString().padStart(2, "0");
    const urut = state.nomorUrutStruk + 1;
    const receiptNumber = `STR-${now.getFullYear()}${ppn(now.getMonth() + 1)}${ppn(
      now.getDate()
    )}-${ppn(urut)}`;

    const status: Sale["status"] = input.metode === "credit" ? "credit" : "paid";
    const amountPaid = input.metode === "credit" ? 0 : input.uangDiterima;
    const sale: Sale = {
      id: uid("sale"),
      receiptNumber,
      cashierId: user.id,
      cashierName: user.name,
      customerId: input.customerId,
      customerName: input.customerName,
      items: input.items,
      subtotal: input.subtotal,
      discount: input.discount,
      total: input.total,
      paymentMethod: input.metode,
      amountPaid,
      changeAmount: input.metode === "cash" ? hitungKembalian(input.uangDiterima, input.total) : 0,
      status,
      transferRef: input.transferRef,
      createdAt: now.toISOString(),
    };

    const notifBaru: AppNotification[] = [
      buatNotif(
        "sale_paid",
        "Penjualan Baru",
        `${user.name} menyelesaikan ${receiptNumber} senilai Rp ${input.total.toLocaleString("id-ID")}`
      ),
    ];

    set((s) => {
      const products = s.products.map((p) => {
        const baris = input.items.find((i) => i.productId === p.id);
        return baris ? { ...p, stockQty: p.stockQty - baris.qty } : p;
      });

      const mutasiKeluar: StockMutation[] = input.items.map((i) => ({
        id: uid("sm"),
        productId: i.productId,
        productName: i.name,
        type: "out",
        reason: "sale",
        qty: i.qty,
        refNumber: receiptNumber,
        byName: user.name,
        createdAt: now.toISOString(),
      }));

      const receivables = [...s.receivables];
      if (input.metode === "credit" && input.customerId) {
        receivables.unshift({
          id: uid("rc"),
          customerId: input.customerId,
          customerName: input.customerName ?? "Pelanggan",
          saleReceipt: receiptNumber,
          originalAmount: input.total,
          paidAmount: 0,
          status: "unpaid",
          payments: [],
          createdAt: now.toISOString(),
        });
      }

      const baruTipis = products.filter((p) => {
        const dibeli = input.items.some((i) => i.productId === p.id);
        const lama = s.products.find((o) => o.id === p.id);
        return dibeli && lama && lama.stockQty > lama.minStock && p.stockQty <= p.minStock;
      });
      for (const p of baruTipis) {
        notifBaru.push(
          buatNotif(
            "stock_low",
            "Stok Menipis",
            `${p.name} sisa ${p.stockQty} (batas minimum ${p.minStock}). Segera kulakan!`
          )
        );
      }

      return {
        sales: [sale, ...s.sales],
        products,
        mutations: [...mutasiKeluar, ...s.mutations],
        receivables,
        notifications: [...notifBaru, ...s.notifications],
        nomorUrutStruk: urut,
      };
    });
    return sale;
  },

  batalkanPenjualan: (saleId, alasan, pinPemilik) => {
    if (pinPemilik !== AKUN.owner.pin) {
      return { ok: false, pesan: "PIN pemilik salah. Transaksi tidak dibatalkan." };
    }
    const state = get();
    const sale = state.sales.find((x) => x.id === saleId);
    if (!sale) return { ok: false, pesan: "Transaksi tidak ditemukan." };
    if (sale.status === "void") return { ok: false, pesan: "Transaksi sudah dibatalkan." };

    const now = new Date().toISOString();
    set({
      sales: state.sales.map((x) =>
        x.id === saleId ? { ...x, status: "void", voidReason: alasan } : x
      ),
      products: state.products.map((p) => {
        const baris = sale.items.find((i) => i.productId === p.id);
        return baris ? { ...p, stockQty: p.stockQty + baris.qty } : p;
      }),
      mutations: [
        ...sale.items.map((i) => ({
          id: uid("sm"),
          productId: i.productId,
          productName: i.name,
          type: "in" as const,
          reason: "sale_void" as const,
          qty: i.qty,
          refNumber: sale.receiptNumber,
          note: `Batal (void): ${alasan}`,
          byName: "Pemilik Toko",
          createdAt: now,
        })),
        ...state.mutations,
      ],
      receivables: state.receivables.filter((r) => r.saleReceipt !== sale.receiptNumber),
      notifications: [
        buatNotif("sale_paid", "Transaksi Dibatalkan", `${sale.receiptNumber} dibatalkan: ${alasan}`),
        ...state.notifications,
      ],
    });
    return { ok: true, pesan: `Transaksi ${sale.receiptNumber} berhasil dibatalkan.` };
  },

  tambahProduk: (data) => {
    const state = get();
    const inisial = data.name
      ?.toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 3);
    const nomor = (
      state.products.filter((p) => p.sku.startsWith(`${inisial}-`)).length + 1
    )
      .toString()
      .padStart(4, "0");
    const produk: Product = {
      id: uid("p"),
      name: data.name ?? "Produk Baru",
      sku: data.sku || `${inisial || "PRD"}-${nomor}`,
      barcode: data.barcode || undefined,
      unit: data.unit || "pcs",
      categoryId: data.categoryId,
      purchasePrice: data.purchasePrice ?? 0,
      sellingPrice: data.sellingPrice ?? 0,
      stockQty: data.stockQty ?? 0,
      minStock: data.minStock ?? 5,
      emoji: data.emoji || "📦",
      units: data.units,
      isActive: true,
    };
    const mutasi =
      produk.stockQty > 0
        ? [
            {
              id: uid("sm"),
              productId: produk.id,
              productName: produk.name,
              type: "in" as const,
              reason: "adjustment" as const,
              qty: produk.stockQty,
              note: "Stok awal saat produk dibuat",
              byName: "Pemilik Toko",
              createdAt: new Date().toISOString(),
            },
          ]
        : [];
    set({ products: [produk, ...state.products], mutations: [...mutasi, ...state.mutations] });
    return produk;
  },

  ubahProduk: (id, data) =>
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),

  toggleProdukAktif: (id) =>
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)),
    })),

  tambahKategori: (nama) =>
    set((s) => {
      if (s.categories.some((k) => k.name.toLowerCase() === nama.toLowerCase())) return s;
      return { categories: [...s.categories, { id: uid("cat"), name: nama }] };
    }),

  catatBarangMasuk: (productId, qty, catatan, user) => {
    const state = get();
    const produk = state.products.find((p) => p.id === productId);
    if (!produk || qty <= 0) return;
    set({
      products: state.products.map((p) =>
        p.id === productId ? { ...p, stockQty: p.stockQty + qty } : p
      ),
      mutations: [
        {
          id: uid("sm"),
          productId,
          productName: produk.name,
          type: "in",
          reason: "purchase",
          qty,
          note: catatan || "Barang masuk (kulakan)",
          byName: user.name,
          createdAt: new Date().toISOString(),
        },
        ...state.mutations,
      ],
    });
  },

  catatBarangKeluar: (productId, qty, reason, catatan, user) => {
    const state = get();
    const produk = state.products.find((p) => p.id === productId);
    if (!produk) return { ok: false, pesan: "Produk tidak ditemukan." };
    if (qty <= 0) return { ok: false, pesan: "Jumlah harus lebih dari nol." };
    if (qty > produk.stockQty)
      return { ok: false, pesan: `Stok ${produk.name} hanya ${produk.stockQty}.` };
    set({
      products: state.products.map((p) =>
        p.id === productId ? { ...p, stockQty: p.stockQty - qty } : p
      ),
      mutations: [
        {
          id: uid("sm"),
          productId,
          productName: produk.name,
          type: "out",
          reason,
          qty,
          note: catatan || (reason === "damage" ? "Rusak/hilang" : "Stok opname"),
          byName: user.name,
          createdAt: new Date().toISOString(),
        },
        ...state.mutations,
      ],
    });
    return { ok: true, pesan: "Catatan stok keluar disimpan." };
  },

  catatPengeluaran: (title, amount, user, category = "Operasional") =>
    set((s) => ({
      expenses: [
        {
          id: uid("exp"),
          title,
          category,
          amount,
          byName: user.name,
          createdAt: new Date().toISOString(),
        },
        ...s.expenses,
      ],
    })),

  tambahPelanggan: (nama, telepon) => {
    const pelanggan: Customer = { id: uid("c"), name: nama, phone: telepon };
    set((s) => ({ customers: [...s.customers, pelanggan] }));
    return pelanggan;
  },

  tambahSupplier: (nama, telepon) => {
    const supplier: Supplier = { id: uid("s"), name: nama, phone: telepon };
    set((s) => ({ suppliers: [...s.suppliers, supplier] }));
    return supplier;
  },

  catatPembelian: (supplierId, items, status, user) => {
    const state = get();
    const supplier = state.suppliers.find((x) => x.id === supplierId);
    if (!supplier) return { ok: false, pesan: "Pilih supplier dulu ya." };
    const valid = items.filter((i) => i.qty > 0 && i.unitCost >= 0);
    if (valid.length === 0) return { ok: false, pesan: "Isi minimal satu barang." };

    const now = new Date();
    const invoice = `F-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}${(
      state.purchases.length + 3
    )
      .toString()
      .padStart(2, "0")}`;
    const rincian = valid.map((i) => {
      const produk = state.products.find((p) => p.id === i.productId)!;
      return {
        productName: produk.name,
        qty: i.qty,
        unitCost: i.unitCost,
        total: Math.round(i.qty * i.unitCost),
      };
    });
    const total = rincian.reduce((a, b) => a + b.total, 0);

    set((s) => ({
      products: s.products.map((p) => {
        const baris = valid.find((i) => i.productId === p.id);
        return baris ? { ...p, stockQty: p.stockQty + baris.qty, purchasePrice: baris.unitCost } : p;
      }),
      mutations: [
        ...rincian.map((r, idx) => ({
          id: uid("sm"),
          productId: valid[idx].productId,
          productName: r.productName,
          type: "in" as const,
          reason: "purchase" as const,
          qty: r.qty,
          refNumber: invoice,
          note: `Beli dari ${supplier.name}`,
          byName: user.name,
          createdAt: now.toISOString(),
        })),
        ...s.mutations,
      ],
      purchases: [
        {
          id: uid("pur"),
          invoiceNumber: invoice,
          supplierId,
          supplierName: supplier.name,
          items: rincian,
          total,
          status,
          createdAt: now.toISOString(),
          createdByName: user.name,
        },
        ...s.purchases,
      ],
      payables:
        status === "credit"
          ? [
              {
                id: uid("pb"),
                supplierId,
                supplierName: supplier.name,
                purchaseInvoice: invoice,
                originalAmount: total,
                paidAmount: 0,
                status: "unpaid" as const,
                payments: [],
                createdAt: now.toISOString(),
              },
              ...s.payables,
            ]
          : s.payables,
    }));
    return { ok: true, pesan: `Pembelian ${invoice} tercatat. Stok bertambah.`, invoice };
  },

  bayarHutangSupplier: (payableId, amount, user) => {
    set((s) => ({
      payables: s.payables.map((pb) => {
        if (pb.id !== payableId) return pb;
        const dibayar = pb.paidAmount + amount;
        return {
          ...pb,
          paidAmount: dibayar,
          status: dibayar >= pb.originalAmount ? ("paid" as const) : ("partial" as const),
          payments: [
            ...pb.payments,
            { id: uid("pbp"), amount, paidAt: new Date().toISOString() },
          ],
        };
      }),
    }));
    void user;
  },

  terimaPembayaranKasbon: (receivableId, amount, user) => {
    const now = new Date().toISOString();
    set((s) => ({
      receivables: s.receivables.map((rc) => {
        if (rc.id !== receivableId) return rc;
        const dibayar = rc.paidAmount + amount;
        return {
          ...rc,
          paidAmount: dibayar,
          status: dibayar >= rc.originalAmount ? ("paid" as const) : ("partial" as const),
          payments: [
            {
              id: uid("rcp"),
              amount,
              note: "Pembayaran kasbon",
              acceptedByName: user.name,
              paidAt: now,
            },
            ...rc.payments,
          ],
        };
      }),
    }));
  },

  tambahKasirAkun: (nama, email, pin) => {
    const s = get();
    if (s.cashierAccounts.some((a) => a.email.toLowerCase() === email.toLowerCase()))
      return { ok: false, pesan: "Email kasir sudah dipakai." };
    if (!/^\d{4,6}$/.test(pin)) return { ok: false, pesan: "PIN harus 4-6 angka." };
    set({
      cashierAccounts: [
        ...s.cashierAccounts,
        { id: uid("user"), name: nama, email, pin, isActive: true },
      ],
    });
    return { ok: true, pesan: `Akun kasir ${nama} dibuat.` };
  },

  toggleKasirAkun: (id) =>
    set((s) => ({
      cashierAccounts: s.cashierAccounts.map((a) =>
        a.id === id ? { ...a, isActive: !a.isActive } : a
      ),
    })),

  tandaiNotifDibaca: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, isRead: true })) })),
    }),
    {
      name: "kastoko-pos",
      version: 1,
      partialize: (s) => ({
        products: s.products,
        categories: s.categories,
        customers: s.customers,
        suppliers: s.suppliers,
        cashierAccounts: s.cashierAccounts,
        sales: s.sales,
        shift: s.shift,
        shiftHistory: s.shiftHistory,
        expenses: s.expenses,
        mutations: s.mutations,
        purchases: s.purchases,
        receivables: s.receivables,
        payables: s.payables,
        notifications: s.notifications,
        nomorUrutStruk: s.nomorUrutStruk,
      }),
    }
  )
);

export function produkStokMenipis(products: Product[]): Product[] {
  return products.filter((p) => p.isActive && p.stockQty <= p.minStock);
}
