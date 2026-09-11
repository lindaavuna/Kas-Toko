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
    <section id="fitur" className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <Badge
            variant="outline"
            className="text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 font-medium"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fitur.map((f, idx) => {
            const Icon = f.icon;
            return (
              <Reveal
                key={f.judul}
                delay={idx * 80}
                className="rounded-2xl p-6 sm:p-8 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 transition-colors hover:border-emerald-300 dark:hover:border-emerald-800 space-y-5"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${f.warna}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
                    {f.judul}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
                <ul className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
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
            className="rounded-2xl p-6 sm:p-8 bg-slate-950 border border-slate-800 space-y-5 h-full"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <Badge
                variant="outline"
                className="text-emerald-300 border-emerald-800 bg-emerald-950/50 font-medium"
              >
                100% Read-Only
              </Badge>
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-white">
                Asisten AI Analis Bisnis
              </h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Konsultasikan kinerja toko Anda lewat obrolan teks bahasa Indonesia. AI menganalisis omset, produk terlaris, dan kasbon secara real-time.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <ShieldAlert className="w-4 h-4" />
                <span>Standar keamanan anti-manipulasi data</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                AI dikunci hanya boleh membaca data (<span className="font-mono text-emerald-300">SELECT only</span>). AI tidak bisa memotong kasir atau menghapus transaksi dagangan Anda.
              </p>
            </div>

            <ul className="space-y-2.5 text-sm text-slate-300">
              {[
                "Tanya: \u201cBerapa omset dan laba bersih hari ini?\u201d",
                "Tanya: \u201cProduk apa saja yang harus saya kulakan besok?\u201d",
                "Didukung model canggih FreeLLM lokal & Groq",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
