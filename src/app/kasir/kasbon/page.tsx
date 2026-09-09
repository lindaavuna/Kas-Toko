"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, HandCoins, Phone, UserPlus, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DialogTerimaPembayaran } from "@/components/kasbon/terima-pembayaran";
import { usePosStore } from "@/lib/stores/pos-store";
import { formatRupiah } from "@/lib/format";
import type { Receivable } from "@/lib/types";

export default function LoketKasbon() {
  const customers = usePosStore((s) => s.customers);
  const receivables = usePosStore((s) => s.receivables);
  const tambahPelanggan = usePosStore((s) => s.tambahPelanggan);

  const [nama, setNama] = useState("");
  const [telepon, setTelepon] = useState("");
  const [bayar, setBayar] = useState<Receivable | null>(null);

  const sisaPerPelanggan = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of receivables) {
      if (r.status === "paid") continue;
      map.set(r.customerId, (map.get(r.customerId) ?? 0) + (r.originalAmount - r.paidAmount));
    }
    return map;
  }, [receivables]);

  function buat() {
    if (!nama.trim()) {
      toast.error("Isi nama pelanggan dulu ya.");
      return;
    }
    tambahPelanggan(nama.trim(), telepon.trim() || undefined);
    toast.success(`${nama.trim()} ditambahkan ke daftar pelanggan.`);
    setNama("");
    setTelepon("");
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Button asChild size="sm" variant="ghost" className="h-9">
          <Link href="/kasir">
            <ArrowLeft className="size-4" />
            Kembali ke Kasir
          </Link>
        </Button>
        <h1 className="text-lg font-bold">Loket Kasbon — Pilih / Buat Pelanggan</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="size-4" /> Buat nama pelanggan baru
          </CardTitle>
          <CardDescription>Beli pertama kali dengan kasbon? Daftarkan namanya di sini.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input placeholder="Nama (mis. Bu Tini)" value={nama} onChange={(e) => setNama(e.target.value)} />
          <Input inputMode="tel" placeholder="No. HP (opsional)" value={telepon} onChange={(e) => setTelepon(e.target.value)} />
          <Button onClick={buat} className="w-full sm:w-auto">
            <UserPlus className="size-4" />
            Tambah
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4" /> Pelanggan &amp; Sisa Kasbon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {customers.map((c) => {
            const sisa = sisaPerPelanggan.get(c.id) ?? 0;
            const rcTerakhir = receivables.find((r) => r.customerId === c.id && r.status !== "paid");
            return (
              <div key={c.id} className="flex items-center gap-3 rounded-lg border p-3 shadow-sm">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted text-lg" aria-hidden>
                  {c.name.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="size-3" /> {c.phone ?? "—"}
                  </p>
                </div>
                {sisa > 0 ? (
                  <Badge variant="warning" className="font-money">
                    Kasbon {formatRupiah(sisa)}
                  </Badge>
                ) : (
                  <Badge variant="success">Aman</Badge>
                )}
                {sisa > 0 && rcTerakhir && (
                  <Button size="sm" variant="outline" className="h-9" onClick={() => setBayar(rcTerakhir)}>
                    <HandCoins className="size-4" />
                    Terima Pembayaran
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <DialogTerimaPembayaran receivable={bayar} open={!!bayar} onOpenChange={(o) => !o && setBayar(null)} />
    </div>
  );
}
