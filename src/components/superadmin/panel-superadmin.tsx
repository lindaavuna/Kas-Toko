"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Save, Eye, EyeOff, Store, TrendingUp, AlertTriangle, PlayCircle, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import { aksiSimpanPengaturanPlatform, aksiPerpanjangSewaToko, aksiUbahStatusToko, aksiSimpanPaketLangganan } from "@/lib/server/aksi-superadmin";
import { aksiKeluar } from "@/lib/server/aksi-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogOut, Activity } from "lucide-react";

export function PanelSuperadmin({ data }: { data: unknown }) {
  const router = useRouter();
  const { metrics, stores, settings } = data;

  const [paket, setPaket] = useState({
    monthlyFee: settings.monthly_subscription_fee || 50000,
    yearlyFee: settings.yearly_subscription_fee || 550000,
    trialDays: settings.trial_days || 7,
  });

  const [pg, setPg] = useState({
    fee: settings.monthly_subscription_fee || 50000,
    primary_gateway: settings.primary_gateway || "paywuz",
    enable_failover: settings.enable_failover ?? true,
    duitku_merchant_code: settings.duitku_merchant_code || "",
    duitku_api_key: settings.duitku_api_key || "",
    duitku_is_sandbox: settings.duitku_is_sandbox ?? true,
    duitku_is_active: settings.duitku_is_active ?? false,
    paywuz_api_key: settings.paywuz_api_key || "",
    paywuz_is_sandbox: settings.paywuz_is_sandbox ?? true,
    paywuz_is_active: settings.paywuz_is_active ?? false,
    manual_qris_image: settings.manual_qris_image || null,
    manual_bank_name: settings.manual_bank_name || "",
    manual_bank_account: settings.manual_bank_account || "",
    manual_bank_holder: settings.manual_bank_holder || "",
    manual_qris_is_active: settings.manual_qris_is_active ?? true,
  });
  const [showPgKey, setShowPgKey] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPg((s) => ({ ...s, manual_qris_image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  async function handleSimpanPaket() {
    const id = toast.loading("Menyimpan paket & tarif...");
    const res = await aksiSimpanPaketLangganan(paket);
    if (res.ok) {
      toast.success(res.pesan, { id });
      router.refresh();
    } else {
      toast.error(res.pesan, { id });
    }
  }

  async function handleSimpanPg() {
    const id = toast.loading("Menyimpan pengaturan gateway...");
    const res = await aksiSimpanPengaturanPlatform(pg);
    if (res.ok) {
      toast.success(res.pesan, { id });
      router.refresh();
    } else {
      toast.error(res.pesan, { id });
    }
  }

  async function handlePerpanjang(storeId: string, hari: number) {
    const id = toast.loading(`Menambahkan +${hari} hari...`);
    const res = await aksiPerpanjangSewaToko(storeId, hari);
    if (res.ok) {
      toast.success(res.pesan, { id });
      router.refresh();
    } else {
      toast.error(res.pesan, { id });
    }
  }

  async function handleStatus(storeId: string, status: string) {
    const id = toast.loading(`Mengubah status...`);
    const res = await aksiUbahStatusToko(storeId, status);
    if (res.ok) {
      toast.success(res.pesan, { id });
      router.refresh();
    } else {
      toast.error(res.pesan, { id });
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">👑 KasToko Super Admin</h1>
          <p className="text-muted-foreground">Pusat Kendali Platform & Sewa SaaS</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 font-normal">admin@billinghmb.site</Badge>
          <ThemeToggle className="size-9 rounded-lg" />
          <Button onClick={() => aksiKeluar()} variant="destructive" size="sm">
            <LogOut className="mr-2 size-4" /> Keluar Platform
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Store className="size-4" /> Total Pelanggan</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0"><p className="text-2xl font-bold">{metrics.totalStores}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-emerald-500 flex items-center gap-2"><Activity className="size-4 animate-pulse" /> Online Saat Ini</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0"><p className="text-2xl font-bold text-emerald-500">{metrics.onlineStores || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2"><PlayCircle className="size-4" /> Toko Aktif</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0"><p className="text-2xl font-bold">{metrics.activeStores}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-yellow-600 flex items-center gap-2"><Clock className="size-4" /> Uji Coba</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0"><p className="text-2xl font-bold">{metrics.trialStores}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2"><AlertTriangle className="size-4" /> Kedaluwarsa</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0"><p className="text-2xl font-bold">{metrics.expiredStores}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2"><TrendingUp className="size-4" /> Omset Bulanan</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0"><p className="text-xl font-bold font-money">Rp {metrics.monthlyRevenue.toLocaleString('id-ID')}</p></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="toko">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent flex-wrap gap-2">
          <TabsTrigger value="toko" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">
            Manajemen Toko Penyewa
          </TabsTrigger>
          <TabsTrigger value="paket" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">
            Paket & Tarif Langganan
          </TabsTrigger>
          <TabsTrigger value="pg" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">
            Payment Gateway & Rekening Owner
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paket" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Paket & Tarif Langganan</CardTitle>
              <CardDescription>Atur harga sewa platform KasToko per tenant (toko).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-xl">
              <div className="space-y-1.5">
                <Label>Tarif Paket Bulanan (Rp)</Label>
                <Input type="number" min="0" value={paket.monthlyFee} onChange={(e) => setPaket({ ...paket, monthlyFee: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Tarif Paket 1 Tahun (Rp)</Label>
                <Input type="number" min="0" value={paket.yearlyFee} onChange={(e) => setPaket({ ...paket, yearlyFee: Number(e.target.value) })} />
                <p className="text-sm font-medium text-success">
                  Hemat Rp {(paket.monthlyFee * 12 - paket.yearlyFee).toLocaleString('id-ID')} (Diskon {Math.floor(((paket.monthlyFee * 12 - paket.yearlyFee) / paket.monthlyFee) * 10) / 10} Bulan Sewa Gratis!)
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Durasi Masa Uji Coba (Hari)</Label>
                <Input type="number" min="0" value={paket.trialDays} onChange={(e) => setPaket({ ...paket, trialDays: Number(e.target.value) })} />
              </div>
              <Button size="lg" onClick={handleSimpanPaket} className="w-full">
                <Save className="mr-2 size-4" /> Simpan Paket & Tarif Langganan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="toko" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Toko Penyewa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3">Koneksi</th>
                      <th className="px-4 py-3">Pelanggan SaaS (Toko)</th>
                      <th className="px-4 py-3">Kontak WA</th>
                      <th className="px-4 py-3">Masa Aktif Sewa</th>
                      <th className="px-4 py-3 text-right">Aksi Tagihan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stores.map((s: unknown) => (
                      <tr key={s.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3">
                          {s.is_online ? (
                            <Badge variant="outline" className="border-emerald-500 text-emerald-500 bg-emerald-500/10">
                              <span className="mr-1.5 flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              Online
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              <span className="mr-1.5 flex h-2 w-2 rounded-full bg-muted-foreground"></span>
                              Offline
                            </Badge>
                          )}
                          {s.last_seen_at && (
                            <p className="text-[10px] text-muted-foreground mt-1 text-center">
                              {new Date(s.last_seen_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{s.name}</p>
                          <p className="text-xs text-muted-foreground">Pemilik: {s.owner_name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{s.address}</p>
                        </td>
                        <td className="px-4 py-3">
                          <a href={`https://wa.me/${s.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">
                            {s.phone || '-'}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={s.subscription_status === 'active' ? 'default' : s.subscription_status === 'trial' ? 'secondary' : 'destructive'} className="mb-1">
                            {s.subscription_status.toUpperCase()}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {s.subscription_expires_at ? new Date(s.subscription_expires_at).toLocaleDateString('id-ID') : '-'}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handlePerpanjang(s.id, 30)}>+30 Hari</Button>
                          <Button size="sm" variant="outline" onClick={() => handlePerpanjang(s.id, 365)}>+1 Tahun</Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button size="sm" variant="ghost">Set Status</Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleStatus(s.id, 'trial')}>
                                Reset ke Trial (7 Hari dari Sekarang)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatus(s.id, 'active_30')}>
                                Set Aktif 30 Hari (Mulai Hari Ini)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatus(s.id, 'active_365')}>
                                Set Aktif 1 Tahun (Mulai Hari Ini)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatus(s.id, 'expired')} className="text-destructive font-medium">
                                Kunci / Suspend Toko (Expired)
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pg" className="mt-6">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>💳 Payment Gateway Platform (Uang Sewa Owner)</CardTitle>
              <CardDescription>
                Tentukan gateway pembayaran untuk menerima tagihan langganan otomatis dari seluruh penyewa KasToko.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <input type="text" name="prevent_autofill_user" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
              <input type="password" name="prevent_autofill_pass" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

              <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Gateway Utama (Primary) ⭐</Label>
                    <p className="text-sm text-muted-foreground">Pilih gateway prioritas untuk penagihan bulanan (Rp {pg.fee.toLocaleString()}).</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    variant={pg.primary_gateway === "paywuz" ? "default" : "outline"} 
                    onClick={() => setPg((s) => ({ ...s, primary_gateway: "paywuz" }))}>
                    Paywuz
                  </Button>
                  <Button 
                    variant={pg.primary_gateway === "duitku" ? "default" : "outline"} 
                    onClick={() => setPg((s) => ({ ...s, primary_gateway: "duitku" }))}>
                    Duitku
                  </Button>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <Label className="font-semibold text-primary">Aktifkan Cadangan Otomatis (Failover) 🛡️</Label>
                    <p className="text-xs text-muted-foreground mt-1">Jika gateway utama mengalami gangguan/timeout, otomatis alihkan pembayaran sewa ke gateway cadangan.</p>
                  </div>
                  <Switch checked={pg.enable_failover} onCheckedChange={(v) => setPg((s) => ({ ...s, enable_failover: v }))} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Paywuz */}
                <div className="space-y-4 rounded-lg border p-4 relative">
                  {pg.primary_gateway === 'paywuz' && <Badge className="absolute top-4 right-4" variant="default">Primary</Badge>}
                  {pg.primary_gateway !== 'paywuz' && pg.enable_failover && <Badge className="absolute top-4 right-4" variant="secondary">Backup</Badge>}
                  <h3 className="font-semibold text-lg">Paywuz</h3>
                  <div className="space-y-1.5">
                    <Label>API Key Paywuz</Label>
                    <div className="relative">
                      <Input type={showPgKey ? "text" : "password"} placeholder="pk_live_..." value={pg.paywuz_api_key} onChange={(e) => setPg({ ...pg, paywuz_api_key: e.target.value })} autoComplete="new-password" data-lpignore="true" data-1p-ignore="true" />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full hover:bg-transparent" onClick={() => setShowPgKey(!showPgKey)}>
                        {showPgKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div><Label>Mode Sandbox</Label><p className="text-[10px] text-muted-foreground">Uji coba Paywuz.</p></div>
                    <Switch checked={pg.paywuz_is_sandbox} onCheckedChange={(v) => setPg((s) => ({ ...s, paywuz_is_sandbox: v }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div><Label>Aktif</Label><p className="text-[10px] text-muted-foreground">Aktifkan integrasi ini.</p></div>
                    <Switch checked={pg.paywuz_is_active} onCheckedChange={(v) => setPg((s) => ({ ...s, paywuz_is_active: v }))} />
                  </div>
                </div>

                {/* Duitku */}
                <div className="space-y-4 rounded-lg border p-4 relative">
                  {pg.primary_gateway === 'duitku' && <Badge className="absolute top-4 right-4" variant="default">Primary</Badge>}
                  {pg.primary_gateway !== 'duitku' && pg.enable_failover && <Badge className="absolute top-4 right-4" variant="secondary">Backup</Badge>}
                  <h3 className="font-semibold text-lg">Duitku</h3>
                  <div className="space-y-1.5">
                    <Label>Merchant Code</Label>
                    <Input placeholder="D12345" value={pg.duitku_merchant_code} onChange={(e) => setPg({ ...pg, duitku_merchant_code: e.target.value })} autoComplete="off" data-lpignore="true" data-1p-ignore="true" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>API Key Duitku</Label>
                    <div className="relative">
                      <Input type={showPgKey ? "text" : "password"} value={pg.duitku_api_key} onChange={(e) => setPg({ ...pg, duitku_api_key: e.target.value })} autoComplete="new-password" data-lpignore="true" data-1p-ignore="true" />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full hover:bg-transparent" onClick={() => setShowPgKey(!showPgKey)}>
                        {showPgKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div><Label>Mode Sandbox</Label><p className="text-[10px] text-muted-foreground">Uji coba Duitku.</p></div>
                    <Switch checked={pg.duitku_is_sandbox} onCheckedChange={(v) => setPg((s) => ({ ...s, duitku_is_sandbox: v }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div><Label>Aktif</Label><p className="text-[10px] text-muted-foreground">Aktifkan integrasi ini.</p></div>
                    <Switch checked={pg.duitku_is_active} onCheckedChange={(v) => setPg((s) => ({ ...s, duitku_is_active: v }))} />
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between border-b pb-3 mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">QRIS Manual & Rekening Owner (0% Fee)</h3>
                    <p className="text-sm text-muted-foreground">Tampilkan gambar stiker QRIS asli Anda agar penyewa bisa scan langsung tanpa potongan payment gateway.</p>
                  </div>
                  <Switch checked={pg.manual_qris_is_active} onCheckedChange={(v) => setPg((s) => ({ ...s, manual_qris_is_active: v }))} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label>Foto Stiker QRIS</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      {pg.manual_qris_image ? (
                        <div className="relative inline-block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img   src={pg.manual_qris_image} alt="QRIS Manual" className="max-h-48 rounded" />
                          <Button size="sm" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0" onClick={() => setPg({ ...pg, manual_qris_image: null })}>X</Button>
                        </div>
                      ) : (
                        <div className="py-6">
                          <p className="text-sm text-muted-foreground mb-2">Pilih file gambar QRIS (PNG/JPG)</p>
                          <Input type="file" accept="image/*" onChange={handleFileChange} className="max-w-[250px] mx-auto" />
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

              <Button size="lg" onClick={handleSimpanPg} className="w-full">
                <Save className="mr-2 size-4" /> Simpan Pengaturan Platform
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
