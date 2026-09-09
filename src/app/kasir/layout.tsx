"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Banknote,
  LayoutDashboard,
  LogOut,
  Printer,
  ShoppingCart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ButuhSesi } from "@/components/butuh-sesi";
import { HermesChat } from "@/components/hermes-chat";
import { DialogShift, DialogPengeluaran } from "@/components/pos/shift-dialog";
import { DialogBayar } from "@/components/pos/bayar-dialog";
import { DialogStruk } from "@/components/pos/struk-dialog";
import { usePosStore } from "@/lib/stores/pos-store";
import { useSesiStore } from "@/lib/stores/sesi-store";
import { useUiStore } from "@/lib/stores/ui-store";
import { formatWaktu } from "@/lib/format";
import type { SessionUser } from "@/lib/types";

function KasirFrame({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const router = useRouter();
  const keluar = useSesiStore((s) => s.keluar);
  const shift = usePosStore((s) => s.shift);
  const setDialogShift = useUiStore((s) => s.setDialogShift);

  const statusShift = useMemo(
    () =>
      shift
        ? { label: `Kasir Buka sejak ${formatWaktu(shift.openedAt).slice(11)}`, buka: true }
        : { label: "Kasir Belum Dibuka", buka: false },
    [shift]
  );

  function logout() {
    keluar();
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
            <p className="truncate text-sm font-bold">Kasir — {user.storeName}</p>
            <p className="hidden truncate text-[11px] text-muted-foreground sm:block">{user.name}</p>
          </div>
        </div>

        <Badge
          variant={statusShift.buka ? "success" : "secondary"}
          className="ml-2 hidden sm:inline-flex"
        >
          <Banknote className="size-3" />
          {statusShift.label}
        </Badge>

        <div className="ml-auto flex items-center gap-1.5 md:gap-2">
          <HermesChat user={user} variant="header" />
          <DialogPengeluaran />
          {statusShift.buka ? (
            <Button
              size="sm"
              variant="outline"
              className="h-9"
              onClick={() => setDialogShift("tutup")}
            >
              Tutup Kasir
            </Button>
          ) : (
            <Button size="sm" className="h-9" onClick={() => setDialogShift("buka")}>
              Buka Kasir
            </Button>
          )}
          {user.role === "owner" && (
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
                    {user.name.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="text-sm">{user.name}</p>
                <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
                <p className="text-xs font-normal text-muted-foreground">
                  {user.role === "owner" ? "Pemilik Toko" : "Kasir Toko"}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/kasir/riwayat">
                  <Printer className="size-4" />
                  Riwayat Transaksi Shift
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

      <DialogShift />
      <DialogBayar />
      <DialogStruk />
    </div>
  );
}

export default function KasirLayout({ children }: { children: React.ReactNode }) {
  return (
    <ButuhSesi boleh={["owner", "cashier"]}>
      {(user) => <KasirFrame user={user}>{children}</KasirFrame>}
    </ButuhSesi>
  );
}
