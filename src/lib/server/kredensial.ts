import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// scrypt built-in node — tidak ada dependensi native, aman lintas OS (Win/Linux/Docker)
export function hashKredensial(teks: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(teks, salt, 32, { N: 16384, r: 8, p: 1 });
  return `s1$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function cocokKredensial(teks: string, simpan: string | null): boolean {
  if (!simpan) return false;
  try {
    const [versi, saltB64, hashB64] = simpan.split("$");
    if (versi !== "s1") return false;
    const asli = Buffer.from(hashB64, "base64");
    const uji = scryptSync(teks, Buffer.from(saltB64, "base64"), asli.length, { N: 16384, r: 8, p: 1 });
    return timingSafeEqual(asli, uji);
  } catch {
    return false;
  }
}

// Token cookie: <base64url(payload)>.<base64url(hmac)> — diverifikasi proxy tanpa DB,
// lalu dicek ulang ke app_sessions di server (rotasi/kedaluwarsa nyata).
export interface IsiSesi {
  uid: string;
  sid: string;
  role: "owner" | "cashier";
  store: string;
  nama: string;
  exp: number; // epoch detik
}

function rahasia(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET belum diisi di .env.local");
  return s;
}

function tanda(buf: Buffer): Buffer {
  return createHmac("sha256", rahasia()).update(buf).digest();
}

export function tandaToken(isi: IsiSesi): string {
  const payload = Buffer.from(JSON.stringify(isi));
  const mac = tanda(payload);
  return `${payload.toString("base64url")}.${mac.toString("base64url")}`;
}

export function bacaToken(token: string): IsiSesi | null {
  const [p, m] = token.split(".");
  if (!p || !m) return null;
  const payload = Buffer.from(p, "base64url");
  const harapan = tanda(payload);
  const diberi = Buffer.from(m, "base64url");
  if (harapan.length !== diberi.length || !timingSafeEqual(harapan, diberi)) return null;
  try {
    const isi = JSON.parse(payload.toString("utf8")) as IsiSesi & { token?: never };
    if (!isi.uid || !isi.sid) return null;
    if (isi.exp * 1000 < Date.now()) return null;
    return isi;
  } catch {
    return null;
  }
}

/** Token mentah utk kolom app_sessions (disimpan sebagai sha256) */
export function tokenAcak(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHmac("sha256", "app_sessions").update(token).digest("hex");
}
