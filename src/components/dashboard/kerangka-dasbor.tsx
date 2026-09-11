"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Banknote,
  Bell,
  BookUser,
  Boxes,
  Calculator,
  CheckCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Store,
  Truck,
  Handshake,
  Crown,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { HermesChat, type SnapshotHermes } from "@/components/hermes-chat";
import { ThemeToggle } from "@/components/theme-toggle";
import { WidgetSewa } from "./widget-sewa";
import { aksiKeluar } from "@/lib/server/aksi-auth";
import { aksiTandaiNotifDibaca } from "@/lib/server/aksi-kas";
import { formatRupiah } from "@/lib/format";
import type { AppNotification, Petugas } from "@/lib/types";

const MENU: { label: string; href: string; icon: React.ElementType; seksi: string }[] = [
  { label: "Dasbor Toko", href: "/dashboard", icon: LayoutDashboard, seksi: "Ringkasan" },
  { label: "Transaksi", href: "/dashboard/transaksi", icon: Receipt, seksi: "Ringkasan" },
  { label: "Produk", href: "/dashboard/produk", icon: Package, seksi: "Barang" },
  { label: "Stok", href: "/dashboard/stok", icon: Boxes, seksi: "Barang" },
  { label: "Mutasi Barang", href: "/dashboard/mutasi", icon: ShoppingCart, seksi: "Barang" },
  { label: "Pembelian Supplier", href: "/dashboard/pembelian", icon: Truck, seksi: "Uang & Hutang" },
  { label: "Kasbon Pelanggan", href: "/dashboard/kasbon", icon: BookUser, seksi: "Uang & Hutang" },
  { label: "Supplier & Hutang", href: "/dashboard/supplier", icon: Handshake, seksi: "Uang & Hutang" },
  { label: "Laporan Keuangan", href: "/dashboard/laporan", icon: Calculator, seksi: "Uang & Hutang" },
  { label: "Pengaturan", href: "/dashboard/pengaturan", icon: Settings, seksi: "Pengaturan" },
];

const JUDUL: Record<string, string> = {
  "/dashboard": "Dasbor Toko",
  "/dashboard/transaksi": "Riwayat Transaksi Seluruh Toko",
  "/dashboard/produk": "Manajemen Produk",
  "/dashboard/stok": "Status Stok Barang",
  "/dashboard/mutasi": "Riwayat Mutasi Barang",
  "/dashboard/pembelian": "Pembelian dari Supplier",
  "/dashboard/kasbon": "Buku Kasbon Pelanggan",
  "/dashboard/supplier": "Supplier & Hutang Toko",
  "/dashboard/laporan": "Laporan Keuangan",
  "/dashboard/pengaturan": "Pengaturan Toko",
};

function MenuDaftar({ onPilih }: { onPilih?: () => void }) {
  const pathname = usePathname();
  const kelompok: { seksi: string; items: typeof MENU }[] = [];
  for (const m of MENU) {
    const last = kelompok[kelompok.length - 1];
    if (last && last.seksi === m.seksi) last.items.push(m);
    else kelompok.push({ seksi: m.seksi, items: [m] });
  }
  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
      {kelompok.map((k) => (
        <div key={k.seksi}>
          <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            {k.seksi}
          </p>
          {k.items.map((m) => {
            const aktif = pathname === m.href;
            return (
              <Link
                key={m.href}
                href={m.href}
                onClick={onPilih}
                className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
                  aktif
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <m.icon className="size-4 shrink-0" />
                {m.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function Lonceng({ notifikasi }: { notifikasi: AppNotification[] }) {
  const router = useRouter();
  const belum = notifikasi.filter((n) => !n.isRead).length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="relative size-11" aria-label="Notifikasi">
          <Bell className="size-5" />
          {belum > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-4.5 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-danger-foreground">
              {belum}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-sm font-semibold">Notifikasi</p>
          {belum > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={async () => {
                await aksiTandaiNotifDibaca();
                router.refresh();
              }}
            >
              <CheckCheck className="size-3.5" />
              Tandai dibaca
            </Button>
          )}
        </div>
        <Separator />
        <div className="max-h-72 overflow-y-auto">
          {notifikasi.slice(0, 10).map((n) => (
            <div key={n.id} className={`border-b px-3 py-2 text-sm last:border-0 ${n.isRead ? "opacity-60" : ""}`}>
              <p className="font-medium">
                {n.type === "stock_low" ? "📦" : n.type === "sale_paid" ? "💰" : "⚠️"} {n.title}
              </p>
              <p className="text-xs text-muted-foreground">{n.message}</p>
            </div>
          ))}
          {notifikasi.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">Belum ada notifikasi.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function KerangkaDasbor({
  petugas,
  email,
  saldoKasHari,
  notifikasi,
  snapshot,
  sewa,
  children,
}: {
  petugas: Petugas;
  email: string;
  saldoKasHari: number;
  notifikasi: AppNotification[];
  snapshot: SnapshotHermes;
  sewa?: {
    status: string;
    berakhir: string;
    platformConfig: unknown;
  };
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function logout() {
    await aksiKeluar();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-sidebar py-4 lg:flex">
        <div className="mb-4 flex items-center gap-2 px-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-white">KasToko</p>
            <p className="truncate text-[11px] text-sidebar-foreground/70">{petugas.storeName}</p>
          </div>
        </div>
        <MenuDaftar />
        <div className="mt-3 px-3">
          <Separator className="bg-sidebar-border" />
          <Link
            href="/kasir"
            className="mt-3 flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Banknote className="size-4" />
            Layar Kasir (POS)
          </Link>
        </div>
        <WidgetSewa sewa={sewa} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-card px-3 shadow-sm md:px-5">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="size-11 lg:hidden" aria-label="Buka menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-0 pt-4 pb-4 flex flex-col h-full text-sidebar-foreground">
              <SheetHeader className="px-4">
                <SheetTitle className="flex items-center gap-2 text-sidebar-foreground">
                  <Store className="size-5 text-primary" /> {petugas.storeName}
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto">
                <MenuDaftar onPilih={() => setDrawerOpen(false)} />
              </div>
              <WidgetSewa sewa={sewa} />
            </SheetContent>
          </Sheet>

          <h1 className="min-w-0 truncate text-base font-bold md:text-lg">{JUDUL[pathname] ?? "Dasbor"}</h1>

          <div className="ml-auto flex items-center gap-1.5">
            <Badge variant="outline" className="hidden h-11 items-center gap-1.5 border-success/40 bg-success/10 px-3 text-success font-money md:inline-flex">
              <Banknote className="size-3.5" />
              Kas hari ini {formatRupiah(saldoKasHari)}
            </Badge>
            <Lonceng notifikasi={notifikasi} />
            <ThemeToggle className="size-9 rounded-lg" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                      {petugas.nama.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm">{petugas.nama}</p>
                  <p className="text-xs font-normal text-muted-foreground">{email}</p>
                  <p className="text-xs font-normal text-muted-foreground">Pemilik Toko</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {petugas.isSuperadmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/superadmin" className="text-primary font-medium">
                        <Crown className="size-4 text-primary" />
                        Super Admin Platform
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/kasir">
                    <Banknote className="size-4" />
                    Buka Layar Kasir
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/transaksi">
                    <Receipt className="size-4" />
                    Transaksi Terakhir
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-danger">
                  <LogOut className="size-4" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-3 md:p-5">{children}</main>
      </div>

      <HermesChat petugas={petugas} snapshot={snapshot} />
    </div>
  );
}
