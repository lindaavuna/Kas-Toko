"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bot, CreditCard, Plus, Save, Store, Tags, Trash2, UserCog, Eye, EyeOff } from "lucide-react";

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
import { aksiSimpanIdentitasToko, aksiSimpanPengaturanAI, aksiTambahKasirAkun, aksiToggleKasirAkun, aksiSimpanPaymentGateway } from "@/lib/server/aksi-kas";
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
  aiConfig,
  pgConfig,
}: {
  categories: Category[];
  cashierAccounts: { id: string; nama: string; email: string; aktif: boolean }[];
  identitas: { nama: string; alamat: string; telepon: string; kakiStruk: string };
  sewa: { status: string; berakhir: string };
  aiConfig?: { aktif: boolean; apiKey?: string; baseUrl?: string };
  pgConfig?: { 
    provider: string; 
    merchantCode: string; 
    apiKey: string; 
    isSandbox: boolean; 
    isActive: boolean;
    manual_qris_image: string | null;
    manual_bank_name: string | null;
    manual_bank_account: string | null;
    manual_bank_holder: string | null;
  };
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
  const [pg, setPg] = useState({
    provider: pgConfig?.provider || "duitku",
    merchantCode: pgConfig?.merchantCode || "",
    apiKey: pgConfig?.apiKey || "",
    isSandbox: pgConfig?.isSandbox ?? true,
    isActive: pgConfig?.isActive ?? false,
    manual_qris_image: pgConfig?.manual_qris_image || null,
    manual_bank_name: pgConfig?.manual_bank_name || "",
    manual_bank_account: pgConfig?.manual_bank_account || "",
    manual_bank_holder: pgConfig?.manual_bank_holder || "",
  });
  const [showPgKey, setShowPgKey] = useState(false);
  const [ai, setAi] = useState({
    aktif: aiConfig?.aktif ?? true,
    provider: aiConfig?.baseUrl?.includes("freellm")
      ? "freellm"
      : aiConfig?.baseUrl?.includes("11434")
      ? "ollama"
      : "openrouter",
    baseUrl: aiConfig?.baseUrl || "https://openrouter.ai/api/v1",
    apiKey: aiConfig?.apiKey || "",
    model: "nousresearch/hermes-3-llama-3.1-8b:free",
  });
  const [kasirBaru, setKasirBaru] = useState({ open: false, nama: "", email: "", pin: "" });

  const handlePgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPg((s) => ({ ...s, manual_qris_image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

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

          {MODE === "saas" && (
            <Card>
              <CardHeader>
                <CardTitle>Status Sewa / Lisensi</CardTitle>
                <CardDescription>Mode aplikasi: Sewa Bulanan (Cloud SaaS)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Badge variant={sewa.status === "expired" ? "destructive" : "success"}>
                      {sewa.status === "trial" ? "Masa Uji Coba Aktif" : sewa.status === "active" ? "Sewa Aktif" : "Sewa Kedaluwarsa"}
                    </Badge>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {sewa.berakhir ? `Berakhir: ${sewa.berakhir}. ` : ""}Rp 50.000/bulan. Data tersimpan aman di cloud.
                    </p>
                  </div>
                  <Button variant="outline" size="lg" onClick={() => toast.info("Pembayaran sewa dapat dikelola melalui dashboard SaaS.")}>
                    Perpanjang Sewa
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
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

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>💳 Integrasi Payment Gateway (QRIS & VA Otomatis)</CardTitle>
              <CardDescription>
                Konfigurasi provider untuk memproses pembayaran non-tunai secara dinamis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Pilih Provider</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant={pg.provider === "duitku" ? "default" : "outline"}
                    onClick={() => setPg((s) => ({ ...s, provider: "duitku" }))}
                  >
                    Duitku
                  </Button>
                  <Button
                    variant={pg.provider === "paywuz" ? "default" : "outline"}
                    onClick={() => setPg((s) => ({ ...s, provider: "paywuz" }))}
                  >
                    Paywuz
                  </Button>
                </div>
              </div>

              {pg.provider === "duitku" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="pg-merchant">Merchant Code</Label>
                    <Input
                      id="pg-merchant"
                      placeholder="Contoh: D12345"
                      value={pg.merchantCode}
                      onChange={(e) => setPg({ ...pg, merchantCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pg-key-duitku">API Key / Private Key</Label>
                    <div className="relative">
                      <Input
                        id="pg-key-duitku"
                        type={showPgKey ? "text" : "password"}
                        placeholder="Masukkan API Key Duitku"
                        value={pg.apiKey}
                        onChange={(e) => setPg({ ...pg, apiKey: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPgKey(!showPgKey)}
                      >
                        {showPgKey ? <EyeOff className="size-4 text-muted-foreground" /> : <Eye className="size-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {pg.provider === "paywuz" && (
                <div className="space-y-1.5">
                  <Label htmlFor="pg-key-paywuz">API Key Paywuz</Label>
                  <div className="relative">
                    <Input
                      id="pg-key-paywuz"
                      type={showPgKey ? "text" : "password"}
                      placeholder="pk_live_... atau pk_sand_..."
                      value={pg.apiKey}
                      onChange={(e) => setPg({ ...pg, apiKey: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPgKey(!showPgKey)}
                    >
                      {showPgKey ? <EyeOff className="size-4 text-muted-foreground" /> : <Eye className="size-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-4 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <Label>Mode Sandbox (Uji Coba)</Label>
                    <p className="text-xs text-muted-foreground">
                      Gunakan kredensial sandbox untuk simulasi pembayaran tanpa uang nyata.
                    </p>
                  </div>
                  <Switch
                    checked={pg.isSandbox}
                    onCheckedChange={(v) => setPg((s) => ({ ...s, isSandbox: v }))}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <Label>Aktifkan QRIS Dinamis Otomatis</Label>
                    <p className="text-xs text-muted-foreground">
                      Tampilkan opsi QRIS otomatis di dialog bayar kasir.
                    </p>
                  </div>
                  <Switch
                    checked={pg.isActive}
                    onCheckedChange={(v) => setPg((s) => ({ ...s, isActive: v }))}
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-lg border p-4 mt-6">
                <div className="flex items-center justify-between border-b pb-3 mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">📷 QRIS Manual Toko & Info Rekening (0% Fee)</h3>
                    <p className="text-sm text-muted-foreground">Tampilkan gambar stiker QRIS asli toko Anda agar pembeli bisa scan langsung (tanpa potongan gateway).</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label>Foto Stiker QRIS Toko</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      {pg.manual_qris_image ? (
                        <div className="relative inline-block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img   src={pg.manual_qris_image} alt="QRIS Manual Toko" className="max-h-48 rounded" />
                          <Button size="sm" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0" onClick={() => setPg({ ...pg, manual_qris_image: null })}>X</Button>
                        </div>
                      ) : (
                        <div className="py-6">
                          <p className="text-sm text-muted-foreground mb-2">Pilih file gambar QRIS Toko (PNG/JPG)</p>
                          <Input type="file" accept="image/*" onChange={handlePgFileChange} className="max-w-[250px] mx-auto" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Nama Bank / E-Wallet</Label>
                      <Input placeholder="BCA / Mandiri / GoPay" value={pg.manual_bank_name || ""} onChange={(e) => setPg({ ...pg, manual_bank_name: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Nomor Rekening</Label>
                      <Input placeholder="1234567890" value={pg.manual_bank_account || ""} onChange={(e) => setPg({ ...pg, manual_bank_account: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Atas Nama</Label>
                      <Input placeholder="Budi Santoso" value={pg.manual_bank_holder || ""} onChange={(e) => setPg({ ...pg, manual_bank_holder: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                onClick={async () => {
                  const toastId = toast.loading("Menyimpan pengaturan Payment Gateway...");
                  const hasil = await aksiSimpanPaymentGateway(pg);
                  if (hasil.ok) {
                    toast.success(hasil.pesan, { id: toastId });
                    router.refresh();
                  } else {
                    toast.error(hasil.pesan, { id: toastId });
                  }
                }}
              >
                <Save className="mr-2 size-4" /> Simpan Pengaturan Payment Gateway
              </Button>
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
                  const hasil = await aksiSimpanPengaturanAI({
                    aktif: ai.aktif,
                    apiKey: ai.apiKey,
                    baseUrl: ai.baseUrl,
                  });
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
