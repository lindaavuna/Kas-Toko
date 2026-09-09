"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HandCoins } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { usePosStore } from "@/lib/stores/pos-store";
import { useSesiStore } from "@/lib/stores/sesi-store";
import { formatRupiah } from "@/lib/format";
import { InputUang, angkaDariDigit } from "@/components/pos/shift-dialog";
import type { Receivable } from "@/lib/types";

/** Dialog [Terima Pembayaran] kasbon — menghitung sisa hutang otomatis (Task 1.16) */
export function DialogTerimaPembayaran({
  receivable,
  open,
  onOpenChange,
}: {
  receivable: Receivable | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [digit, setDigit] = useState("");
  const terima = usePosStore((s) => s.terimaPembayaranKasbon);
  const user = useSesiStore((s) => s.user);

  if (!receivable) return null;
  const sisa = receivable.originalAmount - receivable.paidAmount;
  const jumlah = angkaDariDigit(digit);

  function simpan() {
    if (!user) return;
    if (jumlah <= 0) {
      toast.error("Isi nominal pembayaran dulu.");
      return;
    }
    if (jumlah > sisa) {
      toast.error(`Bayar maksimal sesuai sisa kasbon (${formatRupiah(sisa)}).`);
      return;
    }
    terima(receivable!.id, jumlah, user);
    toast.success(
      jumlah === sisa
        ? `Kasbon ${receivable!.customerName} LUNAS. Terima kasih! 🎉`
        : `Pembayaran ${formatRupiah(jumlah)} dicatat masuk kas laci.`
    );
    setDigit("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setDigit(""); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="size-5 text-warning" />
            Terima Pembayaran Kasbon
          </DialogTitle>
          <DialogDescription>
            {receivable.customerName} — beli {receivable.saleReceipt ?? "sebelumnya"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Kasbon awal</span>
            <span className="font-money">{formatRupiah(receivable.originalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sudah dibayar</span>
            <span className="font-money text-success">{formatRupiah(receivable.paidAmount)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Sisa sekarang</span>
            <span className="font-money text-danger">{formatRupiah(sisa)}</span>
          </div>
          <div className="space-y-1.5 pt-2">
            <Label htmlFor="bayar-kasbon">Uang Diterima dari Pelanggan</Label>
            <InputUang idLabel="bayar-kasbon" digit={digit} setDigit={setDigit} />
            <Button size="sm" variant="outline" onClick={() => setDigit(String(sisa))} className="mt-1">
              Lunas Semua ({formatRupiah(sisa)})
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Pembayaran otomatis menambah pemasukan kas laci shift berjalan.
          </p>
        </div>
        <DialogFooter>
          <Button size="lg" onClick={simpan} className="w-full sm:w-auto">
            Simpan Pembayaran
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
