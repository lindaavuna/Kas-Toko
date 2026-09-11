/* eslint-disable */
import { tanyaPakaiSesi as tanya } from "./db";
import type { Konteks } from "./sesi";
import type {
  AppNotification,
  Category,
  Customer,
  Expense,
  Payable,
  Product,
  ProductUnit,
  Purchase,
  Receivable,
  Sale,
  Shift,
  StockMutation,
  Supplier,
} from "@/lib/types";

type Row = Record<string, unknown>;
const n = (v: any) => Number(v ?? 0);
const t = (v: any) => (v ? new Date(v as string).toISOString() : undefined) as string;

function petakanProduk(r: Row, units: ProductUnit[]): Product {
  return {
    id: r.id as string,
    name: r.name as string,
    sku: r.sku as string,
    barcode: (r.barcode as string) ?? undefined,
    unit: r.unit as string,
    categoryId: (r.category_id as string) ?? undefined,
    purchasePrice: n(r.purchase_price),
    sellingPrice: n(r.selling_price),
    stockQty: n(r.stock_qty),
    minStock: n(r.min_stock),
    // image_url dipakai ganda: emoji ikon ATAU url foto hasil upload
    emoji: String(r.image_url ?? "").startsWith("/api/foto") ? "🖼️" : (r.image_url as string) || "📦",
    fotoUrl: String(r.image_url ?? "").startsWith("/api/foto") ? (r.image_url as string) : undefined,
    units: units.length ? units : undefined,
    isActive: Boolean(r.is_active),
  };
}

export async function ambilKategori(ctx: Konteks): Promise<Category[]> {
  const rows = await tanya(ctx.userId, "select id, name from categories order by name");
  return rows.map((r) => ({ id: r.id as string, name: r.name as string }));
}

export async function ambilProduk(ctx: Konteks): Promise<Product[]> {
  const rows = await tanya(
    ctx.userId,
    "select id, name, sku, barcode, unit, category_id, purchase_price, selling_price, stock_qty, min_stock, image_url, is_active from products order by name"
  );
  const unitRows = await tanya(
    ctx.userId,
    `select pu.id, pu.product_id, pu.unit_name, pu.conversion_factor, pu.selling_price, pu.is_base_unit
     from product_units pu join products p on p.id = pu.product_id
     where p.store_id = $1 order by pu.conversion_factor`,
    [ctx.storeId]
  );
  return rows.map((r) =>
    petakanProduk(
      r,
      unitRows
        .filter((u) => u.product_id === r.id)
        .map((u) => ({
          unitName: u.unit_name as string,
          conversionFactor: n(u.conversion_factor),
          sellingPrice: n(u.selling_price),
        }))
    )
  );
}

export async function ambilPelanggan(ctx: Konteks): Promise<Customer[]> {
  const rows = await tanya(
    ctx.userId,
    "select id, name, phone, address from customers where is_active order by name"
  );
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    phone: (r.phone as string) ?? undefined,
    address: (r.address as string) ?? undefined,
  }));
}

export async function ambilSupplier(ctx: Konteks): Promise<Supplier[]> {
  const rows = await tanya(
    ctx.userId,
    "select id, name, phone, address from suppliers where is_active order by name"
  );
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    phone: (r.phone as string) ?? undefined,
    address: (r.address as string) ?? undefined,
  }));
}

function petakanShift(r: Row): Shift {
  return {
    id: r.id as string,
    cashierId: r.cashier_id as string,
    cashierName: r.cashier_name as string,
    openedAt: t(r.opened_at),
    closedAt: r.closed_at ? t(r.closed_at) : undefined,
    startingCash: n(r.starting_cash),
    actualCash: r.actual_cash != null ? n(r.actual_cash) : undefined,
    expectedCash: r.expected_cash != null ? n(r.expected_cash) : undefined,
    difference: r.cash_difference != null ? n(r.cash_difference) : undefined,
    status: r.status as Shift["status"],
  };
}

const SHIFT_KOLOM = `select cs.id, cs.cashier_id, u.full_name as cashier_name, cs.opened_at, cs.closed_at,
  cs.starting_cash, cs.expected_cash, cs.actual_cash, cs.cash_difference, cs.status
  from cashier_shifts cs join users u on u.id = cs.cashier_id`;

export async function ambilShiftAktif(ctx: Konteks): Promise<Shift | null> {
  const rows = await tanya(
    ctx.userId,
    `${SHIFT_KOLOM} where cs.store_id = $1 and cs.status = 'open' and cs.cashier_id = $2 limit 1`,
    [ctx.storeId, ctx.userId]
  );
  return rows.length ? petakanShift(rows[0]) : null;
}

/** Semua shift toko (pemilik); untuk kasir hanya miliknya — RLS membatasi anyway */
export async function ambilRiwayatShift(ctx: Konteks): Promise<Shift[]> {
  const rows = await tanya(
    ctx.userId,
    `${SHIFT_KOLOM} where cs.store_id = $1 and cs.status = 'closed' order by cs.closed_at desc limit 30`,
    [ctx.storeId]
  );
  return rows.map(petakanShift);
}

export async function ambilPenjualan(
  ctx: Konteks,
  opts: { hanyaKasirSaya?: boolean; sejak?: string; limit?: number; id?: string } = {}
): Promise<Sale[]> {
  const syarat: string[] = ["s.store_id = $1"];
  const params: any[] = [ctx.storeId];
  if (opts.hanyaKasirSaya) {
    params.push(ctx.userId);
    syarat.push(`s.cashier_id = $${params.length}`);
  }
  if (opts.sejak) {
    params.push(opts.sejak);
    syarat.push(`s.created_at >= $${params.length}`);
  }
  if (opts.id) {
    params.push(opts.id);
    syarat.push(`s.id = $${params.length}`);
  }
  const batas = opts.limit ?? 200;
  const rows = await tanya(
    ctx.userId,
    `select s.id, s.receipt_number, s.cashier_id, cu.full_name as cashier_name, s.customer_id,
       k.name as customer_name, s.status, s.subtotal, s.discount, s.total,
       s.payment_method, s.amount_paid, s.change_amount, s.transfer_ref, s.void_reason, s.created_at,
       s.paid_at
     from sales s
     join users cu on cu.id = s.cashier_id
     left join customers k on k.id = s.customer_id
     where ${syarat.join(" and ")}
     order by s.created_at desc limit ${Math.min(batas, 500)}`,
    params
  );

  const ids = rows.map((r) => r.id as string);
  const itemRows = ids.length
    ? await tanya<{ sale_id: string } & Row>(ctx.userId,
        `select si.sale_id, si.product_id, p.name, coalesce(pu.unit_name, p.unit) as unit,
           si.quantity, si.unit_price, si.total
         from sale_items si
         join products p on p.id = si.product_id
         left join product_units pu on pu.id = si.product_unit_id
         where si.sale_id = any($1::uuid[])`,
        [ids]
      )
    : [];

  return rows.map((r) => ({
    id: r.id as string,
    receiptNumber: r.receipt_number as string,
    cashierId: r.cashier_id as string,
    cashierName: r.cashier_name as string,
    customerId: (r.customer_id as string) ?? undefined,
    customerName: (r.customer_name as string) ?? undefined,
    status: r.status as Sale["status"],
    subtotal: n(r.subtotal),
    discount: n(r.discount),
    total: n(r.total),
    paymentMethod: r.payment_method as Sale["paymentMethod"],
    amountPaid: n(r.amount_paid),
    changeAmount: n(r.change_amount),
    transferRef: (r.transfer_ref as string) ?? undefined,
    voidReason: (r.void_reason as string) ?? undefined,
    createdAt: t(r.created_at),
    items: itemRows
      .filter((i) => i.sale_id === r.id)
      .map((i) => ({
        productId: i.product_id as string,
        name: i.name as string,
        unit: i.unit as string,
        qty: n(i.quantity),
        price: n(i.unit_price),
        total: n(i.total),
      })),
  }));
}

export async function ambilPengeluaran(ctx: Konteks): Promise<Expense[]> {
  const rows = await tanya(
    ctx.userId,
    `select e.id, e.title, e.category, e.amount, e.paid_at, u.full_name as petugas
     from expenses e left join users u on u.id = e.created_by
     where e.store_id = $1 order by e.paid_at desc limit 200`,
    [ctx.storeId]
  );
  return rows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    category: r.category as string,
    amount: n(r.amount),
    byName: (r.petugas as string) ?? "Petugas",
    createdAt: t(r.paid_at),
  }));
}

export async function ambilMutasi(ctx: Konteks): Promise<StockMutation[]> {
  const rows = await tanya(
    ctx.userId,
    `select sm.id, sm.product_id, p.name as product_name, sm.mutation_type, sm.reason, sm.quantity,
       coalesce(s.receipt_number, pur.invoice_number) as ref, sm.note, sm.created_at, u.full_name as petugas
     from stock_mutations sm
     join products p on p.id = sm.product_id
     left join sales s on s.id = sm.sale_id
     left join purchases pur on pur.id = sm.purchase_id
     left join users u on u.id = sm.created_by
     where sm.store_id = $1 order by sm.created_at desc limit 200`,
    [ctx.storeId]
  );
  return rows.map((r) => ({
    id: r.id as string,
    productId: r.product_id as string,
    productName: r.product_name as string,
    type: r.mutation_type as "in" | "out",
    reason: r.reason as StockMutation["reason"],
    qty: n(r.quantity),
    refNumber: (r.ref as string) ?? undefined,
    note: (r.note as string) ?? undefined,
    byName: (r.petugas as string) ?? "—",
    createdAt: t(r.created_at),
  }));
}

export async function ambilPembelian(ctx: Konteks): Promise<Purchase[]> {
  const rows = await tanya(
    ctx.userId,
    `select pu.id, pu.invoice_number, pu.supplier_id, sp.name as supplier_name, pu.status, pu.total,
       pu.created_at, u.full_name as petugas
     from purchases pu join suppliers sp on sp.id = pu.supplier_id
     left join users u on u.id = pu.created_by
     where pu.store_id = $1 order by pu.created_at desc limit 100`,
    [ctx.storeId]
  );
  const ids = rows.map((r) => r.id as string);
  const itemRows = ids.length
    ? await tanya<Row>(ctx.userId,
        `select pi.purchase_id, p.name, pi.quantity, pi.unit_cost, pi.total
         from purchase_items pi join products p on p.id = pi.product_id
         where pi.purchase_id = any($1::uuid[])`,
        [ids]
      )
    : [];
  return rows.map((r) => ({
    id: r.id as string,
    invoiceNumber: r.invoice_number as string,
    supplierId: r.supplier_id as string,
    supplierName: r.supplier_name as string,
    total: n(r.total),
    status: r.status as Purchase["status"],
    createdAt: t(r.created_at),
    createdByName: (r.petugas as string) ?? "Pemilik",
    items: itemRows
      .filter((i) => i.purchase_id === r.id)
      .map((i) => ({
        productName: i.name as string,
        qty: n(i.quantity),
        unitCost: n(i.unit_cost),
        total: n(i.total),
      })),
  }));
}

export async function ambilKasbon(ctx: Konteks): Promise<Receivable[]> {
  const rows = await tanya(
    ctx.userId,
    `select r.id, r.customer_id, c.name as customer_name, r.original_amount, r.paid_amount, r.status,
       s.receipt_number, r.created_at
     from receivables r
     join customers c on c.id = r.customer_id
     left join sales s on s.id = r.sale_id
     where r.store_id = $1 order by r.created_at desc limit 100`,
    [ctx.storeId]
  );
  const ids = rows.map((r) => r.id as string);
  const payRows = ids.length
    ? await tanya<Row>(ctx.userId,
        `select rp.receivable_id, rp.amount, rp.note, rp.paid_at, u.full_name as petugas
         from receivable_payments rp left join users u on u.id = rp.accepted_by
         where rp.receivable_id = any($1::uuid[]) order by rp.paid_at desc`,
        [ids]
      )
    : [];
  return rows.map((r) => ({
    id: r.id as string,
    customerId: r.customer_id as string,
    customerName: r.customer_name as string,
    saleReceipt: (r.receipt_number as string) ?? undefined,
    originalAmount: n(r.original_amount),
    paidAmount: n(r.paid_amount),
    status: r.status as Receivable["status"],
    createdAt: t(r.created_at),
    payments: payRows
      .filter((p) => p.receivable_id === r.id)
      .map((p) => ({
        id: `${r.id}-${p.paid_at}`,
        amount: n(p.amount),
        note: (p.note as string) ?? undefined,
        acceptedByName: (p.petugas as string) ?? "Petugas",
        paidAt: t(p.paid_at),
      })),
  }));
}

export async function ambilHutang(ctx: Konteks): Promise<Payable[]> {
  const rows = await tanya(
    ctx.userId,
    `select pa.id, pa.supplier_id, sp.name as supplier_name, pa.original_amount, pa.paid_amount,
       pa.status, pu.invoice_number, pa.created_at
     from payables pa
     join suppliers sp on sp.id = pa.supplier_id
     join purchases pu on pu.id = pa.purchase_id
     where pa.store_id = $1 order by pa.created_at desc limit 100`,
    [ctx.storeId]
  );
  const ids = rows.map((r) => r.id as string);
  const payRows = ids.length
    ? await tanya<Row>(ctx.userId,
        `select pp.payable_id, pp.amount, pp.paid_at from payable_payments pp
         where pp.payable_id = any($1::uuid[]) order by pp.paid_at`,
        [ids]
      )
    : [];
  return rows.map((r) => ({
    id: r.id as string,
    supplierId: r.supplier_id as string,
    supplierName: r.supplier_name as string,
    purchaseInvoice: r.invoice_number as string,
    originalAmount: n(r.original_amount),
    paidAmount: n(r.paid_amount),
    status: r.status as Payable["status"],
    createdAt: t(r.created_at),
    payments: payRows
      .filter((p) => p.payable_id === r.id)
      .map((p, i) => ({ id: `${r.id}-${i}`, amount: n(p.amount), paidAt: t(p.paid_at) })),
  }));
}

export async function ambilNotifikasi(ctx: Konteks): Promise<AppNotification[]> {
  const rows = await tanya(
    ctx.userId,
    `select id, type, title, message, is_read, created_at from notifications
     where user_id = $1 order by created_at desc limit 15`,
    [ctx.userId]
  );
  return rows.map((r) => ({
    id: r.id as string,
    type: r.type as AppNotification["type"],
    title: r.title as string,
    message: r.message as string,
    isRead: Boolean(r.is_read),
    createdAt: t(r.created_at),
  }));
}

export interface HitunganShift {
  startingCash: number;
  penjualanTunai: number;
  bayarKasbonTunai: number;
  pengeluaranTunai: number;
}

/** Rincian laci untuk tutup kasir — dari cash_flows sejak shift dibuka */
export async function hitungLaciShift(
  ctx: Konteks,
  shift: Shift
): Promise<HitunganShift> {
  const rows = await tanya<{ key: string; jumlah: number }>(
    ctx.userId,
    `select case
        when flow_type='in' and category='sale_payment' and method='cash' then 'jual'
        when flow_type='in' and category='receivable_payment' then 'kasbon'
        when flow_type='out' and category='expense' then 'keluar'
      end as key, coalesce(sum(amount),0)::numeric as jumlah
     from cash_flows
     where store_id = $1 and created_at >= $2
     group by 1`,
    [ctx.storeId, shift.openedAt]
  );
  const map = Object.fromEntries(rows.map((r) => [r.key, r.jumlah]));
  return {
    startingCash: shift.startingCash,
    penjualanTunai: n(map.jual),
    bayarKasbonTunai: n(map.kasbon),
    pengeluaranTunai: n(map.keluar),
  };
}

// ---------- agregat untuk dasbor & laporan (SQL murni, bukan hitung JS) ----------

export interface StatistikDasbor {
  omsetHari: number;
  labaHari: number;
  pengeluaranHari: number;
  kasbonSisa: number;
  stokTipis: number;
  saldoKasHari: number;
}

export async function statistikDasbor(ctx: Konteks): Promise<StatistikDasbor> {
  const [r] = await tanya<Row>(
    ctx.userId,
    `select
       (select coalesce(sum(total),0) from sales
         where store_id=$1 and created_at::date=current_date and status<>'void') as omset_hari,
       (select coalesce(sum(si.total - p.purchase_price * si.quantity),0)
         from sales s join sale_items si on si.sale_id=s.id join products p on p.id=si.product_id
         where s.store_id=$1 and s.created_at::date=current_date and s.status<>'void') as laba_hari,
       (select coalesce(sum(amount),0) from expenses
         where store_id=$1 and paid_at::date=current_date) as pengeluaran_hari,
       (select coalesce(sum(original_amount - paid_amount),0) from receivables
         where store_id=$1 and status<>'paid') as kasbon_sisa,
       (select count(*)::int from products
         where store_id=$1 and is_active and stock_qty <= min_stock) as stok_tipis,
       (select coalesce(sum(case when flow_type='in' then amount else -amount end),0)
         from cash_flows where store_id=$1 and created_at::date=current_date) as saldo_kas_hari`,
    [ctx.storeId]
  );
  return {
    omsetHari: n(r.omset_hari),
    labaHari: n(r.laba_hari),
    pengeluaranHari: n(r.pengeluaran_hari),
    kasbonSisa: n(r.kasbon_sisa),
    stokTipis: n(r.stok_tipis),
    saldoKasHari: n(r.saldo_kas_hari),
  };
}

export interface TitikHarian {
  tanggal: string;
  omset: number;
  laba: number;
  pengeluaran: number;
}

export async function trenHarian(ctx: Konteks, mulai: string, akhir: string): Promise<TitikHarian[]> {
  const rows = await tanya<Row>(
    ctx.userId,
    `select substring(h.t::text, 1, 10) as tanggal,
       coalesce((select sum(total) from sales s
         where s.store_id=$1 and s.status<>'void' and s.created_at::date between $2 and $3 and s.created_at::date=h.t),0) as omset,
       coalesce((select sum(si.total - p.purchase_price*si.quantity) from sales s
         join sale_items si on si.sale_id=s.id join products p on p.id=si.product_id
         where s.store_id=$1 and s.status<>'void' and s.created_at::date between $2 and $3 and s.created_at::date=h.t),0) as laba,
       coalesce((select sum(amount) from expenses e
         where e.store_id=$1 and e.paid_at::date between $2 and $3 and e.paid_at::date=h.t),0) as pengeluaran
     from generate_series($2::date, $3::date, '1 day') as h(t)
     order by 1`,
    [ctx.storeId, mulai, akhir]
  );
  return rows.map((r) => ({
    tanggal: r.tanggal as string,
    omset: n(r.omset),
    laba: n(r.laba),
    pengeluaran: n(r.pengeluaran),
  }));
}

export interface RingkasanLaporan {
  omset: number;
  hpp: number;
  pengeluaran: number;
  labaKotor: number;
  labaBersih: number;
  jumlahTransaksi: number;
}

export async function ringkasanLaporan(
  ctx: Konteks,
  mulai: string,
  akhir: string
): Promise<RingkasanLaporan> {
  const [r] = await tanya<Row>(
    ctx.userId,
    `select
       coalesce((select sum(total) from sales where store_id=$1 and status<>'void'
         and created_at::date between $2 and $3),0) as omset,
       coalesce((select sum(p.purchase_price*si.quantity) from sales s
         join sale_items si on si.sale_id=s.id join products p on p.id=si.product_id
         where s.store_id=$1 and s.status<>'void' and s.created_at::date between $2 and $3),0) as hpp,
       coalesce((select sum(amount) from expenses where store_id=$1
         and paid_at::date between $2 and $3),0) as pengeluaran,
       (select count(*)::int from sales where store_id=$1 and status<>'void'
         and created_at::date between $2 and $3) as jumlah_transaksi`,
    [ctx.storeId, mulai, akhir]
  );
  const omset = n(r.omset);
  const hpp = n(r.hpp);
  const pengeluaran = n(r.pengeluaran);
  return {
    omset,
    hpp,
    pengeluaran,
    labaKotor: omset - hpp,
    labaBersih: omset - hpp - pengeluaran,
    jumlahTransaksi: n(r.jumlah_transaksi),
  };
}

export interface ArusKasBaris {
  waktu: string;
  keterangan: string;
  masuk: number;
  keluar: number;
}

export async function arusKas(
  ctx: Konteks,
  mulai: string,
  akhir: string
): Promise<ArusKasBaris[]> {
  const rows = await tanya<Row>(
    ctx.userId,
    `select cf.created_at as waktu, cf.flow_type, cf.amount, cf.category, cf.method,
       coalesce(s.receipt_number, pur.invoice_number, e.title) as keterangan
     from cash_flows cf
     left join sales s on cf.reference_type='sale' and s.id = cf.reference_id
     left join purchases pur on cf.reference_type='purchase' and pur.id = cf.reference_id
     left join expenses e on cf.reference_type='expense' and e.id = cf.reference_id
     where cf.store_id=$1 and cf.created_at::date between $2 and $3
     order by cf.created_at desc limit 15`,
    [ctx.storeId, mulai, akhir]
  );
  return rows.map((r) => ({
    waktu: t(r.waktu),
    keterangan: (r.keterangan as string) ?? String(r.category),
    masuk: r.flow_type === "in" ? n(r.amount) : 0,
    keluar: r.flow_type === "out" ? n(r.amount) : 0,
  }));
}

export interface AkunKasirDb {
  id: string;
  nama: string;
  email: string;
  aktif: boolean;
}

/** Definer: hanya pemilik yang bisa lihat daftar akun kasir lengkap dengan email */
export async function ambilAkunKasir(ctx: Konteks): Promise<AkunKasirDb[]> {
  if (ctx.peran !== "owner") return [];
  const rows = await tanya<Row>(ctx.userId, "select * from kas_daftar_kasir($1)", [ctx.storeId]);
  return rows.map((r) => ({
    id: r.id as string,
    nama: r.nama as string,
    email: r.email as string,
    aktif: Boolean(r.aktif),
  }));
}

export async function ambilIdentitasToko(ctx: Konteks) {
  const [r] = await tanya<Row>(
    ctx.userId,
    `select name, address, phone, receipt_footer, currency, subscription_status,
       to_char(subscription_expires_at, 'YYYY-MM-DD') as expires_at,
       ai_enabled, custom_ai_api_key, custom_ai_base_url,
       pg_provider, pg_merchant_code, pg_api_key, pg_is_sandbox, pg_is_active,
       manual_qris_image, manual_bank_name, manual_bank_account, manual_bank_holder
     from stores where id = $1`,
    [ctx.storeId]
  );
  return {
    nama: (r?.name as string) ?? "",
    alamat: (r?.address as string) ?? "",
    telepon: (r?.phone as string) ?? "",
    kakiStruk: (r?.receipt_footer as string) ?? "",
    statusSewa: (r?.subscription_status as string) ?? "trial",
    sewaBerakhir: (r?.expires_at as string) ?? "",
    aiAktif: (r?.ai_enabled as boolean) ?? true,
    aiApiKey: (r?.custom_ai_api_key as string) ?? "",
    aiBaseUrl: (r?.custom_ai_base_url as string) ?? "",
    paymentGateway: {
      provider: (r?.pg_provider as string) ?? "duitku",
      merchantCode: (r?.pg_merchant_code as string) ?? "",
      apiKey: (r?.pg_api_key as string) ?? "",
      isSandbox: (r?.pg_is_sandbox as boolean) ?? true,
      isActive: (r?.pg_is_active as boolean) ?? false,
      manual_qris_image: (r?.manual_qris_image as string) ?? null,
      manual_bank_name: (r?.manual_bank_name as string) ?? "",
      manual_bank_account: (r?.manual_bank_account as string) ?? "",
      manual_bank_holder: (r?.manual_bank_holder as string) ?? "",
    }
  };
}

export async function ambilPlatformSewaConfig() {
  const [r] = await tanya<any>(
    "system",
    `select monthly_subscription_fee, yearly_subscription_fee, trial_days, primary_gateway,
            manual_qris_image, manual_bank_name, manual_bank_account, manual_bank_holder, manual_qris_is_active 
     from platform_settings where id = 1`
  );
  return {
    monthlyFee: r?.monthly_subscription_fee || 50000,
    yearlyFee: r?.yearly_subscription_fee || 550000,
    trialDays: r?.trial_days || 7,
    primaryGateway: r?.primary_gateway || "paywuz",
    manualQris: r?.manual_qris_is_active ? {
      image: r.manual_qris_image,
      bankName: r.manual_bank_name,
      account: r.manual_bank_account,
      holder: r.manual_bank_holder
    } : null
  };
}

/** Saldo kasbon per pelanggan utk loket & buku kasbon */
export async function sisaKasbonPerPelanggan(ctx: Konteks): Promise<Record<string, number>> {
  const rows = await tanya<{ customer_id: string; sisa: number }>(
    ctx.userId,
    `select customer_id, sum(original_amount - paid_amount)::numeric as sisa
     from receivables where store_id=$1 and status<>'paid' group by customer_id`,
    [ctx.storeId]
  );
  return Object.fromEntries(rows.map((r) => [r.customer_id, n(r.sisa)]));
}

export async function ambilProdukMenipis(ctx: Konteks) {
  const rows = await tanya<{ name: string; stock_qty: number; min_stock: number }>(
    ctx.userId,
    `select name, stock_qty::float8, min_stock::float8
     from products
     where store_id = $1 and is_active = true and stock_qty <= min_stock
     order by stock_qty asc limit 100`,
    [ctx.storeId]
  );
  return rows.map(r => ({
    nama: r.name,
    sisa: Number(r.stock_qty),
    batasMin: Number(r.min_stock)
  }));
}
