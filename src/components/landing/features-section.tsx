"use client";

import { Barcode, MessageSquare, AlertTriangle, Sparkles, CheckCircle2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function LandingFeatures() {
  return (
    <section id="fitur" className="py-16 sm:py-24 bg-slate-50/60 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 font-semibold px-3 py-1">
            Fitur Lengkap Ritel & Grosir
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Semua yang Dibutuhkan Toko Anda, Tanpa Kerumitan
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400">
            Didesain intuitif agar kasir, pemilik toko, maupun karyawan keluarga bisa langsung mengoperasikannya tanpa pelatihan teknis berhari-hari.
          </p>
        </div>

        {/* Feature Grid: 2x2 Rich Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Kasir POS Kilat & Barcode */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <Barcode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Mesin Kasir Kilat & Barcode Scanner
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Scan barcode barang memakai scanner laser USB, Bluetooth nirkabel, atau kamera smartphone. Transaksi belanja tuntas hanya dalam hitungan detik.
              </p>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Shortcut tombol kasir cepat (F2 Cari, F9 Bayar Tunai, F10 Struk)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pencarian instan nama produk atau scan barcode</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mode multi-kasir dengan pembagian shift kerja transparan</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Buku Kasbon Digital & Tagihan WA */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/50 text-teal-600 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Buku Kasbon Digital & Tagihan WhatsApp
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Catat piutang pelanggan setia tanpa kertas robek atau hilang. Kirim rincian nota tagihan kasbon yang ramah dan rapi langsung ke nomor WhatsApp pelanggan.
              </p>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>1-Klik kirim rincian belanja kasbon via pesan WhatsApp</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Pencatatan cicilan parsial otomatis mengurangi sisa piutang</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Buku kasbon dilindungi akses khusus pemilik toko (Owner)</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Peringatan Stok Menipis */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Peringatan Stok Menipis (Alarm Habis Barang)
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Tentukan batas stok minimum per produk. Sistem otomatis memberi peringatan visual saat barang dagangan mendekati habis sebelum pembeli kecewa.
              </p>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Lencana merah otomatis di kasir saat stok barang tersisa sedikit</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Daftar belanjaan kulakan ke supplier tergenerate otomatis</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Penyesuaian stok opname mudah untuk mencatat barang rusak/kadaluarsa</span>
              </li>
            </ul>
          </div>

          {/* Card 4: Asisten AI Hermes (Read-Only) */}
          <div id="ai-assistant" className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 border border-emerald-500/30 shadow-xl space-y-5 text-white relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-500/20 blur-2xl rounded-full pointer-events-none" />
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <Badge variant="outline" className="text-xs bg-emerald-950/80 border-emerald-500/40 text-emerald-300">
                Dedicated AI Server (172.22.22.6)
              </Badge>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">
                  Asisten AI Hermes
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  100% Read-Only
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                Konsultasikan kinerja toko Anda lewat obrolan teks bahasa Indonesia. AI terhubung ke server mandiri untuk menganalisis omset, produk terlaris, dan kasbon secara real-time.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <ShieldAlert className="w-4 h-4" />
                <span>Standar Keamanan Anti-Manipulasi Data:</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                AI dikunci hanya boleh membaca data (<span className="font-mono text-emerald-300">SELECT only</span>). AI tidak bisa memotong kasir atau menghapus transaksi dagangan Anda.
              </p>
            </div>

            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tanya: &ldquo;Berapa omset dan laba bersih hari ini?&rdquo;</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tanya: &ldquo;Produk apa saja yang harus saya kulakan besok?&rdquo;</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Didukung model canggih FreeLLM lokal &amp; Groq Llama/GPT</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
