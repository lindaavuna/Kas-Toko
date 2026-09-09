"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Banknote,
  LayoutDashboard,
  LogOut,
  Printer,
  ShoppingCart,
  BookUser,
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
import type { Customer, InfoToko, Petugas } from "@/lib/types";

/**
 * Rangka layar kasir: header fullscreen + dialog global (shift, bayar, struk).
 * Snapshot utk Hermes diambil server terpisah; di sini cuma tempel angka.
 */
export function KerangkaKasir({
  petugas,
  toko,
  pelanggan,
  shiftBuka,
  shiftSejak,
  snapshot,
  children,
}: {
  petugas: Petugas;
  toko: InfoToko;
  pelanggan: Customer[];
  shiftBuka: boolean;
  shiftSejak?: string;
  snapshot: SnapshotHermes;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const setDialogShift = useUiStore((s) => s.setDialogShift);

  const statusShift = shiftBuka
    ? { label: `Kasir Buka sejak ${shiftSejak ? formatWaktu(shiftSejak).slice(11) : "…"}`, buka: true }
    : { label: "Kasir Belum Dibuka", buka: false };

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
      <DialogBayar pelanggan={pelanggan} />
      <DialogStruk toko={toko} pelanggan={pelanggan} />
    </div>
  );
}
