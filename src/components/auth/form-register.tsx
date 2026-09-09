"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { aksiDaftarToko } from "@/lib/server/aksi-auth";

const MODE = process.env.NEXT_PUBLIC_APP_MODE ?? "saas";

export function FormRegister() {
  const router = useRouter();
  const [proses, mulaiTransisi] = useTransition();
  const [form, setForm] = useState({
    namaPemilik: "",
    email: "",
    kataSandi: "",
    pinPemilik: "",
    namaToko: "",
    alamat: "",
    telepon: "",
  });

  function ubah(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function kirim(e: React.FormEvent) {
    e.preventDefault();
    mulaiTransisi(async () => {
      const hasil = await aksiDaftarToko(form);
      if (hasil.ok) {
        toast.success(hasil.pesan);
        router.replace("/dashboard");
        router.refresh();
      } else {
        toast.error(hasil.pesan);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          {MODE === "saas" ? "Daftar Toko Baru" : "Inisialisasi Toko Pertama"}
        </CardTitle>
        <CardDescription>
          {MODE === "saas"
            ? "Isi data berikut, toko Anda langsung aktif dengan masa uji coba gratis."
            : "Instalasi mandiri (self-hosted): tentukan profil toko, tanpa biaya sewa seumur hidup."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={kirim} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Pemilik</Label>
            <Input id="nama" placeholder="Budi Santoso" value={form.namaPemilik} onChange={ubah("namaPemilik")} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input id="reg-email" type="email" placeholder="budi@tokoberkah.id" value={form.email} onChange={ubah("email")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Password</Label>
              <Input id="reg-password" type="password" placeholder="Minimal 6 karakter" value={form.kataSandi} onChange={ubah("kataSandi")} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-pin">
              PIN Pemilik (4-6 angka) <span className="font-normal text-muted-foreground">— utk otorisasi batal transaksi</span>
            </Label>
            <Input
              id="reg-pin"
              inputMode="numeric"
              maxLength={6}
              placeholder="mis. 8765"
              value={form.pinPemilik}
              onChange={(e) => setForm((f) => ({ ...f, pinPemilik: e.target.value.replace(/\D/g, "") }))}
              className="text-center tracking-[0.3em] font-money"
              required
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="toko">Nama Toko</Label>
            <Input id="toko" placeholder="Toko Berkah Jaya" value={form.namaToko} onChange={ubah("namaToko")} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alamat">Alamat Toko</Label>
            <Input id="alamat" placeholder="Jl. Melati No. 12, Surabaya" value={form.alamat} onChange={ubah("alamat")} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telp">Nomor HP Toko</Label>
            <Input id="telp" inputMode="tel" placeholder="0851-2345-6789" value={form.telepon} onChange={ubah("telepon")} required />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={proses}>
            <Store className="size-4" />
            Buat Toko &amp; Mulai Jualan
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Sudah punya toko?{" "}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Masuk di sini
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
