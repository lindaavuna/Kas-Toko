import type {
  AppNotification,
  CashierAccount,
  Category,
  Customer,
  Expense,
  Payable,
  Product,
  Purchase,
  Receivable,
  Sale,
  SessionUser,
  StockMutation,
  Supplier,
} from "./types";

export const TOKO = {
  id: "store-berkah-jaya",
  nama: "Toko Berkah Jaya",
  alamat: "Jl. Melati No. 12, Surabaya",
  telepon: "0851-2345-6789",
  kakiStruk: "Terima kasih atas kunjungan Anda!",
  rekening: "BCA 1234567890 a.n. Budi Santoso",
};

export const AKUN = {
  owner: {
    email: "budi@tokoberkah.id",
    password: "rahasia",
    pin: "8765",
    user: {
      id: "user-budi",
      name: "Budi Santoso",
      email: "budi@tokoberkah.id",
      role: "owner",
      storeId: TOKO.id,
      storeName: TOKO.nama,
    } satisfies SessionUser,
  },
  kasir: {
    email: "siti@tokoberkah.id",
    pin: "1234",
    user: {
      id: "user-siti",
      name: "Siti Rahma",
      email: "siti@tokoberkah.id",
      role: "cashier",
      storeId: TOKO.id,
      storeName: TOKO.nama,
    } satisfies SessionUser,
  },
};

export const AKUN_KASIR: CashierAccount[] = [
  { id: "user-siti", name: "Siti Rahma", email: "siti@tokoberkah.id", pin: "1234", isActive: true },
  { id: "user-rina", name: "Rina Wati", email: "rina@tokoberkah.id", pin: "5678", isActive: true },
];

export const KATEGORI: Category[] = [
  { id: "cat-sembako", name: "Sembako" },
  { id: "cat-minuman", name: "Minuman" },
  { id: "cat-dapur", name: "Dapur" },
  { id: "cat-lain", name: "Perlengkapan" },
];

export const PRODUK: Product[] = [
  {
    id: "p-beras",
    name: "Beras Premium 5Kg",
    sku: "BRS-0001",
    barcode: "8991002111111",
    unit: "pcs",
    categoryId: "cat-sembako",
    purchasePrice: 55000,
    sellingPrice: 62000,
    stockQty: 40,
    minStock: 10,
    emoji: "🍚",
    isActive: true,
  },
  {
    id: "p-minyak",
    name: "Minyak Goreng 1L",
    sku: "MNY-0001",
    barcode: "8991002222222",
    unit: "pcs",
    categoryId: "cat-sembako",
    purchasePrice: 16500,
    sellingPrice: 19000,
    stockQty: 2,
    minStock: 5,
    emoji: "🛢️",
    isActive: true,
  },
  {
    id: "p-gula",
    name: "Gula Pasir 1Kg",
    sku: "GLA-0001",
    barcode: "8991002333333",
    unit: "pcs",
    categoryId: "cat-sembako",
    purchasePrice: 15000,
    sellingPrice: 17500,
    stockQty: 25,
    minStock: 5,
    emoji: "🍬",
    isActive: true,
  },
  {
    id: "p-telur",
    name: "Telur Ayam 1Kg",
    sku: "TEL-0001",
    barcode: "8991002444444",
    unit: "pcs",
    categoryId: "cat-dapur",
    purchasePrice: 26000,
    sellingPrice: 30000,
    stockQty: 8,
    minStock: 10,
    emoji: "🥚",
    isActive: true,
  },
  {
    id: "p-indomie",
    name: "Indomie Goreng",
    sku: "DIM-0001",
    barcode: "8991003111111",
    unit: "pcs",
    categoryId: "cat-sembako",
    purchasePrice: 2400,
    sellingPrice: 3000,
    stockQty: 200,
    minStock: 40,
    emoji: "🍜",
    units: [
      { unitName: "Pcs", conversionFactor: 1, sellingPrice: 3000 },
      { unitName: "Bal", conversionFactor: 10, sellingPrice: 28500 },
      { unitName: "Dus", conversionFactor: 40, sellingPrice: 108000 },
    ],
    isActive: true,
  },
  {
    id: "p-air",
    name: "Air Mineral 600ml",
    sku: "AIR-0001",
    barcode: "8991003222222",
    unit: "pcs",
    categoryId: "cat-minuman",
    purchasePrice: 2500,
    sellingPrice: 3500,
    stockQty: 96,
    minStock: 24,
    emoji: "🥤",
    units: [
      { unitName: "Pcs", conversionFactor: 1, sellingPrice: 3500 },
      { unitName: "Pack", conversionFactor: 12, sellingPrice: 39000 },
    ],
    isActive: true,
  },
  {
    id: "p-skm",
    name: "Susu SKM 370gr",
    sku: "SKM-0001",
    barcode: "8991003333333",
    unit: "pcs",
    categoryId: "cat-minuman",
    purchasePrice: 12000,
    sellingPrice: 15000,
    stockQty: 18,
    minStock: 6,
    emoji: "🥫",
    isActive: true,
  },
  {
    id: "p-kopi",
    name: "Kopi Sachet",
    sku: "KOP-0001",
    barcode: "8991003444444",
    unit: "pcs",
    categoryId: "cat-minuman",
    purchasePrice: 1200,
    sellingPrice: 2000,
    stockQty: 120,
    minStock: 30,
    emoji: "☕",
    isActive: true,
  },
  {
    id: "p-teh",
    name: "Teh Celup 25s",
    sku: "TEH-0001",
    barcode: "8991003555555",
    unit: "pcs",
    categoryId: "cat-minuman",
    purchasePrice: 4500,
    sellingPrice: 6500,
    stockQty: 22,
    minStock: 8,
    emoji: "🫖",
    isActive: true,
  },
  {
    id: "p-gas",
    name: "Gas LPG 3Kg",
    sku: "LPG-0001",
    barcode: "8991003666666",
    unit: "pcs",
    categoryId: "cat-dapur",
    purchasePrice: 16000,
    sellingPrice: 21000,
    stockQty: 9,
    minStock: 5,
    emoji: "🔥",
    isActive: true,
  },
  {
    id: "p-sabun",
    name: "Sabun Mandi 240ml",
    sku: "SBN-0001",
    barcode: "8991003777777",
    unit: "pcs",
    categoryId: "cat-lain",
    purchasePrice: 3000,
    sellingPrice: 4500,
    stockQty: 35,
    minStock: 10,
    emoji: "🧼",
    isActive: true,
  },
  {
    id: "p-roko",
    name: "Rokok Garnet Mild",
    sku: "RKK-0001",
    barcode: "8991003888888",
    unit: "pcs",
    categoryId: "cat-lain",
    purchasePrice: 20500,
    sellingPrice: 23000,
    stockQty: 40,
    minStock: 10,
    emoji: "🚬",
    units: [
      { unitName: "Pcs", conversionFactor: 1, sellingPrice: 2300 },
      { unitName: "Renceng", conversionFactor: 10, sellingPrice: 22500 },
    ],
    isActive: true,
  },
];

export const PELANGGAN: Customer[] = [
  { id: "c-buani", name: "Bu Ani", phone: "0812-3333-4444", address: "Jl. Kenanga No. 3" },
  { id: "c-pakjoko", name: "Pak Joko", phone: "0813-5555-6666", address: "Jl. Anggrek No. 8" },
  { id: "c-mbaklily", name: "Mbak Lily", phone: "0857-7777-8888", address: "Perum Griya Asri" },
];

export const SUPPLIER: Supplier[] = [
  { id: "s-sinarmas", name: "UD Sinar Mas", phone: "031-555-1234", address: "Jl. Pasar Keputran" },
  { id: "s-makmur", name: "CV Makmur Sentosa", phone: "031-555-9876", address: "Jl. Tambak Mayor" },
];

let counterId = 0;
export function uid(prefix = "id"): string {
  counterId += 1;
  return `${prefix}-${Date.now().toString(36)}-${counterId}`;
}

function waktuLalu(hari: number, jam: number, menit: number): string {
  const d = new Date();
  d.setDate(d.getDate() - hari);
  d.setHours(jam, menit, 0, 0);
  return d.toISOString();
}

function nomorStruk(hari: number, urut: number): string {
  const d = new Date();
  d.setDate(d.getDate() - hari);
  const ppn = (n: number) => n.toString().padStart(2, "0");
  return `STR-${d.getFullYear()}${ppn(d.getMonth() + 1)}${ppn(d.getDate())}-${ppn(urut)}`;
}

function jual(
  hari: number,
  urut: number,
  menit: number,
  items: { productId: string; qty: number }[],
  metode: Sale["paymentMethod"] = "cash",
  cashier: { id: string; name: string } = AKUN.kasir.user
): Sale {
  const jam = 8 + ((urut * 3) % 10);
  const rincian = items.map((i) => {
    const p = PRODUK.find((pr) => pr.id === i.productId)!;
    return {
      productId: p.id,
      name: p.name,
      unit: p.unit,
      qty: i.qty,
      price: p.sellingPrice,
      total: p.sellingPrice * i.qty,
    };
  });
  const subtotal = rincian.reduce((a, b) => a + b.total, 0);
  const status: Sale["status"] = metode === "credit" ? "credit" : "paid";
  return {
    id: uid("sale"),
    receiptNumber: nomorStruk(hari, urut),
    cashierId: cashier.id,
    cashierName: cashier.name,
    customerId: metode === "credit" ? "c-buani" : undefined,
    customerName: metode === "credit" ? "Bu Ani" : undefined,
    items: rincian,
    subtotal,
    discount: 0,
    total: subtotal,
    paymentMethod: metode,
    amountPaid: metode === "credit" ? 0 : subtotal,
    changeAmount: 0,
    status,
    createdAt: waktuLalu(hari, jam, menit),
  };
}

const p = (id: string, qty: number) => ({ productId: id, qty });

export const PENJUALAN_AWAL: Sale[] = [
  // 7 hari terakhir untuk grafik tren (omset harian bervariasi)
  jual(6, 3, 42, [p("p-beras", 1), p("p-gula", 2)]),
  jual(6, 2, 15, [p("p-minyak", 2), p("p-air", 6)]),
  jual(6, 1, 5, [p("p-indomie", 8), p("p-kopi", 10)]),
  jual(5, 4, 50, [p("p-beras", 2), p("p-telur", 1)]),
  jual(5, 3, 30, [p("p-skm", 2), p("p-teh", 1)]),
  jual(5, 2, 12, [p("p-gas", 2), p("p-sabun", 2)]),
  jual(5, 1, 2, [p("p-roko", 1, )]),
  jual(4, 4, 45, [p("p-beras", 1), p("p-minyak", 1), p("p-gula", 1)]),
  jual(4, 3, 20, [p("p-indomie", 12), p("p-air", 12)]),
  jual(4, 2, 8, [p("p-telur", 2)]),
  jual(4, 1, 1, [p("p-kopi", 20)]),
  jual(3, 4, 40, [p("p-beras", 3)]),
  jual(3, 3, 25, [p("p-gas", 3), p("p-roko", 10)]),
  jual(3, 2, 10, [p("p-skm", 4)]),
  jual(2, 5, 55, [p("p-beras", 2), p("p-gula", 3)]),
  jual(2, 4, 35, [p("p-minyak", 4), p("p-air", 24)]),
  jual(2, 3, 18, [p("p-teh", 2), p("p-kopi", 6)]),
  jual(2, 2, 9, [p("p-indomie", 20)]),
  jual(1, 6, 58, [p("p-beras", 2), p("p-telur", 2)]),
  jual(1, 5, 44, [p("p-roko", 20)]),
  jual(1, 4, 28, [p("p-gas", 2), p("p-sabun", 3)]),
  jual(1, 3, 16, [p("p-air", 12), p("p-kopi", 8)]),
  jual(1, 2, 6, [p("p-minyak", 3)]),
  jual(1, 1, 0, [p("p-gula", 2)]),
  // Hari ini
  jual(0, 3, 47, [p("p-beras", 1), p("p-air", 6)]),
  jual(0, 2, 25, [p("p-indomie", 5), p("p-kopi", 4), p("p-gas", 1)]),
  jual(0, 1, 10, [p("p-sabun", 2), p("p-roko", 10)]),
  jual(0, 4, 5, [p("p-gula", 1), p("p-teh", 1)], "credit"),
];

export const KASBON_AWAL: Receivable[] = [
  {
    id: "rc-buani-lama",
    customerId: "c-buani",
    customerName: "Bu Ani",
    saleReceipt: "STR-20260901-002",
    originalAmount: 200000,
    paidAmount: 50000,
    status: "partial",
    payments: [
      {
        id: "rcp-1",
        amount: 50000,
        note: "Cicilan pertama",
        acceptedByName: "Siti Rahma",
        paidAt: waktuLalu(5, 10, 30),
      },
    ],
    createdAt: waktuLalu(8, 9, 15),
  },
  {
    id: "rc-pakjoko",
    customerId: "c-pakjoko",
    customerName: "Pak Joko",
    saleReceipt: "STR-20260905-001",
    originalAmount: 85000,
    paidAmount: 0,
    status: "unpaid",
    payments: [],
    createdAt: waktuLalu(4, 16, 20),
  },
];

export const HUTANG_AWAL: Payable[] = [
  {
    id: "pb-sinarmas",
    supplierId: "s-sinarmas",
    supplierName: "UD Sinar Mas",
    purchaseInvoice: "F-2026-0905",
    originalAmount: 500000,
    paidAmount: 150000,
    status: "partial",
    payments: [
      { id: "pbp-1", amount: 100000, paidAt: waktuLalu(2, 11, 0) },
      { id: "pbp-2", amount: 50000, paidAt: waktuLalu(1, 11, 30) },
    ],
    createdAt: waktuLalu(4, 9, 0),
  },
];

export const PEMBELIAN_AWAL: Purchase[] = [
  {
    id: "pur-1",
    invoiceNumber: "F-2026-0905",
    supplierId: "s-sinarmas",
    supplierName: "UD Sinar Mas",
    items: [
      { productName: "Beras Premium 5Kg", qty: 20, unitCost: 55000, total: 1100000 },
    ],
    total: 500000,
    status: "credit",
    createdAt: waktuLalu(4, 9, 0),
    createdByName: "Budi Santoso",
  },
  {
    id: "pur-2",
    invoiceNumber: "F-2026-0907",
    supplierId: "s-makmur",
    supplierName: "CV Makmur Sentosa",
    items: [
      { productName: "Indomie Goreng", qty: 60, unitCost: 2400, total: 144000 },
      { productName: "Air Mineral 600ml", qty: 48, unitCost: 2500, total: 120000 },
    ],
    total: 264000,
    status: "paid",
    createdAt: waktuLalu(2, 8, 30),
    createdByName: "Budi Santoso",
  },
];

export const PENGELUARAN_AWAL: Expense[] = [
  {
    id: "exp-1",
    title: "Beli token listrik toko",
    category: "Operasional",
    amount: 50000,
    byName: "Siti Rahma",
    createdAt: waktuLalu(0, 9, 45),
  },
  {
    id: "exp-2",
    title: "Iuran kebersihan kampung",
    category: "Operasional",
    amount: 20000,
    byName: "Budi Santoso",
    createdAt: waktuLalu(3, 15, 10),
  },
];

export const MUTASI_AWAL: StockMutation[] = [
  {
    id: "sm-1",
    productId: "p-beras",
    productName: "Beras Premium 5Kg",
    type: "in",
    reason: "purchase",
    qty: 20,
    note: "Kulakan dari UD Sinar Mas",
    refNumber: "F-2026-0905",
    byName: "Budi Santoso",
    createdAt: waktuLalu(4, 9, 5),
  },
  {
    id: "sm-2",
    productId: "p-indomie",
    productName: "Indomie Goreng",
    type: "in",
    reason: "purchase",
    qty: 60,
    refNumber: "F-2026-0907",
    note: "Kulakan dari CV Makmur Sentosa",
    byName: "Budi Santoso",
    createdAt: waktuLalu(2, 8, 35),
  },
  {
    id: "sm-3",
    productId: "p-gula",
    productName: "Gula Pasir 1Kg",
    type: "out",
    reason: "damage",
    qty: 2,
    note: "Kemasan sobek dimakan tikus",
    byName: "Siti Rahma",
    createdAt: waktuLalu(1, 7, 50),
  },
];

export const NOTIFIKASI_AWAL: AppNotification[] = [
  {
    id: "nt-1",
    type: "stock_low",
    title: "Stok Menipis",
    message: "Minyak Goreng 1L sisa 2 (batas minimum 5). Segera kulakan!",
    isRead: false,
    createdAt: waktuLalu(0, 7, 0),
  },
  {
    id: "nt-2",
    type: "stock_low",
    title: "Stok Menipis",
    message: "Telur Ayam 1Kg sisa 8 (batas minimum 10).",
    isRead: false,
    createdAt: waktuLalu(0, 7, 0),
  },
  {
    id: "nt-3",
    type: "sale_paid",
    title: "Penjualan Baru",
    message: "Siti Rahma baru saja menyelesaikan transaksi tunai.",
    isRead: true,
    createdAt: waktuLalu(0, 9, 25),
  },
];
