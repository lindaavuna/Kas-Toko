"use client";

import { Wifi, Printer, QrCode, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/landing/reveal";

export function LandingValueStrip() {
  const pillars = [
    {
      icon: Wifi,
      warna: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
      title: "100% Offline-First",
      tagline: "Tahan mati lampu & sinyal padam",
      desc: "Transaksi kasir, scan barcode, dan cetak nota tetap jalan mulus walau internet mati total. Data tersinkronisasi otomatis saat online.",
    },
    {
      icon: Printer,
      warna: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
      title: "Printer Bluetooth Bebas",
      tagline: "Pakai printer thermal apa saja",
      desc: "Tidak dipaksa beli alat mahal jutaan rupiah. Cocok untuk semua printer thermal 58mm & 80mm Bluetooth seharga ratusan ribu.",
    },
    {
      icon: QrCode,
      warna: "text-teal-600 bg-teal-50 dark:bg-teal-950/40",
      title: "QRIS & Kasbon WhatsApp",
      tagline: "Bebas piutang & uang kembalian",
      desc: "Terima pembayaran QRIS langsung ke rekening Anda. Kirim rincian nota tagihan kasbon ke WhatsApp pelanggan dalam 1-klik.",
    },
    {
      icon: ShieldCheck,
      warna: "text-blue-600 bg-blue-50 dark:bg-blue-950/40",
      title: "Data Terisolasi Aman",
      tagline: "Standar keamanan PostgreSQL RLS",
      desc: "Setiap toko memiliki ruang data terisolasi. Riwayat penjualan, omset, dan stok Anda terjamin aman tanpa risiko bocor.",
    },
  ];

  return (
    <section
      id="keunggulan"
      className="py-14 sm:py-20 bg-white dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800"
    >
      <div className="max-w-7xl xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Dibuat untuk realitas toko Indonesia
          </h2>
          <p className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Empat alasan pemilik toko memilih KasToko
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <Reveal
                key={p.title}
                delay={idx * 80}
                className="rounded-2xl p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${p.warna}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {p.title}
                </h3>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-0.5 mb-2">
                  {p.tagline}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {p.desc}
                </p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
