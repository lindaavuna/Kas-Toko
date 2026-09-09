"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  Image as ImageIcon,
  Layers,
  Pencil,
  Power,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { aksiSimpanProduk, aksiToggleProduk, aksiUploadFotoProduk } from "@/lib/server/aksi-katalog";
import { formatRupiah, parseInputUang } from "@/lib/format";
import type { Category, Product, ProductUnit } from "@/lib/types";

const AKORDEON = "Informasi Tambahan (Boleh Dikosongkan)";

interface FormProduk {
  name: string;
  sellingPrice: string;
  stockQty: string;
  barcode: string;
  purchasePrice: string;
  categoryId: string;
  minStock: string;
  unit: string;
  emoji: string;
  units: ProductUnit[];
}

interface StateFoto {
  url?: string;
  status: "kosong" | "mengunggah" | "ada";
}

const kosong: FormProduk = {
  name: "",
  sellingPrice: "",
  stockQty: "",
  barcode: "",
  purchasePrice: "",
  categoryId: "",
  minStock: "5",
  unit: "pcs",
  emoji: "📦",
  units: [],
};

export function PanelProduk({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const router = useRouter();
  const [proses, setProses] = useState(false);

  const [cari, setCari] = useState("");
  const [filterKategori, setFilterKategori] = useState("semua");
  const [dialog, setDialog] = useState<{ open: boolean; edit: Product | null }>({
    open: false,
    edit: null,
  });
  const [form, setForm] = useState<FormProduk>(kosong);
  const [bukaTambahan, setBukaTambahan] = useState(false);
  const [foto, setFoto] = useState<StateFoto>({ status: "kosong" });

  const daftar = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return products
      .filter((p) => filterKategori === "semua" || p.categoryId === filterKategori)
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode ?? "").includes(q)
      );
  }, [products, cari, filterKategori]);

  function bukaTambah() {
    setForm(kosong);
    setBukaTambahan(false);
    setFoto({ status: "kosong" });
    setDialog({ open: true, edit: null });
  }

  function bukaEdit(p: Product) {
    setForm({
      name: p.name,
      sellingPrice: String(p.sellingPrice),
      stockQty: String(p.stockQty),
      barcode: p.barcode ?? "",
      purchasePrice: String(p.purchasePrice),
      categoryId: p.categoryId ?? "",
      minStock: String(p.minStock),
      unit: p.unit,
      emoji: p.emoji,
      units: p.units ? [...p.units] : [],
    });
    setBukaTambahan(true);
    setFoto(p.fotoUrl ? { url: p.fotoUrl, status: "ada" } : { status: "kosong" });
    setDialog({ open: true, edit: p });
  }

  async function simpan() {
    const harga = parseInputUang(form.sellingPrice);
    const stok = Number(form.stockQty || 0);
    if (!form.name.trim()) {
      toast.error("Nama barang wajib diisi.");
      return;
    }
    if (harga <= 0) {
      toast.error("Harga jual wajib diisi (lebih dari nol).");
      return;
    }
    setProses(true);
    const hasil = await aksiSimpanProduk({
      id: dialog.edit?.id ?? null,
      name: form.name.trim(),
      sellingPrice: harga,
      stockQty: stok,
      barcode: form.barcode.trim() || null,
      purchasePrice: parseInputUang(form.purchasePrice),
      categoryId: form.categoryId || null,
      minStock: Number(form.minStock || 5),
      unit: form.unit.trim() || "pcs",
      emoji: form.emoji.trim() || "📦",
      fotoUrl: foto.url ?? null,
      units: form.units.filter((u) => u.unitName.trim()),
    });
    setProses(false);
    toast[hasil.ok ? "success" : "error"](hasil.pesan);
    if (hasil.ok) {
      setDialog({ open: false, edit: null });
      router.refresh();
    }
  }

  function ubahUnit(i: number, patch: Partial<ProductUnit>) {
    setForm((f) => ({
      ...f,
      units: f.units.map((u, idx) => (idx === i ? { ...u, ...patch } : u)),
    }));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute inset-y-0 left-3 my-auto size-4 text-muted-foreground" />
          <Input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama / SKU / barcode…"
            className="pl-9"
          />
        </div>
        <Select value={filterKategori} onValueChange={setFilterKategori}>
          <SelectTrigger className="h-11 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Kategori</SelectItem>
            {categories.map((k) => (
              <SelectItem key={k.id} value={k.id}>
                {k.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="lg" onClick={bukaTambah}>
          <Plus className="size-4" />
          Tambah Produk
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead className="hidden md:table-cell">Kategori</TableHead>
              <TableHead className="text-right">Harga Beli</TableHead>
              <TableHead className="text-right">Harga Jual</TableHead>
              <TableHead className="text-right">Stok</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {daftar.map((p) => {
              const kategori = categories.find((k) => k.id === p.categoryId);
              return (
                <TableRow key={p.id} className={p.isActive ? "" : "opacity-50"}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      {p.fotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.fotoUrl} alt={p.name} className="size-9 rounded-md border object-cover" />
                      ) : (
                        <span className="flex size-9 items-center justify-center rounded-md bg-muted text-lg">
                          {p.emoji}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.sku}
                          {p.barcode ? ` • ${p.barcode}` : ""}
                          {p.units && p.units.length > 1 ? (
                            <span className="ml-1 inline-flex items-center gap-0.5 text-primary">
                              <Layers className="size-3" /> multi
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {kategori?.name ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right font-money">{formatRupiah(p.purchasePrice)}</TableCell>
                  <TableCell className="text-right font-semibold font-money">{formatRupiah(p.sellingPrice)}</TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-money font-semibold ${
                        p.stockQty <= p.minStock ? "text-warning" : ""
                      }`}
                    >
                      {p.stockQty} {p.unit}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.isActive ? (p.stockQty <= p.minStock ? "warning" : "success") : "secondary"}>
                      {p.isActive ? (p.stockQty <= p.minStock ? "Stok Tipis" : "Aktif") : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => bukaEdit(p)} aria-label={`Edit ${p.name}`}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8"
                      onClick={async () => {
                        const hasil = await aksiToggleProduk(p.id);
                        toast[hasil.ok ? "info" : "error"](hasil.ok ? `${p.name} ${p.isActive ? "dinonaktifkan" : "diaktifkan lagi"}.` : hasil.pesan);
                        if (hasil.ok) router.refresh();
                      }}
                      aria-label={`Aktif/nonaktif ${p.name}`}
                    >
                      <Power className={`size-3.5 ${p.isActive ? "text-danger" : "text-success"}`} />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {daftar.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Belum ada produk. Klik “Tambah Produk” — cuma 3 kolom wajib!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialog.open} onOpenChange={(o) => !o && setDialog({ open: false, edit: null })}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog.edit ? "Edit Produk" : "Tambah Produk Kilat"}</DialogTitle>
            <DialogDescription>
              Isi 3 kolom di bawah ini saja sudah bisa langsung dijual. Sisanya opsional.
            </DialogDescription>
          </DialogHeader>

          {/* 3 KOLOM WAJIB */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-nama">
                1. Nama Barang <span className="text-danger">*</span>
              </Label>
              <Input
                id="p-nama"
                placeholder="Contoh: Beras Premium 5Kg"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-harga">
                  2. Harga Jual <span className="text-danger">*</span>
                </Label>
                <Input
                  id="p-harga"
                  inputMode="numeric"
                  placeholder="62000"
                  value={
                    form.sellingPrice === ""
                      ? ""
                      : parseInputUang(form.sellingPrice).toLocaleString("id-ID")
                  }
                  onChange={(e) => setForm({ ...form, sellingPrice: e.target.value.replace(/\D/g, "") })}
                  className="text-right font-money"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-stok">
                  3. Jumlah Stok <span className="text-danger">*</span>
                </Label>
                <Input
                  id="p-stok"
                  inputMode="numeric"
                  placeholder="40"
                  value={form.stockQty}
                  onChange={(e) => setForm({ ...form, stockQty: e.target.value.replace(/[^\d.]/g, "") })}
                  className="text-right font-money"
                />
              </div>
            </div>
          </div>

          {/* AKORDEON OPSIONAL */}
          <div className="rounded-lg border">
            <button
              type="button"
              className="flex h-11 w-full items-center justify-between px-3 text-sm font-medium"
              onClick={() => setBukaTambahan((v) => !v)}
              aria-expanded={bukaTambahan}
            >
              {AKORDEON}
              <ChevronDown className={`size-4 transition-transform ${bukaTambahan ? "rotate-180" : ""}`} />
            </button>
            {bukaTambahan && (
              <div className="space-y-3 border-t p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="p-barcode">Barcode (scan kemasan)</Label>
                    <Input
                      id="p-barcode"
                      placeholder="899100…"
                      value={form.barcode}
                      onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-belinya">Harga Beli</Label>
                    <Input
                      id="p-belinya"
                      inputMode="numeric"
                      placeholder="55000"
                      value={form.purchasePrice}
                      onChange={(e) => setForm({ ...form, purchasePrice: e.target.value.replace(/\D/g, "") })}
                      className="text-right font-money"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Kategori</Label>
                    <Select value={form.categoryId || undefined} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Tanpa kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((k) => (
                          <SelectItem key={k.id} value={k.id}>
                            {k.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-min">Stok Minimum (peringatan)</Label>
                    <Input
                      id="p-min"
                      inputMode="numeric"
                      value={form.minStock}
                      onChange={(e) => setForm({ ...form, minStock: e.target.value.replace(/\D/g, "") })}
                      className="text-right font-money"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-satuan">Satuan Dasar</Label>
                    <Input
                      id="p-satuan"
                      placeholder="pcs"
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-emoji">
                      <ImageIcon className="mr-1 inline size-3.5" /> Ikon/Foto (emoji)
                    </Label>
                    <Input
                      id="p-emoji"
                      placeholder="📦"
                      maxLength={4}
                      value={form.emoji}
                      onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                      className="text-center text-lg"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="p-foto">Foto produk (JPG/PNG/WebP, maks 2 MB)</Label>
                    <div className="flex items-center gap-2">
                      <input
                        id="p-foto"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="h-11 flex-1 text-sm file:mr-2 file:h-11 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:font-medium file:text-primary"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setFoto({ status: "mengunggah" });
                          const fd = new FormData();
                          fd.set("foto", f);
                          const hasil = await aksiUploadFotoProduk(fd);
                          toast[hasil.ok ? "success" : "error"](hasil.pesan);
                          setFoto(hasil.ok && hasil.url ? { url: hasil.url, status: "ada" } : { status: "kosong" });
                        }}
                      />
                      {foto.status === "ada" && foto.url && (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={foto.url} alt="Pratinjau foto produk" className="size-11 rounded-md border object-cover" />
                          <Button size="sm" variant="ghost" className="text-danger" onClick={() => setFoto({ status: "kosong" })}>
                            Hapus
                          </Button>
                        </>
                      )}
                      {foto.status === "mengunggah" && (
                        <span className="text-xs text-muted-foreground">mengunggah…</span>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                    <Layers className="size-4" /> Harga Grosir / Multi-Satuan (opsional)
                  </p>
                  {form.units.map((u, i) => (
                    <div key={i} className="mb-2 grid grid-cols-[1fr_70px_1fr_36px] items-center gap-2">
                      <Input
                        placeholder="Nama (Dus)"
                        value={u.unitName}
                        onChange={(e) => ubahUnit(i, { unitName: e.target.value })}
                      />
                      <Input
                        inputMode="numeric"
                        placeholder="=40"
                        aria-label="isi per satuan"
                        value={String(u.conversionFactor)}
                        onChange={(e) =>
                          ubahUnit(i, { conversionFactor: Number(e.target.value.replace(/[^\d.]/g, "") || 1) })
                        }
                        className="text-right font-money"
                      />
                      <Input
                        inputMode="numeric"
                        placeholder="Harga"
                        aria-label="harga satuan ini"
                        value={String(u.sellingPrice)}
                        onChange={(e) =>
                          ubahUnit(i, { sellingPrice: parseInputUang(e.target.value) })
                        }
                        className="text-right font-money"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-danger"
                        onClick={() =>
                          setForm((f) => ({ ...f, units: f.units.filter((_, idx) => idx !== i) }))
                        }
                        aria-label="Hapus satuan"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        units: [...f.units, { unitName: "", conversionFactor: 1, sellingPrice: 0 }],
                      }))
                    }
                  >
                    <Plus className="size-3.5" /> Tambah Satuan
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Isi “=40” artinya 1 Dus = 40 pcs. Stok tetap dihitung dari satuan dasar.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" size="lg" onClick={() => setDialog({ open: false, edit: null })}>
              Batal
            </Button>
            <Button size="lg" onClick={simpan} disabled={proses}>
              {proses ? "Menyimpan…" : dialog.edit ? "Simpan Perubahan" : "Simpan Produk"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
