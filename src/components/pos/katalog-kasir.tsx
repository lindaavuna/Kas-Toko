"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Camera,
  Layers,
  PackageX,
  Search,
  ShoppingBasket,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { KeranjangPanel } from "@/components/pos/keranjang-panel";
import { BarcodeListener } from "@/components/pos/barcode-listener";
import { useKeranjangStore } from "@/lib/stores/keranjang-store";
import { useUiStore } from "@/lib/stores/ui-store";
import { formatRupiah } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

export function KatalogKasir({
  produk,
  kategori,
  shiftBuka,
  peranKasir = false,
}: {
  produk: Product[];
  kategori: Category[];
  shiftBuka: boolean;
  peranKasir?: boolean;
}) {
  const [cari, setCari] = useState("");
  const [kategoriAktif, setKategoriAktif] = useState<string>("");
  const [produkSatuan, setProdukSatuan] = useState<Product | null>(null);

  const tambahProduk = useKeranjangStore((s) => s.tambahProduk);
  const itemCount = useKeranjangStore((s) => s.items.reduce((a, i) => a + i.qty, 0));
  const setDialogShift = useUiStore((s) => s.setDialogShift);

  useEffect(() => {
    if (peranKasir && !shiftBuka) setDialogShift("buka");
  }, [peranKasir, shiftBuka, setDialogShift]);

  const hasil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return produk
      .filter((p) => p.isActive)
      .filter((p) => !kategoriAktif || p.categoryId === kategoriAktif)
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          String(p.barcode ?? "").includes(q)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [produk, cari, kategoriAktif]);

  const stokTipis = produk.filter((p) => p.isActive && p.stockQty <= p.minStock);

  const pilihProduk = useCallback(
    (p: Product) => {
      if (p.stockQty <= 0) {
        toast.error(`Stok ${p.name} habis. Catat barang masuk dulu.`);
        return;
      }
      if (p.units && p.units.length > 1) {
        setProdukSatuan(p);
        return;
      }
      tambahProduk(p);
      toast.success(`${p.name} masuk keranjang`, { duration: 1200 });
    },
    [tambahProduk]
  );

  const handleScanBarcode = useCallback(
    (barcode: string) => {
      const q = barcode.trim().toLowerCase();
      const cocok = produk.find(
        (p) =>
          p.isActive &&
          (String(p.barcode ?? "").toLowerCase() === q || p.sku.toLowerCase() === q)
      );

      if (!cocok) {
        toast.error(`Barcode "${barcode}" tidak ditemukan di katalog.`);
        return;
      }

      toast.info(`📷 Barcode scan: ${cocok.name}`);
      pilihProduk(cocok);
    },
    [produk, pilihProduk]
  );

  function tekanEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const q = cari.trim();
    if (!q) return;
    const cocok = produk.find(
      (p) => p.isActive && (String(p.barcode ?? "") === q || p.sku.toLowerCase() === q.toLowerCase())
    );
    const target = cocok ?? hasil[0];
    if (!target) {
      toast.error("Barang tidak ditemukan. Periksa lagi namanya ya.");
      return;
    }
    pilihProduk(target);
    setCari("");
  }

  function simulasiScan() {
    const berscan = produk.filter((p) => p.barcode && p.isActive && p.stockQty > 0);
    const target = berscan[Math.floor(Math.random() * berscan.length)];
    if (!target) return;
    handleScanBarcode(String(target.barcode));
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)]">
      <BarcodeListener onScan={handleScanBarcode} />

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b bg-card p-3">
          <div className="relative flex-1">
            <Search className="absolute inset-y-0 left-3 my-auto size-4 text-muted-foreground" />
            <Input
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              onKeyDown={tekanEnter}
              placeholder="Cari nama barang / barcode… (Enter = tambah)"
              className="h-11 pl-9"
              aria-label="Cari produk"
              data-barcode-catcher="true"
            />
          </div>
          <Button size="lg" variant="outline" className="h-11 shrink-0" onClick={simulasiScan} aria-label="Simulasi scan barcode">
            <Camera className="size-4" />
            <span className="hidden md:inline">Scan</span>
          </Button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto border-b bg-card px-3 py-2">
          <Button size="sm" variant={kategoriAktif === "" ? "default" : "outline"} className="h-8 shrink-0" onClick={() => setKategoriAktif("")}>
            Semua
          </Button>
          {kategori.map((k) => (
            <Button key={k.id} size="sm" variant={kategoriAktif === k.id ? "default" : "outline"} className="h-8 shrink-0" onClick={() => setKategoriAktif(k.id)}>
              {k.name}
            </Button>
          ))}
        </div>

        {stokTipis.length > 0 && (
          <p className="border-b bg-warning/10 px-3 py-1.5 text-xs text-muted-foreground">
            ⚠️ Stok menipis: {stokTipis.map((p) => p.name).join(", ")}
          </p>
        )}

        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {hasil.map((p) => (
              <button
                key={p.id}
                onClick={() => pilihProduk(p)}
                aria-label={p.name}
                className={`group flex flex-col rounded-lg border bg-card p-2 text-left shadow-sm transition active:scale-[0.98] ${
                  p.stockQty <= 0 ? "opacity-60" : "hover:border-primary/60 hover:shadow-md"
                }`}
              >
                {p.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.fotoUrl} alt={p.name} className="mb-1.5 h-20 w-full rounded-md border object-cover" />
                ) : (
                  <div className="mb-1.5 flex size-full items-center justify-center rounded-md bg-muted py-4 text-3xl" aria-hidden>
                    {p.emoji}
                  </div>
                )}
                <p className="line-clamp-2 min-h-9 text-xs font-medium leading-tight">{p.name}</p>
                <p className="mt-0.5 text-sm font-bold text-primary font-money">{formatRupiah(p.sellingPrice)}</p>
                <div className="mt-1 flex items-center gap-1">
                  <Badge variant={p.stockQty <= p.minStock ? "warning" : "secondary"} className="text-[10px] h-5">
                    {p.stockQty <= 0 ? "Habis" : `Stok ${p.stockQty}`}
                  </Badge>
                  {p.units && p.units.length > 1 && (
                    <Badge variant="outline" className="text-[10px] h-5">
                      <Layers className="size-2.5" />
                    </Badge>
                  )}
                </div>
              </button>
            ))}
            {hasil.length === 0 && (
              <div className="col-span-full flex flex-col items-center gap-2 py-16 text-sm text-muted-foreground">
                <PackageX className="size-8 opacity-40" />
                Tidak ada barang cocok dengan pencarian.
              </div>
            )}
          </div>
        </ScrollArea>
      </section>

      <aside className="hidden w-[380px] shrink-0 lg:block xl:w-[420px]">
        <KeranjangPanel />
      </aside>

      <div className="fixed bottom-20 right-4 z-40 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <button className="relative flex size-14 items-center justify-center rounded-full bg-success text-success-foreground shadow-lg transition active:scale-95" aria-label="Buka keranjang belanja">
              <ShoppingBasket className="size-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-danger text-xs font-bold text-danger-foreground">
                  {itemCount}
                </span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85dvh] p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Keranjang Belanja</SheetTitle>
            </SheetHeader>
            <KeranjangPanel compact />
          </SheetContent>
        </Sheet>
      </div>

      <Dialog open={!!produkSatuan} onOpenChange={(o) => !o && setProdukSatuan(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{produkSatuan?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {produkSatuan?.units?.map((u) => (
              <Button
                key={u.unitName}
                variant="outline"
                size="lg"
                className="flex w-full justify-between"
                onClick={() => {
                  tambahProduk(produkSatuan!, 1, u);
                  toast.success(`1 ${u.unitName} ${produkSatuan!.name} masuk keranjang`);
                  setProdukSatuan(null);
                }}
              >
                <span>
                  {u.unitName}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {u.conversionFactor > 1 ? `= ${u.conversionFactor} ${produkSatuan!.unit}` : ""}
                  </span>
                </span>
                <span className="font-money font-semibold">{formatRupiah(u.sellingPrice)}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
