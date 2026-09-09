"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Printer, Receipt } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePosStore } from "@/lib/stores/pos-store";
import { useSesiStore } from "@/lib/stores/sesi-store";
import { useUiStore } from "@/lib/stores/ui-store";
import { formatRupiah, formatWaktu } from "@/lib/format";
import { namaMetodeBayar } from "@/lib/nota";

export default function RiwayatKasir() {
  const sales = usePosStore((s) => s.sales);
  const shift = usePosStore((s) => s.shift);
  const user = useSesiStore((s) => s.user);
  const setStrukSale = useUiStore((s) => s.setStrukSale);

  const daftar = useMemo(() => {
    const batas = shift?.openedAt ?? new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    return sales.filter((s) => s.cashierId === user?.id && s.createdAt >= batas);
  }, [sales, shift, user]);

  const totalMasuk = daftar
    .filter((s) => s.status === "paid")
    .reduce((a, s) => a + s.total, 0);
  const totalKasbon = daftar
    .filter((s) => s.status === "credit")
    .reduce((a, s) => a + s.total, 0);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button asChild size="sm" variant="ghost" className="h-9">
          <Link href="/kasir">
            <ArrowLeft className="size-4" />
            Kembali ke Kasir
          </Link>
        </Button>
        <h1 className="text-lg font-bold">Riwayat Transaksi Shift Ini</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Jumlah Transaksi</CardDescription>
            <CardTitle className="text-xl font-money">{daftar.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Total Penjualan Lunas</CardDescription>
            <CardTitle className="text-xl text-success font-money">{formatRupiah(totalMasuk)}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Belanja Kasbon</CardDescription>
            <CardTitle className="text-xl text-warning font-money">{formatRupiah(totalKasbon)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi</CardTitle>
          <CardDescription>
            Cetak ulang struk atau kirim ulang nota WhatsApp kapan saja.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {daftar.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Belum ada transaksi pada shift ini. Mulai jualan di layar kasir ya!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Struk</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Bayar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {daftar.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium whitespace-nowrap">{s.receiptNumber}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatWaktu(s.createdAt)}</TableCell>
                      <TableCell className="text-right font-money">{formatRupiah(s.total)}</TableCell>
                      <TableCell>{namaMetodeBayar(s.paymentMethod)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            s.status === "void" ? "destructive" : s.status === "credit" ? "warning" : "success"
                          }
                        >
                          {s.status === "void" ? "Dibatalkan" : s.status === "credit" ? "Kasbon" : "Lunas"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" className="h-8" onClick={() => setStrukSale(s)}>
                            <Printer className="size-3.5" />
                            Struk
                          </Button>
                          <Button size="sm" variant="outline" className="h-8" onClick={() => setStrukSale(s)}>
                            <MessageCircle className="size-3.5" />
                            WA
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <Receipt className="size-3.5" /> Transaksi yang sudah selesai dapat dikoreksi (void) hanya dengan PIN Pemilik Toko.
      </p>
    </div>
  );
}
