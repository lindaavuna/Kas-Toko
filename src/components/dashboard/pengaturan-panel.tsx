"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bot, CreditCard, Plus, Save, Store, Tags, Trash2, UserCog } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { Category } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { aksiSimpanIdentitasToko, aksiSimpanPengaturanAI, aksiTambahKasirAkun, aksiToggleKasirAkun, aksiGantiPinKasir } from "@/lib/server/aksi-kas";
import { aksiTambahKategori } from "@/lib/server/aksi-katalog";

const MODE = process.env.NEXT_PUBLIC_APP_MODE ?? "saas";

const METODE = [
  { key: "tunai", label: "Tunai", ket: "Uang fisik + hitung kembalian otomatis" },
  { key: "duitku", label: "QRIS Otomatis (Duitku)", ket: "QR dinamis, lunas otomatis saat callback" },
  { key: "statis", label: "QRIS Statis Toko", ket: "Tampilkan QR belanja toko ke pembeli" },
  { key: "transfer", label: "Transfer Bank Manual", ket: "Catat 4 digit referensi bukti transfer" },
  { key: "kasbon", label: "Kasbon (Hutang Pelanggan)", ket: "Masuk ke buku kasbon pelanggan" },
];

export function PanelPengaturan({
  categories,
  cashierAccounts,
  identitas,
  sewa,
}: {
  categories: Category[];
  cashierAccounts: { id: string; nama: string; email: string; aktif: boolean }[];
  identitas: { nama: string; alamat: string; telepon: string; kakiStruk: string };
  sewa: { status: string; berakhir: string };
}) {
  const router = useRouter();
  const [toko, setToko] = useState(identitas);
  const [kategoriBaru, setKategoriBaru] = useState("");
  const [metodeAktif, setMetodeAktif] = useState<Record<string, boolean>>({
    tunai: true,
    duitku: true,
    statis: true,
    transfer: true,
    kasbon: true,
  });
  const [ai, setAi] = useState({
    aktif: true,
    provider: "openrouter",
    baseUrl: "https://openrouter.ai/api/v1",
    apiKey: "",
    model: "nousresearch/hermes-3-llama-3.1-8b:free",
  });
  const [kasirBaru, setKasirBaru] = useState({ open: false, nama: "", email: "", pin: "" });

  async function tambahKategoriKlik() {
    if (!kategoriBaru.trim()) return;
    const hasil = await aksiTambahKategori(kategoriBaru.trim());
    toast[hasil.ok ? "success" : "error"](hasil.pesan);
    if (hasil.ok) {
      setKategoriBaru("");
      router.refresh();
    }
  }

  async function simpanKasir() {
    const hasil = await aksiTambahKasirAkun({
      nama: kasirBaru.nama.trim(),
      email: kasirBaru.email.trim(),
      pin: kasirBaru.pin,
    });
    toast[hasil.ok ? "success" : "error"](hasil.pesan);
    if (hasil.ok) {
      setKasirBaru({ open: false, nama: "", email: "", pin: "" });
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Tabs defaultValue="toko">
        <TabsList className="grid h-auto w-full grid-cols-3 md:grid-cols-5">
          <TabsTrigger value="toko"><Store className="size-4" /> Toko</TabsTrigger>
          <TabsTrigger value="kasir"><UserCog className="size-4" /> Kasir</TabsTrigger>
          <TabsTrigger value="kategori"><Tags className="size-4" /> Kategori</TabsTrigger>
          <TabsTrigger value="bayar"><CreditCard className="size-4" /> Metode Bayar</TabsTrigger>
          <TabsTrigger value="ai"><Bot className="size-4" /> Hermes AI</TabsTrigger>
        </TabsList>

        {/* IDENTITAS TOKO */}
        <TabsContent value="toko" className="space-y-4 pt-2">
          <Card>
            <CardHeader>
              <CardTitle>Identitas Toko</CardTitle>
              <CardDescription>Tercetak di bagian atas struk belanja.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="g-nama">Nama Toko</Label>
                <Input id="g-nama" value={toko.nama} onChange={(e) => setToko({ ...toko, nama: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-alamat">Alamat</Label>
                <Input id="g-alamat" value={toko.alamat} onChange={(e) => setToko({ ...toko, alamat: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-telp">Telepon</Label>
                <Input id="g-telp" value={toko.telepon} onChange={(e) => setToko({ ...toko, telepon: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-kaki">Teks Ucapan di Kaki Struk</Label>
                <Input id="g-kaki" value={toko.kakiStruk} onChange={(e) => setToko({ ...toko, kakiStruk: e.target.value })} />
              </div>
              <Button
                size="lg"
                onClick={async () => {
                  const hasil = await aksiSimpanIdentitasToko(toko);
                  toast[hasil.ok ? "success" : "error"](hasil.pesan);
                  if (hasil.ok) router.refresh();
                }}
              >
                <Save className="size-4" /> Simpan
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Sewa / Lisensi</CardTitle>
              <CardDescription>Mode aplikasi: {MODE === "saas" ? "Sewa Bulanan (Cloud SaaS)" : "Instalasi Mandiri (Self-Hosted)"}</CardDescription>
            </CardHeader>
            <CardContent>
              {MODE === "saas" ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Badge variant={sewa.status === "expired" ? "destructive" : "success"}>
                      {sewa.status === "trial" ? "Masa Uji Coba Aktif" : sewa.status === "active" ? "Sewa Aktif" : "Sewa Kedaluwarsa"}
                    </Badge>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {sewa.berakhir ? `Berakhir: ${sewa.berakhir}. ` : ""}Rp 50.000/bulan. Data tersimpan aman di cloud.
                    </p>
                  </div>
                  <Button variant="outline" size="lg" onClick={() => toast.info("Pembayaran sewa disambungkan di Tahap 4.")}>
                    Perpanjang Sewa
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Lisensi seumur hidup (lifetime) — bebas biaya sewa, data di komputer Anda sendiri, 100% jalan di LAN tanpa internet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AKUN KASIR */}
        <TabsContent value="kasir" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Pengelolaan Akun Kasir</CardTitle>
                <CardDescription>Kasir login dengan email toko + PIN 4-6 angka.</CardDescription>
              </div>
              <Button size="lg" onClick={() => setKasirBaru({ open: true, nama: "", email: "", pin: "" })}>
                <Plus className="size-4" /> Tambah Kasir
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {cashierAccounts.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                    {a.nama.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{a.nama}</p>
                    <p className="text-xs text-muted-foreground">{a.email}</p>
                  </div>
                  <Badge variant={a.aktif ? "success" : "secondary"}>{a.aktif ? "Aktif" : "Nonaktif"}</Badge>
                  <Button
                    size="sm"
                    variant={a.aktif ? "outline" : "success"}
                    className="h-9"
                    onClick={async () => {
                      const hasil = await aksiToggleKasirAkun(a.id, !a.aktif);
                      toast[hasil.ok ? "info" : "error"](hasil.ok ? `${a.nama} ${a.aktif ? "dinonaktifkan" : "diaktifkan lagi"}.` : hasil.pesan);
                      if (hasil.ok) router.refresh();
                    }}
                  >
                    {a.aktif ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* KATEGORI */}
        <TabsContent value="kategori" className="pt-2">
          <Card>
            <CardHeader>
              <CardTitle>Kategori Produk</CardTitle>
              <CardDescription>Dipakai untuk merapikan katalog di layar kasir.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Input placeholder="Nama kategori baru (mis. Snack)" value={kategoriBaru} onChange={(e) => setKategoriBaru(e.target.value)} />
                <Button size="lg" className="shrink-0" onClick={tambahKategoriKlik}>
                  <Plus className="size-4" /> Tambah
                </Button>
              </div>
              <Separator />
              {categories.map((k) => (
                <div key={k.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span className="font-medium">{k.name}</span>
                  <Button size="sm" variant="ghost" className="text-danger" aria-label={`Hapus ${k.name}`} onClick={() => toast.info("Penghapusan kategori aktif setelah database tersambung (Tahap 2).")}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* METODE BAYAR */}
        <TabsContent value="bayar" className="pt-2">
          <Card>
            <CardHeader>
              <CardTitle>Metode Pembayaran</CardTitle>
              <CardDescription>Sakelar metode yang muncul di dialog bayar kasir.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {METODE.map((m) => (
                <div key={m.key} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.ket}</p>
                  </div>
                  <Switch
                    id={`metode-${m.key}`}
                    checked={metodeAktif[m.key]}
                    onCheckedChange={(v) => {
                      setMetodeAktif((s) => ({ ...s, [m.key]: v }));
                      toast.success(`${m.label} ${v ? "diaktifkan" : "dimatikan"}.`);
                    }}
                    aria-label={m.label}
                  />
                </div>
              ))}
              {metodeAktif.transfer && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <p className="text-muted-foreground">Rekening toko untuk pembayaran transfer:</p>
                  <p className="font-medium font-money">BCA 1234567890 a.n. {toko.nama}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HERMES AI */}
        <TabsContent value="ai" className="pt-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="size-5 text-primary" /> Konfigurasi Asisten AI Hermes
              </CardTitle>
              <CardDescription>
                Hermes Agent (Nous Research) — tanya omset, cek stok, catat pengeluaran lewat chat. Biaya API Rp 0 via FreeLLM / OpenRouter.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Aktifkan widget chat</p>
                  <p className="text-xs text-muted-foreground">Muncul melayang di pojok kanan bawah dasbor.</p>
                </div>
                <Switch checked={ai.aktif} onCheckedChange={(v) => setAi({ ...ai, aktif: v })} aria-label="Aktifkan Hermes" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Penyedia Layanan</Label>
                  <div className="flex gap-1.5">
                    {(["openrouter", "freellm"] as const).map((pv) => (
                      <Button
                        key={pv}
                        size="sm"
                        variant={ai.provider === pv ? "default" : "outline"}
                        className="h-9 flex-1"
                        onClick={() => setAi({ ...ai, provider: pv, baseUrl: pv === "openrouter" ? "https://openrouter.ai/api/v1" : "https://chat.freellm.ai/v1" })}
                      >
                        {pv === "openrouter" ? "OpenRouter" : "FreeLLM"}
                      </Button>
                    ))}
                    {MODE === "self-hosted" && (
                      <Button
                        size="sm"
                        variant={ai.provider === "ollama" ? "default" : "outline"}
                        className="h-9 flex-1"
                        onClick={() => setAi({ ...ai, provider: "ollama", baseUrl: "http://localhost:11434/v1" })}
                      >
                        Ollama Lokal
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {MODE === "saas" ? "Mode self-hosted dapat memakai Ollama lokal tanpa internet." : "Mode self-hosted bebas pakai Ollama lokal."}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ai-model">Nama Model</Label>
                  <Input id="ai-model" value={ai.model} onChange={(e) => setAi({ ...ai, model: e.target.value })} className="font-mono text-xs" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ai-url">Base URL API</Label>
                <Input id="ai-url" value={ai.baseUrl} onChange={(e) => setAi({ ...ai, baseUrl: e.target.value })} className="font-mono text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ai-key">API Key</Label>
                <Input
                  id="ai-key"
                  type="password"
                  placeholder={MODE === "saas" ? "sk-or-v1-… (opsional, bawaan sudah gratis)" : "sk-or-v1-… atau kosong untuk Ollama"}
                  value={ai.apiKey}
                  onChange={(e) => setAi({ ...ai, apiKey: e.target.value })}
                />
              </div>
              <Button
                size="lg"
                onClick={async () => {
                  const hasil = await aksiSimpanPengaturanAI({ aktif: ai.aktif });
                  toast[hasil.ok ? "success" : "error"](
                    hasil.ok ? "Konfigurasi AI tersimpan. Hermes siap diajak ngobrol!" : hasil.pesan
                  );
                  if (hasil.ok) router.refresh();
                }}
              >
                <Save className="size-4" /> Simpan Konfigurasi
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog tambah kasir */}
      <KasirDialog
        data={kasirBaru}
        setData={setKasirBaru}
        onSimpan={simpanKasir}
      />
    </div>
  );
}

function KasirDialog({
  data,
  setData,
  onSimpan,
}: {
  data: { open: boolean; nama: string; email: string; pin: string };
  setData: (v: { open: boolean; nama: string; email: string; pin: string }) => void;
  onSimpan: () => void;
}) {
  return (
    <Dialog open={data.open} onOpenChange={(o) => setData({ ...data, open: o })}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buat Akun Kasir Baru</DialogTitle>
          <DialogDescription>
            Pemilik yang membuatkan akun &amp; PIN — kasir tidak bisa mendaftar sendiri.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="k-nama">Nama Kasir</Label>
            <Input id="k-nama" placeholder="Contoh: Slamet" value={data.nama} onChange={(e) => setData({ ...data, nama: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="k-email">Email</Label>
            <Input id="k-email" type="email" placeholder="slamet@tokoberkah.id" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="k-pin">PIN Kasir (4-6 angka)</Label>
            <Input
              id="k-pin"
              inputMode="numeric"
              maxLength={6}
              placeholder="mis. 4321"
              value={data.pin}
              onChange={(e) => setData({ ...data, pin: e.target.value.replace(/\D/g, "") })}
              className="text-center text-lg tracking-[0.5em] font-money"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" size="lg" onClick={() => setData({ ...data, open: false })}>
            Batal
          </Button>
          <Button size="lg" onClick={onSimpan}>
            Simpan Kasir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
