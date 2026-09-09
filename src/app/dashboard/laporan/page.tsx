import { redirect } from "next/navigation";
import { ambilKonteks } from "@/lib/server/sesi";
import { arusKas, ringkasanLaporan, trenHarian } from "@/lib/server/data";
import { PanelLaporan } from "@/components/dashboard/laporan-panel";

export default async function HalamanLaporan() {
  const ctx = await ambilKonteks();
  if (!ctx) redirect("/login");
  const now = new Date();
  const awal = new Date();
  awal.setDate(awal.getDate() - 6);
  const s = (d: Date) => d.toISOString().slice(0, 10);
  const mulai = s(awal);
  const akhir = s(now);
  const [ringkasan, tren, arus] = await Promise.all([
    ringkasanLaporan(ctx, mulai, akhir),
    trenHarian(ctx, mulai, akhir),
    arusKas(ctx, mulai, akhir),
  ]);
  return (
    <PanelLaporan
      initialMulai={mulai}
      initialAkhir={akhir}
      ringkasan={ringkasan}
      tren={tren}
      arus={arus}
    />
  );
}
