"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { usePosStore } from "@/lib/stores/pos-store";
import { formatWaktu } from "@/lib/format";

const ALASAN_ID: Record<string, string> = {
  sale: "Penjualan",
  sale_void: "Batal Jual (Void)",
  purchase: "Beli dari Supplier",
  damage: "Rusak / Hilang",
  adjustment: "Opname / Penyesuaian",
};

export default function HalamanMutasi() {
  const mutations = usePosStore((s) => s.mutations);
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
