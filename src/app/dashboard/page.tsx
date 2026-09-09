"use client";

import { useMemo } from "react";
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
import { produkStokMenipis, usePosStore } from "@/lib/stores/pos-store";
import { formatRupiah, formatWaktu, hariIni, kunciHari, labelHariLokal } from "@/lib/format";
import { namaMetodeBayar } from "@/lib/nota";

export default function Dasbor() {
  const sales = usePosStore((s) => s.sales);
  const expenses = usePosStore((s) => s.expenses);
  const receivables = usePosStore((s) => s.receivables);
  const products = usePosStore((s) => s.products);

  const h = hariIni();

  const penjualanHari = useMemo(() => sales.filter((s) => s.status !== "void" && s.createdAt.slice(0, 10) === h), [sales, h]);
  const omset = penjualanHari.reduce((a, s) => a + s.total, 0);
  const labaKotor = penjualanHari.reduce(
    (a, s) =>
      a +
      s.items.reduce((b, i) => {
        const p = products.find((x) => x.id === i.productId);
        return b + (i.price - (p?.purchasePrice ?? 0)) * i.qty;
      }, 0),
    0
  );
  const pengeluaran = expenses
    .filter((e) => e.createdAt.slice(0, 10) === h)
    .reduce((a, e) => a + e.amount, 0);
  const kasbonBelumLunas = receivables
    .filter((r) => r.status !== "paid")
    .reduce((a, r) => a + (r.originalAmount - r.paidAmount), 0);
  const stokTipis = produkStokMenipis(products);

  const tren = useMemo(() => {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = kunciHari(d);
      const nilai = sales
        .filter((s) => s.status !== "void" && s.createdAt.slice(0, 10) === k)
        .reduce((a, s) => a + s.total, 0);
      const biaya = expenses
        .filter((e) => e.createdAt.slice(0, 10) === k)
        .reduce((a, e) => a + e.amount, 0);
      arr.push({ label: labelHariLokal(d).split(",")[0], nilai, nilai2: biaya });
    }
    return arr;
  }, [sales, expenses]);

  const transaksiTerbaru = sales.slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Kartu KPI */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Card size="sm">
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-primary" /> Omset Hari Ini
            </CardDescription>
            <CardTitle className="text-lg font-bold font-money text-primary md:text-xl">{formatRupiah(omset)}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-success" /> Keuntungan Kotor
            </CardDescription>
            <CardTitle className="text-lg font-bold font-money text-success md:text-xl">{formatRupiah(labaKotor)}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <Wallet className="size-3.5 text-danger" /> Pengeluaran Hari Ini
            </CardDescription>
            <CardTitle className="text-lg font-bold font-money text-danger md:text-xl">{formatRupiah(pengeluaran)}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <HandCoins className="size-3.5 text-warning" /> Kasbon Belum Lunas
            </CardDescription>
            <CardTitle className="text-lg font-bold font-money md:text-xl">{formatRupiah(kasbonBelumLunas)}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm" className="col-span-2 md:col-span-1">
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <AlertTriangle className="size-3.5 text-warning" /> Stok Menipis
            </CardDescription>
            <CardTitle className="text-lg font-bold md:text-xl">
              {stokTipis.length} <span className="text-sm font-normal text-muted-foreground">barang perlu kulakan</span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Grafik tren */}
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
            <GrafikBatang data={tren} warna="bg-primary" warna2="bg-danger/60" formatNilai={formatRupiah} />
          </CardContent>
        </Card>

        {/* Stok menipis */}
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
        {/* Transaksi terbaru */}
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
            {transaksiTerbaru.map((s) => (
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
                <Badge
                  variant={s.status === "void" ? "destructive" : s.status === "credit" ? "warning" : "success"}
                >
                  {s.status === "void" ? "Void" : s.status === "credit" ? "Kasbon" : "Lunas"}
                </Badge>
                <span className={`font-money text-sm font-semibold ${s.status === "void" ? "line-through opacity-50" : ""}`}>
                  {formatRupiah(s.total)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pintasan cepat */}
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
