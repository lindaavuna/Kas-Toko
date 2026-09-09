"use server";

import { z } from "zod";
import { butuhKonteks } from "./aksi-auth";
import { arusKas, ringkasanLaporan, trenHarian } from "./data";

const skemaRentang = z.object({
  mulai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  akhir: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/** Query laporan sesuai rentang tanggal — dipakai filter pada halaman Laporan */
export async function aksiAmbilLaporan(mulai: string, akhir: string) {
  try {
    const ctx = await butuhKonteks();
    const r = skemaRentang.safeParse({ mulai, akhir });
    if (!r.success) return { ok: false as const, pesan: "Rentang tanggal tidak valid." };
    const [ringkasan, tren, arus] = await Promise.all([
      ringkasanLaporan(ctx, r.data.mulai, r.data.akhir),
      trenHarian(ctx, r.data.mulai, r.data.akhir),
      arusKas(ctx, r.data.mulai, r.data.akhir),
    ]);
    return { ok: true as const, ringkasan, tren, arus };
  } catch {
    return { ok: false as const, pesan: "Sesi berakhir, silakan masuk kembali." };
  }
}
