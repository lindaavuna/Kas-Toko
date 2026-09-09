import { redirect } from "next/navigation";
import { ambilKonteks } from "@/lib/server/sesi";
import { ambilPembelian, ambilProduk, ambilSupplier } from "@/lib/server/data";
import { PanelPembelian } from "@/components/dashboard/pembelian-panel";

export default async function HalamanPembelian() {
  const ctx = await ambilKonteks();
  if (!ctx) redirect("/login");
  const [purchases, suppliers, products] = await Promise.all([
    ambilPembelian(ctx),
    ambilSupplier(ctx),
    ambilProduk(ctx),
  ]);
  return <PanelPembelian purchases={purchases} suppliers={suppliers} products={products} />;
}
