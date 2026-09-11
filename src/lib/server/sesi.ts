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
  isSuperadmin: boolean;
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

  const dbData = await tanya<{
    u_id: string; full_name: string; email: string; is_superadmin: boolean;
    store_id: string | null; store_name: string | null; role: string | null; subscription_status: string | null;
  }>(
    `WITH s AS (SELECT user_id FROM kas_read_session($1)),
          u AS (SELECT * FROM kas_get_user_by_id($2) WHERE id IN (SELECT user_id FROM s)),
          c AS (SELECT * FROM kas_user_context($2))
     SELECT u.id as u_id, u.full_name, u.email, u.is_superadmin,
            c.store_id, c.store_name, c.role, c.subscription_status
     FROM u LEFT JOIN c ON u.id = c.user_id`,
    [hashToken(token), isi.uid]
  );

  if (dbData.length === 0 || !dbData[0].u_id) return null;
  const row = dbData[0];
  const isSuperadmin = Boolean(row.is_superadmin);

  if (!row.store_id) {
    if (isSuperadmin) {
      return {
        userId: row.u_id,
        nama: row.full_name,
        email: row.email,
        peran: "owner",
        storeId: "",
        storeName: "Platform KasToko",
        token,
        isSuperadmin: true,
      };
    }
    return null;
  }

  if (!isSuperadmin && row.subscription_status === "expired") return null;

  return {
    userId: row.u_id,
    nama: row.full_name,
    email: row.email,
    peran: row.role,
    storeId: row.store_id,
    storeName: row.store_name,
    token,
    isSuperadmin,
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
