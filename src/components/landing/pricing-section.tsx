"use client";

import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/reveal";

export function LandingPricing() {
  const plans = [
    {
      id: "trial",
      name: "Uji Coba Gratis",
      badge: "7 hari penuh",
      price: "Rp 0",
      period: "selama 7 hari",
      desc: "Uji coba semua fitur kasir dan printer Anda tanpa risiko dan tanpa biaya apa pun.",
      cta: "Mulai trial gratis",
      href: "/register?plan=trial",
      highlighted: false,
      features: [
        "Kasir POS & scanner barcode",
        "Cetak struk Bluetooth 58/80mm & USB",
        "Mode 100% offline-first",
        "Maksimal 50 produk inventaris",
        "Laporan penjualan harian kasir",
        "Tanpa ikatan & tanpa kartu kredit",
      ],
    },
    {
      id: "monthly",
      name: "Paket Bulanan",
      badge: "Paling fleksibel",
      price: "Rp 50.000",
      period: "/ bulan",
      desc: "Bayar bulanan tanpa ikatan jangka panjang. Bebas perpanjang kapan saja saat toko aktif.",
      cta: "Pilih paket bulanan",
      href: "/register?plan=monthly",
      highlighted: false,
      features: [
        "Semua fitur paket uji coba",
        "Produk & transaksi tanpa batas",
        "Buku kasbon & tagihan WhatsApp",
        "Asisten AI analis bisnis (read-only)",
        "Dukungan multi-kasir & shift kerja",
        "Pencadangan cloud harian otomatis",
        "Aktivasi instan via QRIS",
      ],
    },
    {
      id: "yearly",
      name: "Paket 1 Tahun",
      badge: "Paling hemat",
      price: "Rp 550.000",
      period: "/ tahun",
      desc: "Pilihan terbaik pemilik toko. Nikmati gratis 1 bulan sewa dan fokus kembangkan usaha.",
      cta: "Ambil promo 1 tahun",
      href: "/register?plan=yearly",
      highlighted: true,
      features: [
        "Semua fitur paket bulanan",
        "Gratis 1 bulan sewa (bayar 11 dapat 12)",
        "Prioritas bantuan teknis via WhatsApp",
        "Analisis laba rugi & tren pelanggan",
        "Bebas repot bayar tagihan tiap bulan",
        "Stiker QRIS toko & nota kustom",
        "Garansi data aman & backup permanen",
      ],
    },
  ];

  return (
    <section id="harga" className="py-16 sm:py-24 bg-white dark:bg-slate-900">
      <div className="max-w-7xl xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Tarif transparan & terjangkau
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Investasi murah untuk toko rapi & untung terjaga
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400">
            Tanpa biaya tersembunyi, tanpa komisi per transaksi, dan tanpa dipaksa beli alat mahal.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {plans.map((p, idx) => (
            <Reveal
              key={p.id}
              delay={idx * 100}
              className={`rounded-2xl p-7 sm:p-8 flex flex-col justify-between transition-colors relative border ${
                p.highlighted
                  ? "bg-slate-950 text-white border-emerald-700 dark:border-emerald-700"
                  : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="space-y-4">
                <span
                  className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border ${
                    p.highlighted
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-800"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {p.badge}
                </span>

                <div>
                  <h3 className={`text-lg font-semibold ${p.highlighted ? "text-white" : "text-slate-900 dark:text-white"}`}>
                    {p.name}
                  </h3>
                  <p className={`text-xs mt-1.5 leading-relaxed ${p.highlighted ? "text-slate-400" : "text-slate-500 dark:text-slate-400"}`}>
                    {p.desc}
                  </p>
                </div>

                <div className={`pt-2 pb-4 border-b ${p.highlighted ? "border-slate-800" : "border-slate-200 dark:border-slate-800"}`}>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-3xl sm:text-4xl font-semibold tracking-tight ${
                      p.highlighted ? "text-emerald-400" : "text-slate-900 dark:text-white"
                    }`}>
                      {p.price}
                    </span>
                    <span className={`text-xs font-normal ${p.highlighted ? "text-slate-500" : "text-slate-500"}`}>
                      {p.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 pt-2 text-sm">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${
                        p.highlighted ? "text-emerald-400" : "text-emerald-600"
                      }`} />
                      <span className={p.highlighted ? "text-slate-300" : "text-slate-700 dark:text-slate-300"}>
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <Button
                  asChild
                  size="lg"
                  className={`w-full h-12 rounded-lg font-semibold text-sm ${
                    p.highlighted
                      ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  <Link href={p.href} className="flex items-center justify-center gap-2">
                    <span>{p.cta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
