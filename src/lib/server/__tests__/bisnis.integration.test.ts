// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

// Arahkan pool ke kastoko_test (pool db.ts dibuat malas — cukup set di sini).
const envLokal: Record<string, string> = {};
for (const baris of readFileSync(".env.local", "utf8").split("\n")) {
  const m = baris.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) envLokal[m[1]] = m[2].trim();
}
process.env.DATABASE_URL = `postgresql://kastoko_app:${envLokal.POSTGRES_APP_PASSWORD}@localhost:5433/kastoko_test`;

import { beforeAll, describe, expect, it } from "vitest";
import { tanya, tanyaPakaiSesi } from "../db";
import { hashKredensial } from "../kredensial";
import {
  batalkanPenjualan,
  buatPenjualan,
  bukaShift,
  catatBarangKeluar,
  catatPengeluaran,
  catatPembelian,
  GagalBisnis,
  simpanProduk,
  tambahKategori,
  tambahPelanggan,
  tambahSupplier,
  terimaPembayaranKasbon,
  tutupShift,
  type KonteksMinimal,
} from "../bisnis";

// Integration test TAHAP 2 (DB nyata kastoko_test). Semua baca/tulis lewat
// tanyaPakaiSesi supaya Row Level Security benar-benar ikut teruji.

async function sctx<T extends Record<string, unknown>>(
  ctx: KonteksMinimal,
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  return tanyaPakaiSesi<T>(ctx.userId, sql, params);
}

async function buatToko(): Promise<{ ctx: KonteksMinimal; pin: string }> {
  const pin = String(1000 + Math.floor(Math.random() * 9000));
  const r = await tanya<{ user_id: string; store_id: string }>(
    "select * from kas_register_store($1,$2,$3,$4,$5,$6,$7)",
    [
      "Pemilik Uji",
      `pemilik-${randomUUID().slice(0, 8)}@uji.test`,
      hashKredensial("password123"),
      hashKredensial(pin),
      "Toko Uji",
      "Jl. Uji 1",
      "0800",
    ]
  );
  return {
    pin,
    ctx: {
      userId: r[0].user_id,
      nama: "Pemilik Uji",
      peran: "owner",
      storeId: r[0].store_id,
      storeName: "Toko Uji",
    },
  };
}

async function ambilId(ctx: KonteksMinimal, tabel: string, nama: string): Promise<string> {
  const rows = await sctx<{ id: string }>(ctx, `select id from ${tabel} where store_id=$1 and name=$2`, [
    ctx.storeId,
    nama,
  ]);
  return rows[0].id;
}

async function stok(ctx: KonteksMinimal, nama: string): Promise<number> {
  const rows = await sctx<{ stock_qty: string }>(
    ctx,
    "select stock_qty from products where store_id=$1 and name=$2",
    [ctx.storeId, nama]
  );
  return Number(rows[0].stock_qty);
}

async function tokoDenganProduk(nama: string, harga: number, stokAwal: number): Promise<KonteksMinimal> {
  const { ctx } = await buatToko();
  await simpanProduk(ctx, {
    name: nama, sellingPrice: harga, stockQty: stokAwal, purchasePrice: Math.round(harga * 0.85),
    minStock: 1, unit: "pcs", emoji: "📦", units: [],
  });
  return ctx;
}

let A: { ctx: KonteksMinimal; pin: string };
let B: { ctx: KonteksMinimal; pin: string };

beforeAll(async () => {
  A = await buatToko();
  B = await buatToko();
  await tambahKategori(A.ctx, "Sembako");
  await simpanProduk(A.ctx, {
    name: "Beras Uji 5Kg", sellingPrice: 62000, stockQty: 20, purchasePrice: 55000,
    minStock: 5, unit: "pcs", emoji: "🍚",
    units: [{ unitName: "Dus", conversionFactor: 40, sellingPrice: 2400000 }],
  });
  await simpanProduk(A.ctx, {
    name: "Gula Uji 1Kg", sellingPrice: 17500, stockQty: 30, purchasePrice: 15000,
    minStock: 5, unit: "pcs", emoji: "🍬", units: [],
  });
  await simpanProduk(B.ctx, {
    name: "Beras Toko B", sellingPrice: 70000, stockQty: 7, purchasePrice: 60000,
    minStock: 1, unit: "pcs", emoji: "🍚", units: [],
  });
});

describe("Row Level Security per store_id", () => {
  it("toko A tidak bisa membaca produk toko B", async () => {
    const namaA = (await sctx<{ name: string }>(A.ctx, "select name from products")).map((r) => r.name);
    expect(namaA).toContain("Beras Uji 5Kg");
    expect(namaA).not.toContain("Beras Toko B");
  });

  it("kasir toko A menembak produk toko B via buatPenjualan -> ditolak", async () => {
    const berasB = await ambilId(B.ctx, "products", "Beras Toko B");
    await bukaShift(A.ctx, 10000);
    await expect(
      buatPenjualan(A.ctx, {
        items: [{ productId: berasB, unit: "pcs", qty: 1 }],
        diskonNilai: 0, diskonTipe: "fixed", metode: "cash", uangDiterima: 100000,
      })
    ).rejects.toThrow(GagalBisnis);
    await tutupShift(A.ctx, 10000);
  });

  it("tanpa sesi, tabel penjualan tidak mengembalikan baris (RLS default deny)", async () => {
    const rows = await tanya<{ c: string }>("select count(*) as c from sales");
    expect(Number(rows[0].c)).toBe(0);
  });
});

describe("createSale atomik", () => {
  it("memotong stok, catat mutasi keluar & cash_flow saat tunai", async () => {
    const c = (await buatToko()).ctx;
    await simpanProduk(c, { name: "Telur Uji", sellingPrice: 30000, stockQty: 10, purchasePrice: 26000, minStock: 2, unit: "pcs", emoji: "🥚", units: [] });
    const id = await ambilId(c, "products", "Telur Uji");
    await bukaShift(c, 50000);
    const sale = await buatPenjualan(c, {
      items: [{ productId: id, unit: "pcs", qty: 3 }],
      diskonNilai: 0, diskonTipe: "fixed", metode: "cash", uangDiterima: 100000,
    });
    expect(await stok(c, "Telur Uji")).toBe(7);
    expect(sale.total).toBe(90000);
    expect(sale.changeAmount).toBe(10000);
    const mut = await sctx<{ n: string }>(c, "select count(*) as n from stock_mutations where reason='sale'");
    const cash = await sctx<{ n: string }>(c, "select count(*) as n from cash_flows where category='sale_payment'");
    expect(Number(mut[0].n)).toBe(1);
    expect(Number(cash[0].n)).toBe(1);
    await tutupShift(c, 50000 + 90000);
  });

  it("harga & total dihitung ulang server (diskon %)", async () => {
    const c = await tokoDenganProduk("Beras Diskon", 62000, 10);
    const beras = await ambilId(c, "products", "Beras Diskon");
    await bukaShift(c, 0);
    const sale = await buatPenjualan(c, {
      items: [{ productId: beras, unit: "pcs", qty: 2 }],
      diskonNilai: 10, diskonTipe: "percentage", metode: "cash", uangDiterima: 124000,
    });
    expect(sale.subtotal).toBe(124000);
    expect(sale.discount).toBe(12400);
    expect(sale.total).toBe(111600);
    await tutupShift(c, sale.total);
  });

  it("multi-satuan: 1 Dus memotong 40 stok pcs dengan harga grosir", async () => {
    const c = await tokoDenganProduk("Beras Dus", 62000, 100);
    await sctx(c, "insert into product_units (product_id, unit_name, conversion_factor, selling_price) values ($1,'Dus',40,2400000)", [await ambilId(c, "products", "Beras Dus")]);
    const beras = await ambilId(c, "products", "Beras Dus");
    await bukaShift(c, 0);
    const before = await stok(c, "Beras Dus");
    const sale = await buatPenjualan(c, {
      items: [{ productId: beras, unit: "Dus", qty: 1 }],
      diskonNilai: 0, diskonTipe: "fixed", metode: "cash", uangDiterima: 2400000,
    });
    expect(sale.total).toBe(2400000);
    expect(await stok(c, "Beras Dus")).toBe(before - 40);
    await tutupShift(c, sale.total);
  });

  it("menjual melebihi stok ditolak & stok tidak berubah (rollback)", async () => {
    const c = await tokoDenganProduk("Beras Over", 62000, 5);
    const beras = await ambilId(c, "products", "Beras Over");
    await bukaShift(c, 0);
    await expect(
      buatPenjualan(c, {
        items: [{ productId: beras, unit: "pcs", qty: 99999 }],
        diskonNilai: 0, diskonTipe: "fixed", metode: "cash", uangDiterima: 999999,
      })
    ).rejects.toThrow(GagalBisnis);
    expect(await stok(c, "Beras Over")).toBe(5);
    await tutupShift(c, 0);
  });
});

describe("Buka / tutup kasir", () => {
  it("kas seharusnya = modal + tunai masuk - pengeluaran", async () => {
    const c = (await buatToko()).ctx;
    await simpanProduk(c, { name: "Minyak Uji", sellingPrice: 19000, stockQty: 10, purchasePrice: 16000, minStock: 1, unit: "pcs", emoji: "🛢️", units: [] });
    const id = await ambilId(c, "products", "Minyak Uji");
    await bukaShift(c, 150000);
    const sale = await buatPenjualan(c, {
      items: [{ productId: id, unit: "pcs", qty: 2 }],
      diskonNilai: 0, diskonTipe: "fixed", metode: "cash", uangDiterima: 40000,
    });
    await catatPengeluaran(c, { title: "Token listrik", amount: 50000 });
    const fisik = 150000 + sale.total - 50000;
    const tutup = await tutupShift(c, fisik);
    expect(tutup.seharusnya).toBe(fisik);
    expect(tutup.status).toBe("seimbang");
  });

  it("uang fisik kurang -> status kurang dengan selisih negatif", async () => {
    const c = (await buatToko()).ctx;
    await bukaShift(c, 20000);
    const t = await tutupShift(c, 5000);
    expect(t.status).toBe("kurang");
    expect(t.selisih).toBe(-15000);
  });
});

describe("Kasbon & hutang supplier", () => {
  it("kasbon: piutang dibuat, cicilan mengurangi, bayar berlebih ditolak", async () => {
    const c = await tokoDenganProduk("Gula Bon", 17500, 30);
    await bukaShift(c, 0);
    const pel = await tambahPelanggan(c, "Bu Uji", "0812");
    const gula = await ambilId(c, "products", "Gula Bon");
    const sale = await buatPenjualan(c, {
      items: [{ productId: gula, unit: "pcs", qty: 4 }],
      diskonNilai: 0, diskonTipe: "fixed", metode: "credit", uangDiterima: 0, customerId: pel,
    });
    expect(sale.status).toBe("credit");
    const rc = await sctx<{ id: string; original_amount: string }>(
      c, "select id, original_amount from receivables where sale_id=$1", [sale.id]
    );
    expect(Number(rc[0].original_amount)).toBe(70000);
    await terimaPembayaranKasbon(c, { receivableId: rc[0].id, amount: 30000 });
    const after = await sctx<{ paid_amount: string; status: string }>(
      c, "select paid_amount, status from receivables where id=$1", [rc[0].id]
    );
    expect(Number(after[0].paid_amount)).toBe(30000);
    expect(after[0].status).toBe("partial");
    await expect(
      terimaPembayaranKasbon(c, { receivableId: rc[0].id, amount: 999999 })
    ).rejects.toThrow(GagalBisnis);
    await tutupShift(c, 30000); // kasbon 30rb tunai masuk laci
  });

  it("pembelian kredit menambah stok + hutang, lalu dicicil", async () => {
    const c = await tokoDenganProduk("Gula Beli", 17500, 3);
    await tambahSupplier(c, "Supplier Uji");
    const sup = await ambilId(c, "suppliers", "Supplier Uji");
    const gula = await ambilId(c, "products", "Gula Beli");
    const invoice = await catatPembelian(c, {
      supplierId: sup, status: "credit",
      items: [{ productId: gula, qty: 10, unitCost: 15000 }],
    });
    expect(await stok(c, "Gula Beli")).toBe(13);
    const pb = await sctx<{ id: string; original_amount: string }>(
      c, "select pa.id, pa.original_amount from payables pa join purchases pu on pu.id=pa.purchase_id where pu.invoice_number=$1",
      [invoice]
    );
    expect(Number(pb[0].original_amount)).toBe(150000);
    const { bayarHutangSupplier } = await import("../bisnis");
    await bayarHutangSupplier(c, { payableId: pb[0].id, amount: 50000 });
    const pb2 = await sctx<{ paid_amount: string; status: string }>(
      c, "select paid_amount, status from payables where id=$1", [pb[0].id]
    );
    expect(Number(pb2[0].paid_amount)).toBe(50000);
    expect(pb2[0].status).toBe("partial");
  });
});

describe("Void (PIN pemilik) & stok keluar", () => {
  it("void dengan PIN salah ditolak, PIN benar mengembalikan stok", async () => {
    const t = await buatToko();
    const c = t.ctx;
    await simpanProduk(c, { name: "Sabun Uji", sellingPrice: 4500, stockQty: 10, purchasePrice: 3000, minStock: 1, unit: "pcs", emoji: "🧼", units: [] });
    const id = await ambilId(c, "products", "Sabun Uji");
    await bukaShift(c, 0);
    const sale = await buatPenjualan(c, {
      items: [{ productId: id, unit: "pcs", qty: 2 }],
      diskonNilai: 0, diskonTipe: "fixed", metode: "cash", uangDiterima: 9000,
    });
    await expect(
      batalkanPenjualan(c, { saleId: sale.id, alasan: "salah", pinPemilik: "000000" })
    ).rejects.toThrow(GagalBisnis);
    await batalkanPenjualan(c, { saleId: sale.id, alasan: "pelanggan batal", pinPemilik: t.pin });
    expect(await stok(c, "Sabun Uji")).toBe(10);
    const status = await sctx<{ status: string }>(c, "select status from sales where id=$1", [sale.id]);
    expect(status[0].status).toBe("void");
    await tutupShift(c, 0);
  });

  it("stok keluar damage memotong, melebihi stok ditolak", async () => {
    const c = await tokoDenganProduk("Gula Keluar", 17500, 10);
    const gula = await ambilId(c, "products", "Gula Keluar");
    await catatBarangKeluar(c, { productId: gula, qty: 4, reason: "damage", catatan: "basah" });
    expect(await stok(c, "Gula Keluar")).toBe(6);
    await expect(
      catatBarangKeluar(c, { productId: gula, qty: 999999, reason: "damage", catatan: "" })
    ).rejects.toThrow(GagalBisnis);
  });
});
