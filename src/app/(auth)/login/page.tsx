"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, LogIn, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSesiStore } from "@/lib/stores/sesi-store";

const MODE = process.env.NEXT_PUBLIC_APP_MODE ?? "saas";

export default function HalamanLogin() {
  const router = useRouter();
  const loginPemilik = useSesiStore((s) => s.loginPemilik);
  const loginKasir = useSesiStore((s) => s.loginKasir);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lihatSandi, setLihatSandi] = useState(false);
  const [emailKasir, setEmailKasir] = useState("");
  const [pin, setPin] = useState("");
  const [proses, setProses] = useState(false);

  function masukOwner(e: React.FormEvent) {
    e.preventDefault();
    setProses(true);
    const hasil = loginPemilik(email, password);
    setProses(false);
    if (hasil.ok) {
      toast.success(hasil.pesan);
      router.push("/dashboard");
    } else {
      toast.error(hasil.pesan);
    }
  }

  function masukKasir(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(pin)) {
      toast.error("PIN kasir minimal 4 angka.");
      return;
    }
    setProses(true);
    const hasil = loginKasir(emailKasir, pin);
    setProses(false);
    if (hasil.ok) {
      toast.success(hasil.pesan);
      router.push("/kasir");
    } else {
      toast.error(hasil.pesan);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Masuk ke Toko Anda</CardTitle>
        <CardDescription>
          {MODE === "saas"
            ? "Pilih cara masuk. Tidak punya akun? Daftar toko baru dulu."
            : "Mode instalasi mandiri — masuk dengan akun toko Anda."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pemilik">
          <TabsList className="grid h-11 w-full grid-cols-2">
            <TabsTrigger value="pemilik">Pemilik Toko</TabsTrigger>
            <TabsTrigger value="kasir">Kasir (PIN)</TabsTrigger>
          </TabsList>

          <TabsContent value="pemilik" className="mt-5">
            <form onSubmit={masukOwner} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="budi@tokoberkah.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={lihatSandi ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setLihatSandi((v) => !v)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground"
                    aria-label={lihatSandi ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {lihatSandi ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={proses}>
                <LogIn className="size-4" />
                Masuk sebagai Pemilik
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="kasir" className="mt-5">
            <form onSubmit={masukKasir} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-kasir">Email Toko</Label>
                <Input
                  id="email-kasir"
                  type="email"
                  placeholder="siti@tokoberkah.id"
                  value={emailKasir}
                  onChange={(e) => setEmailKasir(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin">PIN Kasir (4 angka)</Label>
                <div className="relative">
                  <KeyRound className="absolute inset-y-0 left-3 my-auto size-4 text-muted-foreground" />
                  <Input
                    id="pin"
                    inputMode="numeric"
                    type="password"
                    maxLength={6}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    className="pl-10 text-center text-lg tracking-[0.5em] font-money"
                    required
                  />
                </div>
              </div>
              <Button type="submit" variant="success" className="w-full" size="lg" disabled={proses}>
                <Smartphone className="size-4" />
                Masuk Cepat &amp; Mulai Jualan
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-5 rounded-lg border border-dashed bg-muted/60 p-3 text-xs text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">Akun demo (data dummy):</p>
          <p>Pemilik: budi@tokoberkah.id / rahasia</p>
          <p>Kasir: siti@tokoberkah.id / PIN 1234</p>
        </div>

        {MODE === "saas" && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Toko baru?{" "}
            <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
              Daftar gratis (uji coba)
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
