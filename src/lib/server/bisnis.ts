import type { PoolClient } from "pg";
import { denganKlien, tanyaPakaiSesi } from "./db";
import { cocokKredensial, hashKredensial } from "./kredensial";
import { kasSeharusnya } from "@/lib/kas";
import type { Sale, Shift } from "@/lib/types";

export interface KonteksMinimal {
  userId: string;
  nama: string;
  peran: "owner" | "cashier";
  storeId: string;
  storeName: string;
}

export class GagalBisnis extends Error {}

function gagal(pesan: string): never {
  throw new GagalBisnis(pesan);
}

export interface ItemKeranjang {
  productId: string;
  unit: string;
  qty: number;
}

export interface InputPenjualan {
  items: ItemKeranjang[];
  diskonNilai: number;
  diskonTipe: "fixed" | "percentage";
  metode: Sale["paymentMethod"];
  uangDiterima: number;
  customerId?: string | null;
  transferRef?: string | null;
}

/**
 * Penjualan atomik — harga dihitung ulang dari DB (client cuma kirim barang+jumlah),
 * stok dikunci FOR UPDATE berurutan id supaya dua kasir tidak rebutan barang terakhir.
 * Kasbon tidak menambah uang laci; tunai/QRIS/transfer masuk cash_flows.
 */
export async function buatPenjualan(ctx: KonteksMinimal, input: InputPenjualan): Promise<Sale> {
  return denganKlien(ctx.userId, async (cl) => {
    const urut = [...input.items].sort((a, b) => (a.productId < b.productId ? -1 : 1));
    const rincian: {
      productId: string; name: string; unit: string; qty: number;
      baseQty: number; price: number; total: number; unitId: string | null;
      stokSebelum: number; minStock: number;
    }[] = [];
    for (const i of urut) {
      if (i.qty <= 0) gagal("Jumlah barang harus lebih dari nol.");
      const p = await cl.query(
        `select id, name, unit, selling_price::float8 as price, stock_qty::float8 as stok,
           min_stock::float8 as min
         from products where id = $1 and store_id = $2 and is_active`,
        [i.productId, ctx.storeId]
      );
      if (p.rows.length === 0) gagal(`Barang tidak ditemukan atau tidak aktif.`);
      const baris = p.rows[0];
      let baseQty = i.qty;
      let unitId: string | null = null;
      let unit = baris.unit as string;
      let price = baris.price as number;
      if (unit !== i.unit) {
        const u = await cl.query(
          `select id, conversion_factor::float8 as f, selling_price::float8 as h
           from product_units where product_id = $1 and unit_name = $2 limit 1`,
          [i.productId, i.unit]
        );
        if (u.rows.length === 0) gagal(`Satuan "${i.unit}" tidak dikenal untuk ${baris.name}.`);
        baseQty = i.qty * u.rows[0].f;
        unitId = u.rows[0].id;
        unit = i.unit;
        price = u.rows[0].h;
      }
      if ((baris.stok as number) < baseQty) {
        gagal(`Stok ${baris.name} tinggal ${baris.stok} ${unit}.`);
      }
      rincian.push({
        productId: i.productId, name: baris.name, unit, qty: i.qty, baseQty,
        price, total: Math.round(i.qty * price), unitId,
        stokSebelum: baris.stok, minStock: baris.min,
      });
    }

    const subtotal = rincian.reduce((a, i) => a + i.total, 0);
    const diskon = Math.min(
      Math.max(
        input.diskonTipe === "percentage"
          ? Math.round((subtotal * input.diskonNilai) / 100)
          : Math.round(input.diskonNilai),
        0
      ),
      subtotal
    );
    const total = subtotal - diskon;

    if (input.metode === "cash" && input.uangDiterima < total) {
      gagal("Uang diterima kurang dari total belanja.");
    }
    let customerName: string | undefined;
    if (input.metode === "credit") {
      if (!input.customerId) gagal("Pilih pelanggan dulu untuk belanja kasbon.");
      const c = await cl.query(
        "select name from customers where id = $1 and store_id = $2 and is_active",
        [input.customerId, ctx.storeId]
      );
      if (c.rows.length === 0) gagal("Pelanggan kasbon tidak ditemukan.");
      customerName = c.rows[0].name;
    }

    const sh = await cl.query(
      `select id from cashier_shifts
       where store_id = $1 and cashier_id = $2 and status = 'open' limit 1`,
      [ctx.storeId, ctx.userId]
    );
    if (sh.rows.length === 0) gagal("Kasir belum dibuka — tekan Buka Kasir dulu.");

    const struk = await cl.query("select kas_nomor_struk($1, current_date) as no", [ctx.storeId]);
    const receiptNumber = struk.rows[0].no as string;

    const insertedSale = await cl.query(
      `insert into sales (store_id, shift_id, receipt_number, cashier_id, customer_id, status,
         subtotal, discount, discount_type, total, payment_method, amount_paid, change_amount,
         transfer_ref, paid_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, case when $6='credit' then null else now() end)
       returning id, created_at`,
      [
        ctx.storeId, sh.rows[0].id, receiptNumber, ctx.userId, input.customerId ?? null,
        input.metode === "credit" ? "credit" : "paid",
        subtotal, diskon, input.diskonTipe, total, input.metode,
        input.metode === "credit" ? 0 : input.metode === "cash" ? input.uangDiterima : total,
        input.metode === "cash" ? Math.max(input.uangDiterima - total, 0) : 0,
        input.transferRef ?? null,
      ]
    );
    const saleId = insertedSale.rows[0].id as string;
    const createdAt = new Date(insertedSale.rows[0].created_at as string).toISOString();

    for (const i of rincian) {
      await cl.query(
        `insert into sale_items (sale_id, product_id, product_unit_id, quantity, unit_price, total)
         values ($1,$2,$3,$4,$5,$6)`,
        [saleId, i.productId, i.unitId, i.qty, i.price, i.total]
      );
      await cl.query("select kas_ubah_stok($1, $2)", [i.productId, -i.baseQty]);
      await cl.query(
        `insert into stock_mutations (store_id, product_id, mutation_type, reason, quantity, sale_id, created_by)
         values ($1,$2,'out','sale',$3,$4,$5)`,
        [ctx.storeId, i.productId, i.baseQty, saleId, ctx.userId]
      );
      if (i.stokSebelum > i.minStock && i.stokSebelum - i.baseQty <= i.minStock) {
        await cl.query(
          "select kas_notif_toko($1,'stock_low','Stok Menipis',$2)",
          [ctx.storeId, `${i.name} sisa ${i.stokSebelum - i.baseQty} (batas minimum ${i.minStock}). Segera kulakan!`]
        );
      }
    }

    if (input.metode === "credit") {
      await cl.query(
        `insert into receivables (store_id, sale_id, customer_id, original_amount, status)
         values ($1,$2,$3,$4,'unpaid')`,
        [ctx.storeId, saleId, input.customerId, total]
      );
    } else {
      await cl.query(
        `insert into cash_flows (store_id, flow_type, amount, category, method, reference_type, reference_id)
         values ($1,'in',$2,'sale_payment',$3,'sale',$4)`,
        [ctx.storeId, total, input.metode, saleId]
      );
    }
    await cl.query(
      "select kas_notif_toko($1,'sale_paid','Penjualan Baru',$2)",
      [ctx.storeId, `${ctx.nama} menyelesaikan ${receiptNumber} senilai ${total.toLocaleString("id-ID")}`]
    );

    return {
      id: saleId,
      receiptNumber,
      cashierId: ctx.userId,
      cashierName: ctx.nama,
      customerId: input.customerId ?? undefined,
      customerName,
      items: rincian.map((i) => ({
        productId: i.productId, name: i.name, unit: i.unit, qty: i.qty, price: i.price, total: i.total,
      })),
      subtotal,
      discount: diskon,
      total,
      paymentMethod: input.metode,
      amountPaid: input.metode === "credit" ? 0 : input.metode === "cash" ? input.uangDiterima : total,
      changeAmount: input.metode === "cash" ? Math.max(input.uangDiterima - total, 0) : 0,
      status: input.metode === "credit" ? "credit" : "paid",
      transferRef: input.transferRef ?? undefined,
      createdAt,
    };
  });
}

/** Void — PIN pemilik diverifikasi di layer aksi; stok/kas/piutang dirapikan atomik */
export async function batalkanPenjualan(
  ctx: KonteksMinimal,
  input: { saleId: string; alasan: string; pinPemilik: string }
): Promise<void> {
  const owner = await tanyaPakaiSesi<{ cashier_pin: string | null }>(
    ctx.userId,
    `select cashier_pin from store_members
     where store_id = $1 and role = 'owner' and status = 'active' limit 1`,
    [ctx.storeId]
  );
  if (owner.length === 0 || !cocokKredensial(input.pinPemilik, owner[0].cashier_pin)) {
    gagal("PIN pemilik salah. Transaksi tidak dibatalkan.");
  }
  try {
    await tanyaPakaiSesi(
      ctx.userId,
      "select kas_void_sale($1, $2) from (select 1) x",
      [input.saleId, input.alasan]
    );
  } catch (e) {
    const m = String((e as Error).message);
    if (m.includes("BUKAN_PEMILIK")) gagal("Hanya pemilik toko yang boleh membatalkan.");
    if (m.includes("SUDAH_VOID")) gagal("Transaksi sudah dibatalkan.");
    if (m.includes("TRANSAKSI_TIDAK_ADA")) gagal("Transaksi tidak ditemukan.");
    throw e;
  }
}

export async function bukaShift(ctx: KonteksMinimal, modalAwal: number): Promise<Shift> {
  const modal = Math.max(Math.round(Number(modalAwal) || 0), 0);
  try {
    await denganKlien(ctx.userId, async (cl) => {
      await cl.query(
        `insert into cashier_shifts (store_id, cashier_id, starting_cash) values ($1,$2,$3)`,
        [ctx.storeId, ctx.userId, modal]
      );
    });
  } catch (e) {
    if (String((e as Error).message).includes("uq_shift_open_per_cashier")) {
      gagal("Kasir sudah dibuka. Tutup dulu sebelum buka baru.");
    }
    throw e;
  }
  const rows = await tanyaPakaiSesi<Record<string, unknown>>(
    ctx.userId,
    `select cs.id, cs.cashier_id, u.full_name as cashier_name, cs.opened_at,
       cs.starting_cash, cs.status
     from cashier_shifts cs join users u on u.id = cs.cashier_id
     where cs.cashier_id = $1 and cs.status='open' limit 1`,
    [ctx.userId]
  );
  return petakanShift(rows[0]);
}

export interface RangkumanLaci {
  startingCash: number;
  penjualanTunai: number;
  bayarKasbonTunai: number;
  pengeluaranTunai: number;
  seharusnya: number;
}

/** Arus laci tunai shift berjalan (dipakai dialog tutup kasir & riwayat) */
export async function rangkumanLaci(ctx: KonteksMinimal, shift: Shift): Promise<RangkumanLaci> {
  const rows = await tanyaPakaiSesi<{ jual: number; kasbon: number; keluar: number }>(
    ctx.userId,
    `select coalesce(sum(case when flow_type='in' and category='sale_payment' then amount end),0)::float8 as jual,
       coalesce(sum(case when flow_type='in' and category='receivable_payment' then amount end),0)::float8 as kasbon,
       coalesce(sum(case when flow_type='out' then amount end),0)::float8 as keluar
     from cash_flows
     where store_id=$1 and method='cash' and created_at >= $2`,
    [ctx.storeId, shift.openedAt]
  );
  const r = rows[0];
  // pengeluaran kasir + pembalikan void keluar dari laci
  return {
    startingCash: shift.startingCash,
    penjualanTunai: r.jual,
    bayarKasbonTunai: r.kasbon,
    pengeluaranTunai: r.keluar,
    seharusnya: kasSeharusnya({
      startingCash: shift.startingCash,
      penjualanTunai: r.jual,
      bayarKasbonTunai: r.kasbon,
      pengeluaranTunai: r.keluar,
    }),
  };
}

export interface HasilTutup {
  seharusnya: number;
  actual: number;
  selisih: number;
  status: "seimbang" | "kurang" | "lebih";
}

export async function tutupShift(ctx: KonteksMinimal, uangFisik: number): Promise<HasilTutup> {
  const fisik = Math.round(Number(uangFisik) || 0);
  return denganKlien(ctx.userId, async (cl) => {
    const s = await cl.query(
      `select id, starting_cash::float8 as modal from cashier_shifts
       where store_id=$1 and cashier_id=$2 and status='open' for update`,
      [ctx.storeId, ctx.userId]
    );
    if (s.rows.length === 0) gagal("Tidak ada shift kasir yang sedang buka.");
    const arus = await cl.query(
      `select coalesce(sum(case
          when flow_type='in' and category in ('sale_payment','receivable_payment') then amount
          when flow_type='out' and category in ('expense','sale_payment') then -amount
          else 0 end),0)::float8 as net
       from cash_flows
       where store_id = $1 and method = 'cash' and created_at >= (select opened_at from cashier_shifts where id=$2)`,
      [ctx.storeId, s.rows[0].id]
    );
    const seharusnya = s.rows[0].modal + arus.rows[0].net;
    const selisih = fisik - seharusnya;
    await cl.query(
      `update cashier_shifts
       set status='closed', closed_at=now(), expected_cash=$2, actual_cash=$3, cash_difference=$4
       where id = $1`,
      [s.rows[0].id, seharusnya, fisik, selisih]
    );
    return {
      seharusnya,
      actual: fisik,
      selisih,
      status: (selisih === 0 ? "seimbang" : selisih > 0 ? "lebih" : "kurang") as HasilTutup["status"],
    };
  });
}

export function petakanShift(r: Record<string, unknown>): Shift {
  return {
    id: r.id as string,
    cashierId: r.cashier_id as string,
    cashierName: r.cashier_name as string,
    openedAt: new Date(r.opened_at as string).toISOString(),
    closedAt: r.closed_at ? new Date(r.closed_at as string).toISOString() : undefined,
    startingCash: Number(r.starting_cash ?? 0),
    expectedCash: r.expected_cash != null ? Number(r.expected_cash) : undefined,
    actualCash: r.actual_cash != null ? Number(r.actual_cash) : undefined,
    difference: r.cash_difference != null ? Number(r.cash_difference) : undefined,
    status: r.status as Shift["status"],
  };
}

// ---------- katalog ----------

export interface InputProduk {
  id?: string | null;
  name: string;
  sellingPrice: number;
  stockQty: number;
  barcode?: string | null;
  purchasePrice: number;
  categoryId?: string | null;
  minStock: number;
  unit: string;
  emoji: string;
  fotoUrl?: string | null;
  units: { unitName: string; conversionFactor: number; sellingPrice: number }[];
}

export async function simpanProduk(ctx: KonteksMinimal, p: InputProduk): Promise<string | undefined> {
  if (ctx.peran !== "owner") gagal("Hanya pemilik toko yang boleh melakukan ini.");
  return denganKlien(ctx.userId, async (cl) => {
    let produkId = p.id ?? null;
    if (p.id) {
      await cl.query(
        `update products set name=$2, barcode=$3, unit=$4, category_id=$5, purchase_price=$6,
           selling_price=$7, min_stock=$8, image_url=$9
         where id=$1 and store_id=$10`,
        [p.id, p.name, p.barcode || null, p.unit, p.categoryId || null, p.purchasePrice,
         p.sellingPrice, p.minStock, p.emoji, ctx.storeId]
      );
      await cl.query("delete from product_units where product_id = $1", [p.id]);
    } else {
      const inisial = p.name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || "PRD";
      let nomor = 1;
      let kode = "";
      for (;;) {
        kode = `${inisial}-${String(nomor).padStart(4, "0")}`;
        const tabrakan = await cl.query("select 1 from products where store_id=$1 and sku=$2", [
          ctx.storeId, kode,
        ]);
        if (tabrakan.rows.length === 0) break;
        nomor++;
        if (nomor > 999) gagal("Kode barang otomatis sudah penuh, isi SKU manual ya.");
      }
      const dibuat = await cl.query(
        `insert into products (store_id, name, sku, barcode, unit, category_id, purchase_price,
           selling_price, stock_qty, min_stock, image_url)
         values ($1,$2,$3,$4,$5,$6,$7,$8,0,$9,$10) returning id`,
        [ctx.storeId, p.name, kode, p.barcode || null, p.unit, p.categoryId || null,
         p.purchasePrice, p.sellingPrice, p.minStock, p.fotoUrl || p.emoji]
      );
      produkId = dibuat.rows[0].id;
      if (p.stockQty > 0) {
        await cl.query("select kas_ubah_stok($1,$2)", [produkId, p.stockQty]);
        await cl.query(
          `insert into stock_mutations (store_id, product_id, mutation_type, reason, quantity, note, created_by)
           values ($1,$2,'in','adjustment',$3,'Stok awal saat produk dibuat',$4)`,
          [ctx.storeId, produkId, p.stockQty, ctx.userId]
        );
      }
    }
    for (const u of p.units) {
      if (u.unitName.toLowerCase() === p.unit.toLowerCase()) continue;
      await cl.query(
        `insert into product_units (product_id, unit_name, conversion_factor, selling_price)
         values ($1,$2,$3,$4)`,
        [produkId, u.unitName, u.conversionFactor, u.sellingPrice]
      );
    }
    return produkId ?? undefined;
  }).catch((e) => {
    const m = String((e as Error).message);
    if (m.includes("duplicate key") && m.includes("barcode")) gagal("Barcode sudah dipakai produk lain di toko ini.");
    throw e;
  });
}

export async function toggleProduk(ctx: KonteksMinimal, id: string): Promise<void> {
  if (ctx.peran !== "owner") gagal("Hanya pemilik toko yang boleh melakukan ini.");
  await tanyaPakaiSesi(
    ctx.userId,
    "update products set is_active = not is_active where id = $1 and store_id = $2",
    [id, ctx.storeId]
  );
}

export async function tambahKategori(ctx: KonteksMinimal, nama: string): Promise<void> {
  if (ctx.peran !== "owner") gagal("Hanya pemilik toko yang boleh melakukan ini.");
  try {
    await tanyaPakaiSesi(
      ctx.userId,
      "insert into categories (store_id, name) values ($1,$2)",
      [ctx.storeId, nama.trim()]
    );
  } catch {
    gagal("Kategori itu sudah ada.");
  }
}

// ---------- stok ----------

export async function catatBarangMasuk(
  ctx: KonteksMinimal,
  input: { productId: string; qty: number; catatan: string }
): Promise<void> {
  if (input.qty <= 0) gagal("Isi jumlah barang yang masuk.");
  const nama = await tanyaPakaiSesi<{ name: string }>(
    ctx.userId,
    "select name from products where id=$1 and store_id=$2",
    [input.productId, ctx.storeId]
  );
  if (nama.length === 0) gagal("Produk tidak ditemukan.");
  await tanyaPakaiSesi(ctx.userId, "select kas_ubah_stok($1,$2) from (select 1) x", [
    input.productId,
    input.qty,
  ]);
  await tanyaPakaiSesi(
    ctx.userId,
    `insert into stock_mutations (store_id, product_id, mutation_type, reason, quantity, note, created_by)
     values ($1,$2,'in','purchase',$3,$4,$5)`,
    [ctx.storeId, input.productId, input.qty, input.catatan || "Barang masuk (kulakan)", ctx.userId]
  );
}

export async function catatBarangKeluar(
  ctx: KonteksMinimal,
  input: { productId: string; qty: number; reason: "damage" | "adjustment"; catatan: string }
): Promise<void> {
  if (input.qty <= 0) gagal("Jumlah harus lebih dari nol.");
  const stok = await tanyaPakaiSesi<{ stock_qty: number; name: string }>(
    ctx.userId,
    "select stock_qty::float8 as stock_qty, name from products where id=$1 and store_id=$2",
    [input.productId, ctx.storeId]
  );
  if (stok.length === 0) gagal("Produk tidak ditemukan.");
  if (stok[0].stock_qty < input.qty) gagal(`Stok ${stok[0].name} hanya ${stok[0].stock_qty}.`);
  await tanyaPakaiSesi(ctx.userId, "select kas_ubah_stok($1,$2) from (select 1) x", [
    input.productId,
    -input.qty,
  ]);
  await tanyaPakaiSesi(
    ctx.userId,
    `insert into stock_mutations (store_id, product_id, mutation_type, reason, quantity, note, created_by)
     values ($1,$2,'out',$3,$4,$5,$6)`,
    [ctx.storeId, input.productId, input.reason, input.qty,
     input.catatan || (input.reason === "damage" ? "Rusak/hilang" : "Stok opname"), ctx.userId]
  );
}

export async function tambahPelanggan(
  ctx: KonteksMinimal,
  nama: string,
  telepon?: string
): Promise<string> {
  if (!nama.trim()) gagal("Isi nama pelanggan.");
  const r = await tanyaPakaiSesi<{ id: string }>(
    ctx.userId,
    "insert into customers (store_id, name, phone) values ($1,$2,$3) returning id",
    [ctx.storeId, nama.trim(), telepon?.trim() || null]
  );
  return r[0].id;
}

export async function tambahSupplier(ctx: KonteksMinimal, nama: string, telepon?: string): Promise<void> {
  if (ctx.peran !== "owner") gagal("Hanya pemilik yang bisa menambah supplier.");
  if (!nama.trim()) gagal("Isi nama supplier.");
  await tanyaPakaiSesi(
    ctx.userId,
    "insert into suppliers (store_id, name, phone) values ($1,$2,$3)",
    [ctx.storeId, nama.trim(), telepon?.trim() || null]
  );
}

// ---------- uang ----------

export async function catatPengeluaran(
  ctx: KonteksMinimal,
  input: { title: string; amount: number; note?: string }
): Promise<void> {
  if (!input.title?.trim()) gagal("Isi dulu keperluan pengeluarannya.");
  if (input.amount <= 0) gagal("Nominal pengeluaran harus lebih dari nol.");
  const jumlah = Math.round(input.amount);
  const ex = await tanyaPakaiSesi<{ id: string }>(
    ctx.userId,
    `insert into expenses (store_id, title, amount, note, created_by)
     values ($1,$2,$3,$4,$5) returning id`,
    [ctx.storeId, input.title.trim(), jumlah, input.note ?? null, ctx.userId]
  );
  await tanyaPakaiSesi(
    ctx.userId,
    `insert into cash_flows (store_id, flow_type, amount, category, method, reference_type, reference_id)
     values ($1,'out',$2,'expense','cash','expense',$3)`,
    [ctx.storeId, jumlah, ex[0].id]
  );
}

export async function terimaPembayaranKasbon(
  ctx: KonteksMinimal,
  input: { receivableId: string; amount: number }
): Promise<void> {
  if (input.amount <= 0) gagal("Isi nominal pembayaran.");
  await denganKlien(ctx.userId, async (cl) => {
    const r = await cl.query(
      `select original_amount::float8 as total, paid_amount::float8 as dibayar
       from receivables where id=$1 and store_id=$2 for update`,
      [input.receivableId, ctx.storeId]
    );
    if (r.rows.length === 0) gagal("Kasbon tidak ditemukan.");
    const sisa = r.rows[0].total - r.rows[0].dibayar;
    if (input.amount > sisa) gagal(`Bayar maksimal sesuai sisa kasbon (${sisa}).`);
    await cl.query(
      `insert into receivable_payments (store_id, receivable_id, amount, note, accepted_by)
       values ($1,$2,$3,'Pembayaran kasbon',$4)`,
      [ctx.storeId, input.receivableId, input.amount, ctx.userId]
    );
    await cl.query(
      `insert into cash_flows (store_id, flow_type, amount, category, method, reference_type, reference_id)
       values ($1,'in',$2,'receivable_payment','cash','receivable',$3)`,
      [ctx.storeId, input.amount, input.receivableId]
    );
    const baru = r.rows[0].dibayar + input.amount;
    await cl.query(
      `update receivables set paid_amount=$2::numeric, status = case when $2::numeric >= $3::numeric then 'paid' else 'partial' end where id=$1`,
      [input.receivableId, baru, r.rows[0].total]
    );
  });
}

export async function bayarHutangSupplier(
  ctx: KonteksMinimal,
  input: { payableId: string; amount: number }
): Promise<void> {
  if (input.amount <= 0) gagal("Isi nominal pembayaran.");
  await denganKlien(ctx.userId, async (cl) => {
    const p = await cl.query(
      `select original_amount::float8 as total, paid_amount::float8 as dibayar
       from payables where id=$1 and store_id=$2 for update`,
      [input.payableId, ctx.storeId]
    );
    if (p.rows.length === 0) gagal("Hutang tidak ditemukan.");
    const sisa = p.rows[0].total - p.rows[0].dibayar;
    if (input.amount > sisa) gagal(`Maksimal bayar sesuai sisa hutang (${sisa}).`);
    await cl.query(
      `insert into payable_payments (store_id, payable_id, amount, accepted_by) values ($1,$2,$3,$4)`,
      [ctx.storeId, input.payableId, input.amount, ctx.userId]
    );
    await cl.query(
      `insert into cash_flows (store_id, flow_type, amount, category, method, reference_type, reference_id)
       values ($1,'out',$2,'payable_payment','cash','payable',$3)`,
      [ctx.storeId, input.amount, input.payableId]
    );
    const baru = p.rows[0].dibayar + input.amount;
    await cl.query(
      `update payables set paid_amount=$2::numeric, status = case when $2::numeric >= $3::numeric then 'paid' else 'partial' end where id=$1`,
      [input.payableId, baru, p.rows[0].total]
    );
  });
}

export interface ItemPembelian {
  productId: string;
  qty: number;
  unitCost: number;
}

export async function catatPembelian(
  ctx: KonteksMinimal,
  input: { supplierId: string; status: "paid" | "credit"; items: ItemPembelian[] }
): Promise<string> {
  if (ctx.peran !== "owner") gagal("Hanya pemilik toko yang boleh mencatat pembelian.");
  if (input.items.length === 0) gagal("Isi minimal satu barang.");
  return denganKlien(ctx.userId, async (cl) => {
    const sup = await cl.query("select name from suppliers where id=$1 and store_id=$2", [
      input.supplierId, ctx.storeId,
    ]);
    if (sup.rows.length === 0) gagal("Pilih supplier dulu ya.");

    let total = 0;
    const rincian: { id: string; qty: number; cost: number; total: number }[] = [];
    for (const i of input.items) {
      if (i.qty <= 0) continue;
      const p = await cl.query(
        `select id from products where id=$1 and store_id=$2 for update`,
        [i.productId, ctx.storeId]
      );
      if (p.rows.length === 0) gagal("Ada barang yang tidak ditemukan.");
      const lineTotal = Math.round(i.qty * i.unitCost);
      total += lineTotal;
      rincian.push({ id: i.productId, qty: i.qty, cost: i.unitCost, total: lineTotal });
    }
    if (rincian.length === 0) gagal("Isi jumlah barang minimal satu.");

    const noFaktur = await cl.query(
      `select 'F-' || to_char(current_date,'YYYY') || '-' || to_char(current_date,'MM') ||
              lpad((count(*)+1)::text, 2, '0') as nomor
       from purchases where store_id=$1 and created_at::date >= date_trunc('month', current_date)`,
      [ctx.storeId]
    );
    const invoice = noFaktur.rows[0].nomor as string;

    const pur = await cl.query(
      `insert into purchases (store_id, supplier_id, invoice_number, status, subtotal, total, paid_at, created_by)
       values ($1,$2,$3,$4,$5,$5, case when $4='paid' then now() end, $6) returning id`,
      [ctx.storeId, input.supplierId, invoice, input.status, total, ctx.userId]
    );
    for (const i of rincian) {
      await cl.query(
        `insert into purchase_items (purchase_id, product_id, quantity, unit_cost, total) values ($1,$2,$3,$4,$5)`,
        [pur.rows[0].id, i.id, i.qty, i.cost, i.total]
      );
      // harga beli terakhir ikut diperbarui — jadi patokan HPP produk
      await cl.query("update products set purchase_price=$2 where id=$1 and store_id=$3", [
        i.id, i.cost, ctx.storeId,
      ]);
      await cl.query("select kas_ubah_stok($1,$2)", [i.id, i.qty]);
      await cl.query(
        `insert into stock_mutations (store_id, product_id, mutation_type, reason, quantity, purchase_id, note, created_by)
         values ($1,$2,'in','purchase',$3,$4,$5,$6)`,
        [ctx.storeId, i.id, i.qty, pur.rows[0].id, `Beli dari ${sup.rows[0].name}`, ctx.userId]
      );
    }
    if (input.status === "credit") {
      await cl.query(
        `insert into payables (store_id, purchase_id, supplier_id, original_amount, status)
         values ($1,$2,$3,$4,'unpaid')`,
        [ctx.storeId, pur.rows[0].id, input.supplierId, total]
      );
    } else {
      await cl.query(
        `insert into cash_flows (store_id, flow_type, amount, category, method, reference_type, reference_id)
         values ($1,'out',$2,'purchase_payment','cash','purchase',$3)`,
        [ctx.storeId, total, pur.rows[0].id]
      );
    }
    return invoice;
  });
}

// ---------- akun kasir & toko ----------

export async function tambahKasirAkun(
  ctx: KonteksMinimal,
  input: { nama: string; email: string; pin: string }
): Promise<void> {
  if (ctx.peran !== "owner") gagal("Hanya pemilik yang bisa membuat akun kasir.");
  if (!/^\d{4,6}$/.test(input.pin)) gagal("PIN harus 4-6 angka.");
  if (!input.nama.trim() || !/^\S+@\S+\.\S+$/.test(input.email)) gagal("Nama & email kasir wajib benar.");
  try {
    await tanyaPakaiSesi(
      ctx.userId,
      "select kas_tambah_kasir($1,$2,$3,$4,$5) from (select 1) x",
      [
        ctx.storeId,
        input.nama.trim(),
        input.email.trim().toLowerCase(),
        hashKredensial(input.pin),
        hashKredensial(crypto.randomUUID()),
      ]
    );
  } catch (e) {
    const m = String((e as Error).message);
    if (m.includes("EMAIL_PAKAI")) gagal("Email kasir sudah dipakai.");
    throw e;
  }
}

export async function toggleKasirAkun(ctx: KonteksMinimal, userId: string, aktif: boolean): Promise<void> {
  if (ctx.peran !== "owner") gagal("Hanya pemilik yang bisa mengubah akun kasir.");
  await tanyaPakaiSesi(
    ctx.userId,
    `update store_members set status = $3 where store_id=$1 and user_id=$2 and role='cashier'`,
    [ctx.storeId, userId, aktif ? "active" : "inactive"]
  );
}

export async function gantiPinKasir(ctx: KonteksMinimal, userId: string, pin: string): Promise<void> {
  if (ctx.peran !== "owner") gagal("Hanya pemilik yang bisa mengatur PIN.");
  if (!/^\d{4,6}$/.test(pin)) gagal("PIN harus 4-6 angka.");
  await tanyaPakaiSesi(
    ctx.userId,
    "update store_members set cashier_pin = $3 where store_id=$1 and user_id=$2",
    [ctx.storeId, userId, hashKredensial(pin)]
  );
}

export async function simpanIdentitasToko(
  ctx: KonteksMinimal,
  input: { nama: string; alamat: string; telepon: string; kakiStruk: string }
): Promise<void> {
  if (ctx.peran !== "owner") gagal("Hanya pemilik yang bisa mengubah profil toko.");
  await tanyaPakaiSesi(
    ctx.userId,
    "update stores set name=$2, address=$3, phone=$4, receipt_footer=$5 where id=$1",
    [ctx.storeId, input.nama.trim(), input.alamat.trim(), input.telepon.trim(), input.kakiStruk.trim()]
  );
}

export async function tandaiNotifDibaca(ctx: KonteksMinimal): Promise<void> {
  await tanyaPakaiSesi(
    ctx.userId,
    "update notifications set is_read = true where user_id = $1 and is_read = false",
    [ctx.userId]
  );
}
