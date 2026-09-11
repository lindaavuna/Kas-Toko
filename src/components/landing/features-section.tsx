"use client";

import { Barcode, MessageSquare, AlertTriangle, Sparkles, CheckCircle2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/landing/reveal";

export function LandingFeatures() {
  const fitur = [
    {
      icon: Barcode,
      warna: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
      judul: "Mesin Kasir Kilat & Barcode Scanner",
      desc: "Scan barcode barang memakai scanner laser USB, Bluetooth nirkabel, atau kamera smartphone. Transaksi belanja tuntas hanya dalam hitungan detik.",
      poin: [
        "Shortcut kasir cepat (F2 Cari, F9 Bayar Tunai, F10 Struk)",
        "Pencarian instan nama produk atau scan barcode",
        "Mode multi-kasir dengan pembagian shift transparan",
      ],
      warnaCentang: "text-emerald-600",
    },
    {
      icon: MessageSquare,
      warna: "bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400",
      judul: "Buku Kasbon Digital & Tagihan WhatsApp",
      desc: "Catat piutang pelanggan setia tanpa kertas robek atau hilang. Kirim rincian nota tagihan kasbon langsung ke nomor WhatsApp pelanggan.",
      poin: [
        "1-klik kirim rincian belanja kasbon via WhatsApp",
        "Pencatatan cicilan parsial otomatis mengurangi sisa piutang",
        "Akses buku kasbon khusus pemilik toko (Owner)",
      ],
      warnaCentang: "text-teal-600",
    },
    {
      icon: AlertTriangle,
      warna: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
      judul: "Peringatan Stok Menipis",
      desc: "Tentukan batas stok minimum per produk. Sistem otomatis memberi peringatan saat barang dagangan mendekati habis sebelum pembeli kecewa.",
      poin: [
        "Lencana merah otomatis di kasir saat stok tersisa sedikit",
        "Daftar belanjaan kulakan ke supplier tergenerate otomatis",
        "Penyesuaian stok opname untuk barang rusak atau kadaluarsa",
      ],
      warnaCentang: "text-amber-600",
    },
  ];

  return (
    <section id="fitur" className="py-8 sm:py-12 bg-slate-50 dark:bg-slate-900/40 relative overflow-hidden">
      {/* Dekorasi latar belakang (Glassmorphism highlight) */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <div className="w-full max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Reveal className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <Badge
            variant="outline"
            className="text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 bg-emerald-50/80 dark:bg-emerald-950/40 backdrop-blur-sm font-medium"
          >
            Fitur lengkap ritel & grosir
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Semua yang dibutuhkan toko Anda, tanpa kerumitan
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400">
            Didesain intuitif agar kasir, pemilik toko, maupun karyawan keluarga bisa langsung mengoperasikannya tanpa pelatihan teknis berhari-hari.
          </p>
        </Reveal>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-6">
          {fitur.map((f, idx) => {
            const Icon = f.icon;
            return (
              <Reveal
                key={f.judul}
                delay={idx * 80}
                className="group rounded-2xl p-6 sm:p-8 bg-white/80 dark:bg-slate-950/60 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-300/50 dark:hover:border-emerald-800/50 hover:-translate-y-1 flex flex-col h-full"
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${f.warna}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white leading-tight">
                      {f.judul}
                    </h3>
                  </div>
                </div>
                <p className="text-[13px] sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed flex-1">
                  {f.desc}
                </p>
                <ul className="space-y-3 text-[13px] sm:text-sm text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-xl">
                  {f.poin.map((p) => (
                    <li key={p} className="flex items-start gap-2.5">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${f.warnaCentang}`} />
                      <span>{p}</span>
                    </li>
                   ))}
                </ul>
              </Reveal>
            );
          })}

          {/* Kartu Asisten AI */}
          <Reveal
            delay={240}
            id="ai-assistant"
            className="group rounded-2xl p-6 sm:p-8 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md border border-slate-800 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-900/20 hover:border-emerald-500/30 hover:-translate-y-1 flex flex-col h-full relative overflow-hidden"
          >
            {/* Aksen kilau AI */}
            <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />

            <div className="flex items-start justify-between gap-4 mb-5 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white leading-tight">
                  Asisten AI Analis Bisnis
                </h3>
              </div>
              <Badge
                variant="outline"
                className="text-emerald-300 border-emerald-800/60 bg-emerald-950/50 font-medium whitespace-nowrap"
              >
                100% Read-Only
              </Badge>
            </div>

            <p className="text-[13px] sm:text-sm text-slate-400 mb-6 leading-relaxed flex-1 relative z-10">
              Konsultasikan kinerja toko Anda lewat obrolan teks bahasa Indonesia. AI menganalisis omset, produk terlaris, dan kasbon secara real-time layaknya asisten pribadi.
            </p>

            <div className="space-y-4 relative z-10">
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-medium text-xs sm:text-sm">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Standar keamanan anti-manipulasi data</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px] sm:text-xs">
                  AI dikunci hanya boleh membaca data (<span className="font-mono text-emerald-300 bg-emerald-950/50 px-1 py-0.5 rounded">SELECT only</span>). AI tidak bisa memotong kasir atau menghapus transaksi dagangan Anda.
                </p>
              </div>

              <ul className="space-y-3 text-[13px] sm:text-sm text-slate-300 bg-slate-800/30 p-4 rounded-xl">
                {[
                  "Tanya: \u201cBerapa omset dan laba bersih hari ini?\u201d",
                  "Tanya: \u201cProduk apa saja yang harus saya kulakan besok?\u201d",
                  "Didukung model canggih (Llama 3 & Groq)",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
