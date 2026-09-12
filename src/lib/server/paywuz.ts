import { PaywuzClient, verifyWebhookSignature } from "paywuz-sdk";
import { tanya } from "./db";

export async function ambilKonfigurasiPaywuz() {
  const r = await tanya<{ paywuz_api_key: string; paywuz_is_sandbox: boolean; paywuz_is_active: boolean }>(
    "SELECT paywuz_api_key, paywuz_is_sandbox, paywuz_is_active FROM platform_settings LIMIT 1"
  );
  if (!r[0]) throw new Error("Pengaturan platform tidak ditemukan");
  
  return {
    apiKey: r[0].paywuz_api_key || process.env.PAYWUZ_API_KEY || "",
    isSandbox: r[0].paywuz_is_sandbox,
    isActive: r[0].paywuz_is_active
  };
}

export function buatKlienPaywuz(apiKey: string) {
  return new PaywuzClient({ apiKey });
}

export { verifyWebhookSignature };
