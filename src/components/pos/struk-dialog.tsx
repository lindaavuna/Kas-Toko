"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Printer, ReceiptText, X } from "lucide-react";

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
import { usePosStore } from "@/lib/stores/pos-store";
import { useUiStore } from "@/lib/stores/ui-store";
import { useKeranjangStore } from "@/lib/stores/keranjang-store";
import { formatRupiah } from "@/lib/format";
import { barisStruk, tautanWhatsApp, teksNotaWa } from "@/lib/nota";
import { TOKO } from "@/lib/dummy-data";

export function DialogStruk() {
  const sale = useUiStore((s) => s.strukSale);
  const setStrukSale = useUiStore((s) => s.setStrukSale);
  const kosongkan = useKeranjangStore((s) => s.kosongkan);
  const customers = usePosStore((s) => s.customers);
  const [lebar, setLebar] = useState<"58" | "80">("58");
  const [telepon, setTelepon] = useState("");

  const baris = useMemo(() => (sale ? barisStruk(sale, TOKO) : []), [sale]);
  const pelanggan = sale?.customerId ? customers.find((c) => c.id === sale.customerId) : undefined;
  const nomorTujuan = pelanggan?.phone ?? telepon.replace(/\D/g, "");

  if (!sale) return null;

  function cetakBrowser() {
    toast.info("Menyiapkan cetak struk via browser (cadangan ESC/POS).");
    window.print();
  }

  function cetakBluetooth() {
    toast.success(
      `Mengirim perintah ESC/POS ke printer Bluetooth ${lebar}mm... (simulasi — driver asli di Tahap 3)`
    );
  }

  function kirimWa() {
    if (nomorTujuan.length < 9) {
      toast.error("Isi dulu nomor HP pembeli untuk mengirim nota.");
      return;
    }
    const pesan = teksNotaWa(sale!, { ...TOKO, telepon: TOKO.telepon });
    window.open(tautanWhatsApp(nomorTujuan, pesan), "_blank");
  }

  function selesai() {
    setStrukSale(null);
    setTelepon("");
    kosongkan();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && selesai()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptText className="size-5 text-success" />
            Transaksi Berhasil — {sale.receiptNumber}
          </DialogTitle>
          <DialogDescription>
            {sale.paymentMethod === "credit"
              ? "Belanja dicatat sebagai kasbon pelanggan."
              : sale.paymentMethod === "cash"
                ? `Uang diterima ${formatRupiah(sale.amountPaid)} — kembalian:`
                : `Pembayaran via ${sale.paymentMethod === "bank_transfer" ? "transfer bank" : "QRIS"} tercatat.`}
          </DialogDescription>
        </DialogHeader>

        {sale.paymentMethod === "cash" && (
          <div className="rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground">KEMBALIAN</p>
            <p className="text-xl font-bold text-success font-money">
              {formatRupiah(sale.changeAmount)}
            </p>
          </div>
        )}

        <div className="mx-auto max-h-[45vh] overflow-y-auto rounded-lg border bg-white p-3">
          <div
            id="struk-print"
            className={`mx-auto font-mono text-[11px] leading-5 text-black ${lebar === "58" ? "w-[58mm]" : "w-[80mm]"}`}
          >
            {baris.map((b, i) => (
              <p key={i} className="whitespace-pre">
                {b}
              </p>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          Ukuran kertas:
          <Button size="sm" variant={lebar === "58" ? "default" : "outline"} className="h-8 px-3" onClick={() => setLebar("58")}>
            58mm
          </Button>
          <Button size="sm" variant={lebar === "80" ? "default" : "outline"} className="h-8 px-3" onClick={() => setLebar("80")}>
            80mm
          </Button>
        </div>

        {!pelanggan && (
          <div className="space-y-1.5">
            <label htmlFor="wa-no" className="text-xs text-muted-foreground">
              Nomor HP pembeli (opsional, untuk kirim nota)
            </label>
            <Input
              id="wa-no"
              inputMode="tel"
              placeholder="0812xxxxxxx"
              value={telepon}
              onChange={(e) => setTelepon(e.target.value)}
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:grid sm:grid-cols-2 sm:gap-2">
          <Button variant="outline" size="lg" onClick={cetakBluetooth}>
            <Printer className="size-4" />
            Cetak Bluetooth
          </Button>
          <Button variant="outline" size="lg" onClick={cetakBrowser}>
            <Printer className="size-4" />
            Cetak Browser
          </Button>
          <Button variant="success" size="lg" onClick={kirimWa}>
            <MessageCircle className="size-4" />
            Kirim Nota WhatsApp
          </Button>
          <Button size="lg" onClick={selesai}>
            <X className="size-4" />
            Selesai
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
