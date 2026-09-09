"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, PackageSearch, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { aksiBarangMasuk, aksiBarangKeluar } from "@/lib/server/aksi-katalog";
import { formatRupiah, parseInputUang } from "@/lib/format";
import type { Product } from "@/lib/types";

function produkStokMenipis(list: Product[]) {
  return list.filter((p) => p.isActive && p.stockQty <= p.minStock);
}

export function PanelStok({ products }: { products: Product[] }) {
  const router = useRouter();

  const [cari, setCari] = useState("");
  const [hanyaTipis, setHanyaTipis] = useState(false);
  const [dialogMasuk, setDialogMasuk] = useState<Product | null>(null);
  const [dialogKeluar, setDialogKeluar] = useState<Product | null>(null);
  const [jumlah, setJumlah] = useState("");
  const [catatan, setCatatan] = useState("");
  const [alasan, setAlasan] = useState<"damage" | "adjustment">("damage");

  const daftar = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return products
      .filter((p) => p.isActive)
      .filter((p) => !hanyaTipis || p.stockQty <= p.minStock)
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [products, cari, hanyaTipis]);

  const tipis = produkStokMenipis(products);
  const habis = products.filter((p) => p.isActive && p.stockQty <= 0);

  function bukaDialog(p: Product, jenis: "masuk" | "keluar") {
    setJumlah("");
    setCatatan("");
    setAlasan("damage");
    if (jenis === "masuk") setDialogMasuk(p);
    else setDialogKeluar(p);
  }

  async function simpanMasuk() {
    if (!dialogMasuk) return;
    const n = Number(jumlah || 0);
    if (n <= 0) {
      toast.error("Isi jumlah barang yang masuk.");
      return;
    }
    const hasil = await aksiBarangMasuk({ productId: dialogMasuk.id, qty: n, catatan });
    toast[hasil.ok ? "success" : "error"](hasil.ok ? `${n} ${dialogMasuk.unit} ${dialogMasuk.name} masuk. Stok bertambah.` : hasil.pesan);
    if (hasil.ok) {
      setDialogMasuk(null);
      router.refresh();
    }
  }

  async function simpanKeluar() {
    if (!dialogKeluar) return;
    const n = Number(jumlah || 0);
    const hasil = await aksiBarangKeluar({ productId: dialogKeluar.id, qty: n, reason: alasan, catatan });
    toast[hasil.ok ? "success" : "error"](hasil.pesan);
    if (hasil.ok) {
      setDialogKeluar(null);
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-3 shadow-sm">
          <p className="text-xs text-muted-foreground">Total jenis barang</p>
          <p className="text-lg font-bold">{products.filter((p) => p.isActive).length}</p>
        </div>
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 shadow-sm">
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <AlertTriangle className="size-3.5 text-warning" /> Stok menipis
          </p>
          <p className="text-lg font-bold text-amber-700">{tipis.length}</p>
        </div>
        <div className="rounded-lg border border-danger/40 bg-danger/10 p-3 shadow-sm">
          <p className="text-xs text-muted-foreground">Stok habis</p>
          <p className="text-lg font-bold text-danger">{habis.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute inset-y-0 left-3 my-auto size-4 text-muted-foreground" />
          <Input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari produk…"
            className="pl-9"
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <Switch checked={hanyaTipis} onCheckedChange={setHanyaTipis} id="filter-tipis" />
          Hanya stok menipis
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead className="text-right">Stok Sekarang</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Minimum</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {daftar.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-md bg-muted text-lg">{p.emoji}</span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.sku}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold font-money">
                  {p.stockQty} {p.unit}
                </TableCell>
                <TableCell className="hidden text-right font-money text-muted-foreground sm:table-cell">
                  {p.minStock}
                </TableCell>
                <TableCell>
                  <Badge variant={p.stockQty <= 0 ? "destructive" : p.stockQty <= p.minStock ? "warning" : "success"}>
                    {p.stockQty <= 0 ? "Habis" : p.stockQty <= p.minStock ? "Menipis" : "Aman"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button size="sm" variant="outline" className="h-8" onClick={() => bukaDialog(p, "masuk")}>
                    <ArrowDownToLine className="size-3.5" />
                    Masuk
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 text-danger" onClick={() => bukaDialog(p, "keluar")}>
                    <ArrowUpFromLine className="size-3.5" />
                    Rusak/Hilang
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {daftar.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  <PackageSearch className="mx-auto mb-2 size-6 opacity-50" />
                  Tidak ada produk pada filter ini.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog barang masuk */}
      <Dialog open={!!dialogMasuk} onOpenChange={(o) => !o && setDialogMasuk(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Catat Barang Masuk (Kulakan)</DialogTitle>
            <DialogDescription>
              {dialogMasuk?.name} — stok sekarang {dialogMasuk?.stockQty} {dialogMasuk?.unit} (
              nilai beli terakhir {formatRupiah(dialogMasuk?.purchasePrice ?? 0)}
              )
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="qty-masuk">Jumlah Masuk</Label>
              <Input
                id="qty-masuk"
                inputMode="numeric"
                placeholder={`mis. 20 ${dialogMasuk?.unit ?? ""}`}
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value.replace(/[^\d.]/g, ""))}
                className="text-right font-money"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note-masuk">Catatan (dari mana)</Label>
              <Input
                id="note-masuk"
                placeholder="Contoh: kulakan dari UD Sinar Mas"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button size="lg" className="w-full" onClick={simpanMasuk}>
              Simpan Barang Masuk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog barang keluar */}
      <Dialog open={!!dialogKeluar} onOpenChange={(o) => !o && setDialogKeluar(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Catat Barang Rusak / Hilang</DialogTitle>
            <DialogDescription>
              {dialogKeluar?.name} — stok sekarang {dialogKeluar?.stockQty} {dialogKeluar?.unit}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Alasan Keluar</Label>
              <Select value={alasan} onValueChange={(v) => setAlasan(v as "damage" | "adjustment")}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="damage">Rusak / Hilang / Kadaluarsa</SelectItem>
                  <SelectItem value="adjustment">Opname (penyesuaian stok)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qty-keluar">Jumlah Keluar</Label>
              <Input
                id="qty-keluar"
                inputMode="numeric"
                value={jumlah}
                onChange={(e) => setJumlah(parseInputUang(e.target.value) ? String(parseInputUang(e.target.value)) : "")}
                className="text-right font-money"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note-keluar">Keterangan</Label>
              <Input
                id="note-keluar"
                placeholder="Contoh: kemasan sobek, jatuh dari rak"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button size="lg" variant="danger" className="w-full" onClick={simpanKeluar}>
              Simpan Stok Keluar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
