"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bot, ChevronDown, Send, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRupiah } from "@/lib/format";
import { aksiCatatPengeluaran } from "@/lib/server/aksi-kas";
import type { Petugas } from "@/lib/types";

export interface SnapshotHermes {
  omsetHari: number;
  labaHari: number;
  stokTipis: { name: string; stockQty: number; minStock: number }[];
  kasbonBelumLunas: { nama: string; sisa: number }[];
}

interface PesanChat {
  dari: "user" | "hermes";
  teks: string;
  fungsi?: string;
}

export function HermesChat({
  petugas,
  snapshot,
  variant = "floating",
}: {
  petugas: Petugas;
  snapshot: SnapshotHermes;
  variant?: "floating" | "header";
}) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [input, setInput] = useState("");
  const [sedangKetik, setSedangKetik] = useState(false);
  const [pesan, setPesan] = useState<PesanChat[]>([
    {
      dari: "hermes",
      teks: `Halo ${petugas.nama.split(" ")[0]}! Saya Hermes, asisten toko pintar Anda. Mau tanya omset, cek stok tipis, atau catat pengeluaran hari ini?`,
    },
  ]);

  const bawahRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bawahRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [pesan, sedangKetik]);

  const pemilik = petugas.peran === "owner";

  async function jawabLokal(teksUser: string): Promise<PesanChat[]> {
    const q = teksUser.toLowerCase();

    function keluar(fn: string, balasan: string): PesanChat[] {
      return [{ dari: "hermes", fungsi: fn || undefined, teks: balasan }];
    }

    if (/(omset|penjualan|pemasukan)/.test(q)) {
      return keluar(
        "ambil_omset_harian()",
        `Omset hari ini: ${formatRupiah(snapshot.omsetHari)}. Estimasi laba kotor: ${formatRupiah(snapshot.labaHari)}. 🔥`
      );
    }

    if (/(laba|keuntungan|untung)/.test(q)) {
      if (!pemilik) return keluar("ambil_omset_harian()", "Informasi laba hanya untuk Pemilik Toko ya.");
      return keluar(
        "ambil_omset_harian()",
        `Perkiraan laba kotor hari ini ${formatRupiah(snapshot.labaHari)}. Rinciannya ada di menu Laporan Keuangan.`
      );
    }

    if (/(stok|habis|menipis|tipis|kulakan)/.test(q)) {
      const tipis = snapshot.stokTipis;
      return keluar(
        "ambil_produk_menipis()",
        tipis.length === 0
          ? "Semua stok aman, belum ada yang menipis. Siap-siap kulakan sebelum akhir pekan ya!"
          : `Barang yang perlu segera dibeli:\n${tipis
              .map((p) => `• ${p.name} — sisa ${p.stockQty} (minimum ${p.minStock})`)
              .join("\n")}`
      );
    }

    if (/(kasbon|hutang pembeli|piutang|belum.?lunas)/.test(q)) {
      if (!pemilik)
        return keluar(
          "ambil_daftar_kasbon()",
          "Buku kasbon penuh hanya untuk Pemilik Toko. Kalau ada pelanggan bayar cicilan, catat lewat Loket Kasbon ya."
        );
      const aktif = snapshot.kasbonBelumLunas;
      return keluar(
        "ambil_daftar_kasbon()",
        aktif.length === 0
          ? "Wah, tidak ada pelanggan yang punya kasbon. Semua sudah lunas!"
          : `Yang masih punya kasbon:\n${aktif
              .map((a) => `• ${a.nama} — sisa ${formatRupiah(a.sisa)}`)
              .join("\n")}\n\nTotal piutang: ${formatRupiah(aktif.reduce((x, a) => x + a.sisa, 0))}`
      );
    }

    if (/(catat|beli|keluar|pengeluaran)/.test(q) && /(bensin|listrik|token|air|sampah|konsumsi|beli|plastik)/.test(q)) {
      const cocok = teksUser.match(/(\d{1,3}(?:[.,]\d{3})+|\d+)\s*(ribu|rb|k)?/i);
      let nominal = 0;
      if (cocok) {
        nominal = Number(cocok[1].replace(/[.,]/g, ""));
        if (cocok[2]) nominal *= 1000;
      }
      if (!nominal) {
        return keluar(
          "catat_pengeluaran_toko()",
          'Boleh, sebutkan nominalnya. Contoh: "Tolong catat beli bensin Rp 20.000 dari kasir".'
        );
      }
      const judul =
        teksUser
          .replace(/tolong|cat(at|kan)?|dari kas(ir)?|rp/gi, " ")
          .replace(/\d|[.,]/g, "")
          .trim()
          .slice(0, 40) || "Pengeluaran kasir";
      const hasil = await aksiCatatPengeluaran({ title: judul, amount: nominal });
      if (!hasil.ok) return keluar("catat_pengeluaran_toko()", `Hmm, gagal: ${hasil.pesan}`);
      router.refresh();
      return keluar(
        "catat_pengeluaran_toko()",
        `Siap! Pengeluaran "${judul}" ${formatRupiah(nominal)} sudah dicatat dan memotong kas laci shift berjalan. ✔`
      );
    }

    return keluar(
      "",
      'Contoh yang bisa ditanyakan:\n• "Omset hari ini berapa?"\n• "Barang apa yang stoknya mau habis?"\n• "Siapa saja yang punya kasbon?"\n• "Catat beli bensin Rp 20.000"'
    );
  }

  async function kirim(teks?: string) {
    const isi = (teks ?? input).trim();
    if (!isi) return;
    setInput("");
    const riwayatBaru = [...pesan, { dari: "user" as const, teks: isi }];
    setPesan(riwayatBaru);
    setSedangKetik(true);

    try {
      // Hubungi endpoint server Hermes API
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: riwayatBaru.map((m) => ({
            role: m.dari === "user" ? "user" : "assistant",
            content: m.teks,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.content) {
          setPesan((p) => [
            ...p,
            {
              dari: "hermes",
              teks: data.content,
              fungsi: data.functionCalled,
            },
          ]);
          setSedangKetik(false);
          return;
        }
      }
    } catch {
      // Fallback lokal jika fetch error atau server unreachable
    }

    // Fallback eksekusi lokal
    const jawaban = await jawabLokal(isi);
    setSedangKetik(false);
    setPesan((p) => [...p, ...jawaban]);
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
                className={`max-w-[85%] whitespace-pre-line rounded-xl px-3 py-2 text-sm leading-relaxed ${
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
            <p className="text-xs text-muted-foreground italic">Hermes sedang menganalisis toko…</p>
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
          placeholder="Tanya omset, stok, atau catat pengeluaran…"
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
                <Badge variant="secondary" className="ml-1 text-[10px]">Hermes 3 · Nous Research</Badge>
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
              <Badge variant="secondary" className="ml-1 text-[10px]">Hermes 3 · Nous Research</Badge>
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
