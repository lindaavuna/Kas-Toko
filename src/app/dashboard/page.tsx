import { redirect } from "next/navigation";
import { ambilKonteks } from "@/lib/server/sesi";
import {
  ambilPenjualan,
  ambilProduk,
  statistikDasbor,
  trenHarian,
} from "@/lib/server/data";
import { DasborPanel } from "@/components/dashboard/dasbor-panel";

export default async function Dasbor() {
  const ctx = await ambilKonteks();
  if (!ctx) redirect("/login");
  const [statistik, produk, tren, terbaru] = await Promise.all([
    statistikDasbor(ctx),
    ambilProduk(ctx),
    trenHarian(
      ctx,
      new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
      new Date().toISOString().slice(0, 10)
    ),
    ambilPenjualan(ctx, { limit: 6 }),
  ]);
  return (
    <DasborPanel
      statistik={statistik}
      stokTipis={produk.filter((p) => p.isActive && p.stockQty <= p.minStock)}
      tren={tren}
      terbaru={terbaru}
    />
  );
}
