"use client";

import Link from "next/link";
import {
  ArrowRight,
  Play,
  CheckCircle2,
  WifiOff,
  Printer,
  QrCode,
  Barcode,
  Package,
  Droplet,
  Egg,
  Coffee,
  Cookie,
  Wheat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const produkContoh = [
  { icon: Wheat, nama: "Beras Ramos 5kg", harga: "Rp 68.000", stok: "Stok: 24 sak" },
  { icon: Droplet, nama: "Minyak Goreng 2L", harga: "Rp 34.500", stok: "Stok: 18 btl" },
  { icon: Egg, nama: "Telur Ayam 1kg", harga: "Rp 28.000", stok: "Stok: 35 kg" },
  { icon: Coffee, nama: "Kopi Bubuk 10s", harga: "Rp 12.500", stok: "Stok: 40 pcs" },
  { icon: Cookie, nama: "Gula Pasir 1kg", harga: "Rp 17.500", stok: "Stok: 15 kg" },
  { icon: Package, nama: "Mie Instan", harga: "Rp 3.500", stok: "Stok: 85 bks" },
];

export function LandingHero() {
  return (
    <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden bg-white dark:bg-slate-950">
      {/* Aksen latar halus */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[420px] pointer-events-none bg-[radial-gradient(60%_100%_at_50%_0%,rgba(16,185,129,0.10),transparent_70%)]"
      />

      <div className="max-w-7xl xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>POS kasir & stok untuk UMKM Indonesia</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Kasir cepat, stok rapi, dan laba tercatat.{" "}
            <span className="text-emerald-600 dark:text-emerald-400">
              Otomatis.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Aplikasi kasir dan inventaris ritel modern berbasis cloud dengan mode{" "}
            <span className="font-medium text-slate-900 dark:text-slate-200">
              100% offline-first
            </span>
            . Transaksi tetap berjalan meski internet padam.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-12 px-7 rounded-lg text-base font-semibold"
            >
              <Link href="/register?plan=trial">
                Mulai uji coba 7 hari
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-12 px-6 rounded-lg text-base font-medium"
            >
              <Link href="/login" className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                <span>Coba akun demo</span>
              </Link>
            </Button>
          </div>

          {/* Trust */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Tanpa kartu kredit
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Aktif dalam 3 menit
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Batal kapan saja
            </span>
          </div>
        </div>

        {/* Mockup POS */}
        <div className="mt-14 sm:mt-20 max-w-5xl xl:max-w-[1240px] mx-auto relative">
          <div className="hidden lg:flex absolute -left-6 top-16 z-20 items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg rounded-xl p-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
              <WifiOff className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">100% Offline-First</p>
              <p className="text-[11px] text-slate-500">Jualan jalan tanpa internet</p>
            </div>
          </div>

          <div className="hidden lg:flex absolute -right-6 top-32 z-20 items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg rounded-xl p-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">Printer Bluetooth 58/80mm</p>
              <p className="text-[11px] text-emerald-600 font-medium">Cetak struk kilat</p>
            </div>
          </div>

          <div className="rounded-2xl p-2 sm:p-3 bg-slate-950 shadow-2xl border border-slate-800">
            <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
              {/* Bar jendela */}
              <div className="h-9 bg-slate-950 px-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  <span className="text-xs font-mono text-slate-500 ml-2 hidden sm:inline">
                    KasToko — Toko Berkah Jaya
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-[11px] text-emerald-400 font-medium">Kasir Online</span>
                </div>
              </div>

              {/* Isi POS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[380px] sm:min-h-[420px] text-slate-200">
                {/* Katalog */}
                <div className="lg:col-span-7 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Barcode className="w-4 h-4 text-emerald-400" />
                      <span>Scanner barcode siap (USB & kamera HP)</span>
                    </div>
                    <Badge variant="outline" className="text-[11px] bg-slate-950 border-slate-700 text-slate-300">
                      Shift Pagi
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {produkContoh.map((p) => {
                      const Icon = p.icon;
                      return (
                        <div
                          key={p.nama}
                          className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-1 hover:border-emerald-500/50 transition-colors"
                        >
                          <div className="h-12 rounded-md bg-slate-900 flex items-center justify-center text-slate-400">
                            <Icon className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-medium truncate text-white">{p.nama}</p>
                          <p className="text-xs text-emerald-400 font-semibold">{p.harga}</p>
                          <p className="text-[10px] text-slate-500">{p.stok}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Keranjang */}
                <div className="lg:col-span-5 p-4 sm:p-6 bg-slate-950/40 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="font-semibold text-sm text-white">Keranjang (3 item)</span>
                      <span className="text-xs font-mono text-slate-500">#TRX-2026-0910</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {[
                        ["Beras Ramos 5kg", "1 x Rp 68.000", "Rp 68.000"],
                        ["Minyak Goreng 2L", "1 x Rp 34.500", "Rp 34.500"],
                        ["Telur Ayam 1kg", "1 x Rp 28.000", "Rp 28.000"],
                      ].map(([nama, qty, total]) => (
                        <div key={nama} className="flex justify-between items-center py-1">
                          <div>
                            <p className="font-medium text-slate-200">{nama}</p>
                            <p className="text-slate-500 text-[11px]">{qty}</p>
                          </div>
                          <span className="font-medium text-slate-300">{total}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-400">Total Tagihan</span>
                      <span className="text-2xl font-bold text-emerald-400 font-mono">Rp 130.500</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-10 rounded-lg bg-slate-800 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-300">
                        <QrCode className="w-4 h-4" />
                        <span>QRIS Toko</span>
                      </div>
                      <div className="h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-xs font-semibold text-white">
                        Bayar Tunai [F9]
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
