import Link from "next/link";
import { Store, Sparkles, WifiOff, ReceiptText, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2 bg-background">
      {/* Panel branding (desktop) */}
      <div className="relative hidden flex-col justify-between bg-slate-950 p-10 text-slate-100 border-r border-slate-800 lg:flex">
        <Link href="/" className="flex items-center gap-3 w-fit group">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm group-hover:scale-105 transition-transform">
            <Store className="size-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Kas<span className="text-emerald-400">Toko</span>
          </span>
        </Link>

        <div className="space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-800 bg-slate-900 text-slate-300 text-xs font-medium">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Mode 100% Offline-First</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-white tracking-tight">
            Jualan lancar, uang &amp; stok tercatat otomatis.
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Sistem kasir pintar ramah UMKM Indonesia — 1 menit langsung bisa jualan tanpa perlu belajar berhari-hari.
          </p>

          <ul className="space-y-3.5 text-sm text-slate-300">
            <li className="flex items-center gap-3">
              <div className="size-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <ReceiptText className="size-3.5" />
              </div>
              <span>Kasir cepat dengan tombol Uang Pas &amp; struk Bluetooth</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="size-6 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <WifiOff className="size-3.5" />
              </div>
              <span>Tetap jalan walau mati lampu &amp; sinyal internet padam</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="size-6 rounded-md bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                <Sparkles className="size-3.5" />
              </div>
              <span>Tanya omset &amp; stok lewat chat Asisten AI Hermes aman</span>
            </li>
          </ul>
        </div>

        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} KasToko — dibuat untuk kemajuan warung &amp; UMKM ritel Indonesia
        </p>
      </div>

      {/* Area form */}
      <div className="relative flex flex-col justify-between bg-slate-50/50 dark:bg-slate-950 p-6 sm:p-10 transition-colors duration-200">
        {/* Tombol Ganti Tema Pojok Kanan Atas */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-20 flex items-center gap-2">
          <ThemeToggle className="text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" />
        </div>

        {/* Top bar navigasi */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto my-auto">
          {/* Logo brand di mobile */}
          <div className="mb-6 flex items-center justify-center gap-2.5 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Store className="size-4.5" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Kas<span className="text-emerald-600 dark:text-emerald-400">Toko</span>
            </span>
          </div>

          {children}
        </div>

        {/* Footer spacer */}
        <div className="w-full max-w-md mx-auto mt-6 text-center text-[11px] text-slate-600 dark:text-slate-400">
          KasToko Cloud POS Platform
        </div>
      </div>
    </div>
  );
}
