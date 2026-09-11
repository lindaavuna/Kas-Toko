"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/landing/reveal";

export function LandingFAQ() {
  const faqs = [
    {
      q: "Apakah KasToko bisa dipakai di HP Android, tablet, atau laptop lama?",
      a: "Sangat bisa! KasToko didesain ringan dan responsif untuk semua perangkat web. Anda bisa menggunakannya di HP Android apa pun, iPhone, tablet murah, maupun laptop/PC kasir lama tanpa perlu beli perangkat khusus yang mahal.",
    },
    {
      q: "Bagaimana jika internet di toko mati atau sinyal padam tiba-tiba?",
      a: "Toko Anda tetap bisa jualan tanpa gangguan! KasToko dilengkapi arsitektur 100% Offline-First. Scanner barcode, hitung total belanja, dan cetak nota Bluetooth tetap berfungsi lancar walau offline. Begitu internet terhubung kembali, semua data tersinkronisasi otomatis ke cloud.",
    },
    {
      q: "Printer thermal apa saja yang cocok dengan KasToko?",
      a: "KasToko kompatibel dengan hampir semua printer thermal mini 58mm dan 80mm Bluetooth standar ESC/POS (yang umum dijual di Shopee/Tokopedia seharga Rp 100 ribuan sampai Rp 200 ribuan) serta printer thermal USB kabel.",
    },
    {
      q: "Apakah data omset dan keuntungan toko saya aman dan tidak bocor?",
      a: "Sangat aman. Setiap toko memiliki isolasi data ketat berbasis Row-Level Security (RLS) pada basis data PostgreSQL tingkat enterprise. Data produk, harga modal beli, omset, dan data kasbon pelanggan Anda terisolasi secara mandiri.",
    },
    {
      q: "Bagaimana cara mengaktifkan sewa setelah uji coba 7 hari selesai?",
      a: "Sangat mudah! Di dalam dasbor toko, Anda cukup memilih Paket Bulanan (Rp 50.000) atau Paket Tahunan (Rp 550.000 — hemat 1 bulan). Anda tinggal scan QRIS dari m-Banking/e-Wallet apa saja dan masa aktif toko langsung diperpanjang instan.",
    },
    {
      q: "Apakah laporan penjualan toko bisa diunduh ke Excel atau PDF?",
      a: "Bisa! Anda bisa mengekspor laporan omset harian, rincian laba kotor, riwayat kasbon pelanggan, dan daftar stok barang ke file Microsoft Excel (.xlsx) atau PDF kapan saja.",
    },
  ];

  return (
    <section id="faq" className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Tanya jawab populer
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Pertanyaan yang sering diajukan
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Masih ragu atau punya pertanyaan seputar penggunaan aplikasi? Temukan jawabannya di sini.
          </p>
        </Reveal>

        <Reveal delay={100} className="bg-white dark:bg-slate-950 rounded-2xl px-6 sm:px-8 border border-slate-200 dark:border-slate-800">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, idx) => (
              <AccordionItem
                key={faq.q}
                value={`item-${idx}`}
                className="border-b border-slate-200 dark:border-slate-800 last:border-b-0"
              >
                <AccordionTrigger className="text-left font-medium text-sm sm:text-base text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
