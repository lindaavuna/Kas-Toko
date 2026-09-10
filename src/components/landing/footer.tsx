"use client";

import Link from "next/link";
import { Store, ArrowRight, ShieldCheck, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingFooter() {
  return (
    <footer className="bg-slate-950 text-white relative overflow-hidden border-t border-slate-800">
      {/* Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Final Closing CTA Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 sm:pt-20 sm:pb-16 relative z-10 border-b border-slate-800/80">
        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-emerald-900/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 text-center space-y-6 max-w-4xl mx-auto shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Tanpa Biaya • Langsung Aktif</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Siap Bikin Toko Lebih Rapi &amp; Untung Maksimal?
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Daftarkan toko Anda hari ini dalam 1 menit. Langsung coba seluruh fitur kasir, cetak struk Bluetooth, dan buku kasbon gratis selama 7 hari.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-12 px-8 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-base shadow-lg shadow-emerald-500/25 rounded-xl"
            >
              <Link href="/register?plan=trial">
                Mulai Uji Coba Gratis Sekarang
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-12 px-6 border-slate-700 text-slate-200 hover:bg-slate-800 rounded-xl"
            >
              <Link href="/login">Masuk Toko</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Branding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <Store className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                Kas<span className="text-emerald-400">Toko</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
              Platform Point of Sale (POS) ritel &amp; warung modern berbasis cloud dengan mode 100% offline-first. Membantu UMKM Indonesia naik kelas dengan pembukuan rapi dan kasir cepat.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
              <span>Semua Layanan Cloud &amp; AI Beroperasi Normal</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Navigasi
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a href="#fitur" className="hover:text-emerald-400 transition-colors">Fitur POS Kasir</a>
              </li>
              <li>
                <a href="#keunggulan" className="hover:text-emerald-400 transition-colors">Mode Offline-First</a>
              </li>
              <li>
                <a href="#ai-assistant" className="hover:text-emerald-400 transition-colors">Chat AI Read-Only</a>
              </li>
              <li>
                <a href="#harga" className="hover:text-emerald-400 transition-colors">Tarif Paket Sewa</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-emerald-400 transition-colors">Pertanyaan Umum (FAQ)</a>
              </li>
            </ul>
          </div>

          {/* Access & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Akses Aplikasi
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/login" className="hover:text-emerald-400 transition-colors">Masuk Kasir Toko</Link>
              </li>
              <li>
                <Link href="/register?plan=trial" className="hover:text-emerald-400 transition-colors">Daftar Toko Baru (Trial)</Link>
              </li>
              <li>
                <Link href="/sa-login" className="hover:text-emerald-400 transition-colors">Super Admin Portal</Link>
              </li>
              <li>
                <span className="flex items-center gap-1.5 text-slate-400 pt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> PostgreSQL RLS Protected
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} KasToko SaaS Platform. Hak cipta dilindungi.</p>
          <p className="flex items-center gap-1">
            Dibuat untuk kemajuan UMKM &amp; Warung Ritel Indonesia <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
}
