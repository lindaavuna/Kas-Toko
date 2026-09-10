"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Banknote,
  LayoutDashboard,
  LogOut,
  Printer,
  ShoppingCart,
  BookUser,
  Wifi,
  WifiOff,
  RefreshCw,
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
import { HermesChat, type SnapshotHermes } from "@/components/hermes-chat";
import { DialogShift, DialogPengeluaran } from "@/components/pos/shift-dialog";
import { DialogBayar } from "@/components/pos/bayar-dialog";
import { DialogStruk } from "@/components/pos/struk-dialog";
import { useUiStore } from "@/lib/stores/ui-store";
import { formatWaktu } from "@/lib/format";
import { aksiKeluar } from "@/lib/server/aksi-auth";
import {
  cacheKatalogOffline,
  hitungAntreanOffline,
  sinkronkanAntreanOffline,
} from "@/lib/offline/sinkron";
import type { Customer, InfoToko, Petugas, Product } from "@/lib/types";

/**
 * Rangka layar kasir: header fullscreen + dialog global (shift, bayar, struk)
 * + indikator online/offline & sinkronisasi otomatis.
 */
export function KerangkaKasir({
  petugas,
  toko,
  pelanggan,
  produk = [],
  shiftBuka,
  shiftSejak,
  snapshot,
  children,
}: {
  petugas: Petugas;
  toko: InfoToko;
  pelanggan: Customer[];
  produk?: Product[];
  shiftBuka: boolean;
  shiftSejak?: string;
  snapshot: SnapshotHermes;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const setDialogShift = useUiStore((s) => s.setDialogShift);
  const [online, setOnline] = useState<boolean>(true);
  const [antrean, setAntrean] = useState<number>(0);
  const [sedangSync, setSedangSync] = useState<boolean>(false);

  const statusShift = shiftBuka
    ? { label: `Kasir Buka sejak ${shiftSejak ? formatWaktu(shiftSejak).slice(11) : "…"}`, buka: true }
    : { label: "Kasir Belum Dibuka", buka: false };

  const cekStatusOffline = useCallback(async () => {
    const jumlah = await hitungAntreanOffline();
    setAntrean(jumlah);
  }, []);

  const lakukanSinkronisasi = useCallback(async () => {
    if (sedangSync) return;
    setSedangSync(true);
    try {
      const hasil = await sinkronkanAntreanOffline();
      await cekStatusOffline();
      if (hasil.total > 0) {
        if (hasil.gagal === 0) {
          toast.success(hasil.pesan);
        } else {
          toast.warning(hasil.pesan);
        }
        router.refresh();
      }
    } finally {
      setSedangSync(false);
    }
  }, [sedangSync, cekStatusOffline, router]);

  useEffect(() => {
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);

    function handleOnline() {
      setOnline(true);
      toast.success("Koneksi internet kembali aktif. Menyinkronkan data...");
      lakukanSinkronisasi();
    }

    function handleOffline() {
      setOnline(false);
      toast.warning("Koneksi terputus. KasToko otomatis berjalan dalam Mode Offline.");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cache produk dan pelanggan ke IndexedDB
    if (produk.length > 0 || pelanggan.length > 0) {
      cacheKatalogOffline(produk, pelanggan);
    }

    cekStatusOffline();
    const interval = setInterval(cekStatusOffline, 15000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [produk, pelanggan, cekStatusOffline, lakukanSinkronisasi]);

  async function logout() {
    await aksiKeluar();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-card px-3 shadow-sm md:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShoppingCart className="size-4" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-bold">Kasir — {petugas.storeName}</p>
            <p className="hidden truncate text-[11px] text-muted-foreground sm:block">{petugas.nama}</p>
          </div>
        </div>

        <Badge variant={statusShift.buka ? "success" : "secondary"} className="ml-2 hidden sm:inline-flex">
          <Banknote className="size-3" />
          {statusShift.label}
        </Badge>

        {/* Status Indikator Online/Offline & Outbox */}
        <div className="ml-2 hidden items-center gap-1 md:flex">
          {online ? (
            <Badge
              variant="outline"
              className={`cursor-pointer gap-1 transition text-xs ${
                antrean > 0 ? "border-warning text-warning" : "border-success/60 text-success"
              }`}
              onClick={lakukanSinkronisasi}
              title={antrean > 0 ? `${antrean} transaksi offline menunggu sinkronisasi` : "Online — Siap transaksi"}
            >
              <Wifi className="size-3" />
              <span>{antrean > 0 ? `${antrean} offline` : "Online"}</span>
              {antrean > 0 && (
                <RefreshCw className={`size-3 ${sedangSync ? "animate-spin" : ""}`} />
              )}
            </Badge>
          ) : (
            <Badge
              variant="warning"
              className="gap-1 text-xs"
              title="Koneksi terputus. Transaksi akan disimpan di IndexedDB perangkat."
            >
              <WifiOff className="size-3" />
              <span>Offline ({antrean})</span>
            </Badge>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1.5 md:gap-2">
          <HermesChat petugas={petugas} snapshot={snapshot} variant="header" />
          <DialogPengeluaran />
          {statusShift.buka ? (
            <Button size="sm" variant="outline" className="h-9" onClick={() => setDialogShift("tutup")}>
              Tutup Kasir
            </Button>
          ) : (
            <Button size="sm" className="h-9" onClick={() => setDialogShift("buka")}>
              Buka Kasir
            </Button>
          )}
          {petugas.peran === "owner" && (
            <Button asChild size="sm" variant="secondary" className="h-9">
              <Link href="/dashboard">
                <LayoutDashboard className="size-4" />
                <span className="hidden md:inline">Dasbor</span>
              </Link>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                    {petugas.nama.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="text-sm">{petugas.nama}</p>
                <p className="text-xs font-normal text-muted-foreground">
                  {petugas.peran === "owner" ? "Pemilik Toko" : "Kasir Toko"}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/kasir/riwayat">
                  <Printer className="size-4" />
                  Riwayat Transaksi Shift
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/kasir/kasbon">
                  <BookUser className="size-4" />
                  Loket Kasbon
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

      <main className="flex-1">{children}</main>

      <DialogShift toko={toko} />
      <DialogBayar toko={toko} pelanggan={pelanggan} petugas={petugas} />
      <DialogStruk toko={toko} pelanggan={pelanggan} />
    </div>
  );
}
