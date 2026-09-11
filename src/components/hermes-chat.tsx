/* eslint-disable */
"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bot, ChevronDown, Send, Sparkles, ShieldCheck, Check, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
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
  drafAksi?: {
    judul: string;
    nominal: number;
    sudahDikonfirmasi?: boolean;
  };
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
  const [sedangKonfirmasiIdx, setSedangKonfirmasiIdx] = useState<number | null>(null);
  const [pesan, setPesan] = useState<PesanChat[]>([
    {
      dari: "hermes",
      teks: `Halo ${petugas.nama.split(" ")[0]}! Saya Hermes, asisten toko pintar Anda (Mode Read-Only Aman). Mau tanya omset, cek stok tipis, atau siapkan draf pengeluaran hari ini?`,
    },
  ]);

  function bersihkanObrolan() {
    setPesan([
      {
        dari: "hermes",
        teks: `Halo ${petugas.nama.split(" ")[0]}! Saya Hermes, asisten toko pintar Anda (Mode Read-Only Aman). Mau tanya omset, cek stok tipis, atau siapkan draf pengeluaran hari ini?`,
      },
    ]);
  }

  const bawahRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bawahRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [pesan, sedangKetik]);

  const pemilik = petugas.peran === "owner";

  async function jawabLokal(teksUser: string): Promise<PesanChat[]> {
    const q = teksUser.toLowerCase();

    function keluar(fn: string, balasan: string, draf?: { judul: string; nominal: number }): PesanChat[] {
      return [{ dari: "hermes", fungsi: fn || undefined, teks: balasan, drafAksi: draf }];
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
          "create_expense()",
          'Boleh, sebutkan nominalnya. Contoh: "Tolong siapkan draf beli bensin Rp 20.000".'
        );
      }
      const judul =
        teksUser
          .replace(/tolong|cat(at|kan)?|dari kas(ir)?|rp/gi, " ")
          .replace(/\d|[.,]/g, "")
          .trim()
          .slice(0, 40) || "Pengeluaran kasir";

      // READ-ONLY GUARD: AI tidak mengeksekusi langsung.
      return keluar(
        "create_expense()",
        `⚠️ Mode Keamanan Read-Only Aktif:\nAI dilarang memotong uang kasir secara mandiri. Draf pengeluaran telah disiapkan di bawah, silakan tekan tombol setujui untuk mencatat ke sistem:`,
        { judul, nominal }
      );
    }

    return keluar(
      "",
      'Halo! Saya Asisten AI Hermes (Mode Read-Only). Contoh yang bisa ditanyakan:\n• "Omset hari ini berapa?"\n• "Barang apa yang stoknya mau habis?"\n• "Siapa saja yang punya kasbon?"\n• "Siapkan draf beli bensin Rp 20.000"'
    );
  }

  async function eksekusiKonfirmasiDraf(idx: number, judul: string, nominal: number) {
    setSedangKonfirmasiIdx(idx);
    try {
      const hasil = await aksiCatatPengeluaran({ title: judul, amount: nominal });
      if (hasil.ok) {
        toast.success(`Pengeluaran "${judul}" ${formatRupiah(nominal)} berhasil dicatat!`);
        setPesan((prev) =>
          prev.map((msg, i) =>
            i === idx && msg.drafAksi
              ? {
                  ...msg,
                  drafAksi: { ...msg.drafAksi, sudahDikonfirmasi: true },
                  teks: `${msg.teks}\n\n✔ Telah disetujui & dicatat ke kas laci oleh ${petugas.nama}.`,
                }
              : msg
          )
        );
        router.refresh();
      } else {
        toast.error(`Gagal mencatat pengeluaran: ${hasil.pesan}`);
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan saat mencatat pengeluaran.");
    } finally {
      setSedangKonfirmasiIdx(null);
    }
  }

  async function kirim(teks?: string) {
    const isi = (teks ?? input).trim();
    if (!isi) return;
    setInput("");
    const riwayatBaru = [...pesan, { dari: "user" as const, teks: isi }];
    setPesan(riwayatBaru);
    setSedangKetik(true);

    try {
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
              drafAksi: data.drafAksi,
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
    "Siapkan draf beli bensin Rp 20.000",
  ];

  const isiKonten = (
    <div
      className="flex flex-col flex-1 min-h-0 overflow-hidden"
    >
      <ScrollArea className="flex-1 min-h-0 pr-2">
        <div className="space-y-3 py-2">
          {pesan.map((m, i) => (
            <div key={i} className={m.dari === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={`max-w-[88%] whitespace-pre-line rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.dari === "user"
                    ? "rounded-br-sm bg-emerald-600 text-white"
                    : "rounded-bl-sm border bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100"
                }`}
              >
                {m.fungsi && (
                  <Badge variant="outline" className="mb-1.5 h-5 gap-1 bg-card text-[10px] text-emerald-600 border-emerald-300">
                    <Sparkles className="size-2.5 text-emerald-500" />
                    {m.fungsi}
                  </Badge>
                )}
                <p>{m.teks}</p>

                {/* Draf Card Konfirmasi Human-In-The-Loop */}
                {m.drafAksi && (
                  <div className="mt-3 p-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-2 text-xs">
                    <div className="flex justify-between items-baseline font-semibold">
                      <span className="text-slate-600 dark:text-slate-300">{m.drafAksi.judul}</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 font-mono text-sm">
                        {formatRupiah(m.drafAksi.nominal)}
                      </span>
                    </div>

                    {m.drafAksi.sudahDikonfirmasi ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                        <Check className="w-4 h-4" />
                        <span>Pengeluaran Sudah Dicatat</span>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        disabled={sedangKonfirmasiIdx === i}
                        onClick={() => eksekusiKonfirmasiDraf(i, m.drafAksi!.judul, m.drafAksi!.nominal)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 rounded-md mt-1 shadow-sm"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                        {sedangKonfirmasiIdx === i ? "Menyimpan..." : "Setujui & Catat Pengeluaran"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {sedangKetik && (
            <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-500 animate-spin" />
              <span>Hermes sedang menganalisis data toko...</span>
            </p>
          )}
          <div ref={bawahRef} />
        </div>
      </ScrollArea>

      <div className="shrink-0 flex flex-wrap gap-1.5 border-t border-slate-200 dark:border-slate-800 pt-2 mt-1">
        {saran.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => kirim(s)}
            className="rounded-full border bg-card px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-emerald-500 hover:text-emerald-600"
          >
            {s}
          </button>
        ))}
      </div>
      <form
        className="shrink-0 flex gap-2 pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          kirim();
        }}
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
              e.preventDefault();
              kirim();
            }
          }}
          rows={1}
          placeholder="Tanya omset, stok, atau siapkan draf (Ctrl+Enter untuk baris baru)..."
          className="min-h-[40px] max-h-24 resize-none text-xs sm:text-sm py-2"
          aria-label="Pesan untuk Hermes"
        />
        <Button type="submit" size="sm" className="aspect-square h-10 w-10 p-0 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0" aria-label="Kirim">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );

  const headerDialog = (
    <SheetHeader className="shrink-0 text-left">
      <div className="flex items-center justify-between pr-7">
        <SheetTitle className="flex items-center gap-2 text-base font-bold">
          <Sparkles className="size-4 text-emerald-600" />
          <span>Asisten Toko Hermes</span>
        </SheetTitle>
        <div className="flex items-center gap-1.5">
          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950" onClick={bersihkanObrolan} title="Sesi Baru / Bersihkan Obrolan">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Badge variant="outline" className="text-[10px] bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
            Read-Only Aman
          </Badge>
        </div>
      </div>
      <SheetDescription className="text-xs text-slate-500">
        Konsultasi omset, analisa stok, dan manajemen kasbon toko.
      </SheetDescription>
    </SheetHeader>
  );

  if (variant === "header") {
    return (
      <>
        <Button size="sm" variant="ghost" className="h-9 px-2 text-emerald-600" onClick={() => setBuka(true)} aria-label="Buka asisten AI Hermes">
          <Sparkles className="size-4" />
        </Button>
        <Sheet open={buka} onOpenChange={setBuka} modal={false}>
          <SheetContent
            side="right"
            showOverlay={false}
            className="w-full sm:max-w-[400px] flex flex-col p-4 sm:p-5 gap-3 shadow-2xl border-l"
          >
            {headerDialog}
            {isiKonten}
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <>
      <Sheet open={buka} onOpenChange={setBuka} modal={false}>
        <SheetContent
          side="right"
          showOverlay={false}
          className="w-full sm:max-w-[400px] flex flex-col p-4 sm:p-5 gap-3 shadow-2xl border-l"
        >
          {headerDialog}
          {isiKonten}
        </SheetContent>
      </Sheet>
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3">
        {!buka && (
          <div className="animate-bounce bg-emerald-600 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-lg border border-emerald-500 pointer-events-none whitespace-nowrap relative">
            Tanya AI! ✨
            <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 border-y-[6px] border-y-transparent border-l-[6px] border-l-emerald-600"></div>
          </div>
        )}
        <Button
          onClick={() => setBuka((v) => !v)}
          className="h-12 w-12 rounded-full shadow-2xl bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105 transition-transform shrink-0"
          aria-label="Buka chat Asisten AI Hermes"
        >
          {buka ? <ChevronDown className="size-5" /> : <Sparkles className="size-5" />}
        </Button>
      </div>
    </>
  );
}
