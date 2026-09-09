"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, ChevronDown, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePosStore } from "@/lib/stores/pos-store";
import { formatRupiah, hariIni } from "@/lib/format";
import type { SessionUser } from "@/lib/types";

interface Pesan {
  dari: "user" | "hermes";
  teks: string;
  fungsi?: string;
}

function hariIniLabel(): string {
  const d = new Date();
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
}

export function HermesChat({
  user,
  variant = "fab",
}: {
  user: SessionUser;
  variant?: "fab" | "header";
}) {
  const [buka, setBuka] = useState(false);
  const [pesan, setPesan] = useState<Pesan[]>([
    {
      dari: "hermes",
      teks: `Halo ${user.name}! Saya Hermes, asisten toko Anda. Tanya apa saja pakai bahasa sehari-hari, misal "omset hari ini berapa?".`,
    },
  ]);
  const [input, setInput] = useState("");
  const [sedangKetik, setSedangKetik] = useState(false);
  const bawahRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bawahRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [pesan, sedangKetik]);

  function jawab(teksUser: string): Pesan[] {
    const state = usePosStore.getState();
    const q = teksUser.toLowerCase();
    const pemilik = user.role === "owner";
    const keluar = (fungsi: string, teks: string): Pesan[] => [{ dari: "hermes", fungsi, teks }];

    const penjualanHariIni = state.sales.filter(
      (s) => s.status !== "void" && s.createdAt.slice(0, 10) >= hariIni()
    );

    if (/(omset|omzet|pendapatan|penjualan.*(hari|today))/.test(q)) {
      if (!pemilik)
        return keluar(
          "get_daily_sales()",
          "Maaf, laporan omset hanya bisa diakses Pemilik Toko ya. Saya bisa bantu panduan kasir, cek stok, atau catat pengeluaran."
        );
      const omset = penjualanHariIni.reduce((a, s) => a + s.total, 0);
      const laba = penjualanHariIni.reduce(
        (a, s) =>
          a +
          s.items.reduce((b, i) => {
            const p = state.products.find((x) => x.id === i.productId);
            return b + (i.price - (p?.purchasePrice ?? 0)) * i.qty;
          }, 0),
        0
      );
      return keluar(
        "get_daily_sales()",
        `Omset ${hariIniLabel()}: ${formatRupiah(omset)} dari ${penjualanHariIni.length} transaksi. Perkiraan laba kotor hari ini ${formatRupiah(laba)}. 🔥`
      );
    }

    if (/(stok|barang.*habis|menipis|mau habis|tipis)/.test(q)) {
      const tipis = state.products.filter((p) => p.isActive && p.stockQty <= p.minStock);
      return keluar(
        "get_low_stock_products()",
        tipis.length === 0
          ? "Semua stok aman, belum ada yang menipis. Siap-siap kulakan sebelum akhir pekan ya!"
          : `Barang yang perlu segera dibeli:\n${tipis
              .map((p) => `• ${p.name} — sisa ${p.stockQty} (minimum ${p.minStock})`)
              .join("\n")}\n\nRekomendasi: hubungi UD Sinar Mas hari ini.`
      );
    }

    if (/(kasbon|hutang.*(pembeli|pelanggan)|piutang|belum.?lunas)/.test(q)) {
      if (!pemilik)
        return keluar(
          "get_debtor_list()",
          "Buku kasbon penuh hanya untuk Pemilik Toko. Kalau ada pelanggan bayar cicilan, catat lewat Loket Kasbon ya."
        );
      const aktif = state.receivables.filter((r) => r.status !== "paid");
      return keluar(
        "get_debtor_list()",
        aktif.length === 0
          ? "Wah, tidak ada pelanggan yang punya kasbon. Semua sudah lunas!"
          : `Yang masih punya kasbon:\n${aktif
              .map(
                (r) =>
                  `• ${r.customerName} — sisa ${formatRupiah(r.originalAmount - r.paidAmount)}`
              )
              .join("\n")}\n\nTotal piutang: ${formatRupiah(
              aktif.reduce((a, r) => a + r.originalAmount - r.paidAmount, 0)
            )}`
      );
    }

    if (/(catat|jangan|tolong).*(beli|bensin|listrik|air|sampah|konsumsi|pengeluaran|keluar)/.test(q) || /pengeluaran/.test(q)) {
      const cocok = teksUser.match(/(\d{1,3}(?:[.,]\d{3})+|\d+)\s*(ribu|rb|k)?/i);
      let nominal = 0;
      if (cocok) {
        nominal = Number(cocok[1].replace(/[.,]/g, ""));
        if (cocok[2]) nominal *= 1000;
      }
      const judul = teksUser
        .replace(/tolong|cat(at|kan)?|beli|dari kas(ir)?|rp|\d|[.,]|\s+/gi, " ")
        .trim();
      if (!nominal) {
        return keluar(
          "create_expense()",
          "Boleh, sebutkan nominalnya. Contoh: \"Tolong catat beli bensin Rp 20.000 dari kasir\"."
        );
      }
      const namaPengeluaran = judul ? judul.slice(0, 40) : "Pengeluaran lewat chat Hermes";
      state.catatPengeluaran(namaPengeluaran, nominal, user);
      return keluar(
        "create_expense()",
        `Siap! Pengeluaran "${namaPengeluaran || "beli bensin"}" ${formatRupiah(nominal)} sudah saya catat dan memotong kas laci shift berjalan. ✔`
      );
    }

    if (/(laba|keuntungan|untung)/.test(q)) {
      if (!pemilik)
        return keluar("get_daily_sales()", "Informasi laba hanya untuk Pemilik Toko ya.");
      const laba = penjualanHariIni.reduce(
        (a, s) =>
          a +
          s.items.reduce((b, i) => {
            const p = state.products.find((x) => x.id === i.productId);
            return b + (i.price - (p?.purchasePrice ?? 0)) * i.qty;
          }, 0),
        0
      );
      return keluar(
        "get_daily_sales()",
        `Perkiraan laba kotor hari ini ${formatRupiah(laba)}. Rinciannya ada di menu Laporan Keuangan.`
      );
    }

    if (/(bantu|panduan|cara|gimana|bagaimana)/.test(q)) {
      return keluar(
        "",
        "Contoh yang bisa Anda tanyakan:\n• \"Omset hari ini berapa?\"\n• \"Barang apa yang stoknya mau habis?\"\n• \"Siapa saja yang punya kasbon?\"\n• \"Catat beli bensin Rp 20.000 dari kasir\"\n\nSaya pakai data toko Anda sendiri, jadi jawaban langsung akurat."
      );
    }

    return keluar(
      "",
      "Hmm, saya belum paham. Coba tanya hal lain, misalnya \"omset hari ini\" atau \"cek stok menipis\"."
    );
  }

  function kirim(teks?: string) {
    const isi = (teks ?? input).trim();
    if (!isi) return;
    setInput("");
    setPesan((p) => [...p, { dari: "user", teks: isi }]);
    setSedangKetik(true);
    setTimeout(() => {
      setPesan((p) => [...p, ...jawab(isi)]);
      setSedangKetik(false);
    }, 600);
  }

  const saran = [
    "Omset hari ini berapa?",
    "Barang apa yang mau habis?",
    "Siapa saja yang punya kasbon?",
    "Catat beli bensin Rp 20.000",
  ];

  const isi = (
    <div className="flex h-[60vh] max-h-[480px] flex-col">
      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-3 py-2">
          {pesan.map((m, i) => (
            <div key={i} className={m.dari === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-line ${
                  m.dari === "user"
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm border bg-muted/70"
                }`}
              >
                {m.fungsi && (
                  <Badge variant="outline" className="mb-1.5 h-5 gap-1 bg-card text-[10px]">
                    <Sparkles className="size-2.5 text-primary" />
                    {m.fungsi}
                  </Badge>
                )}
                {m.teks}
              </div>
            </div>
          ))}
          {sedangKetik && (
            <p className="text-xs text-muted-foreground italic">Hermes sedang memanggil fungsi toko…</p>
          )}
          <div ref={bawahRef} />
        </div>
      </ScrollArea>

      <div className="flex flex-wrap gap-1.5 border-t pt-2">
        {saran.map((s) => (
          <button
            key={s}
            onClick={() => kirim(s)}
            className="rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            {s}
          </button>
        ))}
      </div>
      <form
        className="flex gap-2 pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          kirim();
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ngobrol santai saja…"
          className="h-11"
          aria-label="Pesan untuk Hermes"
        />
        <Button type="submit" size="lg" className="aspect-square h-11 p-0" aria-label="Kirim">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );

  if (variant === "header") {
    return (
      <>
        <Button size="sm" variant="ghost" className="h-9 px-2 text-primary" onClick={() => setBuka(true)} aria-label="Buka asisten AI Hermes">
          <Bot className="size-4" />
        </Button>
        <Dialog open={buka} onOpenChange={setBuka}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-4 text-primary" />
                Asisten Toko Hermes
                <Badge variant="secondary" className="ml-1 text-[10px]">
                  Nous Research · Rp 0
                </Badge>
              </DialogTitle>
              <DialogDescription className="sr-only">
                Tanya omset, cek stok, dan catat pengeluaran lewat chat bahasa Indonesia.
              </DialogDescription>
            </DialogHeader>
            {isi}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Dialog open={buka} onOpenChange={setBuka}>
        <DialogContent className="fixed bottom-20 right-4 left-auto top-auto w-[min(92vw,24rem)] translate-y-0 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" />
              Asisten Toko Hermes
              <Badge variant="secondary" className="ml-1 text-[10px]">
                Hermes · Nous Research
              </Badge>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Tanya omset, cek stok, dan catat pengeluaran lewat chat bahasa Indonesia.
            </DialogDescription>
          </DialogHeader>
          {isi}
        </DialogContent>
      </Dialog>
      <Button
        onClick={() => setBuka((v) => !v)}
        className="fixed bottom-4 right-4 z-50 size-14 rounded-full shadow-lg"
        aria-label="Buka chat Asisten AI Hermes"
      >
        {buka ? <ChevronDown className="size-6" /> : <Bot className="size-6" />}
      </Button>
    </>
  );
}
