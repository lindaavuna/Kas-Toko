"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { butuhKonteks, type HasilAksi } from "./aksi-auth";
import { ambilShiftAktif } from "./data";
import {
  batalkanPenjualan,
  buatPenjualan,
  bukaShift,
  GagalBisnis,
  rangkumanLaci,
  tutupShift,
  type RangkumanLaci,
} from "./bisnis";
import type { Sale, Shift } from "@/lib/types";

const skemaPenjualan = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        unit: z.string().min(1),
        qty: z.number().positive(),
      })
    )
    .min(1, "Keranjang masih kosong."),
  diskonNilai: z.number().min(0),
  diskonTipe: z.enum(["fixed", "percentage"]),
  metode: z.enum(["cash", "qris_duitku", "qris_manual", "bank_transfer", "credit"]),
  uangDiterima: z.number().min(0).default(0),
  customerId: z.string().uuid().nullish(),
  transferRef: z.string().max(20).nullish(),
});

export type HasilPenjualan = { ok: true; sale: Sale } | { ok: false; pesan: string };

export async function aksiBuatPenjualan(input: unknown): Promise<HasilPenjualan> {
  let ctx;
  try {
    ctx = await butuhKonteks();
  } catch {
    return { ok: false, pesan: "Sesi berakhir, silakan masuk kembali." };
  }
  const parsed = skemaPenjualan.safeParse(input);
  if (!parsed.success) return { ok: false, pesan: parsed.error.issues[0].message };
  try {
    const sale = await buatPenjualan(ctx, parsed.data);
    revalidatePath("/", "layout");
    return { ok: true, sale };
  } catch (e) {
    return { ok: false, pesan: e instanceof GagalBisnis ? e.message : "Transaksi gagal, coba lagi." };
  }
}

export async function aksiBatalkanPenjualan(input: {
  saleId: string;
  alasan: string;
  pinPemilik: string;
}): Promise<HasilAksi> {
  let ctx;
  try {
    ctx = await butuhKonteks();
  } catch {
    return { ok: false, pesan: "Sesi berakhir, silakan masuk kembali." };
  }
  try {
    await batalkanPenjualan(ctx, input);
    revalidatePath("/", "layout");
    return { ok: true, pesan: "Transaksi berhasil dibatalkan." };
  } catch (e) {
    return { ok: false, pesan: e instanceof GagalBisnis ? e.message : "Gagal membatalkan transaksi." };
  }
}

export async function aksiBukaShift(modalAwal: number): Promise<HasilAksi & { shift?: Shift }> {
  let ctx;
  try {
    ctx = await butuhKonteks();
  } catch {
    return { ok: false, pesan: "Sesi berakhir, silakan masuk kembali." };
  }
  const sudah = await ambilShiftAktif(ctx);
  if (sudah) return { ok: false, pesan: "Kasir sudah dibuka. Tutup dulu sebelum buka baru." };
  try {
    const shift = await bukaShift(ctx, modalAwal);
    revalidatePath("/", "layout");
    return { ok: true, pesan: "Kasir dibuka. Semoga hari ini laris!", shift };
  } catch (e) {
    return { ok: false, pesan: e instanceof GagalBisnis ? e.message : "Gagal membuka kasir." };
  }
}

export type HasilTutupAksi = HasilAksi & Partial<Awaited<ReturnType<typeof tutupShift>>>;

export async function aksiTutupShift(uangFisik: number): Promise<HasilTutupAksi> {
  let ctx;
  try {
    ctx = await butuhKonteks();
  } catch {
    return { ok: false, pesan: "Sesi berakhir, silakan masuk kembali." };
  }
  try {
    const hasil = await tutupShift(ctx, uangFisik);
    revalidatePath("/", "layout");
    return {
      ok: true,
      pesan:
        hasil.status === "seimbang"
          ? "Uang laci cocok — shift ditutup rapi."
          : `Shift ditutup, uang ${hasil.status}.`,
      ...hasil,
    };
  } catch (e) {
    return { ok: false, pesan: e instanceof GagalBisnis ? e.message : "Gagal menutup kasir." };
  }
}

/** Data hidup utk dialog tutup kasir (dipanggil saat membuka dialog) */
export async function aksiRangkumanLaci(): Promise<
  { ok: true; shift: Shift; laci: RangkumanLaci } | { ok: false; pesan: string }
> {
  let ctx;
  try {
    ctx = await butuhKonteks();
  } catch {
    return { ok: false, pesan: "Sesi berakhir, silakan masuk kembali." };
  }
  const shift = await ambilShiftAktif(ctx);
  if (!shift) return { ok: false, pesan: "Kasir belum dibuka." };
  return { ok: true, shift, laci: await rangkumanLaci(ctx, shift) };
}
