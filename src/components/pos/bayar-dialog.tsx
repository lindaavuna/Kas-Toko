/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HandCoins, Landmark, QrCode, Timer, Banknote, WifiOff } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QrMock } from "@/components/qr-mock";
import { useKeranjangStore } from "@/lib/stores/keranjang-store";
import { useUiStore } from "@/lib/stores/ui-store";
import {
  formatRupiah,
  hitungDiskon,
  hitungKembalian,
  hitungSubtotal,
  hitungTotal,
  NOMINAL_INSTAN,
  uangCukup,
} from "@/lib/format";
import { aksiBuatPenjualan } from "@/lib/server/aksi-pos";
import { aksiTambahPelanggan } from "@/lib/server/aksi-katalog";
import { simpanPenjualanOffline } from "@/lib/offline/sinkron";
import { InputUang, angkaDariDigit } from "./shift-dialog";
import type { Customer, PaymentMethod, Petugas } from "@/lib/types";

export function DialogBayar({
  toko,
  pelanggan,
  petugas,
}: {
  toko?: { manual_qris_image?: string | null };
  pelanggan: Customer[];
  petugas?: Petugas;
}) {
  const open = useUiStore((s) => s.bayarOpen);
  const setOpen = useUiStore((s) => s.setBayarOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {open && (
        <IsiBayar
          toko={toko}
          pelanggan={pelanggan}
          petugas={petugas}
          onTutup={() => setOpen(false)}
        />
      )}
    </Dialog>
  );
}

function IsiBayar({
  toko,
  pelanggan,
  petugas,
  onTutup,
}: {
  toko?: { manual_qris_image?: string | null };
  pelanggan: Customer[];
  petugas?: Petugas;
  onTutup: () => void;
}) {
  const router = useRouter();
  const setStrukSale = useUiStore((s) => s.setStrukSale);
  const items = useKeranjangStore((s) => s.items);
  const diskonNilai = useKeranjangStore((s) => s.diskonNilai);
  const diskonTipe = useKeranjangStore((s) => s.diskonTipe);
  const kosongkan = useKeranjangStore((s) => s.kosongkan);

  const [metode, setMetode] = useState<PaymentMethod>("cash");
  const [digit, setDigit] = useState("");
  const [ref, setRef] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [namaBaru, setNamaBaru] = useState("");
  const [teleponBaru, setTeleponBaru] = useState("");
  const [sudahQris, setSudahQris] = useState(false);
  const [proses, setProses] = useState(false);

  const subtotal = hitungSubtotal(items);
  const diskon = hitungDiskon(subtotal, diskonNilai, diskonTipe);
  const total = hitungTotal(subtotal, diskon);
  const diterima = angkaDariDigit(digit);
  const kembalian = hitungKembalian(diterima, total);

  async function simpanOfflineFallback(cid: string | null) {
    try {
      const custObj = pelanggan.find((c) => c.id === cid);
      const custName = custObj?.name || (namaBaru.trim() ? namaBaru.trim() : undefined);

      const saleOffline = await simpanPenjualanOffline({
        storeId: petugas?.storeId || "store-default",
        cashierId: petugas?.id || "cashier-offline",
        cashierName: petugas?.nama || "Kasir Toko",
        customerId: cid || undefined,
        customerName: custName,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          unit: i.unit,
          qty: i.qty,
          price: i.price,
          total: i.qty * i.price,
        })),
        subtotal,
        discount: diskon,
        total,
        paymentMethod: metode,
        amountPaid: metode === "cash" ? diterima : total,
        changeAmount: kembalian,
        transferRef: ref || undefined,
      });

      kosongkan();
      onTutup();
      setStrukSale(saleOffline);
      toast.success(
        "Tersimpan OFFLINE di perangkat. Otomatis disinkronkan saat terhubung kembali.",
        { duration: 4000 }
      );
    } catch (err: unknown) {
      const pesan = err instanceof Error ? err.message : "Gagal menyimpan transaksi offline.";
      toast.error(pesan);
    }
  }

  async function selesai() {
    if (items.length === 0 || proses) return;

    if (metode === "cash" && !uangCukup(diterima, total)) {
      toast.error(`Uang diterima kurang ${formatRupiah(total - diterima)}.`);
      return;
    }
    if ((metode === "qris_manual" || metode === "bank_transfer") && !/^\d{4}$/.test(ref)) {
      toast.error("Masukkan 4 digit nomor referensi bukti transfer dulu.");
      return;
    }
    if (metode === "qris_duitku" && !sudahQris) {
      toast.info("Menunggu pembayaran QRIS selesai…");
      return;
    }

    let cid: string | null = customerId || null;

    // Jika perangkat terdeteksi offline secara eksplisit
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await simpanOfflineFallback(cid);
      return;
    }

    if (!cid && metode === "credit" && namaBaru.trim()) {
      try {
        const baru = await aksiTambahPelanggan(namaBaru.trim(), teleponBaru.trim() || undefined);
        if (!baru.ok || !baru.id) {
          toast.error(baru.ok ? "Gagal menyimpan pelanggan." : baru.pesan);
          return;
        }
        cid = baru.id;
      } catch {
        // Jika gagal karena jaringan, lanjutkan ke offline
        await simpanOfflineFallback(cid);
        return;
      }
    }

    setProses(true);
    try {
      const hasil = await aksiBuatPenjualan({
        items: items.map((i) => ({ productId: i.productId, unit: i.unit, qty: i.qty })),
        diskonNilai,
        diskonTipe,
        metode,
        uangDiterima: metode === "cash" ? diterima : total,
        customerId: cid,
        transferRef: ref || null,
      });

      setProses(false);

      if (!hasil.ok) {
        if (hasil.pesan.includes("fetch") || hasil.pesan.includes("koneksi") || hasil.pesan.includes("Network")) {
          // Jaringan bermasalah, fallback ke offline
          toast.warning("Koneksi server terputus. Mengalihkan ke penyimpanan offline...");
          await simpanOfflineFallback(cid);
          return;
        }

        toast.error(hasil.pesan);
        if (hasil.pesan.includes("Kasir belum dibuka")) onTutup();
        return;
      }

      kosongkan();
      onTutup();
      setStrukSale(hasil.sale);
      router.refresh();
    } catch {
      setProses(false);
      // Fallback offline jika server action gagal karena masalah koneksi
      toast.warning("Gagal menghubungi server. Menyimpan transaksi secara offline...");
      await simpanOfflineFallback(cid);
    }
  }

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <span>Bayar Belanja</span>
          {typeof navigator !== "undefined" && !navigator.onLine && (
            <span className="flex items-center gap-1 rounded bg-warning/20 px-2 py-0.5 text-xs text-warning">
              <WifiOff className="size-3" />
              Mode Offline
            </span>
          )}
        </DialogTitle>
        <DialogDescription>Sentuh nominal uang yang diterima — kembalian langsung tampil.</DialogDescription>
      </DialogHeader>

      <div className="rounded-lg bg-muted/60 px-4 py-3 text-center">
        <p className="text-xs text-muted-foreground">TOTAL TAGIHAN</p>
        <p className="text-2xl font-bold text-primary font-money">{formatRupiah(total)}</p>
      </div>

      <Tabs value={metode} onValueChange={(v) => setMetode(v as PaymentMethod)}>
        <TabsList className="grid h-11 w-full grid-cols-3 text-xs md:grid-cols-5">
          <TabsTrigger value="cash">Tunai</TabsTrigger>
          <TabsTrigger value="qris_duitku">QRIS</TabsTrigger>
          <TabsTrigger value="qris_manual">QRIS Toko</TabsTrigger>
          <TabsTrigger value="bank_transfer">Transfer</TabsTrigger>
          <TabsTrigger value="credit" className="text-warning">Kasbon</TabsTrigger>
        </TabsList>

        <TabsContent value="cash" className="space-y-3 pt-2">
          <div className="grid grid-cols-3 gap-2">
            <Button type="button" variant={diterima === total ? "success" : "outline"} className="h-11 font-semibold" onClick={() => setDigit(String(total))}>
              Uang Pas
            </Button>
            {NOMINAL_INSTAN.map((n) => (
              <Button key={n} type="button" variant={diterima === n ? "success" : "outline"} className="h-11 font-money" onClick={() => setDigit(String(n))}>
                {formatRupiah(n)}
              </Button>
            ))}
            <Button type="button" variant="outline" className="h-11 font-money" onClick={() => setDigit(String(Math.ceil(total / 50000) * 50000))}>
              {formatRupiah(Math.ceil(total / 50000) * 50000)}
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="diterima">Uang Diterima dari Pembeli</Label>
            <InputUang idLabel="diterima" digit={digit} setDigit={setDigit} />
          </div>
          <Separator />
          {diterima === 0 ? (
            <p className="text-center text-sm text-muted-foreground">Sentuh nominal uang yang diterima…</p>
          ) : uangCukup(diterima, total) ? (
            <div className="rounded-lg border border-success/40 bg-success/10 px-4 py-2.5 text-center">
              <p className="text-xs text-muted-foreground">KEMBALIAN</p>
              <p className="text-xl font-bold text-success font-money">{formatRupiah(kembalian)}</p>
            </div>
          ) : (
            <p className="text-center text-sm font-semibold text-danger">Uang kurang {formatRupiah(total - diterima)}</p>
          )}
        </TabsContent>

        <TabsContent value="qris_duitku" className="space-y-3 pt-2 text-center">
          <PanelQrisDuitku total={total} lunas={sudahQris} onSimulasi={() => setSudahQris(true)} />
        </TabsContent>

        <TabsContent value="qris_manual" className="space-y-3 pt-2 text-center">
          <div className="mx-auto w-fit rounded-lg border p-3 bg-white">
            {toko?.manual_qris_image ? (
              <img src={toko.manual_qris_image} alt="QRIS Toko" className="max-w-[200px] rounded" />
            ) : (
              <QrMock seed={`qris-statis-${total}`} />
            )}
          </div>
          <p className="text-sm text-muted-foreground">QRIS statis milik toko — tampilkan ke pembeli.</p>
          <div className="space-y-1.5 text-left">
            <Label htmlFor="ref-qris">4 digit nomor referensi bukti transfer</Label>
            <Input id="ref-qris" inputMode="numeric" maxLength={4} placeholder="mis. 4821" value={ref} onChange={(e) => setRef(e.target.value.replace(/\D/g, ""))} className="text-center tracking-[0.5em] font-money" />
          </div>
        </TabsContent>

        <TabsContent value="bank_transfer" className="space-y-3 pt-2 text-left">
          <div className="rounded-lg border bg-muted/50 p-3 text-sm">
            <p className="flex items-center gap-2 font-semibold"><Landmark className="size-4" /> Rekening Toko</p>
            <p className="mt-1 text-xs text-muted-foreground">Minta pembeli transfer lalu catat 4 digit terakhir nomor buktinya.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ref-transfer">4 digit nomor referensi</Label>
            <Input id="ref-transfer" inputMode="numeric" maxLength={4} placeholder="mis. 1234" value={ref} onChange={(e) => setRef(e.target.value.replace(/\D/g, ""))} className="text-center tracking-[0.5em] font-money" />
          </div>
        </TabsContent>

        <TabsContent value="credit" className="space-y-3 pt-2">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <HandCoins className="size-4 text-warning" />
            Belanja dicatat sebagai piutang di buku kasbon pelanggan.
          </p>
          <div className="space-y-1.5">
            <Label>Pilih pelanggan langganan</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger className="h-11 w-full"><SelectValue placeholder="— Pilih nama pelanggan —" /></SelectTrigger>
              <SelectContent>
                {pelanggan.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <p className="text-sm font-medium">Atau buat pelanggan baru cepat:</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input placeholder="Nama (mis. Bu Tini)" value={namaBaru} onChange={(e) => setNamaBaru(e.target.value)} />
            <Input inputMode="tel" placeholder="No. HP (opsional)" value={teleponBaru} onChange={(e) => setTeleponBaru(e.target.value)} />
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter className="gap-2 sm:gap-2">
        <Button variant="ghost" size="lg" onClick={onTutup} className="w-full sm:w-auto">Batal</Button>
        <Button variant="success" size="lg" className="w-full sm:w-auto min-w-56" onClick={selesai} disabled={items.length === 0 || proses}>
          <Banknote className="size-4" />
          {proses ? "Menyimpan…" : "Selesai & Cetak Struk"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function PanelQrisDuitku({ total, lunas, onSimulasi }: { total: number; lunas: boolean; onSimulasi: () => void }) {
  const [sisaDetik, setSisaDetik] = useState(300);

  useEffect(() => {
    const t = setInterval(() => setSisaDetik((s) => Math.max(s - 1, 0)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <div className="mx-auto w-fit rounded-lg border p-3">
        <QrMock seed={`duitku-${total}`} />
      </div>
      <p className="text-sm font-medium">Scan QR ini untuk bayar <span className="font-money">{formatRupiah(total)}</span></p>
      {lunas ? (
        <p className="font-semibold text-success">Pembayaran lunas — siap diselesaikan ✔</p>
      ) : (
        <>
          <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
            <Timer className="size-4" />
            Kedaluwarsa {Math.floor(sisaDetik / 60)}:{(sisaDetik % 60).toString().padStart(2, "0")}
          </p>
          {process.env.NODE_ENV !== "production" && (
            <Button variant="outline" onClick={onSimulasi}>
              <QrCode className="size-4" />
              [Dev] Pembeli Sudah Bayar
            </Button>
          )}
        </>
      )}
    </>
  );
}
