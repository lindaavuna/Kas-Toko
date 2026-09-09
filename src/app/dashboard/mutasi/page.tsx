import { redirect } from "next/navigation";
import { ambilKonteks } from "@/lib/server/sesi";
import { ambilMutasi } from "@/lib/server/data";
import { PanelMutasi } from "@/components/dashboard/mutasi-panel";

export default async function HalamanMutasi() {
  const ctx = await ambilKonteks();
  if (!ctx) redirect("/login");
  return <PanelMutasi mutations={await ambilMutasi(ctx)} />;
}
