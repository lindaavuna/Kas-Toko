import { redirect } from "next/navigation";
import { ambilKonteks } from "@/lib/server/sesi";
import { ambilProduk } from "@/lib/server/data";
import { PanelStok } from "@/components/dashboard/stok-panel";

export default async function HalamanStok() {
  const ctx = await ambilKonteks();
  if (!ctx) redirect("/login");
  return <PanelStok products={await ambilProduk(ctx)} />;
}
