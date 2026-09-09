"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookUser,
  Boxes,
  HandCoins,
  Package,
  Plus,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GrafikBatang } from "@/components/grafik-batang";
import { formatRupiah, formatWaktu } from "@/lib/format";
import { namaMetodeBayar } from "@/lib/nota";
import type { StatistikDasbor, TitikHarian } from "@/lib/server/data";
import type { Product, Sale } from "@/lib/types";

export function DasborPanel({
  statistik,
  stokTipis,
  tren,
  terbaru,
}: {
  statistik: StatistikDasbor;
  stokTipis: Product[];
  tren: TitikHarian[];
  terbaru: Sale[];
}) {
  const data = tren.map((t) => {
    const raw = String(t.tanggal || "").slice(0, 10);
    const d = new Date(raw + "T12:00:00");
    const label = !isNaN(d.getTime())
      ? d.toLocaleDateString("id-ID", { weekday: "short" })
      : raw;
    return {
      label,
      nilai: t.omset,
      nilai2: t.pengeluaran,
    };
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Card size="sm">
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-primary" /> Omset Hari Ini
            </CardDescription>
            <CardTitle className="text-lg font-bold font-money text-primary md:text-xl">{formatRupiah(statistik.omsetHari)}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-success" /> Keuntungan Kotor
            </CardDescription>
            <CardTitle className="text-lg font-bold font-money text-success md:text-xl">{formatRupiah(statistik.labaHari)}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <Wallet className="size-3.5 text-danger" /> Pengeluaran Hari Ini
            </CardDescription>
            <CardTitle className="text-lg font-bold font-money text-danger md:text-xl">{formatRupiah(statistik.pengeluaranHari)}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <HandCoins className="size-3.5 text-warning" /> Kasbon Belum Lunas
            </CardDescription>
            <CardTitle className="text-lg font-bold font-money md:text-xl">{formatRupiah(statistik.kasbonSisa)}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm" className="col-span-2 md:col-span-1">
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <AlertTriangle className="size-3.5 text-warning" /> Stok Menipis
            </CardDescription>
            <CardTitle className="text-lg font-bold md:text-xl">
              {statistik.stokTipis}{" "}
              <span className="text-sm font-normal text-muted-foreground">barang perlu kulakan</span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Tren Penjualan 7 Hari</CardTitle>
              <CardDescription>Biru = pemasukan penjualan, merah = pengeluaran kas</CardDescription>
            </div>
            <Button asChild size="sm" variant="ghost" className="h-9">
              <Link href="/dashboard/laporan">
                Laporan lengkap <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <GrafikBatang data={data} warna="bg-primary" warna2="bg-danger/60" formatNilai={formatRupiah} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Boxes className="size-4 text-warning" /> Perlu Kulakan
              </CardTitle>
              <CardDescription>Stok di bawah batas minimum</CardDescription>
            </div>
            <Button asChild size="sm" variant="outline" className="h-9">
              <Link href="/dashboard/stok">Kelola</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {stokTipis.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Semua stok aman 👍</p>
            )}
            {stokTipis.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-lg border p-2">
                <span className="text-lg">{p.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Sisa {p.stockQty} {p.unit} / minimum {p.minStock}
                  </p>
                </div>
                <Badge variant="warning">Menipis</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Transaksi Terbaru</CardTitle>
              <CardDescription>Penjualan dari semua kasir barusan</CardDescription>
            </div>
            <Button asChild size="sm" variant="ghost" className="h-9">
              <Link href="/dashboard/transaksi">
                Semua <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {terbaru.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {s.items.length} barang — {s.receiptNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatWaktu(s.createdAt)} • {s.cashierName} • {namaMetodeBayar(s.paymentMethod)}
                    {s.customerName ? ` • ${s.customerName}` : ""}
                  </p>
                </div>
                <Badge variant={s.status === "void" ? "destructive" : s.status === "credit" ? "warning" : "success"}>
                  {s.status === "void" ? "Void" : s.status === "credit" ? "Kasbon" : "Lunas"}
                </Badge>
                <span className={`font-money text-sm font-semibold ${s.status === "void" ? "line-through opacity-50" : ""}`}>
                  {formatRupiah(s.total)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>Yang paling sering dilakukan pemilik</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" size="lg" className="w-full justify-start">
              <Link href="/dashboard/produk">
                <Plus className="size-4 text-success" /> Tambah Produk Kilat (3 kolom)
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full justify-start">
              <Link href="/dashboard/pembelian">
                <Package className="size-4 text-primary" /> Catat Pembelian Supplier
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full justify-start">
              <Link href="/dashboard/kasbon">
                <BookUser className="size-4 text-warning" /> Terima Pembayaran Kasbon
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
