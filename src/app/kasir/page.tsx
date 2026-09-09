import { redirect } from "next/navigation";
import { ambilKonteks } from "@/lib/server/sesi";
import { ambilKategori, ambilProduk, ambilShiftAktif } from "@/lib/server/data";
import { KatalogKasir } from "@/components/pos/katalog-kasir";

export default async function LayarKasir() {
  const ctx = await ambilKonteks();
  if (!ctx) redirect("/login");
  const [produk, kategori, shift] = await Promise.all([
    ambilProduk(ctx),
    ambilKategori(ctx),
    ambilShiftAktif(ctx),
  ]);
  return (
    <KatalogKasir
      produk={produk}
      kategori={kategori}
      shiftBuka={!!shift}
      peranKasir={ctx.peran === "cashier"}
    />
  );
}
