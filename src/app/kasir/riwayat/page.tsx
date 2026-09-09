import { redirect } from "next/navigation";
import { ambilKonteks } from "@/lib/server/sesi";
import { ambilPenjualan, ambilShiftAktif } from "@/lib/server/data";
import { RiwayatKasirPanel } from "@/components/pos/riwayat-panel";

export default async function RiwayatKasirPage() {
  const ctx = await ambilKonteks();
  if (!ctx) redirect("/login");
  const shift = await ambilShiftAktif(ctx);
  const batas = shift?.openedAt ?? new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  const penjualan = await ambilPenjualan(ctx, { hanyaKasirSaya: true, sejak: batas });
  return <RiwayatKasirPanel penjualan={penjualan} shiftBuka={!!shift} />;
}
