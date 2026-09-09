"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GrafikBatang } from "@/components/grafik-batang";
import { usePosStore } from "@/lib/stores/pos-store";
import { formatRupiah, formatWaktu, kunciHari } from "@/lib/format";
import { namaMetodeBayar } from "@/lib/nota";

type Rentang = "hari" | "7hari" | "bulan" | "kustom";

function rentangTanggal(r: Rentang, dari: string, sampai: string): [string, string] {
  const now = new Date();
  const s = (d: Date) => d.toISOString().slice(0, 10);
  if (r === "hari") return [s(now), s(now)];
  if (r === "7hari") {
    const awal = new Date();
    awal.setDate(awal.getDate() - 6);
    return [s(awal), s(now)];
  }
  if (r === "bulan") {
    const awal = new Date(now.getFullYear(), now.getMonth(), 1);
    return [s(awal), s(now)];
  }
  return [dari || s(now), sampai || s(now)];
}

export default function HalamanLaporan() {
  const sales = usePosStore((s) => s.sales);
  const expenses = usePosStore((s) => s.expenses);
  const products = usePosStore((s) => s.products);

  const [rentang, setRentang] = useState<Rentang>("7hari");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");

  const [mulai, akhir] = rentangTanggal(rentang, dari, sampai);

  const d = useMemo(() => {
    const jual = sales.filter(
      (s) => s.status !== "void" && s.createdAt.slice(0, 10) >= mulai && s.createdAt.slice(0, 10) <= akhir
    );
    const omset = jual.reduce((a, s) => a + s.total, 0);
    const hpp = jual.reduce(
      (a, s) =>
        a +
        s.items.reduce((b, i) => {
          const p = products.find((x) => x.id === i.productId);
          return b + (p?.purchasePrice ?? 0) * i.qty;
        }, 0),
      0
    );
    const pengeluaran = expenses
      .filter((e) => e.createdAt.slice(0, 10) >= mulai && e.createdAt.slice(0, 10) <= akhir)
      .reduce((a, e) => a + e.amount, 0);
    const labaKotor = omset - hpp;
    const labaBersih = labaKotor - pengeluaran;
    const piutangMasuk = 0; // pembayaran kasbon dihitung terpisah di arus kas
    return { omset, hpp, pengeluaran, labaKotor, labaBersih, piutangMasuk, jual };
  }, [sales, expenses, products, mulai, akhir]);

  // Arus kas gabungan
  const arusKas = useMemo(() => {
    const rows: { tgl: string; ket: string; masuk: number; keluar: number }[] = [];
    d.jual.forEach((s) =>
      rows.push({
        tgl: s.createdAt,
        ket: `Penjualan ${s.receiptNumber} (${namaMetodeBayar(s.paymentMethod)})`,
        masuk: s.total,
        keluar: 0,
      })
    );
    expenses
      .filter((e) => e.createdAt.slice(0, 10) >= mulai && e.createdAt.slice(0, 10) <= akhir)
      .forEach((e) =>
        rows.push({ tgl: e.createdAt, ket: `Pengeluaran: ${e.title}`, masuk: 0, keluar: e.amount })
      );
    return rows.sort((a, b) => (a.tgl < b.tgl ? 1 : -1)).slice(0, 12);
  }, [d.jual, expenses, mulai, akhir]);

  // Grafik harian rentang
  const tren = useMemo(() => {
    const arr = [];
    const a = new Date(mulai);
    const z = new Date(akhir);
    const hari = Math.min(Math.ceil((+z - +a) / 86400000) + 1, 31);
    for (let i = 0; i < hari; i++) {
      const cur = new Date(+a + i * 86400000);
      const k = kunciHari(cur);
      const m = sales
        .filter((s) => s.status !== "void" && s.createdAt.slice(0, 10) === k)
        .reduce((x, s) => x + s.total, 0);
      const b = expenses
        .filter((e) => e.createdAt.slice(0, 10) === k)
        .reduce((x, e) => x + e.amount, 0);
      arr.push({ label: `${cur.getDate()}`, nilai: m, nilai2: b });
    }
    return arr;
  }, [sales, expenses, mulai, akhir]);

  function ekspor(format: "xlsx" | "pdf") {
    toast.info(
      `Menyiapkan unduhan laporan ${format.toUpperCase()} (${mulai} s.d. ${akhir})… tombol siap disambungkan ke backend di Tahap 4.`
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter rentang */}
      <Card size="sm">
        <CardContent className="flex flex-wrap items-center gap-2">
          <BarChart3 className="size-4 text-primary" />
          <span className="text-sm font-medium">Periode:</span>
          {(
            [
              ["hari", "Hari Ini"],
              ["7hari", "7 Hari Terakhir"],
              ["bulan", "Bulan Ini"],
              ["kustom", "Kustom"],
            ] as [Rentang, string][]
          ).map(([k, label]) => (
            <Button key={k} size="sm" variant={rentang === k ? "default" : "outline"} className="h-9" onClick={() => setRentang(k)}>
              {label}
            </Button>
          ))}
          {rentang === "kustom" && (
            <div className="flex items-center gap-1.5">
              <Label htmlFor="dari" className="sr-only">Dari tanggal</Label>
              <Input id="dari" type="date" value={dari} onChange={(e) => setDari(e.target.value)} className="h-9 w-40" />
              <span className="text-sm text-muted-foreground">s.d.</span>
              <Label htmlFor="sampai" className="sr-only">Sampai tanggal</Label>
              <Input id="sampai" type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} className="h-9 w-40" />
            </div>
          )}
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" className="h-9" onClick={() => ekspor("xlsx")}>
              <FileSpreadsheet className="size-4 text-success" /> Export Excel
            </Button>
            <Button size="sm" variant="outline" className="h-9" onClick={() => ekspor("pdf")}>
              <FileText className="size-4 text-danger" /> Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Kartu ringkasan */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Pemasukan Penjualan</CardDescription>
            <CardTitle className="text-lg font-bold text-success font-money md:text-xl">{formatRupiah(d.omset)}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>HPP (modal barang terjual)</CardDescription>
            <CardTitle className="text-lg font-bold font-money md:text-xl">{formatRupiah(d.hpp)}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Pengeluaran Kasir</CardDescription>
            <CardTitle className="text-lg font-bold text-danger font-money md:text-xl">{formatRupiah(d.pengeluaran)}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Laba Kotor</CardDescription>
            <CardTitle className="flex items-center gap-1 text-lg font-bold text-primary font-money md:text-xl">
              <TrendingUp className="size-4" /> {formatRupiah(d.labaKotor)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Laba Bersih</CardDescription>
            <CardTitle className="flex items-center gap-1 text-lg font-bold font-money md:text-xl">
              {d.labaBersih >= 0 ? <TrendingUp className="size-4 text-success" /> : <TrendingDown className="size-4 text-danger" />}
              {formatRupiah(d.labaBersih)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pemasukan vs Pengeluaran</CardTitle>
            <CardDescription>{mulai} s.d. {akhir}</CardDescription>
          </CardHeader>
          <CardContent>
            <GrafikBatang data={tren} warna="bg-success" warna2="bg-danger/60" formatNilai={formatRupiah} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Arus Kas Toko</CardTitle>
            <CardDescription>12 catatan kas terbaru pada periode ini</CardDescription>
          </CardHeader>
          <CardContent className="max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right">Masuk</TableHead>
                  <TableHead className="text-right">Keluar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arusKas.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatWaktu(r.tgl)}</TableCell>
                    <TableCell className="text-sm">{r.ket}</TableCell>
                    <TableCell className="text-right font-money text-success">{r.masuk ? formatRupiah(r.masuk) : "—"}</TableCell>
                    <TableCell className="text-right font-money text-danger">{r.keluar ? formatRupiah(r.keluar) : "—"}</TableCell>
                  </TableRow>
                ))}
                {arusKas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                      Tidak ada arus kas pada periode ini.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card size="sm">
        <CardContent className="flex items-center gap-2 text-xs text-muted-foreground">
          <Download className="size-3.5" />
          Rumus: Laba Kotor = Omset − HPP. Laba Bersih = Laba Kotor − Pengeluaran Kasir.
        </CardContent>
      </Card>
    </div>
  );
}
