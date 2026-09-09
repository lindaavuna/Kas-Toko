import { NextResponse } from "next/server";
import {
  ambilKonfigurasiDuitku,
  verifikasiSignatureCallback,
} from "@/lib/server/duitku";

/**
 * Webhook Callback Resmi Duitku Payment Gateway.
 * Duitku memanggil endpoint ini ketika pembeli telah sukses membayar tagihan QRIS.
 */
export async function POST(req: Request) {
  try {
    let merchantCode = "";
    let amount = 0;
    let merchantOrderId = "";
    let signature = "";
    let resultCode = "";
    let reference = "";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      merchantCode = String(formData.get("merchantCode") || "");
      amount = Number(formData.get("amount") || 0);
      merchantOrderId = String(formData.get("merchantOrderId") || "");
      signature = String(formData.get("signature") || "");
      resultCode = String(formData.get("resultCode") || "");
      reference = String(formData.get("reference") || "");
    } else {
      const body = await req.json();
      merchantCode = String(body.merchantCode || "");
      amount = Number(body.amount || 0);
      merchantOrderId = String(body.merchantOrderId || "");
      signature = String(body.signature || "");
      resultCode = String(body.resultCode || "");
      reference = String(body.reference || "");
    }

    const config = ambilKonfigurasiDuitku();

    // Verifikasi Keaslian Signature Callback MD5
    const signatureValid = verifikasiSignatureCallback(
      merchantCode || config.merchantCode,
      merchantOrderId,
      amount,
      config.apiKey,
      signature
    );

    if (!signatureValid) {
      console.warn("Signature callback Duitku tidak cocok:", {
        merchantOrderId,
        signatureDiterima: signature,
      });
      return new NextResponse("Bad Signature", { status: 400 });
    }

    if (resultCode === "00") {
      // Pembayaran Duitku sukses lunas
      console.info(`Pembayaran QRIS ${merchantOrderId} sukses lunas. Ref: ${reference}`);
      // Return "OK" sesuai standar Duitku
      return new NextResponse("OK", { status: 200 });
    }

    return new NextResponse(`Payment status: ${resultCode}`, { status: 200 });
  } catch (err: unknown) {
    const pesan = err instanceof Error ? err.message : "Kesalahan callback";
    console.error("Error pada callback Duitku:", pesan);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
