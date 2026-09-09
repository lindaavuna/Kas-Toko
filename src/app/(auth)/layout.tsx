import { ShoppingCart, Sparkles, WifiOff, ReceiptText } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Panel branding (desktop) */}
      <div className="relative hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShoppingCart className="size-5" />
          </div>
          <span className="text-xl font-bold text-white">KasToko</span>
        </div>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold leading-relaxed text-white">
            Jualan lancar, uang &amp; stok tercatat otomatis.
          </h1>
          <p className="text-sm text-sidebar-foreground/80">
            Sistem kasir pintar ramah UMKM — 3 menit langsung bisa jualan, tanpa perlu belajar berhari-hari.
          </p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <ReceiptText className="size-4 text-success" />
              Kasir cepat dengan tombol Uang Pas &amp; struk thermal
            </li>
            <li className="flex items-center gap-3">
              <WifiOff className="size-4 text-warning" />
              Tetap bisa jualan walau internet mati
            </li>
            <li className="flex items-center gap-3">
              <Sparkles className="size-4 text-primary" />
              Tanya omset &amp; stok lewat chat Asisten AI Hermes
            </li>
          </ul>
        </div>
        <p className="text-xs text-sidebar-foreground/60">
          © {new Date().getFullYear()} KasToko — dibuat untuk warung, toko kelontong &amp; sembako Indonesia
        </p>
      </div>

      {/* Area form */}
      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShoppingCart className="size-5" />
            </div>
            <span className="text-lg font-bold">KasToko</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
