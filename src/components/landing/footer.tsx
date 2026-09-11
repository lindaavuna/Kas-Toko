"use client";

import Link from "next/link";
import { Store, ArrowRight, ShieldCheck, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/reveal";

export function LandingFooter() {
  return (
    <footer className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800 transition-colors duration-200">
      {/* CTA penutup */}
      <div className="max-w-7xl xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 sm:pt-20 sm:pb-16 border-b border-slate-200 dark:border-slate-800">
        <Reveal className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-medium shadow-xs">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            <span>Tanpa biaya • Langsung aktif</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Siap bikin toko lebih rapi & untung maksimal?
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Daftarkan toko Anda hari ini dalam 1 menit. Langsung coba seluruh fitur kasir, cetak struk Bluetooth, dan buku kasbon gratis selama 7 hari.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-12 px-7 rounded-lg text-base font-semibold bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 shadow-sm"
            >
              <Link href="/register?plan=trial">
                Mulai uji coba gratis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-12 px-6 rounded-lg text-base border-slate-300 text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:bg-transparent dark:hover:bg-slate-900 dark:hover:text-white shadow-xs"
            >
              <Link href="/login">Masuk toko</Link>
            </Button>
          </div>
        </Reveal>
      </div>

      {/* Tautan & branding */}
      <div className="max-w-7xl xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                <Store className="w-5 h-5" />
              </div>
              <span className="font-semibold text-xl tracking-tight text-slate-900 dark:text-white">
                Kas<span className="text-emerald-600 dark:text-emerald-400">Toko</span>
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              Platform Point of Sale (POS) ritel & warung modern berbasis cloud dengan mode 100% offline-first. Membantu UMKM Indonesia naik kelas dengan pembukuan rapi dan kasir cepat.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              <span>Semua layanan cloud & AI beroperasi normal</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-300">
              Navigasi
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><a href="#fitur" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Fitur POS kasir</a></li>
              <li><a href="#keunggulan" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Mode offline-first</a></li>
              <li><a href="#ai-assistant" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">AI analis bisnis</a></li>
              <li><a href="#harga" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Tarif paket sewa</a></li>
              <li><a href="#faq" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Pertanyaan umum (FAQ)</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-300">
              Akses aplikasi
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="/login" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Masuk kasir toko</Link></li>
              <li><Link href="/register?plan=trial" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Daftar toko baru (trial)</Link></li>
              <li><Link href="/sa-login" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Super admin portal</Link></li>
              <li className="flex items-center gap-1.5 pt-1 text-slate-600 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>PostgreSQL RLS protected</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} KasToko SaaS Platform. Hak cipta dilindungi.</p>
          <p className="flex items-center gap-1">
            Dibuat untuk kemajuan UMKM & warung ritel Indonesia
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
}
