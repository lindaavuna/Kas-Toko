import { redirect } from "next/navigation";
import { ambilKonteks } from "@/lib/server/sesi";
import { ambilKasbon, ambilPelanggan } from "@/lib/server/data";
import { LoketKasbonPanel } from "@/components/kasbon/loket-panel";

export default async function LoketKasbonPage() {
  const ctx = await ambilKonteks();
  if (!ctx) redirect("/login");
  const [pelanggan, kasbon] = await Promise.all([ambilPelanggan(ctx), ambilKasbon(ctx)]);
  return <LoketKasbonPanel pelanggan={pelanggan} kasbon={kasbon} />;
}
