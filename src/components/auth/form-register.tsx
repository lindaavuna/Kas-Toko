"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Store, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { aksiDaftarToko } from "@/lib/server/aksi-auth";

const MODE = process.env.NEXT_PUBLIC_APP_MODE ?? "saas";

export function FormRegister() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawPlan = searchParams.get("plan");
  
  // Normalize plan: trial, monthly, yearly
  const initialPlan = rawPlan === "yearly" || rawPlan === "monthly" ? rawPlan : "trial";
  const [selectedPlan, setSelectedPlan] = useState<"trial" | "monthly" | "yearly">(initialPlan);

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
    <Card className="border-slate-200 dark:border-slate-800 shadow-xl bg-card">
      <CardHeader className="space-y-3">
        {/* Plan Selector Header Banner */}
        {MODE === "saas" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pilihan Paket:</span>
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPlan("trial")}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-all ${
                    selectedPlan === "trial"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Trial 7 Hari
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlan("monthly")}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-all ${
                    selectedPlan === "monthly"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Bulanan
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlan("yearly")}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-all ${
                    selectedPlan === "yearly"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  1 Tahun 🔥
                </button>
              </div>
            </div>

            {/* Selected Plan Info Card */}
            <div className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
              selectedPlan === "yearly"
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/40 text-emerald-950 dark:text-emerald-300"
                : selectedPlan === "monthly"
                ? "bg-teal-50 dark:bg-teal-950/30 border-teal-300 dark:border-teal-500/40 text-teal-950 dark:text-teal-300"
                : "bg-slate-100/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
            }`}>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">
                    {selectedPlan === "yearly"
                      ? "Paket 1 Tahun (Rp 550.000 / thn)"
                      : selectedPlan === "monthly"
                      ? "Paket Bulanan (Rp 50.000 / bln)"
                      : "Paket Uji Coba Gratis (Rp 0 / 7 Hari)"}
                  </p>
                  {selectedPlan === "yearly" && (
                    <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0 h-4">
                      Hemat 1 Bulan
                    </Badge>
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-tight text-[11px]">
                  {selectedPlan === "yearly"
                    ? "Toko langsung aktif dengan 7 hari trial pertama. Pembayaran sewa 1 tahun tersedia di dashboard via QRIS Super Admin."
                    : selectedPlan === "monthly"
                    ? "Toko langsung aktif dengan 7 hari trial pertama. Pembayaran sewa bulanan dapat diselesaikan di dashboard via QRIS."
                    : "Langsung aktif 7 hari gratis tanpa biaya dan tanpa perlu kartu kredit. Bikin kasir & langsung jualan!"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div>
          <CardTitle className="text-xl font-extrabold text-slate-900 dark:text-white">
            {MODE === "saas" ? "Daftar Toko Baru" : "Inisialisasi Toko Pertama"}
          </CardTitle>
          <CardDescription className="text-xs">
            {MODE === "saas"
              ? "Hanya butuh 1 menit untuk mengisi profil toko. Langsung bisa jualan saat ini juga."
              : "Instalasi mandiri (self-hosted): tentukan profil toko, tanpa biaya sewa seumur hidup."}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={kirim} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama" className="text-xs font-semibold">Nama Pemilik</Label>
            <Input id="nama" placeholder="Budi Santoso" value={form.namaPemilik} onChange={ubah("namaPemilik")} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reg-email" className="text-xs font-semibold">Email Pemilik</Label>
              <Input id="reg-email" type="email" placeholder="email@tokoanda.com" value={form.email} onChange={ubah("email")} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password" className="text-xs font-semibold">Password Akun</Label>
              <Input id="reg-password" type="password" placeholder="Minimal 6 karakter" value={form.kataSandi} onChange={ubah("kataSandi")} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-pin" className="text-xs font-semibold">
              PIN Pemilik (4-6 angka) <span className="font-normal text-muted-foreground">— utk otorisasi kasir</span>
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
            <Label htmlFor="toko" className="text-xs font-semibold">Nama Toko / Warung</Label>
            <Input id="toko" placeholder="Toko Berkah Jaya" value={form.namaToko} onChange={ubah("namaToko")} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alamat" className="text-xs font-semibold">Alamat Toko</Label>
            <Input id="alamat" placeholder="Jl. Melati No. 12, Surabaya" value={form.alamat} onChange={ubah("alamat")} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telp" className="text-xs font-semibold">Nomor WhatsApp Toko</Label>
            <Input id="telp" inputMode="tel" placeholder="0851-2345-6789" value={form.telepon} onChange={ubah("telepon")} required />
          </div>

          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold h-11 text-sm shadow-md rounded-xl transition-all"
            size="lg"
            disabled={proses}
          >
            <Store className="w-4 h-4 mr-1.5" />
            <span>{proses ? "Membuat Toko..." : "Daftarkan Toko & Mulai Jualan Sekarang"}</span>
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Sudah memiliki akun toko?{" "}
          <Link href="/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
            Masuk di sini
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
