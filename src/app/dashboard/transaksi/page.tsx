import { redirect } from "next/navigation";
import { ambilKonteks } from "@/lib/server/sesi";
import { ambilIdentitasToko, ambilPelanggan, ambilPenjualan } from "@/lib/server/data";
import { PanelTransaksi } from "@/components/dashboard/transaksi-panel";

export default async function HalamanTransaksi() {
  const ctx = await ambilKonteks();
  if (!ctx) redirect("/login");
  const [sales, pelanggan, t] = await Promise.all([
    ambilPenjualan(ctx, { limit: 300 }),
    ambilPelanggan(ctx),
    ambilIdentitasToko(ctx),
  ]);
  return (
    <PanelTransaksi
      sales={sales}
      pelanggan={pelanggan}
      toko={{ nama: t.nama, alamat: t.alamat, telepon: t.telepon, kakiStruk: t.kakiStruk }}
    />
  );
}
