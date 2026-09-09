// Hash kata sandi & PIN: scrypt (built-in node, tanpa dependensi native).
// Format: s1$<salt-b64>$<hash-b64>
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashKredensial(teks) {
  const salt = randomBytes(16);
  const hash = scryptSync(teks, salt, 32, { N: 16384, r: 8, p: 1 });
  return `s1$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function cocokKredensial(teks, simpan) {
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
