import { redirect } from "next/navigation";
import { ambilKonteks } from "@/lib/server/sesi";
import { ambilKategori, ambilProduk } from "@/lib/server/data";
import { PanelProduk } from "@/components/dashboard/produk-panel";

export default async function HalamanProduk() {
  const ctx = await ambilKonteks();
  if (!ctx) redirect("/login");
  const [produk, kategori] = await Promise.all([ambilProduk(ctx), ambilKategori(ctx)]);
  return <PanelProduk products={produk} categories={kategori} />;
}
