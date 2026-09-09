"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { aksiBukaShift, aksiRangkumanLaci, aksiTutupShift } from "@/lib/server/aksi-pos";
import { aksiCatatPengeluaran } from "@/lib/server/aksi-kas";
import { useUiStore } from "@/lib/stores/ui-store";
import { formatRupiah } from "@/lib/format";
import type { InfoToko, Shift } from "@/lib/types";

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

/** Dialog Buka & Tutup Kasir (Task 1.7, kini memakai DB) */
export function DialogShift({ toko }: { toko: InfoToko }) {
  const dialogShift = useUiStore((s) => s.dialogShift);
  const setDialogShift = useUiStore((s) => s.setDialogShift);

  return (
    <Dialog open={dialogShift !== null} onOpenChange={(o) => !o && setDialogShift(null)}>
      {dialogShift === "buka" && <IsiBuka onTutup={() => setDialogShift(null)} />}
      {dialogShift === "tutup" && <IsiTutup onTutup={() => setDialogShift(null)} toko={toko} />}
    </Dialog>
  );
}

function IsiBuka({ onTutup }: { onTutup: () => void }) {
  const router = useRouter();
  const [modal, setModal] = useState("150000");
  const [sibuk, setSibuk] = useState(false);
  const angkaModal = angkaDariDigit(modal);

  async function mulai() {
    setSibuk(true);
    const hasil = await aksiBukaShift(angkaModal);
    setSibuk(false);
    toast[hasil.ok ? "success" : "error"](hasil.pesan);
    if (hasil.ok) {
      onTutup();
      router.refresh();
    }
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
        <Button variant="success" size="lg" className="w-full" onClick={mulai} disabled={sibuk}>
          {sibuk ? "Menyimpan…" : "Mulai Jualan"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

type DataLaci = Awaited<ReturnType<typeof aksiRangkumanLaci>>;

function IsiTutup({ onTutup, toko }: { onTutup: () => void; toko: InfoToko }) {
  const router = useRouter();
  const [uangFisik, setUangFisik] = useState("");
  const [data, setData] = useState<DataLaci | null>(null);
  const [sibuk, setSibuk] = useState(false);

  useEffect(() => {
    let aktif = true;
    aksiRangkumanLaci().then((r) => aktif && setData(r));
    return () => {
      aktif = false;
    };
  }, []);

  const angkaFisik = angkaDariDigit(uangFisik);
  const seharusnya = data?.ok ? data.laci.seharusnya : null;
  const selisih = seharusnya === null ? 0 : angkaFisik - seharusnya;

  async function tutup() {
    if (seharusnya === null) return;
    setSibuk(true);
    const hasil = await aksiTutupShift(angkaFisik);
    setSibuk(false);
    if (!hasil.ok) {
      toast.error(hasil.pesan);
      return;
    }
    onTutup();
    router.refresh();
    const selisihTutup = hasil.selisih ?? 0;
    const s = hasil.status ?? (selisihTutup === 0 ? "seimbang" : selisihTutup > 0 ? "lebih" : "kurang");
    toast[s === "seimbang" ? "success" : "warning"](
      s === "seimbang"
        ? "Uang laci cocok — shift ditutup rapi. Mantap!"
        : `Shift ditutup. Uang ${s} ${formatRupiah(Math.abs(selisihTutup))}.`
    );
    if (data?.ok) {
      cetakRekap(
        data.shift,
        { seharusnya: hasil.seharusnya ?? 0, actual: angkaFisik, selisih: selisihTutup },
        data.laci,
        toko
      );
    }
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
      {data === null ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Mengambil data laci…</p>
      ) : !data.ok ? (
        <p className="py-6 text-center text-sm text-danger">{data.pesan}</p>
      ) : (
        <div className="space-y-2.5 text-sm">
          <Baris label="Modal awal" nilai={formatRupiah(data.laci.startingCash)} />
          <Baris label="Penjualan tunai shift ini" nilai={`+ ${formatRupiah(data.laci.penjualanTunai)}`} kelas="text-success" />
          <Baris label="Pembayaran kasbon (tunai)" nilai={`+ ${formatRupiah(data.laci.bayarKasbonTunai)}`} kelas="text-success" />
          <Baris label="Pengeluaran & koreksi kas" nilai={`- ${formatRupiah(data.laci.pengeluaranTunai)}`} kelas="text-danger" />
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Kas seharusnya</span>
            <span className="font-money" data-testid="kas-seharusnya">
              {formatRupiah(data.laci.seharusnya)}
            </span>
          </div>
          <div className="space-y-2 pt-1">
            <Label htmlFor="uang-fisik">Uang Fisik di Laci</Label>
            <InputUang idLabel="uang-fisik" digit={uangFisik} setDigit={setUangFisik} />
          </div>
          {uangFisik !== "" && (
            <div
              className={`mt-1 flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 font-semibold ${
                selisih === 0 ? "text-success" : selisih > 0 ? "text-warning" : "text-danger"
              }`}
            >
              {selisih === 0 ? (
                <>
                  <BadgeCheck className="size-4" /> Uang Cocok (Seimbang)
                </>
              ) : selisih > 0 ? (
                <>
                  <Scale className="size-4" /> Lebih {formatRupiah(selisih)}
                </>
              ) : (
                <>
                  <AlertTriangle className="size-4" /> Kurang {formatRupiah(Math.abs(selisih))}
                </>
              )}
            </div>
          )}
        </div>
      )}
      <DialogFooter className="gap-2 sm:gap-2">
        <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={onTutup}>
          Nanti Saja
        </Button>
        <Button
          size="lg"
          className="w-full sm:w-auto"
          onClick={tutup}
          disabled={uangFisik === "" || sibuk || data === null || !data.ok}
        >
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

function cetakRekap(
  sh: Shift,
  hasil: { seharusnya: number; actual: number; selisih: number },
  laci: { startingCash: number; penjualanTunai: number; bayarKasbonTunai: number; pengeluaranTunai: number },
  toko: InfoToko
) {
  const garis = "-".repeat(28);
  const teks = [
    "REKAP TUTUP KASIR (Z-REPORT)",
    toko?.nama ?? "KasToko",
    sh.cashierName,
    garis,
    `Buka   : ${new Date(sh.openedAt).toLocaleString("id-ID")}`,
    `Tutup  : ${new Date().toLocaleString("id-ID")}`,
    garis,
    `Modal awal      : ${formatRupiah(laci.startingCash)}`,
    `Penjualan tunai : ${formatRupiah(laci.penjualanTunai)}`,
    `Bayar kasbon    : ${formatRupiah(laci.bayarKasbonTunai)}`,
    `Pengeluaran     : ${formatRupiah(laci.pengeluaranTunai)}`,
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
  const router = useRouter();

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
            simpan={async (judul, angka) => {
              const hasil = await aksiCatatPengeluaran({ title: judul, amount: angka });
              toast[hasil.ok ? "success" : "error"](hasil.pesan);
              if (hasil.ok) {
                setOpen(false);
                router.refresh();
              }
            }}
          />
        )}
      </Dialog>
    </>
  );
}

function IsiPengeluaran({
  onTutup,
  simpan,
}: {
  onTutup: () => void;
  simpan: (judul: string, angka: number) => Promise<void>;
}) {
  const [judul, setJudul] = useState("");
  const [jumlah, setJumlah] = useState("");

  async function simpanKlik() {
    const angka = angkaDariDigit(jumlah);
    if (!judul.trim()) {
      toast.error("Isi dulu keperluan pengeluarannya, misal: beli token listrik.");
      return;
    }
    if (angka <= 0) {
      toast.error("Nominal pengeluaran harus lebih dari nol.");
      return;
    }
    await simpan(judul.trim(), angka);
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
        <Button onClick={simpanKlik} size="lg" className="w-full sm:w-auto">
          Simpan Pengeluaran
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
