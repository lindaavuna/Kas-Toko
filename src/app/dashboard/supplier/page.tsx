import { redirect } from "next/navigation";
import { ambilKonteks } from "@/lib/server/sesi";
import { ambilHutang, ambilSupplier } from "@/lib/server/data";
import { PanelSupplier } from "@/components/dashboard/supplier-panel";

export default async function HalamanSupplier() {
  const ctx = await ambilKonteks();
  if (!ctx) redirect("/login");
  const [suppliers, payables] = await Promise.all([ambilSupplier(ctx), ambilHutang(ctx)]);
  return <PanelSupplier suppliers={suppliers} payables={payables} />;
}
