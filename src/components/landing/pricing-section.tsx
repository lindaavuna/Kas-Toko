"use client";

import Link from "next/link";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function LandingPricing() {
  const plans = [
    {
      id: "trial",
      name: "Uji Coba Gratis",
      badge: "7 Hari Penuh",
      price: "Rp 0",
      period: "selama 7 hari",
      desc: "Uji coba semua fitur kasir dan printer Anda tanpa risiko dan tanpa biaya apa pun.",
      cta: "Mulai Trial Gratis",
      href: "/register?plan=trial",
      highlighted: false,
      features: [
        "Kasir POS & Scanner Barcode",
        "Cetak struk Bluetooth 58/80mm & USB",
        "Mode 100% Offline-First",
        "Maksimal 50 Produk inventaris",
        "Laporan penjualan harian kasir",
        "Tanpa ikatan & tanpa kartu kredit",
      ],
    },
    {
      id: "monthly",
      name: "Paket Bulanan",
      badge: "Paling Fleksibel",
      price: "Rp 50.000",
      period: "/ bulan",
      desc: "Bayar bulanan tanpa ikatan jangka panjang. Bebas perpanjang kapan saja saat toko aktif.",
      cta: "Pilih Paket Bulanan",
      href: "/register?plan=monthly",
      highlighted: false,
      features: [
        "Semua fitur Paket Uji Coba",
        "Produk & Transaksi Unlimited",
        "Buku Kasbon & Tagihan WhatsApp",
        "Asisten AI Hermes (Analisis Read-Only)",
        "Dukungan multi-kasir & shift kerja",
        "Pencadangan cloud harian otomatis",
        "Aktivasi instan via QRIS Super Admin",
      ],
    },
    {
      id: "yearly",
      name: "Paket 1 Tahun",
      badge: "🔥 Paling Hemat (Diskon 1 Bulan)",
      price: "Rp 550.000",
      period: "/ tahun (hemat Rp 50.000)",
      desc: "Pilihan terbaik pemilik toko cerdas. Nikmati gratis 1 bulan sewa dan fokus kembangkan usaha.",
      cta: "Ambil Promo 1 Tahun",
      href: "/register?plan=yearly",
      highlighted: true,
      features: [
        "Semua fitur Paket Bulanan",
        "Gratis 1 Bulan Sewa (Bayar 11 bln dapat 12 bln)",
        "Prioritas bantuan teknis via WhatsApp",
        "Analisis laba rugi & tren belanja pelanggan",
        "Bebas repot bayar tagihan tiap bulan",
        "Stiker QRIS toko & nota kustom nama toko",
        "Garansi data aman & backup permanen",
      ],
    },
  ];

  return (
    <section id="harga" className="py-16 sm:py-24 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 font-semibold px-3 py-1">
            Tarif Transparan &amp; Terjangkau
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Investasi Murah untuk Toko Rapi &amp; Untung Terjaga
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400">
            Tanpa biaya tersembunyi, tanpa komisi per transaksi, dan tanpa dipaksa beli alat mahal.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all relative ${
                p.highlighted
                  ? "bg-slate-900 text-white border-2 border-emerald-500 shadow-2xl shadow-emerald-500/10 scale-100 lg:-translate-y-2"
                  : "bg-slate-50/70 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md"
              }`}
            >
              {/* Top Card Badge */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    p.highlighted
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                      : "bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                  }`}>
                    {p.badge}
                  </span>
                  {p.highlighted && (
                    <Sparkles className="w-5 h-5 text-amber-400 animate-bounce" />
                  )}
                </div>

                <div>
                  <h3 className={`text-xl font-bold ${p.highlighted ? "text-white" : "text-slate-900 dark:text-white"}`}>
                    {p.name}
                  </h3>
                  <p className={`text-xs mt-1 leading-relaxed ${p.highlighted ? "text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>
                    {p.desc}
                  </p>
                </div>

                {/* Price Display */}
                <div className="pt-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
                      p.highlighted ? "text-emerald-400" : "text-slate-900 dark:text-white"
                    }`}>
                      {p.price}
                    </span>
                    <span className={`text-xs font-medium ${p.highlighted ? "text-slate-400" : "text-slate-500"}`}>
                      {p.period}
                    </span>
                  </div>
                </div>

                {/* Feature Checklist */}
                <ul className="space-y-3 pt-2 text-xs sm:text-sm">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        p.highlighted
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600"
                      }`}>
                        <Check className="w-3 h-3" />
                      </div>
                      <span className={p.highlighted ? "text-slate-200" : "text-slate-700 dark:text-slate-300"}>
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom CTA Button */}
              <div className="pt-8">
                <Button
                  asChild
                  size="lg"
                  className={`w-full h-12 rounded-xl font-bold text-sm shadow-md transition-all ${
                    p.highlighted
                      ? "bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/25"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  <Link href={p.href} className="flex items-center justify-center gap-2">
                    <span>{p.cta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
