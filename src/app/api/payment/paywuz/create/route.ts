import { NextResponse } from "next/server";
import { ambilKonteks } from "@/lib/server/sesi";
import { ambilKonfigurasiPaywuz, buatKlienPaywuz } from "@/lib/server/paywuz";

export async function POST(req: Request) {
  const ctx = await ambilKonteks();
  if (!ctx) return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });

  try {
    const body = await req.json();
    const amount = Number(body.amount);
    const orderIdRaw = body.orderId;
    const durasiHari = Number(body.durasiHari || 30);

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Nominal pembayaran tidak valid" }, { status: 400 });
    }

    const config = await ambilKonfigurasiPaywuz();
    if (!config.isActive || !config.apiKey) {
      return NextResponse.json({ error: "Payment Gateway Paywuz sedang tidak aktif atau belum dikonfigurasi." }, { status: 503 });
    }

    const merchantOrderId = orderIdRaw || `SAAS-${ctx.storeId}-${durasiHari}-${Date.now()}`;
    const client = buatKlienPaywuz(config.apiKey);
    
    // Gunakan VA atau QRIS yang dipilih dari frontend
    const paymentMethodCode = body.paymentMethod === "VA" ? "VA" : "QRIS";

    const tx = await client.createTransaction({
      orderId: merchantOrderId,
      amount,
      paymentMethod: paymentMethodCode,
    });

    return NextResponse.json({
      ok: true,
      merchantOrderId: tx.orderId,
      paymentUrl: tx.paymentUrl || tx.paymentNumber, // bisa jadi string QR atau URL
      qrString: tx.paymentUrl, // Asumsi paymentUrl paywuz mengembalikan qr jika qris
    });
  } catch (err: unknown) {
    const pesan = err instanceof Error ? err.message : "Kesalahan server saat membuat pembayaran Paywuz";
    console.error("Paywuz Create Tx Error:", pesan);
    return NextResponse.json({ error: pesan }, { status: 500 });
  }
}
