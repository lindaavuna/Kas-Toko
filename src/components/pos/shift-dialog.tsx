"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, BadgeCheck, Banknote, Printer, Scale, Wallet } from "lucide-react";

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
import { usePosStore } from "@/lib/stores/pos-store";
import { useSesiStore } from "@/lib/stores/sesi-store";
import { useUiStore } from "@/lib/stores/ui-store";
import { formatRupiah } from "@/lib/format";
import { kasSeharusnya } from "@/lib/kas";
import type { Shift } from "@/lib/types";

function setelah(iso: string, batas: string): boolean {
  return new Date(iso).getTime() >= new Date(batas).getTime();
}

export function hitungRangkumanKas(
  shift: Shift,
  state: Pick<ReturnType<typeof usePosStore.getState>, "sales" | "receivables" | "expenses">
) {
  const penjualanTunai = state.sales
    .filter(
      (s) =>
        s.status === "paid" &&
        s.paymentMethod === "cash" &&
        s.cashierId === shift.cashierId &&
        setelah(s.createdAt, shift.openedAt)
    )
    .reduce((a, s) => a + s.total, 0);
  const bayarKasbonTunai = state.receivables
    .flatMap((r) => r.payments)
    .filter((pm) => setelah(pm.paidAt, shift.openedAt))
    .reduce((a, p) => a + p.amount, 0);
  const pengeluaranTunai = state.expenses
    .filter((e) => setelah(e.createdAt, shift.openedAt))
    .reduce((a, e) => a + e.amount, 0);
  return { penjualanTunai, bayarKasbonTunai, pengeluaranTunai };
}

/** Input uang dengan pemisah ribuan otomatis; simpan digit murni di state */
export function InputUang({
  digit,
  setDigit,
  idLabel,
  placeholder = "0",
}: {
  digit: string;
  setDigit: (d: string) => void;
  idLabel?: string;
  placeholder?: string;
}) {
  const tampil = digit === "" ? "" : Number(digit).toLocaleString("id-ID");
  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-3 flex items-center text-sm font-medium text-muted-foreground">
        Rp
      </span>
      <Input
        id={idLabel}
        inputMode="numeric"
        value={tampil}
        onChange={(e) => setDigit(e.target.value.replace(/\D/g, ""))}
        className="h-11 pl-10 text-right font-money text-base"
        placeholder={placeholder}
      />
    </div>
  );
}

export function angkaDariDigit(digit: string): number {
  return Number(digit || 0);
}

/** Dialog Buka & Tutup Kasir (Task 1.7) */
export function DialogShift() {
  const dialogShift = useUiStore((s) => s.dialogShift);
  const setDialogShift = useUiStore((s) => s.setDialogShift);
  const shift = usePosStore((s) => s.shift);

  return (
    <Dialog open={dialogShift !== null} onOpenChange={(o) => !o && setDialogShift(null)}>
      {dialogShift === "buka" && <IsiBuka onTutup={() => setDialogShift(null)} />}
      {dialogShift === "tutup" && shift && (
        <IsiTutup shift={shift} onTutup={() => setDialogShift(null)} />
      )}
    </Dialog>
  );
}

function IsiBuka({ onTutup }: { onTutup: () => void }) {
  const bukaShift = usePosStore((s) => s.bukaShift);
  const user = useSesiStore((s) => s.user);
  const [modal, setModal] = useState("150000");
  const angkaModal = angkaDariDigit(modal);

  function mulai() {
    if (!user) return;
    const hasil = bukaShift(angkaModal, user);
    toast[hasil.ok ? "success" : "error"](hasil.pesan);
    if (hasil.ok) onTutup();
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Banknote className="size-5 text-success" />
          Buka Kasir — Uang Kembalian
        </DialogTitle>
        <DialogDescription>
          Isi uang modal awal di laci kasir untuk kembalian hari ini. Contoh Rp 150.000.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="modal-awal">Modal Awal Uang Kembalian</Label>
          <InputUang idLabel="modal-awal" digit={modal} setDigit={setModal} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[100000, 150000, 200000].map((n) => (
            <Button
              key={n}
              type="button"
              size="sm"
              variant={angkaModal === n ? "default" : "outline"}
              onClick={() => setModal(String(n))}
            >
              {formatRupiah(n)}
            </Button>
          ))}
        </div>
      </div>
      <DialogFooter>
        <Button variant="success" size="lg" className="w-full" onClick={mulai}>
          Mulai Jualan
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function IsiTutup({ shift, onTutup }: { shift: Shift; onTutup: () => void }) {
  const sales = usePosStore((s) => s.sales);
  const receivables = usePosStore((s) => s.receivables);
  const expenses = usePosStore((s) => s.expenses);
  const tutupShift = usePosStore((s) => s.tutupShift);
  const [uangFisik, setUangFisik] = useState("");

  const angkaFisik = angkaDariDigit(uangFisik);
  const rekap = useMemo(() => {
    const r = hitungRangkumanKas(shift, { sales, receivables, expenses });
    const seharusnya = kasSeharusnya({ startingCash: shift.startingCash, ...r });
    return { ...r, seharusnya, selisih: angkaFisik - seharusnya };
  }, [shift, sales, receivables, expenses, angkaFisik]);

  function tutup() {
    const hasil = tutupShift(angkaFisik);
    if (!hasil.ok || !hasil.hasil || !hasil.shift) {
      toast.error(hasil.pesan);
      return;
    }
    onTutup();
    const s = hasil.hasil.status;
    toast[s === "seimbang" ? "success" : "warning"](
      s === "seimbang"
        ? "Uang laci cocok — shift ditutup rapi. Mantap!"
        : `Shift ditutup. Uang ${s} ${formatRupiah(Math.abs(hasil.hasil.selisih))}.`
    );
    cetakRekap(hasil.shift, hasil.hasil);
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Scale className="size-5 text-primary" />
          Tutup Kasir — Cocokkan Uang Laci
        </DialogTitle>
        <DialogDescription>
          Hitung uang fisik di laci, sistem mengecek selisihnya otomatis lalu cetak Z-Report.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2.5 text-sm">
        <Baris label="Modal awal" nilai={formatRupiah(shift.startingCash)} />
        <Baris
          label="Penjualan tunai shift ini"
          nilai={`+ ${formatRupiah(rekap.penjualanTunai)}`}
          kelas="text-success"
        />
        <Baris
          label="Pembayaran kasbon (tunai)"
          nilai={`+ ${formatRupiah(rekap.bayarKasbonTunai)}`}
          kelas="text-success"
        />
        <Baris
          label="Pengeluaran tunai"
          nilai={`- ${formatRupiah(rekap.pengeluaranTunai)}`}
          kelas="text-danger"
        />
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>Kas seharusnya</span>
          <span className="font-money" data-testid="kas-seharusnya">
            {formatRupiah(rekap.seharusnya)}
          </span>
        </div>
        <div className="space-y-2 pt-1">
          <Label htmlFor="uang-fisik">Uang Fisik di Laci</Label>
          <InputUang idLabel="uang-fisik" digit={uangFisik} setDigit={setUangFisik} />
        </div>
        {uangFisik !== "" && (
          <div
            className={`mt-1 flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 font-semibold ${
              rekap.selisih === 0 ? "text-success" : rekap.selisih > 0 ? "text-warning" : "text-danger"
            }`}
          >
            {rekap.selisih === 0 ? (
              <>
                <BadgeCheck className="size-4" /> Uang Cocok (Seimbang)
              </>
            ) : rekap.selisih > 0 ? (
              <>
                <Scale className="size-4" /> Lebih {formatRupiah(rekap.selisih)}
              </>
            ) : (
              <>
                <AlertTriangle className="size-4" /> Kurang {formatRupiah(Math.abs(rekap.selisih))}
              </>
            )}
          </div>
        )}
      </div>
      <DialogFooter className="gap-2 sm:gap-2">
        <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={onTutup}>
          Nanti Saja
        </Button>
        <Button size="lg" className="w-full sm:w-auto" onClick={tutup} disabled={uangFisik === ""}>
          <Printer className="size-4" />
          Tutup &amp; Cetak Z-Report
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Baris({ label, nilai, kelas }: { label: string; nilai: string; kelas?: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className={`font-money ${kelas ?? "text-foreground"}`}>{nilai}</span>
    </div>
  );
}

function cetakRekap(sh: Shift, hasil: { seharusnya: number; actual: number; selisih: number }) {
  const r = hitungRangkumanKas(sh, usePosStore.getState());
  const garis = "-".repeat(28);
  const teks = [
    "REKAP TUTUP KASIR (Z-REPORT)",
    "Toko Berkah Jaya",
    sh.cashierName,
    garis,
    `Buka   : ${new Date(sh.openedAt).toLocaleString("id-ID")}`,
    `Tutup  : ${new Date().toLocaleString("id-ID")}`,
    garis,
    `Modal awal      : ${formatRupiah(sh.startingCash)}`,
    `Penjualan tunai : ${formatRupiah(r.penjualanTunai)}`,
    `Bayar kasbon    : ${formatRupiah(r.bayarKasbonTunai)}`,
    `Pengeluaran     : ${formatRupiah(r.pengeluaranTunai)}`,
    garis,
    `Kas seharusnya  : ${formatRupiah(hasil.seharusnya)}`,
    `Uang fisik laci  : ${formatRupiah(hasil.actual)}`,
    `Selisih         : ${
      hasil.selisih === 0
        ? "SEIMBANG"
        : `${hasil.selisih > 0 ? "LEBIH" : "KURANG"} ${formatRupiah(Math.abs(hasil.selisih))}`
    }`,
    garis,
  ].join("\n");
  const w = window.open("", "_blank", "width=340,height=600");
  if (!w) {
    toast.error("Browser memblokir jendela cetak. Izinkan popup untuk mencetak Z-Report.");
    return;
  }
  w.document.write(
    `<pre style="font-family:ui-monospace,monospace;font-size:12px;width:58mm;padding:2mm;white-space:pre-wrap">${teks}</pre>`
  );
  w.document.close();
  w.focus();
  w.print();
}

/** Dialog Catat Pengeluaran Kas */
export function DialogPengeluaran() {
  const [open, setOpen] = useState(false);
  const user = useSesiStore((s) => s.user);
  const catat = usePosStore((s) => s.catatPengeluaran);

  return (
    <>
      <Button size="sm" variant="outline" className="h-9" onClick={() => setOpen(true)}>
        <Wallet className="size-4" />
        <span className="hidden lg:inline">Catat Pengeluaran</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        {open && (
          <IsiPengeluaran
            onTutup={() => setOpen(false)}
            simpan={(judul, angka) => {
              if (!user) return;
              catat(judul, angka, user);
              toast.success(`Pengeluaran ${formatRupiah(angka)} untuk "${judul}" tercatat dari kas laci.`);
            }}
          />
        )}
      </Dialog>
    </>
  );
}

function IsiPengeluaran({
  onTutup,
  simpan: simpanFn,
}: {
  onTutup: () => void;
  simpan: (judul: string, angka: number) => void;
}) {
  const [judul, setJudul] = useState("");
  const [jumlah, setJumlah] = useState("");

  function simpan() {
    const angka = angkaDariDigit(jumlah);
    if (!judul.trim()) {
      toast.error("Isi dulu keperluan pengeluarannya, misal: beli token listrik.");
      return;
    }
    if (angka <= 0) {
      toast.error("Nominal pengeluaran harus lebih dari nol.");
      return;
    }
    simpanFn(judul.trim(), angka);
    onTutup();
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Catat Pengeluaran Kas</DialogTitle>
        <DialogDescription>
          Beli bensin, token listrik, iuran sampah? Catat di sini supaya uang laci tetap cocok.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="exp-judul">Keperluan</Label>
          <Input
            id="exp-judul"
            placeholder="Contoh: Beli token listrik toko"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="exp-jumlah">Nominal Keluar</Label>
          <InputUang idLabel="exp-jumlah" digit={jumlah} setDigit={setJumlah} />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={simpan} size="lg" className="w-full sm:w-auto">
          Simpan Pengeluaran
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
