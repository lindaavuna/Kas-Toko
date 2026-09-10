import { redirect } from "next/navigation";
import { ambilKonteks } from "@/lib/server/sesi";
import {
  ambilKasbon,
  ambilNotifikasi,
  ambilProduk,
  statistikDasbor,
} from "@/lib/server/data";
import { KerangkaDasbor } from "@/components/dashboard/kerangka-dasbor";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await ambilKonteks();
  if (!ctx) redirect("/login");
  if (ctx.isSuperadmin && !ctx.storeId) redirect("/superadmin");
  if (ctx.peran !== "owner") redirect("/kasir");

  const [statistik, notifikasi, produk, kasbon, toko, platformSewa] = await Promise.all([
    statistikDasbor(ctx),
    ambilNotifikasi(ctx),
    ambilProduk(ctx),
    ambilKasbon(ctx),
    import("@/lib/server/data").then(m => m.ambilIdentitasToko(ctx)),
    import("@/lib/server/data").then(m => m.ambilPlatformSewaConfig()),
  ]);

  return (
    <KerangkaDasbor
      petugas={{
        id: ctx.userId,
        nama: ctx.nama,
        peran: ctx.peran,
        storeId: ctx.storeId,
        storeName: ctx.storeName,
        isSuperadmin: ctx.isSuperadmin,
      }}
      email={ctx.email}
      sewa={{
        status: toko.statusSewa,
        berakhir: toko.sewaBerakhir,
        platformConfig: platformSewa,
      }}
      saldoKasHari={statistik.saldoKasHari}
      notifikasi={notifikasi}
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
    </KerangkaDasbor>
  );
}
