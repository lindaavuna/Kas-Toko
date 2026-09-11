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
    <section className="relative pt-12 pb-8 lg:pt-20 lg:pb-12 overflow-hidden bg-white dark:bg-slate-950">
      {/* Latar belakang aksen gradasi yang lebih natural */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[600px] pointer-events-none bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.12),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.08),transparent_50%)]"
      />

      <div className="w-full max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Kolom Kiri: Teks & CTA */}
          <div className="text-left space-y-6 lg:pr-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>POS Kasir & Stok untuk UMKM Indonesia</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Kasir cepat, stok rapi & laba tercatat.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">
                Otomatis.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
              Aplikasi kasir dan inventaris ritel modern berbasis cloud dengan mode{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-200">
                100% offline-first
              </span>
              . Transaksi tetap berjalan lancar meski koneksi internet toko putus.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto h-12 px-8 rounded-lg text-base font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all hover:-translate-y-0.5"
              >
                <Link href="/register?plan=trial">
                  Mulai uji coba gratis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 px-6 rounded-lg text-base font-medium border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
              >
                <Link href="/login" className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  <span>Coba demo aplikasi</span>
                </Link>
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-5 text-sm text-slate-600 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Tanpa kartu kredit
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Siap pakai dalam 3 menit
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Batal kapan saja
              </span>
            </div>
          </div>

          {/* Kolom Kanan: Mockup POS */}
          <div className="relative w-full lg:ml-auto max-w-2xl mx-auto lg:mx-0 mt-8 lg:mt-0" style={{ perspective: "1000px" }}>
            {/* Dekorasi mengambang untuk memberikan kesan dinamis tanpa berlebihan */}
            <div className="hidden sm:flex absolute -left-8 top-12 z-20 items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-black/5 dark:shadow-black/20 rounded-xl p-3.5 transition-transform duration-700">
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
                <WifiOff className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Offline-First</p>
                <p className="text-[11px] text-slate-500">Tetap jualan tanpa internet</p>
              </div>
            </div>

            <div className="hidden sm:flex absolute -right-6 top-32 z-20 items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-black/5 dark:shadow-black/20 rounded-xl p-3.5 transition-transform duration-700 delay-150">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Printer Bluetooth</p>
                <p className="text-[11px] text-emerald-600 font-medium">Cetak struk kasir kilat</p>
              </div>
            </div>

            {/* Frame Utama Mockup */}
            <div className="rounded-2xl p-2 sm:p-2.5 bg-slate-200 dark:bg-slate-800 shadow-2xl shadow-slate-300/50 dark:shadow-slate-900/80 border border-slate-300 dark:border-slate-700 transform lg:-rotate-y-6 lg:rotate-x-3 transition-transform hover:rotate-0 duration-500">
              <div className="bg-white dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
                {/* Bar Jendela Browser Mockup */}
                <div className="h-9 bg-slate-100 dark:bg-slate-900 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <div className="ml-3 px-3 py-0.5 bg-white dark:bg-slate-800 rounded-md text-[10px] font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 items-center gap-1.5 hidden sm:flex">
                      <span className="text-slate-400">🔒</span> kastoko.com/kasir
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-slate-600 dark:text-emerald-400 font-medium">Kasir Aktif</span>
                  </div>
                </div>

                {/* Konten UI POS */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-0 min-h-[380px] sm:min-h-[420px]">
                  {/* Katalog Produk */}
                  <div className="sm:col-span-7 p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-950">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 shadow-sm">
                        <Barcode className="w-3.5 h-3.5 text-slate-400" />
                        <span>Kamera HP siap</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 hover:bg-emerald-100 border-none shadow-sm">
                        Shift Pagi
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 flex-1 content-start">
                      {produkContoh.map((p) => {
                        const Icon = p.icon;
                        return (
                          <div
                            key={p.nama}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 flex flex-col gap-1 shadow-sm hover:border-emerald-500/50 transition-colors cursor-pointer"
                          >
                            <div className="h-10 rounded bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800/50">
                              <Icon className="w-4 h-4" />
                            </div>
                            <p className="text-[11px] font-semibold truncate text-slate-700 dark:text-slate-200 mt-1">{p.nama}</p>
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">{p.harga}</p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500">{p.stok}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Struk / Keranjang Belanja */}
                  <div className="sm:col-span-5 p-3 sm:p-4 bg-white dark:bg-slate-900 flex flex-col h-full">
                    <div className="flex-1">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800 border-dashed">
                        <span className="font-bold text-[13px] text-slate-800 dark:text-white">Pesanan Aktif</span>
                        <span className="text-[10px] font-mono text-slate-400">#TRX-0910</span>
                      </div>

                      <div className="space-y-2 text-[11px]">
                        {[
                          ["Beras Ramos 5kg", "1 x Rp 68.000", "Rp 68.000"],
                          ["Minyak Goreng 2L", "1 x Rp 34.500", "Rp 34.500"],
                          ["Telur Ayam 1kg", "1 x Rp 28.000", "Rp 28.000"],
                        ].map(([nama, qty, total]) => (
                          <div key={nama} className="flex justify-between items-center py-0.5">
                            <div>
                              <p className="font-semibold text-slate-700 dark:text-slate-300">{nama}</p>
                              <p className="text-slate-400 text-[10px]">{qty}</p>
                            </div>
                            <span className="font-semibold text-slate-600 dark:text-slate-300">{total}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Area Pembayaran */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 border-dashed mt-auto">
                      <div className="flex justify-between items-baseline mb-3">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Tagihan</span>
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Rp 130.500</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-9 rounded-md bg-slate-100 dark:bg-slate-950 flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                          <QrCode className="w-3.5 h-3.5" />
                          <span>QRIS</span>
                        </div>
                        <div className="h-9 rounded-md bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center text-[11px] font-bold text-white shadow-sm shadow-emerald-600/20 cursor-pointer transition-colors">
                          Bayar [F9]
                        </div>
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
