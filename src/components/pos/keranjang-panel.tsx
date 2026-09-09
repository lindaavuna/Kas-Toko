"use client";

import { Banknote, Minus, Plus, ShoppingBasket, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useKeranjangStore } from "@/lib/stores/keranjang-store";
import { useUiStore } from "@/lib/stores/ui-store";
import {
  formatRupiah,
  hitungDiskon,
  hitungSubtotal,
  hitungTotal,
  parseInputUang,
} from "@/lib/format";

export function KeranjangPanel({ compact = false }: { compact?: boolean }) {
  const items = useKeranjangStore((s) => s.items);
  const ubahQty = useKeranjangStore((s) => s.ubahQty);
  const kosongkan = useKeranjangStore((s) => s.kosongkan);
  const setDiskon = useKeranjangStore((s) => s.setDiskon);
  const diskonNilai = useKeranjangStore((s) => s.diskonNilai);
  const diskonTipe = useKeranjangStore((s) => s.diskonTipe);
  const setBayarOpen = useUiStore((s) => s.setBayarOpen);

  const subtotal = hitungSubtotal(items);
  const diskon = hitungDiskon(subtotal, diskonNilai, diskonTipe);
  const total = hitungTotal(subtotal, diskon);

  return (
    <div className={`flex h-full flex-col bg-card ${compact ? "" : "border-l"}`}>
      <div className="flex items-center justify-between px-4 pt-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <ShoppingBasket className="size-4 text-primary" />
          Keranjang Belanja
        </h2>
        {items.length > 0 && (
          <Button size="sm" variant="ghost" className="h-8 text-danger" onClick={kosongkan}>
            <Trash2 className="size-3.5" />
            Kosongkan
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {items.length === 0 ? (
          <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <ShoppingBasket className="size-8 opacity-40" />
            Keranjang masih kosong.
            <br />
            Sentuh foto barang di katalog untuk menambah.
          </div>
        ) : (
          items.map((baris) => (
            <div
              key={`${baris.productId}-${baris.unit}`}
              className="flex items-center gap-2 rounded-lg border p-2 shadow-sm"
            >
              <span className="text-xl leading-none" aria-hidden>
                {baris.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{baris.name}</p>
                <p className="text-xs text-muted-foreground font-money">
                  {formatRupiah(baris.price)} / {baris.unit}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="size-8 p-0"
                  onClick={() => ubahQty(baris.productId, baris.unit, -1)}
                  aria-label={`Kurangi ${baris.name}`}
                >
                  <Minus className="size-3.5" />
                </Button>
                <span className="w-8 text-center text-sm font-semibold font-money">{baris.qty}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="size-8 p-0"
                  onClick={() => ubahQty(baris.productId, baris.unit, 1)}
                  aria-label={`Tambah ${baris.name}`}
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
              <span className="w-20 text-right text-sm font-semibold font-money">
                {formatRupiah(baris.price * baris.qty)}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2 border-t bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Diskon</span>
          <Tabs
            value={diskonTipe}
            onValueChange={(v) => setDiskon(diskonNilai, v as "fixed" | "percentage")}
            className="ml-auto"
          >
            <TabsList className="h-8">
              <TabsTrigger value="fixed" className="h-6 px-2 text-xs">
                Rp
              </TabsTrigger>
              <TabsTrigger value="percentage" className="h-6 px-2 text-xs">
                %
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Input
            inputMode="numeric"
            value={diskonNilai === 0 ? "" : String(diskonNilai)}
            onChange={(e) => setDiskon(parseInputUang(e.target.value), diskonTipe)}
            placeholder="0"
            className="h-9 w-24 text-right font-money"
            aria-label="Nilai diskon"
          />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span className="font-money">{formatRupiah(subtotal)}</span>
        </div>
        {diskon > 0 && (
          <div className="flex justify-between text-sm text-success">
            <span>Diskon</span>
            <span className="font-money">- {formatRupiah(diskon)}</span>
          </div>
        )}
        <Separator />
        <div className="flex items-baseline justify-between">
          <span className="font-semibold">Total Bayar</span>
          <span className="text-xl font-bold text-primary font-money">{formatRupiah(total)}</span>
        </div>
        <Button
          variant="success"
          size="lg"
          className="w-full text-base"
          onClick={() => setBayarOpen(true)}
          disabled={items.length === 0}
        >
          <Banknote className="size-5" />
          Bayar
        </Button>
      </div>
    </div>
  );
}
