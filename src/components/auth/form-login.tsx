"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, LogIn, Smartphone, Crown, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { aksiMasukKasir, aksiMasukPemilik } from "@/lib/server/aksi-auth";

const MODE = process.env.NEXT_PUBLIC_APP_MODE ?? "saas";

export function FormLogin({ tipe = "toko" }: { tipe?: "toko" | "superadmin" }) {
  const router = useRouter();
  const [proses, mulaiTransisi] = useTransition();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lihatSandi, setLihatSandi] = useState(false);
  const [emailKasir, setEmailKasir] = useState("");
  const [pin, setPin] = useState("");

  function masukOwner(e: React.FormEvent) {
    e.preventDefault();
    mulaiTransisi(async () => {
      const hasil = await aksiMasukPemilik({ email, kataSandi: password });
      if (hasil.ok) {
        toast.success(hasil.pesan);
        router.replace(hasil.redirectUrl || (tipe === "superadmin" ? "/superadmin" : "/dashboard"));
        router.refresh();
      } else {
        toast.error(hasil.pesan);
      }
    });
  }

  function masukKasir(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(pin)) {
      toast.error("PIN kasir minimal 4 angka.");
      return;
    }
    mulaiTransisi(async () => {
      const hasil = await aksiMasukKasir({ email: emailKasir, pin });
      if (hasil.ok) {
        toast.success(hasil.pesan);
        router.replace("/kasir");
        router.refresh();
      } else {
        toast.error(hasil.pesan);
      }
    });
  }

  if (tipe === "superadmin") {
    return (
      <Card className="border-slate-200 dark:border-slate-800 shadow-xl bg-card">
        <CardHeader className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold w-fit">
            <Crown className="size-3.5" />
            <span>Portal Super Admin Platform</span>
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Masuk Pengelola SaaS
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Akses khusus pemilik platform untuk mengontrol tenant toko, paket langganan, dan konfigurasi sistem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={masukOwner} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sa-email" className="text-xs font-semibold">Email Super Admin</Label>
              <Input
                id="sa-email"
                type="email"
                placeholder="admin@platform.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sa-password" className="text-xs font-semibold">Kata Sandi</Label>
              <div className="relative">
                <Input
                  id="sa-password"
                  type={lihatSandi ? "text" : "password"}
                  placeholder="Masukkan kata sandi super admin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setLihatSandi((v) => !v)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label={lihatSandi ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {lihatSandi ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold h-11 text-sm shadow-md rounded-xl transition-all"
              size="lg"
              disabled={proses}
            >
              <LogIn className="size-4 mr-1.5" />
              <span>{proses ? "Memverifikasi..." : "Masuk ke Konsol Super Admin"}</span>
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
            >
              <Store className="size-3.5" />
              <span>Masuk sebagai Pemilik Toko atau Kasir</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-xl bg-card">
      <CardHeader>
        <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Masuk ke Toko Anda
        </CardTitle>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
          {MODE === "saas"
            ? "Pilih cara masuk: akun pemilik untuk dasbor lengkap atau PIN kasir untuk jualan cepat."
            : "Mode instalasi mandiri — masuk dengan akun toko Anda."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pemilik">
          <TabsList className="grid h-11 w-full grid-cols-2 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <TabsTrigger value="pemilik" className="text-xs font-semibold">Pemilik Toko</TabsTrigger>
            <TabsTrigger value="kasir" className="text-xs font-semibold">Kasir (PIN)</TabsTrigger>
          </TabsList>

          <TabsContent value="pemilik" className="mt-5">
            <form onSubmit={masukOwner} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold">Email Pemilik</Label>
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
                <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={lihatSandi ? "text" : "password"}
                    placeholder="Password akun pemilik"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setLihatSandi((v) => !v)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label={lihatSandi ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {lihatSandi ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold h-11 text-sm shadow-md rounded-xl transition-all"
                size="lg"
                disabled={proses}
              >
                <LogIn className="size-4 mr-1.5" />
                <span>{proses ? "Memproses..." : "Masuk sebagai Pemilik"}</span>
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="kasir" className="mt-5">
            <form onSubmit={masukKasir} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-kasir" className="text-xs font-semibold">Email Toko / Akun Kasir</Label>
                <Input
                  id="email-kasir"
                  type="email"
                  placeholder="siti@tokoberkah.id atau budi@tokoberkah.id"
                  value={emailKasir}
                  onChange={(e) => setEmailKasir(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-xs font-semibold">PIN Kasir (4 angka)</Label>
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
                <p className="text-[11px] text-muted-foreground">
                  Demo kasir: <span className="font-semibold text-foreground">siti@tokoberkah.id</span> (PIN 1234) atau masukkan email toko dengan PIN kasir Anda.
                </p>
              </div>
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold h-11 text-sm shadow-md rounded-xl transition-all"
                size="lg"
                disabled={proses}
              >
                <Smartphone className="size-4 mr-1.5" />
                <span>{proses ? "Memproses..." : "Masuk Cepat & Mulai Jualan"}</span>
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Lupa password? Hubungi admin KasToko — akses kasir tetap bisa pakai PIN.
        </p>

        {MODE === "saas" && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Toko baru?{" "}
            <Link href="/register" className="font-semibold text-emerald-600 dark:text-emerald-400 underline-offset-4 hover:underline">
              Daftar gratis (uji coba 7 hari)
            </Link>
          </p>
        )}

        <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
          <Link
            href="/sa-login"
            className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
          >
            <Crown className="size-3" />
            <span>Portal Super Admin →</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
