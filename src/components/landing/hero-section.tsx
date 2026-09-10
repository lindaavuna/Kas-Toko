"use client";

import Link from "next/link";
import { ArrowRight, Play, CheckCircle2, WifiOff, Printer, QrCode, Sparkles, Barcode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function LandingHero() {
  return (
    <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-400/15 dark:bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-teal-400/10 dark:bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Platform SaaS POS Kasir Ritel UMKM #1</span>
          </div>

          {/* Headline H1 */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Bikin Warung & Toko Anda{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500">
              Naik Kelas
            </span>
            : Kasir Cepat, Laba Rapi.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Aplikasi kasir & inventaris ritel modern berbasis cloud dengan mode{" "}
            <span className="font-semibold text-slate-900 dark:text-white underline decoration-emerald-500 decoration-2 underline-offset-4">
              100% offline-first
            </span>
            . Transaksi tetap jalan lancar walau mati lampu atau internet padam.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/25 rounded-xl transition-all hover:scale-[1.02]"
            >
              <Link href="/register?plan=trial">
                Mulai Uji Coba Gratis 7 Hari
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-12 px-6 border-slate-300 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              <Link href="/login" className="flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                <span>Coba Akun Demo Langsung</span>
              </Link>
            </Button>
          </div>

          {/* Trust Highlights under CTA */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Tanpa Kartu Kredit
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Langsung Aktif 3 Menit
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Bebas Batalkan Kapan Saja
            </span>
          </div>
        </div>

        {/* Visual POS Mockup Showcase */}
        <div className="mt-12 sm:mt-16 max-w-5xl mx-auto relative">
          {/* Floating Badge 1: Offline Mode */}
          <div className="hidden lg:flex absolute -left-6 top-16 z-20 items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-3.5 backdrop-blur-sm animate-bounce duration-1000">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
              <WifiOff className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">100% Offline-First</p>
              <p className="text-[11px] text-slate-500">Jualan jalan tanpa internet</p>
            </div>
          </div>

          {/* Floating Badge 2: Bluetooth Printer */}
          <div className="hidden lg:flex absolute -right-6 top-32 z-20 items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-3.5 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Printer Bluetooth 58/80mm</p>
              <p className="text-[11px] text-emerald-600 font-medium">Cetak struk nota kilat ✔</p>
            </div>
          </div>

          {/* Tablet POS Frame Mockup */}
          <div className="rounded-2xl sm:rounded-3xl p-2 sm:p-4 bg-slate-900/90 shadow-2xl border border-slate-800 ring-1 ring-white/10">
            <div className="bg-slate-950 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-800">
              {/* Top Window Bar */}
              <div className="h-9 bg-slate-900 px-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono text-slate-400 ml-2 hidden sm:inline">
                    toko.billinghmb.site/kasir — Toko Berkah Jaya
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-[11px] text-emerald-400 font-medium">Kasir Online</span>
                </div>
              </div>

              {/* POS Interface Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[380px] sm:min-h-[440px] text-slate-200">
                {/* Left: Barcode Scanner & Product Catalog Preview */}
                <div className="lg:col-span-7 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Barcode className="w-4 h-4 text-emerald-400" />
                      <span>Scanner Barcode Siap (USB & Kamera HP)</span>
                    </div>
                    <Badge variant="outline" className="text-[11px] bg-slate-900 border-slate-700 text-slate-300">
                      Shift Pagi
                    </Badge>
                  </div>

                  {/* Sample Catalog Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1 hover:border-emerald-500/50 transition-colors">
                      <div className="h-14 rounded-lg bg-emerald-950/40 flex items-center justify-center text-xl">🍚</div>
                      <p className="text-xs font-semibold truncate text-white">Beras Ramos 5kg</p>
                      <p className="text-xs text-emerald-400 font-bold">Rp 68.000</p>
                      <p className="text-[10px] text-slate-400">Stok: 24 sak</p>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1 hover:border-emerald-500/50 transition-colors">
                      <div className="h-14 rounded-lg bg-amber-950/40 flex items-center justify-center text-xl">🌻</div>
                      <p className="text-xs font-semibold truncate text-white">Minyak Goreng 2L</p>
                      <p className="text-xs text-emerald-400 font-bold">Rp 34.500</p>
                      <p className="text-[10px] text-slate-400">Stok: 18 btl</p>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1 hover:border-emerald-500/50 transition-colors">
                      <div className="h-14 rounded-lg bg-orange-950/40 flex items-center justify-center text-xl">🥚</div>
                      <p className="text-xs font-semibold truncate text-white">Telur Ayam 1kg</p>
                      <p className="text-xs text-emerald-400 font-bold">Rp 28.000</p>
                      <p className="text-[10px] text-slate-400">Stok: 35 kg</p>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1 hover:border-emerald-500/50 transition-colors">
                      <div className="h-14 rounded-lg bg-rose-950/40 flex items-center justify-center text-xl">☕</div>
                      <p className="text-xs font-semibold truncate text-white">Kopi Kapal Api 10s</p>
                      <p className="text-xs text-emerald-400 font-bold">Rp 12.500</p>
                      <p className="text-[10px] text-slate-400">Stok: 40 renceng</p>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1 hover:border-emerald-500/50 transition-colors">
                      <div className="h-14 rounded-lg bg-blue-950/40 flex items-center justify-center text-xl">🧂</div>
                      <p className="text-xs font-semibold truncate text-white">Gula Pasir 1kg</p>
                      <p className="text-xs text-emerald-400 font-bold">Rp 17.500</p>
                      <p className="text-[10px] text-slate-400">Stok: 15 kg</p>
                    </div>

                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1 hover:border-emerald-500/50 transition-colors">
                      <div className="h-14 rounded-lg bg-indigo-950/40 flex items-center justify-center text-xl">🍜</div>
                      <p className="text-xs font-semibold truncate text-white">Indomie Goreng</p>
                      <p className="text-xs text-emerald-400 font-bold">Rp 3.500</p>
                      <p className="text-[10px] text-slate-400">Stok: 85 bks</p>
                    </div>
                  </div>
                </div>

                {/* Right: Cart & Quick Bill */}
                <div className="lg:col-span-5 p-4 sm:p-6 bg-slate-900/40 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="font-bold text-sm text-white">Keranjang Kasir (3 item)</span>
                      <span className="text-xs font-mono text-emerald-400">#TRX-2026-0910</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center py-1">
                        <div>
                          <p className="font-medium text-white">Beras Ramos 5kg</p>
                          <p className="text-slate-400 text-[11px]">1 x Rp 68.000</p>
                        </div>
                        <span className="font-semibold text-slate-200">Rp 68.000</span>
                      </div>

                      <div className="flex justify-between items-center py-1">
                        <div>
                          <p className="font-medium text-white">Minyak Goreng 2L</p>
                          <p className="text-slate-400 text-[11px]">1 x Rp 34.500</p>
                        </div>
                        <span className="font-semibold text-slate-200">Rp 34.500</span>
                      </div>

                      <div className="flex justify-between items-center py-1">
                        <div>
                          <p className="font-medium text-white">Telur Ayam 1kg</p>
                          <p className="text-slate-400 text-[11px]">1 x Rp 28.000</p>
                        </div>
                        <span className="font-semibold text-slate-200">Rp 28.000</span>
                      </div>
                    </div>
                  </div>

                  {/* Cart Total & Action Bar */}
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-400">Total Tagihan:</span>
                      <span className="text-2xl font-black text-emerald-400 font-mono">Rp 130.500</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-10 rounded-lg bg-slate-800 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-200">
                        <QrCode className="w-4 h-4 text-teal-400" />
                        <span>QRIS Toko</span>
                      </div>
                      <div className="h-10 rounded-lg bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-1.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30">
                        <span>Bayar Tunai [F9]</span>
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
