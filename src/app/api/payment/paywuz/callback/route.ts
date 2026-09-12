import { NextResponse } from "next/server";
import { ambilKonfigurasiPaywuz, verifyWebhookSignature } from "@/lib/server/paywuz";
import { tanya } from "@/lib/server/db";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paywuz-signature") || "";
    const eventName = req.headers.get("x-paywuz-event") || "";

    const config = await ambilKonfigurasiPaywuz();

    const isValid = verifyWebhookSignature(rawBody, config.apiKey, signature);
    if (!isValid) {
      console.warn("Signature callback Paywuz tidak cocok");
      return new NextResponse("Bad Signature", { status: 400 });
    }

    if (eventName === "transaction.paid") {
      const payload = JSON.parse(rawBody);
      const orderId = payload.orderId;

      console.info(`[PAYWUZ] Pembayaran lunas untuk Order ID: ${orderId}`);

      // Ekstrak data dari SAAS-StoreId-Days-Timestamp
      if (orderId && orderId.startsWith("SAAS-")) {
        const parts = orderId.split("-");
        if (parts.length >= 4) {
          const storeId = parts.slice(1, 6).join("-"); // UUID has 5 segments
          const days = Number(parts[parts.length - 2]); // Getting the durasiHari

          // Call the postgres function to extend store subscription
          if (storeId && days > 0) {
            await tanya(
              "SELECT kas_superadmin_extend_store($1::uuid, $2::integer)",
              [storeId, days]
            );
            console.info(`[PAYWUZ] Berhasil perpanjang langganan toko ${storeId} selama ${days} hari.`);
          }
        }
      }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err: unknown) {
    const pesan = err instanceof Error ? err.message : "Kesalahan callback";
    console.error("Error pada callback Paywuz:", pesan);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
