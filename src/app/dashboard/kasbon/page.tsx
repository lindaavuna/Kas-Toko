import { redirect } from "next/navigation";
import { ambilKonteks } from "@/lib/server/sesi";
import { ambilKasbon, ambilPelanggan } from "@/lib/server/data";
import { PanelKasbon } from "@/components/dashboard/kasbon-panel";

export default async function HalamanKasbon() {
  const ctx = await ambilKonteks();
  if (!ctx) redirect("/login");
  const [receivables, customers] = await Promise.all([ambilKasbon(ctx), ambilPelanggan(ctx)]);
  return <PanelKasbon receivables={receivables} customers={customers} />;
}
