"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, FileText, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { formatWaktu } from "@/lib/format";
import { unduhCsv, cetakDokumen } from "@/lib/export";
import type { StockMutation } from "@/lib/types";

const ALASAN_ID: Record<string, string> = {
  sale: "Penjualan",
  sale_void: "Batal Jual (Void)",
  purchase: "Beli dari Supplier",
  damage: "Rusak / Hilang",
  adjustment: "Opname / Penyesuaian",
};

export function PanelMutasi({ mutations }: { mutations: StockMutation[] }) {
  const [cari, setCari] = useState("");
  const [tipe, setTipe] = useState("semua");

  const daftar = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return mutations
      .filter((m) => tipe === "semua" || m.type === tipe)
      .filter((m) => !q || m.productName.toLowerCase().includes(q))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [mutations, cari, tipe]);

  const masuk = mutations.filter((m) => m.type === "in").length;
  const keluar = mutations.filter((m) => m.type === "out").length;

  function eksporMutasi(kind: "xlsx" | "pdf") {
    toast.info(`Menyiapkan unduhan mutasi stok ${kind.toUpperCase()}…`);
    const tanggalHariIni = new Date().toISOString().slice(0, 10);

    if (kind === "xlsx") {
      const kolom = [
        "Waktu",
        "Nama Produk",
        "Tipe Pergerakan",
        "Alasan Mutasi",
        "Jumlah Qty",
        "No. Referensi / Catatan",
        "Petugas Audit",
      ];
      const baris = daftar.map((m) => [
        formatWaktu(m.createdAt),
        m.productName,
        m.type === "in" ? "Barang Masuk" : "Barang Keluar",
        ALASAN_ID[m.reason] || m.reason,
        m.type === "in" ? m.qty : -m.qty,
        m.refNumber || m.note || "—",
        m.byName || "—",
      ]);

      unduhCsv(`rekap-mutasi-stok-${tanggalHariIni}.csv`, kolom, baris);
    } else {
      cetakDokumen({
        judul: "Riwayat Mutasi & Arus Stok Barang",
        periode: `Per ${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}`,
        ringkasan: [
          { label: "Total Mutasi", nilai: `${daftar.length} pergerakan` },
          {
            label: "Barang Masuk",
            nilai: `${daftar.filter((m) => m.type === "in").length} kali`,
          },
          {
            label: "Barang Keluar",
            nilai: `${daftar.filter((m) => m.type === "out").length} kali`,
          },
        ],
        kolom: ["Waktu", "Produk", "Tipe", "Alasan", "Jumlah", "Referensi", "Petugas"],
        kolomKanan: [4],
        baris: daftar.map((m) => [
          formatWaktu(m.createdAt),
          m.productName,
          m.type === "in" ? "Masuk" : "Keluar",
          ALASAN_ID[m.reason] || m.reason,
          m.type === "in" ? `+${m.qty}` : `-${m.qty}`,
          m.refNumber || m.note || "—",
          m.byName || "—",
        ]),
      });
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Arus Barang</CardTitle>
          <CardDescription>
            Setiap pergerakan barang tercatat otomatis: {masuk} arus masuk, {keluar} arus keluar.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute inset-y-0 left-3 my-auto size-4 text-muted-foreground" />
          <Input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama barang…"
            className="pl-9"
          />
        </div>
        <Select value={tipe} onValueChange={setTipe}>
          <SelectTrigger className="h-11 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Tipe</SelectItem>
            <SelectItem value="in">Barang Masuk</SelectItem>
            <SelectItem value="out">Barang Keluar</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" className="h-11" onClick={() => eksporMutasi("xlsx")}>
            <FileSpreadsheet className="size-4 text-success" /> Export Excel
          </Button>
          <Button size="sm" variant="outline" className="h-11" onClick={() => eksporMutasi("pdf")}>
            <FileText className="size-4 text-danger" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Alasan</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
              <TableHead className="hidden md:table-cell">Referensi</TableHead>
              <TableHead className="hidden lg:table-cell">Petugas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {daftar.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatWaktu(m.createdAt)}
                </TableCell>
                <TableCell className="font-medium">{m.productName}</TableCell>
                <TableCell>
                  <Badge variant={m.type === "in" ? "success" : "destructive"}>
                    {m.type === "in" ? "Masuk" : "Keluar"}
                  </Badge>
                </TableCell>
                <TableCell>{ALASAN_ID[m.reason] ?? m.reason}</TableCell>
                <TableCell className={`text-right font-money font-semibold ${m.type === "in" ? "text-success" : "text-danger"}`}>
                  {m.type === "in" ? "+" : "-"}
                  {m.qty}
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                  {m.refNumber ?? (m.note ? "—" : "—")}
                </TableCell>
                <TableCell className="hidden text-xs lg:table-cell">{m.byName}</TableCell>
              </TableRow>
            ))}
            {daftar.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Belum ada mutasi pada filter ini.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Catatan: keterangan {`"`}petugas{`"`} membantu audit saat stok fisik berbeda dengan catatan.
      </p>
    </div>
  );
}
