"use client";

import { Wifi, Printer, QrCode, ShieldCheck } from "lucide-react";

export function LandingValueStrip() {
  const pillars = [
    {
      icon: Wifi,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
      title: "100% Offline-First",
      tagline: "Tahan Mati Lampu & Sinyal Padam",
      desc: "Transaksi kasir, scan barcode, dan cetak nota tetap jalan mulus walau internet mati total. Data tersinkronisasi otomatis saat online.",
    },
    {
      icon: Printer,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
      title: "Printer Bluetooth Bebas",
      tagline: "Pakai Printer Thermal Murah Apa Saja",
      desc: "Tidak dipaksa beli alat mahal jutaan rupiah. Cocok untuk semua printer thermal 58mm & 80mm Bluetooth seharga 100 ribuan.",
    },
    {
      icon: QrCode,
      color: "text-teal-500 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800",
      title: "QRIS & Kasbon WA",
      tagline: "Bebas Piutang & Uang Kembalian",
      desc: "Terima pembayaran QRIS langsung ke rekening Anda. Kirim rincian nota tagihan kasbon ramah ke WhatsApp pelanggan dalam 1-klik.",
    },
    {
      icon: ShieldCheck,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
      title: "Data Terisolasi Aman",
      tagline: "Standar Keamanan PostgreSQL RLS",
      desc: "Setiap toko memiliki ruang data terisolasi. Riwayat penjualan, omset, dan stok Anda terjamin aman tanpa resiko bocor.",
    },
  ];

  return (
    <section id="keunggulan" className="py-14 sm:py-20 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Dibuat Khusus Untuk Realitas Toko Indonesia
          </h2>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            4 Alasan Pemilik Toko Memilih KasToko
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="relative rounded-2xl p-6 bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/80 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all hover:shadow-lg group"
              >
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${p.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {p.title}
                </h3>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 mb-2">
                  {p.tagline}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
