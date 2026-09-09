"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, LockKeyhole, Search, ShieldAlert, XCircle } from "lucide-react";

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
import { useRouter } from "next/navigation";
import { useUiStore } from "@/lib/stores/ui-store";
import { aksiBatalkanPenjualan } from "@/lib/server/aksi-pos";
import { DialogStruk } from "@/components/pos/struk-dialog";
import { formatRupiah, formatWaktu } from "@/lib/format";
import { namaMetodeBayar } from "@/lib/nota";
import type { Customer, InfoToko, Sale } from "@/lib/types";

export function PanelTransaksi({ sales, toko, pelanggan }: {
  sales: Sale[];
  toko: InfoToko;
  pelanggan: Customer[];
}) {
  const router = useRouter();
  const setStrukSale = useUiStore((s) => s.setStrukSale);

  const [cari, setCari] = useState("");
  const [status, setStatus] = useState("semua");
  const [metode, setMetode] = useState("semua");
  const [detail, setDetail] = useState<Sale | null>(null);
  const [voidTarget, setVoidTarget] = useState<Sale | null>(null);
  const [voidProses, setVoidProses] = useState(false);
  const [pin, setPin] = useState("");
  const [alasan, setAlasan] = useState("");

  const daftar = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return sales
      .filter((s) => status === "semua" || s.status === status)
      .filter((s) => metode === "semua" || s.paymentMethod === metode)
      .filter((s) => !q || s.receiptNumber.toLowerCase().includes(q) || s.cashierName.toLowerCase().includes(q));
  }, [sales, status, metode, cari]);

  async function kirimVoid() {
    if (!voidTarget) return;
    setVoidProses(true);
    const hasil = await aksiBatalkanPenjualan({
      saleId: voidTarget.id,
      alasan: alasan.trim() || "Salah input",
      pinPemilik: pin,
    });
    setVoidProses(false);
    toast[hasil.ok ? "success" : "error"](hasil.pesan);
    if (hasil.ok) {
      setVoidTarget(null);
      setPin("");
      setAlasan("");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute inset-y-0 left-3 my-auto size-4 text-muted-foreground" />
          <Input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari no. struk / kasir…" className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-11 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Status</SelectItem>
            <SelectItem value="paid">Lunas</SelectItem>
            <SelectItem value="credit">Kasbon</SelectItem>
            <SelectItem value="void">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
        <Select value={metode} onValueChange={setMetode}>
          <SelectTrigger className="h-11 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Bayar</SelectItem>
            <SelectItem value="cash">Tunai</SelectItem>
            <SelectItem value="qris_duitku">QRIS</SelectItem>
            <SelectItem value="qris_manual">QRIS Toko</SelectItem>
            <SelectItem value="bank_transfer">Transfer</SelectItem>
            <SelectItem value="credit">Kasbon</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Struk</TableHead>
              <TableHead>Waktu</TableHead>
              <TableHead className="hidden md:table-cell">Kasir</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Bayar</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {daftar.map((s) => (
              <TableRow key={s.id} className={s.status === "void" ? "opacity-50" : ""}>
                <TableCell className="font-medium whitespace-nowrap">{s.receiptNumber}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatWaktu(s.createdAt)}</TableCell>
                <TableCell className="hidden md:table-cell">{s.cashierName}</TableCell>
                <TableCell className={`text-right font-money font-semibold ${s.status === "void" ? "line-through" : ""}`}>
                  {formatRupiah(s.total)}
                </TableCell>
                <TableCell>{namaMetodeBayar(s.paymentMethod)}</TableCell>
                <TableCell>
                  <Badge variant={s.status === "void" ? "destructive" : s.status === "credit" ? "warning" : "success"}>
                    {s.status === "void" ? "Void" : s.status === "credit" ? "Kasbon" : "Lunas"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setDetail(s)} aria-label="Lihat detail">
                    <Eye className="size-3.5" />
                  </Button>
                  {s.status !== "void" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-danger"
                      onClick={() => setVoidTarget(s)}
                      aria-label={`Batalkan ${s.receiptNumber}`}
                    >
                      <XCircle className="size-3.5" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {daftar.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Tidak ada transaksi cocok dengan filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail struk */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detail {detail?.receiptNumber}</DialogTitle>
            <DialogDescription>
              {detail && `${formatWaktu(detail.createdAt)} • ${detail.cashierName} • ${namaMetodeBayar(detail.paymentMethod)}`}
              {detail?.voidReason ? ` • Alasan void: ${detail.voidReason}` : ""}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-1.5 text-sm">
              {detail.items.map((i, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {i.qty} {i.unit} {i.name}
                  </span>
                  <span className="font-money">{formatRupiah(i.total)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="font-money">{formatRupiah(detail.total)}</span>
              </div>
              {detail.paymentMethod === "cash" && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Kembalian</span>
                  <span className="font-money">{formatRupiah(detail.changeAmount)}</span>
                </div>
              )}
              {detail.transferRef && (
                <div className="flex justify-between text-muted-foreground">
                  <span>No. Referensi</span>
                  <span>{detail.transferRef}</span>
                </div>
              )}
              <Button variant="outline" size="lg" className="mt-2 w-full" onClick={() => { setStrukSale(detail); setDetail(null); }}>
                Buka Pratinjau Struk
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Void dengan PIN pemilik */}
      <Dialog open={!!voidTarget} onOpenChange={(o) => { setVoidTarget(o ? voidTarget : null); if (!o) { setPin(""); setAlasan(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-danger">
              <ShieldAlert className="size-5" />
              Koreksi Transaksi (Void)
            </DialogTitle>
            <DialogDescription>
              Pembatalan {voidTarget?.receiptNumber} membutuhkan PIN Otorisasi Pemilik Toko
              (demo: {/** PIN Budi = 8765 */}8765). Stok kembali, kas terpotong, dan tercatat di log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="void-pin">
                <LockKeyhole className="mr-1 inline size-3.5" />
                PIN Pemilik Toko
              </Label>
              <Input
                id="void-pin"
                inputMode="numeric"
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                className="text-center text-lg tracking-[0.5em] font-money"
                placeholder="••••"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="void-alasan">Alasan pembatalan</Label>
              <Input
                id="void-alasan"
                placeholder="Contoh: salah input jumlah / pelanggan batal beli"
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" size="lg" onClick={() => setVoidTarget(null)}>
              Batal
            </Button>
            <Button variant="danger" size="lg" onClick={kirimVoid} disabled={pin.length < 4 || voidProses}>
              <XCircle className="size-4" />
              {voidProses ? "Membatalkan…" : "Ya, Batalkan Transaksi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DialogStruk toko={toko} pelanggan={pelanggan} />
    </div>
  );
}