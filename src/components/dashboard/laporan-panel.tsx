"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { BarChart3, FileSpreadsheet, FileText, TrendingDown, TrendingUp } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GrafikBatang } from "@/components/grafik-batang";
import { aksiAmbilLaporan } from "@/lib/server/aksi-laporan";
import { formatRupiah, formatWaktu } from "@/lib/format";
import type { ArusKasBaris, RingkasanLaporan, TitikHarian } from "@/lib/server/data";

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
  if (r === "bulan") return [s(new Date(now.getFullYear(), now.getMonth(), 1)), s(now)];
  return [dari, sampai];
}

export function PanelLaporan({
  initialMulai,
  initialAkhir,
  ringkasan: r0,
  tren: t0,
  arus: a0,
}: {
  initialMulai: string;
  initialAkhir: string;
  ringkasan: RingkasanLaporan;
  tren: TitikHarian[];
  arus: ArusKasBaris[];
}) {
  const [rentang, setRentang] = useState<Rentang>("7hari");
  const [dari, setDari] = useState(initialMulai);
  const [sampai, setSampai] = useState(initialAkhir);
  const [data, setData] = useState({ ringkasan: r0, tren: t0, arus: a0 });
  const [aktif, setAktif] = useState({ mulai: initialMulai, akhir: initialAkhir });
  const [loading, setLoading] = useState(false);

  const muat = useCallback(async (mulai: string, akhir: string) => {
    setLoading(true);
    const r = await aksiAmbilLaporan(mulai, akhir);
    setLoading(false);
    if (!r.ok) {
      toast.error(r.pesan);
      return;
    }
    setData({ ringkasan: r.ringkasan, tren: r.tren, arus: r.arus });
    setAktif({ mulai, akhir });
  }, []);

  useEffect(() => {
    const [mulai, akhir] = rentangTanggal(rentang, dari, sampai);
    if (rentang !== "kustom") muat(mulai, akhir);
  }, [rentang, muat]); // eslint-disable-line react-hooks/exhaustive-deps

  const dataGrafik = data.tren.map((t) => ({
    label: t.tanggal.slice(8),
    nilai: t.omset,
    nilai2: t.pengeluaran,
  }));

  function ekspor(kind: "xlsx" | "pdf") {
    toast.info(
      `Menyiapkan unduhan laporan ${kind.toUpperCase()} (${aktif.mulai} s.d. ${aktif.akhir})… unduh asli aktif di Tahap 4.`
    );
  }

  return (
    <div className="space-y-4">
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
              <Button size="sm" className="h-9" disabled={!dari || !sampai} onClick={() => muat(dari, sampai)}>
                Tampilkan
              </Button>
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

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-3 animate-ping rounded-full bg-primary" /> memuat laporan…
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kartu label="Pemasukan Penjualan" nilai={formatRupiah(data.ringkasan.omset)} kelas="text-success" />
        <Kartu label="HPP (modal barang)" nilai={formatRupiah(data.ringkasan.hpp)} />
        <Kartu label="Pengeluaran Kasir" nilai={formatRupiah(data.ringkasan.pengeluaran)} kelas="text-danger" />
        <Kartu label="Laba Kotor" nilai={formatRupiah(data.ringkasan.labaKotor)} kelas="text-primary" ikon />
        <Kartu label="Laba Bersih" nilai={formatRupiah(data.ringkasan.labaBersih)} kelas={data.ringkasan.labaBersih >= 0 ? "text-success" : "text-danger"} ikon />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pemasukan vs Pengeluaran</CardTitle>
            <CardDescription>{aktif.mulai} s.d. {aktif.akhir}</CardDescription>
          </CardHeader>
          <CardContent>
            <GrafikBatang data={dataGrafik} warna="bg-success" warna2="bg-danger/60" formatNilai={formatRupiah} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Arus Kas Toko</CardTitle>
            <CardDescription>{data.ringkasan.jumlahTransaksi} transaksi pada periode ini</CardDescription>
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
                {data.arus.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatWaktu(r.waktu)}</TableCell>
                    <TableCell className="text-sm">{r.keterangan}</TableCell>
                    <TableCell className="text-right font-money text-success">{r.masuk ? formatRupiah(r.masuk) : "—"}</TableCell>
                    <TableCell className="text-right font-money text-danger">{r.keluar ? formatRupiah(r.keluar) : "—"}</TableCell>
                  </TableRow>
                ))}
                {data.arus.length === 0 && (
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
        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><TrendingUp className="size-3.5 text-success" /> Laba Kotor = Omset − HPP</span>
          <Separator className="hidden md:block" orientation="vertical" />
          <span className="flex items-center gap-1"><TrendingDown className="size-3.5 text-danger" /> Laba Bersih = Laba Kotor − Pengeluaran</span>
        </CardContent>
      </Card>
    </div>
  );
}

function Kartu({ label, nilai, kelas, ikon }: { label: string; nilai: string; kelas?: string; ikon?: boolean }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className={`flex items-center gap-1 text-lg font-bold font-money md:text-xl ${kelas ?? ""}`}>
          {ikon && (kelas?.includes("danger") ? <TrendingDown className="size-4" /> : <TrendingUp className="size-4" />)}
          {nilai}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
