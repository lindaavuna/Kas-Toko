"use client";

import { useRef, useState, useEffect } from "react";
import { Sparkles, ChevronDown, Send, Trash2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRupiah } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

interface PesanChat {
  dari: "user" | "hermes";
  teks: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function HermesSuperadmin({ data, variant = "floating" }: { data: any, variant?: "floating" | "header" }) {
  const { metrics, stores } = data;
  const sapaanAwal = `Halo Bos Platform! Saya Hermes Superadmin. Ada yang ingin Anda tanyakan seputar performa SaaS KasToko Anda hari ini?`;

  const [buka, setBuka] = useState(false);
  const [input, setInput] = useState("");
  const [sedangKetik, setSedangKetik] = useState(false);
  const [pesan, setPesan] = useState<PesanChat[]>([{ dari: "hermes", teks: sapaanAwal }]);

  const bawahRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bawahRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [pesan, sedangKetik]);

  async function jawabLokal(teksUser: string) {
    const q = teksUser.toLowerCase();
    let teksRespon = 'Maaf, pertanyaan Anda belum saya pahami. Coba tanyakan tentang "omset platform", "total penyewa", atau "toko expired".';

    if (/(omset|pendapatan|uang|revenue)/.test(q)) {
      teksRespon = `Omset platform bulan ini mencapai ${formatRupiah(metrics.monthlyRevenue)}! Terus kembangkan strategi marketing Anda. 🔥`;
    } else if (/(aktif|total toko|penyewa)/.test(q)) {
      teksRespon = `Total penyewa saat ini adalah ${metrics.totalStores} toko. Dari jumlah tersebut, ${metrics.activeStores} toko berlangganan aktif dan ${metrics.onlineStores} toko sedang online melayani pelanggan.`;
    } else if (/(kedaluwarsa|expired|habis)/.test(q)) {
      if (metrics.expiredStores === 0) {
        teksRespon = "Bagus sekali, tidak ada toko yang masa aktifnya habis saat ini.";
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const expired = stores.filter((s: any) => s.subscription_status === 'expired').map((s: any) => s.name);
        teksRespon = `Ada ${metrics.expiredStores} toko yang expired: ${expired.join(', ')}. Coba hubungi mereka via WA untuk promosi perpanjangan!`;
      }
    } else if (/(trial|uji coba)/.test(q)) {
      if (metrics.trialStores === 0) {
        teksRespon = "Saat ini tidak ada toko dalam masa uji coba (trial).";
      } else {
        teksRespon = `Ada ${metrics.trialStores} toko yang sedang masa Trial. Ayo pandu mereka agar segera upgrade ke paket berbayar!`;
      }
    }

    setSedangKetik(true);
    setTimeout(() => {
      setSedangKetik(false);
      setPesan((p) => [...p, { dari: "hermes", teks: teksRespon }]);
    }, 600);
  }

  function kirim(teks?: string) {
    const isi = (teks ?? input).trim();
    if (!isi) return;
    setInput("");
    setPesan((p) => [...p, { dari: "user", teks: isi }]);
    jawabLokal(isi);
  }

  const saran = [
    "Berapa omset platform bulan ini?",
    "Berapa penyewa yang sedang aktif?",
    "Siapa saja yang tokonya kedaluwarsa?",
  ];

  const headerDialog = (
    <SheetHeader className="shrink-0 text-left">
      <div className="flex items-center justify-between pr-7">
        <SheetTitle className="flex items-center gap-2 text-base font-bold">
          <Sparkles className="size-4 text-primary" />
          <span>Hermes Superadmin</span>
        </SheetTitle>
        <div className="flex items-center gap-1.5">
          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setPesan([{ dari: "hermes", teks: sapaanAwal }])}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Badge variant="outline" className="text-[10px] bg-primary/10 border-primary/30 text-primary">
            <Crown className="w-3 h-3 mr-1" />
            God Mode
          </Badge>
        </div>
      </div>
      <SheetDescription className="text-xs">
        Asisten AI khusus Owner Platform (SaaS). Analisa seluruh toko penyewa.
      </SheetDescription>
    </SheetHeader>
  );

  const isiKonten = (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <ScrollArea className="flex-1 min-h-0 pr-2">
        <div className="space-y-3 py-2">
          {pesan.map((m, i) => (
            <div key={i} className={m.dari === "user" ? "flex justify-end" : "flex justify-start"}>
              <div className={`max-w-[88%] whitespace-pre-line rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${m.dari === "user" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border bg-muted"}`}>
                <p>{m.teks}</p>
              </div>
            </div>
          ))}
          {sedangKetik && (
            <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-primary animate-spin" />
              <span>Hermes sedang menganalisa data platform...</span>
            </p>
          )}
          <div ref={bawahRef} />
        </div>
      </ScrollArea>
      <div className="shrink-0 flex flex-wrap gap-1.5 border-t pt-2 mt-1">
        {saran.map((s) => (
          <button key={s} type="button" onClick={() => kirim(s)} className="rounded-full border bg-card px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-primary hover:text-primary">
            {s}
          </button>
        ))}
      </div>
      <form className="shrink-0 flex gap-2 pt-2" onSubmit={(e) => { e.preventDefault(); kirim(); }}>
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); kirim(); } }} rows={1} placeholder="Tanya tentang omset atau tenant..." className="min-h-[40px] max-h-24 resize-none text-xs sm:text-sm py-2" />
        <Button type="submit" size="sm" className="aspect-square h-10 w-10 p-0 shrink-0">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );

  if (variant === "header") {
    return (
      <>
        <Button size="sm" variant="ghost" className="h-9 px-2 text-primary" onClick={() => setBuka(true)} aria-label="Buka asisten AI Hermes Superadmin">
          <Sparkles className="size-4" />
        </Button>
        <Sheet open={buka} onOpenChange={setBuka} modal={false}>
          <SheetContent side="right" showOverlay={false} className="w-full sm:max-w-[400px] flex flex-col p-4 sm:p-5 gap-3 shadow-2xl border-l">
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
        <SheetContent side="right" showOverlay={false} className="w-full sm:max-w-[400px] flex flex-col p-4 sm:p-5 gap-3 shadow-2xl border-l">
          {headerDialog}
          {isiKonten}
        </SheetContent>
      </Sheet>
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3">
        {!buka && (
          <div className="animate-bounce bg-primary text-primary-foreground text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-lg border border-primary/50 pointer-events-none whitespace-nowrap relative">
            Tanya AI Platform! ✨
            <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 border-y-[6px] border-y-transparent border-l-[6px] border-l-primary"></div>
          </div>
        )}
        <Button onClick={() => setBuka(!buka)} className="h-12 w-12 rounded-full shadow-2xl hover:scale-105 transition-transform shrink-0">
          {buka ? <ChevronDown className="size-5" /> : <Sparkles className="size-5" />}
        </Button>
      </div>
    </>
  );
}
