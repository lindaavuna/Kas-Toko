"use server";

import { z } from "zod";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { tanya } from "./db";
import { cocokKredensial, hashKredensial, hashToken, tokenAcak } from "./kredensial";
import { ambilKonteks, hapusCookieSesi, jatuhTempoSesi, pasangCookieSesi, type Konteks } from "./sesi";

export type HasilAksi = { ok: boolean; pesan: string };

const UMUR_SESI_MENIT = 60 * 24 * 14;

async function mulaiSesi(userId: string): Promise<HasilAksi & { redirectUrl?: string }> {
  const usr = await tanya<{ id: string; full_name: string; is_superadmin: boolean }>(
    "select * from kas_get_user_by_id($1)",
    [userId]
  );
  if (usr.length === 0) return { ok: false, pesan: "Akun tidak ditemukan." };
  
  const isSuperadmin = Boolean(usr[0].is_superadmin);
  const fullName = usr[0].full_name;

  const ctx = await tanya<{
    user_id: string; full_name: string; store_id: string;
    role: "owner" | "cashier"; subscription_status: string;
  }>("select * from kas_user_context($1)", [userId]);

  let role: "owner" | "cashier" = "owner";
  let store = "";

  if (ctx.length === 0) {
    if (!isSuperadmin) return { ok: false, pesan: "Akun belum terhubung ke toko mana pun." };
  } else {
    if (!isSuperadmin && ctx[0].subscription_status === "expired") {
      return { ok: false, pesan: "Masa sewa toko sudah berakhir. Perpanjang dulu ya." };
    }
    role = ctx[0].role;
    store = ctx[0].store_id;
  }

  const token = await pasangCookieSesi({
    uid: usr[0].id,
    sid: randomUUID(),
    role,
    store,
    nama: fullName,
    exp: jatuhTempoSesi(),
  });

  await tanya("select kas_create_session($1, $2, $3) from (select 1) x", [
    userId,
    hashToken(token),
    UMUR_SESI_MENIT,
  ]);
  
  return { ok: true, pesan: "Berhasil masuk", redirectUrl: isSuperadmin ? "/superadmin" : "/dashboard" };
}

const skemaLogin = z.object({
  email: z.string().email("Format email belum benar."),
  kataSandi: z.string().min(1, "Isi password dulu."),
});

export async function aksiMasukPemilik(input: { email: string; kataSandi: string }): Promise<HasilAksi & { redirectUrl?: string }> {
  const data = skemaLogin.safeParse(input);
  if (!data.success) return { ok: false, pesan: data.error.issues[0].message };

  const found = await tanya<{ id: string; password_hash: string }>(
    "select * from kas_find_user_by_email($1)",
    [data.data.email]
  );
  if (found.length === 0 || !cocokKredensial(data.data.kataSandi, found[0].password_hash)) {
    return { ok: false, pesan: "Email atau password salah. Coba lagi ya." };
  }

  const hasil = await mulaiSesi(found[0].id);
  if (hasil.ok) hasil.pesan = "Berhasil masuk sebagai pemilik toko";
  return hasil;
}

const skemaPin = z.object({
  email: z.string().email("Format email belum benar."),
  pin: z.string().regex(/^\d{4,6}$/, "PIN harus 4-6 angka."),
});

export async function aksiMasukKasir(input: { email: string; pin: string }): Promise<HasilAksi> {
  const data = skemaPin.safeParse(input);
  if (!data.success) return { ok: false, pesan: data.error.issues[0].message };

  const inputEmail = data.data.email.trim().toLowerCase();

  // 1. Coba verifikasi langsung berdasarkan email akun kasir (mis. siti@tokoberkah.id)
  const found = await tanya<{ id: string }>("select id from kas_find_user_by_email($1)", [inputEmail]);
  if (found.length > 0) {
    const pin = await tanya<{ pin: string | null }>(
      "select kas_user_pin_hash($1) as pin from (select 1) x",
      [found[0].id]
    );
    if (pin.length > 0 && cocokKredensial(data.data.pin, pin[0].pin)) {
      const hasil = await mulaiSesi(found[0].id);
      if (hasil.ok) hasil.pesan = "Halo, selamat berjualan!";
      return hasil;
    }
  }

  // 2. Jika user memasukkan email toko / pemilik (mis. budi@tokoberkah.id) dengan PIN kasirnya:
  // Cari seluruh kasir aktif di toko yang sama yang memiliki PIN cocok
  const kasirToko = await tanya<{ user_id: string; cashier_pin: string }>(
    `select sm.user_id, sm.cashier_pin
     from store_members sm
     join stores s on s.id = sm.store_id
     where sm.store_id in (
       select m.store_id from store_members m
       join users u on u.id = m.user_id
       where lower(u.email) = $1
     ) and sm.status = 'active'`,
    [inputEmail]
  );

  for (const k of kasirToko) {
    if (cocokKredensial(data.data.pin, k.cashier_pin)) {
      const hasil = await mulaiSesi(k.user_id);
      if (hasil.ok) hasil.pesan = "Halo, selamat berjualan!";
      return hasil;
    }
  }

  return { ok: false, pesan: "Email toko atau PIN kasir tidak cocok. Silakan coba lagi." };
}

const skemaDaftar = z.object({
  namaPemilik: z.string().min(2, "Nama pemilik terlalu pendek."),
  email: z.string().email("Format email belum benar."),
  kataSandi: z.string().min(6, "Password minimal 6 karakter."),
  pinPemilik: z.string().regex(/^\d{4,6}$/, "PIN pemilik 4-6 angka."),
  namaToko: z.string().min(2, "Nama toko wajib diisi."),
  alamat: z.string().min(3, "Alamat wajib diisi."),
  telepon: z.string().min(7, "Nomor HP kurang valid."),
});

export async function aksiDaftarToko(input: {
  namaPemilik: string;
  email: string;
  kataSandi: string;
  pinPemilik: string;
  namaToko: string;
  alamat: string;
  telepon: string;
}): Promise<HasilAksi> {
  const data = skemaDaftar.safeParse(input);
  if (!data.success) return { ok: false, pesan: data.error.issues[0].message };

  const r = await tanya<{ user_id: string; store_id: string }>(
    "select * from kas_register_store($1,$2,$3,$4,$5,$6,$7)",
    [
      data.data.namaPemilik,
      data.data.email,
      hashKredensial(data.data.kataSandi),
      hashKredensial(data.data.pinPemilik),
      data.data.namaToko,
      data.data.alamat,
      data.data.telepon,
    ]
  );
  await mulaiSesi(r[0].user_id);
  return { ok: true, pesan: "Toko berhasil dibuat! Masa uji coba langsung aktif." };
}

export async function aksiKeluar() {
  const ctx = await ambilKonteks();
  if (ctx) {
    await tanya("select kas_destroy_session($1) from (select 1) x", [hashToken(ctx.token)]);
  }
  await hapusCookieSesi();
  revalidatePath("/", "layout");
}

/** Gerbang sesi utk semua aksi domain lain */
export async function butuhKonteks(): Promise<Konteks> {
  const ctx = await ambilKonteks();
  if (!ctx) throw new Error("SESI_BERAKHIR");
  return ctx;
}
