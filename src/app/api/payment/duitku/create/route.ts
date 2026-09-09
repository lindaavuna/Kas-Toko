import { NextResponse } from "next/server";
import { ambilKonteks } from "@/lib/server/sesi";
import { buatTransaksiQris } from "@/lib/server/duitku";

export async function POST(req: Request) {
  const ctx = await ambilKonteks();
  if (!ctx) {
    return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const amount = Number(body.amount);

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Nominal pembayaran tidak valid" },
        { status: 400 }
      );
    }

    const merchantOrderId = `KT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const hasil = await buatTransaksiQris({
      merchantOrderId,
      amount,
      productDetails: body.productDetails || `Pembelian di ${ctx.storeName}`,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
    });

    if (!hasil.sukses) {
      return NextResponse.json({ error: hasil.pesan }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      merchantOrderId: hasil.merchantOrderId,
      reference: hasil.reference,
      qrString: hasil.qrString,
      paymentUrl: hasil.paymentUrl,
    });
  } catch (err: unknown) {
    const pesan = err instanceof Error ? err.message : "Kesalahan server saat membuat QRIS";
    return NextResponse.json({ error: pesan }, { status: 500 });
  }
}
