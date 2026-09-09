"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Building2, HandCoins, Phone, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useRouter } from "next/navigation";
import { aksiBayarHutangSupplier, aksiTambahSupplier } from "@/lib/server/aksi-kas";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { InputUang, angkaDariDigit } from "@/components/pos/shift-dialog";
import type { Payable, Supplier } from "@/lib/types";

export function PanelSupplier({
  suppliers,
  payables,
}: {
  suppliers: Supplier[];
  payables: Payable[];
}) {
  const router = useRouter();

  const [bayar, setBayar] = useState<Payable | null>(null);
  const [digit, setDigit] = useState("");
  const [formSupplier, setFormSupplier] = useState({ open: false, nama: "", telepon: "" });

  const hutangAktif = payables.filter((p) => p.status !== "paid");
  const totalHutang = hutangAktif.reduce((a, p) => a + (p.originalAmount - p.paidAmount), 0);

  async function simpanPembayaran() {
    if (!bayar) return;
    const n = angkaDariDigit(digit);
    const sisa = bayar.originalAmount - bayar.paidAmount;
    if (n <= 0) {
      toast.error("Isi nominal pembayaran.");
      return;
    }
    if (n > sisa) {
      toast.error(`Maksimal bayar sesuai sisa hutang (${formatRupiah(sisa)}).`);
      return;
    }
    const hasil = await aksiBayarHutangSupplier({ payableId: bayar.id, amount: n });
    toast[hasil.ok ? "success" : "error"](hasil.pesan);
    if (hasil.ok) {
      setBayar(null);
      setDigit("");
      router.refresh();
    }
  }

  async function simpanSupplier() {
    if (!formSupplier.nama.trim()) {
      toast.error("Isi nama supplier.");
      return;
    }
    const hasil = await aksiTambahSupplier(formSupplier.nama.trim(), formSupplier.telepon.trim() || undefined);
    toast[hasil.ok ? "success" : "error"](hasil.pesan);
    if (hasil.ok) setFormSupplier({ open: false, nama: "", telepon: "" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4" /> Daftar Supplier / Sales
            </CardTitle>
            <CardDescription>Pemasok tetap toko Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {suppliers.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Building2 className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{s.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="size-3" /> {s.phone ?? "—"} • {s.address ?? "—"}
                  </p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={() => setFormSupplier({ open: true, nama: "", telepon: "" })}>
              <Plus className="size-4" /> Tambah Supplier
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hutang Toko ke Supplier</CardTitle>
            <CardDescription>
              Total sisa hutang: <b className="text-danger font-money">{formatRupiah(totalHutang)}</b>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {hutangAktif.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Tidak ada hutang tersisa. Keuangan toko sehat! 💪
              </p>
            )}
            {hutangAktif.map((p) => {
              const sisa = p.originalAmount - p.paidAmount;
              return (
                <div key={p.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{p.supplierName}</p>
                    <Badge variant={p.status === "partial" ? "warning" : "destructive"}>
                      {p.status === "partial" ? "Dicicil" : "Belum Bayar"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Faktur {p.purchaseInvoice} • {formatTanggal(p.createdAt)}
                  </p>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Sisa hutang <b className="font-money text-foreground">{formatRupiah(sisa)}</b>
                    </span>
                    <Button size="sm" variant="success" className="h-9" onClick={() => setBayar(p)}>
                      <HandCoins className="size-4" />
                      Bayar Sekarang
                    </Button>
                  </div>
                  {p.payments.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Riwayat: {p.payments.map((x) => formatRupiah(x.amount)).join(" + ")} (
                      {formatRupiah(p.paidAmount)} sudah masuk)
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Dialog pembayaran hutang */}
      <Dialog open={!!bayar} onOpenChange={(o) => { setBayar(o ? bayar : null); if (!o) setDigit(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bayar Hutang ke {bayar?.supplierName}</DialogTitle>
            <DialogDescription>
              Saat sales datang menagih, catat pembayarannya di sini.
            </DialogDescription>
          </DialogHeader>
          {bayar && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total tagihan ({bayar.purchaseInvoice})</span>
                <span className="font-money">{formatRupiah(bayar.originalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sudah dibayar</span>
                <span className="font-money text-success">{formatRupiah(bayar.paidAmount)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Sisa</span>
                <span className="font-money text-danger">
                  {formatRupiah(bayar.originalAmount - bayar.paidAmount)}
                </span>
              </div>
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="bayar-hutang">Uang Dibayar ke Sales</Label>
                <InputUang idLabel="bayar-hutang" digit={digit} setDigit={setDigit} />
              </div>
              <Button variant="outline" size="lg" className="w-full" onClick={() => setDigit(String(bayar.originalAmount - bayar.paidAmount))}>
                Lunas Semua ({formatRupiah(bayar.originalAmount - bayar.paidAmount)})
              </Button>
              <p className="text-xs text-muted-foreground">Pembayaran hutang mengurangi uang laci / kas toko.</p>
            </div>
          )}
          <DialogFooter>
            <Button size="lg" className="w-full sm:w-auto" onClick={simpanPembayaran}>
              Simpan Pembayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog tambah supplier */}
      <Dialog open={formSupplier.open} onOpenChange={(o) => setFormSupplier((f) => ({ ...f, open: o }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Supplier</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="s-nama">Nama Supplier</Label>
              <Input id="s-nama" placeholder="Contoh: UD Makmur Jaya" value={formSupplier.nama} onChange={(e) => setFormSupplier((f) => ({ ...f, nama: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-telepon">No. HP / Telepon</Label>
              <Input id="s-telepon" inputMode="tel" placeholder="031-…" value={formSupplier.telepon} onChange={(e) => setFormSupplier((f) => ({ ...f, telepon: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button size="lg" className="w-full sm:w-auto" onClick={simpanSupplier}>
              Simpan Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
