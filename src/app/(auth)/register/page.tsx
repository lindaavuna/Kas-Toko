"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useSesiStore } from "@/lib/stores/sesi-store";

const MODE = process.env.NEXT_PUBLIC_APP_MODE ?? "saas";

export default function HalamanRegister() {
  const router = useRouter();
  const daftarToko = useSesiStore((s) => s.daftarToko);
  const [form, setForm] = useState({
    namaPemilik: "",
    email: "",
    password: "",
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
    if (form.password.length < 6) {
      toast.error("Password minimal 6 karakter ya.");
      return;
    }
    if (!/^0\d{8,12}$|^$/.test(form.telepon.replace(/[-\s]/g, "")) && form.telepon) {
      toast.error("Nomor HP kurang valid. Contoh: 0851-2345-6789");
      return;
    }
    const hasil = daftarToko(form);
    if (hasil.ok) {
      toast.success("Toko berhasil dibuat! Masa uji coba langsung aktif.");
      router.push("/dashboard");
    } else {
      toast.error(hasil.pesan);
    }
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
              <Input id="reg-password" type="password" placeholder="Minimal 6 karakter" value={form.password} onChange={ubah("password")} required />
            </div>
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
          <Button type="submit" className="w-full" size="lg">
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
