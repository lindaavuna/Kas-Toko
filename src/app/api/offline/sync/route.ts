import { NextResponse } from "next/server";
import { ambilKonteks } from "@/lib/server/sesi";
import { buatPenjualan, GagalBisnis } from "@/lib/server/bisnis";
import type { TransaksiOffline } from "@/lib/offline/db";

export async function POST(req: Request) {
  const ctx = await ambilKonteks();
  if (!ctx) {
    return NextResponse.json({ pesan: "Tidak terotentikasi" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const sales: TransaksiOffline[] = body.sales || [];

    if (!Array.isArray(sales) || sales.length === 0) {
      return NextResponse.json({
        suksesCount: 0,
        gagalCount: 0,
        results: [],
      });
    }

    const results: { localId: string; sukses: boolean; receiptNumber?: string; error?: string }[] = [];
    let suksesCount = 0;
    let gagalCount = 0;

    for (const tx of sales) {
      try {
        const sale = await buatPenjualan(ctx, {
          items: tx.items.map((i) => ({
            productId: i.productId,
            unit: i.unit,
            qty: i.qty,
          })),
          diskonNilai: tx.discount || 0,
          diskonTipe: "fixed",
          metode: tx.paymentMethod,
          uangDiterima: tx.amountPaid || tx.total,
          customerId: tx.customerId || null,
          transferRef: tx.transferRef || `OFFLINE:${tx.receiptNumber}`,
        });

        suksesCount++;
        results.push({
          localId: tx.localId,
          sukses: true,
          receiptNumber: sale.receiptNumber,
        });
      } catch (err: unknown) {
        gagalCount++;
        const pesan = err instanceof GagalBisnis ? err.message : err instanceof Error ? err.message : "Gagal memproses transaksi offline";
        results.push({
          localId: tx.localId,
          sukses: false,
          error: pesan,
        });
      }
    }

    return NextResponse.json({
      suksesCount,
      gagalCount,
      results,
    });
  } catch (err: unknown) {
    const pesan = err instanceof Error ? err.message : "Terjadi kesalahan server saat sinkronisasi";
    return NextResponse.json({ pesan }, { status: 500 });
  }
}
