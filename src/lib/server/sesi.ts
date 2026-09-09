import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { tanya } from "./db";
import { bacaToken, hashToken, tandaToken, type IsiSesi } from "./kredensial";
import { NAMA_COOKIE, UMUR_SESI_HARI } from "./konstanta";

const UMUR_HARI = UMUR_SESI_HARI;

export interface Konteks {
  userId: string;
  nama: string;
  email: string;
  peran: "owner" | "cashier";
  storeId: string;
  storeName: string;
  token: string;
}

/**
 * Satu-satunya gerbang identitas request. Cookie signature cuma percepatan
 * (proxy); keabsahan nyata tetap dicek ke app_sessions + store_members,
 * akun nonaktif / keluar toko otomatis kehilangan akses.
 */
export const ambilKonteks = cache(async (): Promise<Konteks | null> => {
  const store = await cookies();
  const token = store.get(NAMA_COOKIE)?.value;
  if (!token) return null;

  const isi = bacaToken(token);
  if (!isi) return null;

  const sesi = await tanya<{ user_id: string }>(
    "select user_id from kas_read_session($1)",
    [hashToken(token)]
  );
  if (sesi.length === 0) return null;

  const ctx = await tanya<{
    user_id: string; full_name: string; email: string;
    store_id: string; store_name: string; role: "owner" | "cashier";
    subscription_status: string;
  }>("select * from kas_user_context($1)", [isi.uid]);
  if (ctx.length === 0) return null;
  if (ctx[0].subscription_status === "expired") return null;

  return {
    userId: ctx[0].user_id,
    nama: ctx[0].full_name,
    email: ctx[0].email,
    peran: ctx[0].role,
    storeId: ctx[0].store_id,
    storeName: ctx[0].store_name,
    token,
  };
});

export async function pasangCookieSesi(isi: IsiSesi): Promise<string> {
  const store = await cookies();
  const token = tandaToken(isi);
  store.set(NAMA_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: UMUR_HARI * 24 * 60 * 60,
  });
  return token;
}

export async function hapusCookieSesi() {
  const store = await cookies();
  store.delete(NAMA_COOKIE);
}

export function jatuhTempoSesi(): number {
  return Math.floor(Date.now() / 1000) + UMUR_HARI * 24 * 60 * 60;
}
