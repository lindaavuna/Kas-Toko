"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Crown, Zap, ShieldCheck } from "lucide-react";
import { formatRupiah } from "@/lib/format";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function WidgetSewa({ sewa }: { sewa: any }) {
  const [open, setOpen] = useState(false);
  const [paketPilihan, setPaketPilihan] = useState<"bulanan" | "tahunan">("tahunan");
  const [metodePilihan, setMetodePilihan] = useState<"manual" | "otomatis">("otomatis");
  const [tampilManual, setTampilManual] = useState(false);

  if (!sewa || !sewa.platformConfig) return null;
  
  const { status, berakhir, platformConfig } = sewa;
  const { monthlyFee, yearlyFee, primaryGateway, manualQris } = platformConfig;

  // Hitung sisa hari
  const sisaHari = Math.ceil((new Date(berakhir).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  const isUrgent = sisaHari <= 3;
  const isExpired = sisaHari <= 0;

  return (
    <>
      <div className="mt-auto px-4 pb-4">
        <div className="rounded-lg bg-sidebar-accent/50 p-3 text-sidebar-foreground">
          <p className="text-xs font-semibold uppercase text-sidebar-foreground/70 mb-1">Masa Aktif Toko</p>
          <div className="flex items-end justify-between mb-2">
            <span className={`text-xl font-bold ${isExpired ? "text-red-500" : isUrgent ? "text-orange-400" : "text-emerald-400"}`}>
              {isExpired ? "Habis!" : `${sisaHari} Hari`}
            </span>
            <Badge variant={isExpired ? "destructive" : "outline"} className={!isExpired ? "border-emerald-500/30 text-emerald-400" : ""}>
              {status}
            </Badge>
          </div>
          <Button size="sm" variant={isUrgent ? "default" : "secondary"} className={`w-full text-xs font-bold ${isUrgent && !isExpired ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`} onClick={() => setOpen(true)}>
            <Crown className="mr-1.5 size-3.5" /> {isExpired ? "Perpanjang Sekarang" : "Perpanjang Sewa"}
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {tampilManual ? (
            <div className="space-y-4 py-4 text-center">
              <DialogHeader>
                <DialogTitle className="text-center text-xl font-bold">Pembayaran Manual</DialogTitle>
                <DialogDescription className="text-center">
                  Transfer atau scan QRIS di bawah ini untuk paket <strong>{paketPilihan === "tahunan" ? "1 Tahun" : "1 Bulan"}</strong> sejumlah <strong>{formatRupiah(paketPilihan === "tahunan" ? yearlyFee : monthlyFee)}</strong>.
                </DialogDescription>
              </DialogHeader>
              
              {manualQris?.image && (
                <div className="flex justify-center my-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={manualQris.image} alt="QRIS Manual" className="max-h-[250px] rounded-lg shadow-sm" />
                </div>
              )}
              
              <div className="bg-muted p-4 rounded-lg text-sm text-left mx-auto max-w-sm space-y-2 border">
                <p><strong>Bank/E-Wallet:</strong> {manualQris?.bankName || "-"}</p>
                <p><strong>No. Rekening:</strong> {manualQris?.account || "-"}</p>
                <p><strong>Atas Nama:</strong> {manualQris?.holder || "-"}</p>
              </div>

              <div className="pt-4">
                <p className="text-xs text-muted-foreground mb-4">Setelah transfer, mohon informasikan ke Superadmin via WhatsApp dengan menyertakan bukti transfer.</p>
                <Button onClick={() => setOpen(false)} className="w-full">Selesai / Tutup</Button>
                <Button variant="ghost" onClick={() => setTampilManual(false)} className="w-full mt-2">Kembali</Button>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Crown className="text-warning size-5" /> Perpanjang Masa Sewa</DialogTitle>
                <DialogDescription>
                  Pilih paket berlangganan untuk toko Anda agar tetap bisa menikmati fitur KasToko.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 gap-4 py-4">
                <div 
                  className={`flex cursor-pointer items-start gap-4 rounded-lg border p-4 hover:border-primary ${paketPilihan === "bulanan" ? "border-primary bg-primary/5" : ""}`}
                  onClick={() => setPaketPilihan("bulanan")}
                >
                  <div className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border border-primary">
                    {paketPilihan === "bulanan" && <div className="size-2.5 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Paket 1 Bulan</h4>
                    <p className="text-muted-foreground text-sm mb-2">Berlangganan standar bulanan.</p>
                    <span className="font-money text-lg text-primary">{formatRupiah(monthlyFee)}</span>
                  </div>
                </div>

                <div 
                  className={`flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 shadow-sm relative overflow-hidden ${paketPilihan === "tahunan" ? "border-primary bg-primary/5" : "border-transparent border-border"}`}
                  onClick={() => setPaketPilihan("tahunan")}
                >
                  <div className="absolute top-3 right-[-30px] bg-warning text-warning-foreground text-[10px] font-bold px-8 py-1 rotate-45 shadow-sm">
                    TERLARIS
                  </div>
                  <div className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border border-primary">
                    {paketPilihan === "tahunan" && <div className="size-2.5 rounded-full bg-primary" />}
                  </div>
                  <div className="pr-8">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-lg">Paket 1 Tahun</h4>
                      <Badge className="bg-success text-success-foreground hover:bg-success/90">Hemat {formatRupiah((monthlyFee * 12) - yearlyFee)}!</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-2">Nikmati potongan harga spesial (Diskon 1 bulan lebih).</p>
                    <div className="flex items-baseline gap-2">
                      <span className="font-money text-xl text-primary font-bold">{formatRupiah(yearlyFee)}</span>
                      <span className="font-money text-sm line-through text-muted-foreground">{formatRupiah(monthlyFee * 12)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-semibold mb-3">Pilihan Pembayaran:</p>
                <div className="space-y-3">
                  {manualQris && (
                    <div 
                      className={`flex items-center gap-3 cursor-pointer p-2 rounded-md border ${metodePilihan === "manual" ? "border-primary bg-background" : "border-transparent hover:bg-background"}`}
                      onClick={() => setMetodePilihan("manual")}
                    >
                      <div className="flex size-4 shrink-0 items-center justify-center rounded-full border border-primary">
                        {metodePilihan === "manual" && <div className="size-2 rounded-full bg-primary" />}
                      </div>
                      <ShieldCheck className="size-5 text-success" />
                      <div className="text-sm">
                        <p className="font-medium">QRIS Superadmin (Manual - 0% Fee)</p>
                        <p className="text-xs text-muted-foreground">Hubungi Superadmin / scan QRIS manual milik platform.</p>
                      </div>
                    </div>
                  )}
                  <div 
                    className={`flex items-center gap-3 cursor-pointer p-2 rounded-md border ${metodePilihan === "otomatis" ? "border-primary bg-background" : "border-transparent hover:bg-background"}`}
                    onClick={() => setMetodePilihan("otomatis")}
                  >
                    <div className="flex size-4 shrink-0 items-center justify-center rounded-full border border-primary">
                      {metodePilihan === "otomatis" && <div className="size-2 rounded-full bg-primary" />}
                    </div>
                    <Zap className="size-5 text-primary" />
                    <div className="text-sm">
                      <p className="font-medium">Pembayaran Online Otomatis</p>
                      <p className="text-xs text-muted-foreground">Otomatis langsung aktif setelah pembayaran berhasil.</p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  size="lg"
                  onClick={() => {
                    if (metodePilihan === "manual") {
                      setTampilManual(true);
                    } else {
                      toast.info(`Sistem pembayaran otomatis via ${primaryGateway} sedang dalam pemeliharaan. Silakan gunakan metode QRIS Owner (Manual) sementara waktu.`);
                    }
                  }}
                >
                  Lanjutkan Pembayaran
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
