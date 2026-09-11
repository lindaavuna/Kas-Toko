/* eslint-disable */
"use server";

import { z } from "zod";
import { mkdirSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { revalidatePath } from "next/cache";
import { butuhKonteks, type HasilAksi } from "./aksi-auth";
import {
  GagalBisnis,
  simpanProduk,
  tambahKategori,
  toggleProduk,
  catatBarangMasuk,
  catatBarangKeluar,
  tambahPelanggan,
  type InputProduk,
} from "./bisnis";

const skemaUnit = z.object({
  unitName: z.string().min(1),
  conversionFactor: z.number().positive(),
  sellingPrice: z.number().min(0),
});

const skemaProduk = z.object({
  id: z.string().uuid().nullish(),
  name: z.string().min(2, "Nama barang wajib diisi (minimal 2 huruf)."),
  sellingPrice: z.number().int().positive("Harga jual harus lebih dari nol."),
  stockQty: z.number().min(0, "Stok tidak boleh negatif."),
  barcode: z.string().max(48).nullish(),
  purchasePrice: z.number().min(0).default(0),
  categoryId: z.string().uuid().nullish(),
  minStock: z.number().min(0).default(5),
  unit: z.string().min(1).default("pcs"),
  emoji: z.string().max(8).default("📦"),
  fotoUrl: z.string().max(200).nullish(),
  units: z.array(skemaUnit).default([]),
});

export async function aksiSimpanProduk(input: InputProduk): Promise<HasilAksi> {
  let ctx;
  try {
    ctx = await butuhKonteks();
  } catch {
    return { ok: false, pesan: "Sesi berakhir, silakan masuk kembali." };
  }
  const parsed = skemaProduk.safeParse(input);
  if (!parsed.success) return { ok: false, pesan: parsed.error.issues[0].message };
  try {
    await simpanProduk(ctx, parsed.data);
    revalidatePath("/", "layout");
    return {
      ok: true,
      pesan: parsed.data.id ? `${parsed.data.name} diperbarui.` : `${parsed.data.name} tersimpan.`,
    };
  } catch (e) {
    return { ok: false, pesan: e instanceof GagalBisnis ? e.message : "Gagal menyimpan produk." };
  }
}

export async function aksiToggleProduk(id: string): Promise<HasilAksi> {
  try {
    const ctx = await butuhKonteks();
    await toggleProduk(ctx, id);
    revalidatePath("/", "layout");
    return { ok: true, pesan: "Status produk diubah." };
  } catch (e) {
    return { ok: false, pesan: e instanceof GagalBisnis ? e.message : "Gagal mengubah status." };
  }
}

export async function aksiTambahKategori(nama: string): Promise<HasilAksi> {
  try {
    const ctx = await butuhKonteks();
    await tambahKategori(ctx, nama);
    revalidatePath("/", "layout");
    return { ok: true, pesan: `Kategori "${nama.trim()}" ditambahkan.` };
  } catch (e) {
    return { ok: false, pesan: e instanceof GagalBisnis ? e.message : "Gagal menambah kategori." };
  }
}

export async function aksiBarangMasuk(input: {
  productId: string;
  qty: number;
  catatan: string;
}): Promise<HasilAksi> {
  try {
    const ctx = await butuhKonteks();
    await catatBarangMasuk(ctx, input);
    revalidatePath("/", "layout");
    return { ok: true, pesan: "Barang masuk tercatat, stok bertambah." };
  } catch (e) {
    return { ok: false, pesan: e instanceof GagalBisnis ? e.message : "Gagal mencatat barang masuk." };
  }
}

export async function aksiBarangKeluar(input: {
  productId: string;
  qty: number;
  reason: "damage" | "adjustment";
  catatan: string;
}): Promise<HasilAksi> {
  try {
    const ctx = await butuhKonteks();
    await catatBarangKeluar(ctx, input);
    revalidatePath("/", "layout");
    return { ok: true, pesan: "Catatan stok keluar disimpan." };
  } catch (e) {
    return { ok: false, pesan: e instanceof GagalBisnis ? e.message : "Gagal mencatat stok keluar." };
  }
}

export async function aksiTambahPelanggan(
  nama: string,
  telepon?: string
): Promise<HasilAksi & { id?: string }> {
  try {
    const ctx = await butuhKonteks();
    const id = await tambahPelanggan(ctx, nama, telepon);
    revalidatePath("/", "layout");
    return { ok: true, pesan: `${nama.trim()} ditambahkan.`, id };
  } catch (e) {
    return { ok: false, pesan: e instanceof GagalBisnis ? e.message : "Gagal menambah pelanggan." };
  }
}

import fs from "node:fs";
import path from "node:path";

export async function aksiUploadFotoProduk(
  formData: FormData
): Promise<HasilAksi & { url?: string }> {
  try {
    const file = formData.get("foto") as File | null;
    if (!file || file.size === 0) {
      return { ok: false, pesan: "Pilih berkas foto terlebih dahulu." };
    }
    if (!file.type.startsWith("image/")) {
      return { ok: false, pesan: "Hanya berkas gambar (JPG, PNG, WebP) yang diizinkan." };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { ok: false, pesan: "Ukuran foto maksimal 5 MB." };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = (file.name.split(".").pop() || "jpg").replace(/[^a-zA-Z0-9]/g, "");
    const namaUnik = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    await fs.promises.mkdir(uploadDir, { recursive: true });
    await fs.promises.writeFile(path.join(uploadDir, namaUnik), buffer);

    return {
      ok: true,
      pesan: "Foto produk berhasil diunggah.",
      url: `/uploads/products/${namaUnik}`,
    };
  } catch {
    return { ok: false, pesan: "Gagal mengunggah foto produk." };
  }
}