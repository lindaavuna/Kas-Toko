import { redirect } from "next/navigation";
import { ambilKonteks } from "@/lib/server/sesi";
import { ambilAkunKasir, ambilIdentitasToko, ambilKategori } from "@/lib/server/data";
import { PanelPengaturan } from "@/components/dashboard/pengaturan-panel";

export default async function HalamanPengaturan() {
  const ctx = await ambilKonteks();
  if (!ctx) redirect("/login");
  const [kategori, kasir, toko] = await Promise.all([
    ambilKategori(ctx),
    ambilAkunKasir(ctx),
    ambilIdentitasToko(ctx),
  ]);
  return (
    <PanelPengaturan
      categories={kategori}
      cashierAccounts={kasir}
      identitas={{ nama: toko.nama, alamat: toko.alamat, telepon: toko.telepon, kakiStruk: toko.kakiStruk }}
      sewa={{ status: toko.statusSewa, berakhir: toko.sewaBerakhir }}
      aiConfig={{ aktif: toko.aiAktif, apiKey: toko.aiApiKey, baseUrl: toko.aiBaseUrl }}
      pgConfig={toko.paymentGateway}
    />
  );
}
