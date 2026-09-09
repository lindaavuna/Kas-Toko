"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Truck, Wallet } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
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
import { useSesiStore } from "@/lib/stores/sesi-store";
import { formatRupiah, formatTanggal } from "@/lib/format";

interface BarisBeli {
  productId: string;
  qty: string;
  unitCost: string;
}

export default function HalamanPembelian() {
  const purchases = usePosStore((s) => s.purchases);
  const suppliers = usePosStore((s) => s.suppliers);
  const products = usePosStore((s) => s.products);
  const catatPembelian = usePosStore((s) => s.catatPembelian);
  const user = useSesiStore((s) => s.user);

  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [status, setStatus] = useState<"paid" | "credit">("paid");
  const [baris, setBaris] = useState<BarisBeli[]>([{ productId: "", qty: "", unitCost: "" }]);

  const totalBelanja = useMemo(
    () =>
      baris.reduce((a, b) => {
        const p = products.find((x) => x.id === b.productId);
        return a + (p ? Number(b.qty || 0) * Number(b.unitCost || p.purchasePrice) : 0);
      }, 0),
    [baris, products]
  );

  function ubahBaris(i: number, patch: Partial<BarisBeli>) {
    setBaris((bs) =>
      bs.map((b, idx) => {
        if (idx !== i) return b;
        const gab = { ...b, ...patch };
        if (patch.productId && !b.unitCost) {
          const p = products.find((x) => x.id === patch.productId);
          if (p) gab.unitCost = String(p.purchasePrice);
        }
        return gab;
      })
    );
  }

  function simpan() {
    if (!user) return;
    const items = baris
      .filter((b) => b.productId && Number(b.qty) > 0)
      .map((b) => ({ productId: b.productId, qty: Number(b.qty), unitCost: Number(b.unitCost || 0) }));
    if (!supplierId) {
      toast.error("Pilih supplier / sales dulu ya.");
      return;
    }
    if (items.length === 0) {
      toast.error("Isi minimal satu barang dengan jumlah lebih dari nol.");
      return;
    }
    const hasil = catatPembelian(supplierId, items, status, user);
    toast[hasil.ok ? "success" : "error"](
      hasil.ok
        ? status === "credit"
          ? `${hasil.invoice} tercatat — stok bertambah, hutang ${formatRupiah(totalBelanja)} dicatat ke supplier.`
          : `${hasil.invoice} tercatat tunai — stok bertambah.`
        : hasil.pesan
    );
    if (hasil.ok) {
      setOpen(false);
      setSupplierId("");
      setBaris([{ productId: "", qty: "", unitCost: "" }]);
      setStatus("paid");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Setiap pembelian menambah stok otomatis. Pilih <b>Tempo</b> jika belum bayar (jadi hutang toko).
        </p>
        <Button size="lg" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Catat Pembelian Baru
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Faktur</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="hidden md:table-cell">Isi</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Bayar</TableHead>
              <TableHead className="hidden sm:table-cell">Tanggal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium whitespace-nowrap">{p.invoiceNumber}</TableCell>
                <TableCell>{p.supplierName}</TableCell>
                <TableCell className="hidden max-w-64 truncate text-xs text-muted-foreground md:table-cell">
                  {p.items.map((i) => `${i.qty} ${i.productName}`).join(", ")}
                </TableCell>
                <TableCell className="text-right font-money font-semibold">{formatRupiah(p.total)}</TableCell>
                <TableCell>
                  <Badge variant={p.status === "paid" ? "success" : "warning"}>
                    {p.status === "paid" ? "Tunai" : "Tempo (Hutang)"}
                  </Badge>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">{formatTanggal(p.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="size-5 text-primary" /> Pembelian dari Sales Supplier
            </DialogTitle>
            <DialogDescription>Sales datang bawa barang? Catat di sini supaya stok & hutang rapi.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Supplier</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="— Pilih supplier —" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cara Bayar</Label>
              <div className="flex h-11 items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={status === "paid" ? "default" : "outline"}
                  className="h-9 flex-1"
                  onClick={() => setStatus("paid")}
                >
                  <Wallet className="size-4" /> Tunai
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={status === "credit" ? "default" : "outline"}
                  className="h-9 flex-1"
                  onClick={() => setStatus("credit")}
                >
                  Tempo / Hutang
                </Button>
              </div>
            </div>
          </div>

          <Separator />
          <p className="text-sm font-medium">Barang yang dibeli</p>
          <div className="space-y-2">
            {baris.map((b, i) => (
              <div key={i} className="grid grid-cols-[1fr_72px_100px_36px] items-center gap-2">
                <Select value={b.productId || undefined} onValueChange={(v) => ubahBaris(i, { productId: v })}>
                  <SelectTrigger className="h-11 w-full" aria-label={`Barang ${i + 1}`}>
                    <SelectValue placeholder="Pilih barang…" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  inputMode="numeric"
                  placeholder="Qty"
                  aria-label="jumlah"
                  value={b.qty}
                  onChange={(e) => ubahBaris(i, { qty: e.target.value.replace(/[^\d.]/g, "") })}
                  className="text-right font-money"
                />
                <Input
                  inputMode="numeric"
                  placeholder="Harga beli"
                  aria-label="harga beli"
                  value={b.unitCost}
                  onChange={(e) => ubahBaris(i, { unitCost: e.target.value.replace(/\D/g, "") })}
                  className="text-right font-money"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger"
                  onClick={() => setBaris((bs) => (bs.length > 1 ? bs.filter((_, idx) => idx !== i) : bs))}
                  aria-label="Hapus baris"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => setBaris((bs) => [...bs, { productId: "", qty: "", unitCost: "" }])}>
              <Plus className="size-3.5" /> Tambah Barang
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm font-semibold">
            <span>Total Belanja</span>
            <span className="font-money text-base">{formatRupiah(totalBelanja)}</span>
          </div>

          <DialogFooter>
            <Button size="lg" className="w-full sm:w-auto" onClick={simpan}>
              Simpan Pembelian {status === "credit" ? "(Hutang)" : "(Tunai)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
