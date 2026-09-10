"use server";

import { revalidatePath } from "next/cache";
import { butuhKonteks, type HasilAksi } from "./aksi-auth";
import {
  GagalBisnis,
  bayarHutangSupplier,
  catatPengeluaran,
  catatPembelian,
  gantiPinKasir,
  simpanIdentitasToko,
  tambahKasirAkun,
  tambahSupplier,
  tandaiNotifDibaca,
  terimaPembayaranKasbon,
  toggleKasirAkun,
} from "./bisnis";

async function jalankan<T>(fn: () => Promise<T>): Promise<{ ok: true; data: T } | { ok: false; pesan: string }> {
  try {
    const data = await fn();
    revalidatePath("/", "layout");
    return { ok: true, data };
  } catch (e) {
    return { ok: false, pesan: e instanceof GagalBisnis ? e.message : "Aksi gagal, coba lagi." };
  }
}

export async function aksiCatatPembelian(input: {
  supplierId: string;
  status: "paid" | "credit";
  items: { productId: string; qty: number; unitCost: number }[];
}): Promise<HasilAksi> {
  const r = await jalankan(async () => {
    const ctx = await butuhKonteks();
    return catatPembelian(ctx, input);
  });
  if (!r.ok) return r;
  return {
    ok: true,
    pesan: `${r.data} tercatat — stok bertambah${input.status === "credit" ? ", hutang dicatat ke supplier." : " (bayar tunai)."}`,
  };
}

export async function aksiBayarHutangSupplier(input: {
  payableId: string;
  amount: number;
}): Promise<HasilAksi> {
  const r = await jalankan(async () => {
    const ctx = await butuhKonteks();
    await bayarHutangSupplier(ctx, input);
  });
  return r.ok ? { ok: true, pesan: "Pembayaran hutang supplier tercatat." } : r;
}

export async function aksiTerimaPembayaranKasbon(input: {
  receivableId: string;
  amount: number;
}): Promise<HasilAksi> {
  const r = await jalankan(async () => {
    const ctx = await butuhKonteks();
    await terimaPembayaranKasbon(ctx, input);
  });
  return r.ok ? { ok: true, pesan: "Pembayaran kasbon masuk kas laci." } : r;
}

export async function aksiCatatPengeluaran(input: {
  title: string;
  amount: number;
  note?: string;
}): Promise<HasilAksi> {
  const r = await jalankan(async () => {
    const ctx = await butuhKonteks();
    await catatPengeluaran(ctx, input);
  });
  return r.ok ? { ok: true, pesan: "Pengeluaran tercatat dari kas laci." } : r;
}

export async function aksiTambahKasirAkun(input: {
  nama: string;
  email: string;
  pin: string;
}): Promise<HasilAksi> {
  const r = await jalankan(async () => {
    const ctx = await butuhKonteks();
    await tambahKasirAkun(ctx, input);
  });
  return r.ok ? { ok: true, pesan: `Akun kasir ${input.nama} dibuat.` } : r;
}

export async function aksiToggleKasirAkun(userId: string, aktif: boolean): Promise<HasilAksi> {
  const r = await jalankan(async () => {
    const ctx = await butuhKonteks();
    await toggleKasirAkun(ctx, userId, aktif);
  });
  return r.ok ? { ok: true, pesan: `Akun kasir ${aktif ? "diaktifkan" : "dinonaktifkan"}.` } : r;
}

export async function aksiGantiPinKasir(userId: string, pin: string): Promise<HasilAksi> {
  const r = await jalankan(async () => {
    const ctx = await butuhKonteks();
    await gantiPinKasir(ctx, userId, pin);
  });
  return r.ok ? { ok: true, pesan: "PIN kasir diperbarui." } : r;
}

export async function aksiSimpanIdentitasToko(input: {
  nama: string;
  alamat: string;
  telepon: string;
  kakiStruk: string;
}): Promise<HasilAksi> {
  const r = await jalankan(async () => {
    const ctx = await butuhKonteks();
    await simpanIdentitasToko(ctx, input);
  });
  return r.ok ? { ok: true, pesan: "Profil toko tersimpan." } : r;
}

export async function aksiTandaiNotifDibaca(): Promise<HasilAksi> {
  const r = await jalankan(async () => {
    const ctx = await butuhKonteks();
    await tandaiNotifDibaca(ctx);
  });
  return r.ok ? { ok: true, pesan: "Notifikasi ditandai dibaca." } : r;
}

export async function aksiTambahSupplier(nama: string, telepon?: string): Promise<HasilAksi> {
  const r = await jalankan(async () => {
    const ctx = await butuhKonteks();
    await tambahSupplier(ctx, nama, telepon);
  });
  return r.ok ? { ok: true, pesan: `${nama.trim()} ditambahkan ke daftar supplier.` } : r;
}

export async function aksiSimpanPengaturanAI(input: {
  aktif: boolean;
  apiKey?: string;
  baseUrl?: string;
}): Promise<HasilAksi> {
  const r = await jalankan(async () => {
    const ctx = await butuhKonteks();
    if (ctx.peran !== "owner") throw new GagalBisnis("Hanya pemilik yang bisa mengubah AI.");
    const { tanyaPakaiSesi } = await import("./db");
    await tanyaPakaiSesi(
      ctx.userId,
      "update stores set ai_enabled = $2, custom_ai_api_key = $3, custom_ai_base_url = $4 where id = $1",
      [ctx.storeId, input.aktif, input.apiKey?.trim() || null, input.baseUrl?.trim() || null]
    );
  });
  return r.ok ? { ok: true, pesan: "Pengaturan asisten AI disimpan." } : r;
}

export async function aksiSimpanPaymentGateway(input: {
  provider: string;
  merchantCode: string;
  apiKey: string;
  isSandbox: boolean;
  isActive: boolean;
  manual_qris_image: string | null;
  manual_bank_name: string | null;
  manual_bank_account: string | null;
  manual_bank_holder: string | null;
}): Promise<HasilAksi> {
  const r = await jalankan(async () => {
    const ctx = await butuhKonteks();
    if (ctx.peran !== "owner") throw new GagalBisnis("Hanya pemilik yang bisa mengubah pengaturan pembayaran.");
    
    // Validasi Zod-like sederhana
    if (!["duitku", "paywuz"].includes(input.provider)) throw new GagalBisnis("Provider tidak valid.");
    
    const { tanyaPakaiSesi } = await import("./db");
    await tanyaPakaiSesi(
      ctx.userId,
      `update stores 
       set pg_provider = $2, pg_merchant_code = $3, pg_api_key = $4, pg_is_sandbox = $5, pg_is_active = $6,
           manual_qris_image = $7, manual_bank_name = $8, manual_bank_account = $9, manual_bank_holder = $10 
       where id = $1`,
      [
        ctx.storeId,
        input.provider,
        input.merchantCode.trim() || null,
        input.apiKey.trim() || null,
        input.isSandbox,
        input.isActive,
        input.manual_qris_image,
        input.manual_bank_name,
        input.manual_bank_account,
        input.manual_bank_holder
      ]
    );
  });
  return r.ok ? { ok: true, pesan: "Pengaturan Pembayaran tersimpan." } : r;
}

