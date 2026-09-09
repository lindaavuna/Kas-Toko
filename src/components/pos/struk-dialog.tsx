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
import { useUiStore } from "@/lib/stores/ui-store";
import { useKeranjangStore } from "@/lib/stores/keranjang-store";
import { formatRupiah } from "@/lib/format";
import { barisStruk } from "@/lib/nota";
import { nomorWa } from "@/lib/format";
import { bangunStrukEscpos } from "@/lib/hardware/escpos";
import { cetakViaBluetooth, apakahBluetoothDidukung } from "@/lib/hardware/bluetooth-printer";
import { formatNotaWhatsApp, buatTautanNotaWa } from "@/lib/hardware/nota-wa";
import type { Customer, InfoToko } from "@/lib/types";

export function DialogStruk({ toko, pelanggan }: { toko: InfoToko; pelanggan: Customer[] }) {
  const sale = useUiStore((s) => s.strukSale);
  const setStrukSale = useUiStore((s) => s.setStrukSale);
  const kosongkan = useKeranjangStore((s) => s.kosongkan);
  const [lebar, setLebar] = useState<"58" | "80">("58");
  const [sedangMencetak, setSedangMencetak] = useState(false);

  const pelangganTerpilih = useMemo(
    () => pelanggan.find((c) => c.id === sale?.customerId),
    [pelanggan, sale]
  );

  const baris = useMemo(() => (sale ? barisStruk(sale, toko, lebar === "58" ? 32 : 48) : []), [sale, toko, lebar]);

  if (!sale) return null;

  function tutup() {
    setStrukSale(null);
  }

  function selesai() {
    setStrukSale(null);
    kosongkan();
  }

  function cetakBrowser() {
    window.print();
  }

  async function cetakBluetooth() {
    if (!sale) return;

    if (!apakahBluetoothDidukung()) {
      toast.error("Browser tidak mendukung Web Bluetooth. Silakan gunakan tombol Cetak Browser.");
      return;
    }

    setSedangMencetak(true);
    const toastId = toast.loading("Menghubungkan ke printer Bluetooth...");

    try {
      const lebarKarakter = lebar === "58" ? 32 : 48;
      const bytes = bangunStrukEscpos(sale, toko, {
        lebarKarakter,
        bukaLaci: sale.paymentMethod === "cash",
        potongKertas: true,
      });

      toast.loading("Mengirim perintah ESC/POS...", { id: toastId });
      const hasil = await cetakViaBluetooth(bytes);

      if (hasil.sukses) {
        toast.success("Struk berhasil dicetak ke printer Bluetooth!", { id: toastId });
      } else {
        toast.error(hasil.pesan || "Gagal mencetak struk.", { id: toastId });
      }
    } catch (err: unknown) {
      const pesan = err instanceof Error ? err.message : "Gagal terhubung ke printer Bluetooth.";
      toast.error(pesan, { id: toastId });
    } finally {
      setSedangMencetak(false);
    }
  }

  function kirimWa(noTelp?: string) {
    if (!sale) return;
    const nomor = nomorWa(pelangganTerpilih?.phone ?? noTelp);
    if (!nomor) {
      toast.error("Nomor HP pelanggan belum diisi.");
      return;
    }
    const teks = formatNotaWhatsApp(sale, toko);
    const url = buatTautanNotaWa(nomor, teks);
    window.open(url, "_blank");
  }

  return (
    <Dialog open onOpenChange={(o) => !o && tutup()}>
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
                : "Pembayaran non-tunai tercatat."}
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

        <div className="mx-auto max-h-[45vh] overflow-y-auto rounded-lg border bg-white p-3 shadow-inner">
          <div
            id="struk-print"
            className={`mx-auto font-mono text-[11px] leading-5 text-black ${lebar === "58" ? "w-[58mm]" : "struk-80 w-[80mm]"}`}
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

        {!pelangganTerpilih && (
          <div className="space-y-1.5">
            <label htmlFor="wa-no" className="text-xs text-muted-foreground">
              Nomor HP pembeli (untuk kirim nota via WhatsApp)
            </label>
            <Input
              id="wa-no"
              inputMode="tel"
              placeholder="0812xxxxxxx"
              onKeyDown={(e) => {
                if (e.key === "Enter") kirimWa((e.target as HTMLInputElement).value);
              }}
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:grid sm:grid-cols-2 sm:gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={cetakBluetooth}
            disabled={sedangMencetak}
          >
            <Printer className="size-4" />
            {sedangMencetak ? "Mencetak..." : "Cetak Bluetooth"}
          </Button>
          <Button variant="outline" size="lg" onClick={cetakBrowser}>
            <Printer className="size-4" />
            Cetak Browser
          </Button>
          <Button
            variant="success"
            size="lg"
            onClick={() => kirimWa((document.getElementById("wa-no") as HTMLInputElement | null)?.value)}
          >
            <MessageCircle className="size-4" />
            Kirim WhatsApp
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
