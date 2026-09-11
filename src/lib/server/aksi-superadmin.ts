/* eslint-disable */
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ambilKonteks, type Konteks } from "./sesi";
import { tanya } from "./db";

export async function wajibSuperAdmin(): Promise<Konteks> {
   
  const ctx = await ambilKonteks();
  if (!ctx) redirect("/sa-login");
  if (!ctx.isSuperadmin) redirect("/dashboard");
  return ctx;
}

export async function ambilDataPlatform() {
  const ctx = await wajibSuperAdmin();
  
  const platform = await tanya<{ kas_superadmin_get_platform_data: any }>(
    "select kas_superadmin_get_platform_data()"
  );
  const data = platform[0]?.kas_superadmin_get_platform_data || { metrics: {}, stores: [] };
  const m = data.metrics;
  const rawStores = data.stores || [];

  const pgSettings = await tanya<{
    monthly_subscription_fee: number;
    yearly_subscription_fee: number;
    trial_days: number;
    duitku_merchant_code: string;
    duitku_api_key: string;
    duitku_is_sandbox: boolean;
    duitku_is_active: boolean;
    paywuz_api_key: string;
    paywuz_is_sandbox: boolean;
    paywuz_is_active: boolean;
    primary_gateway: "paywuz" | "duitku";
    enable_failover: boolean;
    manual_qris_image: string | null;
    manual_bank_name: string | null;
    manual_bank_account: string | null;
    manual_bank_holder: string | null;
    manual_qris_is_active: boolean;
  }>("select * from platform_settings where id = 1");
  
  const monthlyFee = pgSettings.length > 0 ? pgSettings[0].monthly_subscription_fee : 50000;
  const activeStores = m.active || 0;
  const monthlyRevenue = activeStores * monthlyFee;
  const onlineStores = rawStores.filter((s: any) => s.is_online).length;

  return {
    metrics: {
      totalStores: m.total || 0,
      activeStores,
      trialStores: m.trial || 0,
      expiredStores: m.expired || 0,
      monthlyRevenue,
      onlineStores,
    },
    stores: rawStores.map((s: any) => ({
      ...s,
      subscription_expires_at: s.subscription_expires_at ? new Date(s.subscription_expires_at).toISOString() : null,
      created_at: s.created_at ? new Date(s.created_at).toISOString() : null,
      last_seen_at: s.last_seen_at ? new Date(s.last_seen_at).toISOString() : null,
    })),
    settings: pgSettings[0] || {
      monthly_subscription_fee: 50000,
      yearly_subscription_fee: 550000,
      trial_days: 7,
      duitku_merchant_code: "",
      duitku_api_key: "",
      duitku_is_sandbox: true,
      duitku_is_active: false,
      paywuz_api_key: "",
      paywuz_is_sandbox: true,
      paywuz_is_active: false,
      primary_gateway: "paywuz",
      enable_failover: true,
      manual_qris_image: null,
      manual_bank_name: "",
      manual_bank_account: "",
      manual_bank_holder: "",
      manual_qris_is_active: true,
    }
  };
}

export async function aksiSimpanPaketLangganan(input: {
  monthlyFee: number;
  yearlyFee: number;
  trialDays: number;
}): Promise<{ ok: boolean; pesan: string }> {
  try {
    await wajibSuperAdmin();
    if (input.monthlyFee < 0 || input.yearlyFee < 0 || input.trialDays < 0) throw new Error("Input tidak valid");
    
    await tanya(
      `update platform_settings set 
       monthly_subscription_fee = $1, 
       yearly_subscription_fee = $2,
       trial_days = $3,
       updated_at = NOW() 
       where id = 1`,
      [input.monthlyFee, input.yearlyFee, input.trialDays]
    );

    revalidatePath("/superadmin");
    return { ok: true, pesan: "Paket & Tarif Langganan berhasil disimpan!" };
  } catch (e: any) {
    return { ok: false, pesan: e.message || "Gagal menyimpan paket" };
  }
}

export async function aksiSimpanPengaturanPlatform(input: {
  duitku_merchant_code: string;
  duitku_api_key: string;
  duitku_is_sandbox: boolean;
  duitku_is_active: boolean;
  paywuz_api_key: string;
  paywuz_is_sandbox: boolean;
  paywuz_is_active: boolean;
  primary_gateway: "paywuz" | "duitku";
  enable_failover: boolean;
  manual_qris_image: string | null;
  manual_bank_name: string | null;
  manual_bank_account: string | null;
  manual_bank_holder: string | null;
  manual_qris_is_active: boolean;
}): Promise<{ ok: boolean; pesan: string }> {
  try {
    await wajibSuperAdmin();
    
    if (!["duitku", "paywuz"].includes(input.primary_gateway)) throw new Error("Gateway utama tidak valid");
    
    await tanya(
      `update platform_settings set 
       duitku_merchant_code = $1, duitku_api_key = $2, duitku_is_sandbox = $3, duitku_is_active = $4,
       paywuz_api_key = $5, paywuz_is_sandbox = $6, paywuz_is_active = $7,
       primary_gateway = $8, enable_failover = $9,
       manual_qris_image = $10, manual_bank_name = $11, manual_bank_account = $12,
       manual_bank_holder = $13, manual_qris_is_active = $14,
       updated_at = NOW() 
       where id = 1`,
      [
        input.duitku_merchant_code, input.duitku_api_key, input.duitku_is_sandbox, input.duitku_is_active,
        input.paywuz_api_key, input.paywuz_is_sandbox, input.paywuz_is_active,
        input.primary_gateway, input.enable_failover,
        input.manual_qris_image, input.manual_bank_name, input.manual_bank_account,
        input.manual_bank_holder, input.manual_qris_is_active
      ]
    );

    revalidatePath("/superadmin");
    return { ok: true, pesan: "Pengaturan Payment Gateway berhasil disimpan!" };
  } catch (e: any) {
    return { ok: false, pesan: e.message || "Gagal menyimpan pengaturan" };
  }
}

export async function aksiPerpanjangSewaToko(storeId: string, durasiHari: number): Promise<{ ok: boolean; pesan: string }> {
  try {
    await wajibSuperAdmin();
    const r = await tanya<{ kas_superadmin_extend_store: boolean }>(
      "SELECT kas_superadmin_extend_store($1, $2)",
      [storeId, durasiHari]
    );
    if (!r[0]?.kas_superadmin_extend_store) throw new Error("Toko tidak ditemukan");
    
    revalidatePath("/superadmin");
    revalidatePath("/dashboard");
    return { ok: true, pesan: `Masa sewa toko berhasil diperpanjang +${durasiHari} hari!` };
  } catch (e: any) {
    return { ok: false, pesan: e.message || "Gagal memperpanjang sewa toko" };
  }
}

export async function aksiUbahStatusToko(storeId: string, status: string): Promise<{ ok: boolean; pesan: string }> {
  try {
    await wajibSuperAdmin();
    
    if (status === "lifetime") {
      await tanya(
        "UPDATE stores SET subscription_status = 'active', subscription_expires_at = '2099-12-31' WHERE id = $1",
        [storeId]
      );
      revalidatePath("/superadmin");
      return { ok: true, pesan: "Toko diset Aktif Selamanya (Lifetime / Gratis)." };
    }

    const r = await tanya<{ kas_superadmin_set_store_status: boolean }>(
      "SELECT kas_superadmin_set_store_status($1, $2)",
      [storeId, status]
    );
    if (!r[0]?.kas_superadmin_set_store_status) throw new Error("Toko tidak ditemukan");
    revalidatePath("/superadmin");
    return { ok: true, pesan: `Status toko diubah menjadi ${status}.` };
  } catch (e: any) {
    return { ok: false, pesan: e.message || "Gagal mengubah status toko" };
  }
}
