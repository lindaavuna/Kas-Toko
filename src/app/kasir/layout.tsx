import { redirect } from "next/navigation";
import { ambilKonteks } from "@/lib/server/sesi";
import {
  ambilIdentitasToko,
  ambilKasbon,
  ambilPelanggan,
  ambilProduk,
  ambilShiftAktif,
  statistikDasbor,
} from "@/lib/server/data";
import { KerangkaKasir } from "@/components/pos/kerangka-kasir";

export const metadata = { title: "Layar Kasir" };

export default async function KasirLayout({ children }: { children: React.ReactNode }) {
  const ctx = await ambilKonteks();
  if (!ctx) redirect("/login");

  const [toko, pelanggan, shift, statistik, produk, kasbon] = await Promise.all([
    ambilIdentitasToko(ctx),
    ambilPelanggan(ctx),
    ambilShiftAktif(ctx),
    statistikDasbor(ctx),
    ambilProduk(ctx),
    ambilKasbon(ctx),
  ]);

  return (
    <KerangkaKasir
      petugas={{
        id: ctx.userId,
        nama: ctx.nama,
        peran: ctx.peran,
        storeId: ctx.storeId,
        storeName: ctx.storeName,
      }}
      toko={{ nama: toko.nama, alamat: toko.alamat, telepon: toko.telepon, kakiStruk: toko.kakiStruk }}
      pelanggan={pelanggan}
      produk={produk}
      shiftBuka={!!shift}
      shiftSejak={shift?.openedAt}
      snapshot={{
        omsetHari: statistik.omsetHari,
        labaHari: statistik.labaHari,
        stokTipis: produk
          .filter((p) => p.isActive && p.stockQty <= p.minStock)
          .map((p) => ({ name: p.name, stockQty: p.stockQty, minStock: p.minStock })),
        kasbonBelumLunas: kasbon
          .filter((r) => r.status !== "paid")
          .map((r) => ({ nama: r.customerName, sisa: r.originalAmount - r.paidAmount })),
      }}
    >
      {children}
    </KerangkaKasir>
  );
}
