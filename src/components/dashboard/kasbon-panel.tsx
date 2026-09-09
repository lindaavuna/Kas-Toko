"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BookUser, FileSpreadsheet, FileText, HandCoins, History, UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { DialogTerimaPembayaran } from "@/components/kasbon/terima-pembayaran";
import { useRouter } from "next/navigation";
import { aksiTambahPelanggan } from "@/lib/server/aksi-katalog";
import { formatRupiah, formatTanggal, formatWaktu } from "@/lib/format";
import { unduhCsv, cetakDokumen } from "@/lib/export";
import type { Customer, Receivable } from "@/lib/types";

export function PanelKasbon({
  receivables,
  customers,
}: {
  receivables: Receivable[];
  customers: Customer[];
}) {
  const router = useRouter();

  const [aktif, setAktif] = useState(false);
  const [pilih, setPilih] = useState<Receivable | null>(null);
  const [nama, setNama] = useState("");
  const [telepon, setTelepon] = useState("");

  const daftar = useMemo(
    () => receivables.filter((r) => (aktif ? r.status !== "paid" : true)),
    [receivables, aktif]
  );
  const totalPiutang = receivables
    .filter((r) => r.status !== "paid")
    .reduce((a, r) => a + (r.originalAmount - r.paidAmount), 0);

  async function tambah() {
    if (!nama.trim()) {
      toast.error("Isi nama pelanggan.");
      return;
    }
    const hasil = await aksiTambahPelanggan(nama.trim(), telepon.trim() || undefined);
    toast[hasil.ok ? "success" : "error"](hasil.pesan);
    if (hasil.ok) {
      setNama("");
      setTelepon("");
      router.refresh();
    }
  }

  function eksporKasbon(kind: "xlsx" | "pdf") {
    toast.info(`Menyiapkan unduhan rekap kasbon ${kind.toUpperCase()}…`);
    const tanggalHariIni = new Date().toISOString().slice(0, 10);

    if (kind === "xlsx") {
      const kolom = [
        "Nama Pelanggan",
        "No. Telepon",
        "No. Struk",
        "Tanggal Kasbon",
        "Kasbon Awal (Rp)",
        "Sudah Bayar (Rp)",
        "Sisa Hutang (Rp)",
        "Status",
      ];
      const baris = daftar.map((r) => {
        const pelanggan = customers.find((c) => c.id === r.customerId);
        const sisa = r.originalAmount - r.paidAmount;
        const statusLabel =
          r.status === "paid" ? "Lunas" : r.status === "partial" ? "Cicilan" : "Belum Bayar";
        return [
          r.customerName,
          pelanggan?.phone || "—",
          r.saleReceipt || "—",
          formatTanggal(r.createdAt),
          r.originalAmount,
          r.paidAmount,
          sisa,
          statusLabel,
        ];
      });

      // Tambahkan baris total
      baris.push(["", "", "", "", "", "", "", ""]);
      baris.push(["TOTAL PIUTANG", "", "", "", "", "", totalPiutang, ""]);

      unduhCsv(`rekap-kasbon-${tanggalHariIni}.csv`, kolom, baris);
    } else {
      cetakDokumen({
        judul: "Rekap Buku Kasbon & Piutang Pelanggan",
        periode: `Per ${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}`,
        ringkasan: [
          { label: "Total Catatan", nilai: `${daftar.length} transaksi` },
          {
            label: "Belum Lunas",
            nilai: `${daftar.filter((r) => r.status !== "paid").length} orang`,
          },
          { label: "Total Sisa Piutang", nilai: formatRupiah(totalPiutang) },
        ],
        kolom: ["Nama Pelanggan", "No. HP", "Struk", "Tanggal", "Awal", "Sudah Bayar", "Sisa", "Status"],
        kolomKanan: [4, 5, 6],
        baris: daftar.map((r) => {
          const pelanggan = customers.find((c) => c.id === r.customerId);
          const sisa = r.originalAmount - r.paidAmount;
          const statusLabel =
            r.status === "paid" ? "Lunas" : r.status === "partial" ? "Cicilan" : "Belum Bayar";
          return [
            r.customerName,
            pelanggan?.phone || "—",
            r.saleReceipt || "—",
            formatTanggal(r.createdAt),
            formatRupiah(r.originalAmount),
            formatRupiah(r.paidAmount),
            formatRupiah(sisa),
            statusLabel,
          ];
        }),
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={aktif ? "default" : "outline"}
              className="h-9"
              onClick={() => setAktif((v) => !v)}
            >
              {aktif ? "Hanya belum lunas ✓" : "Tampilkan semua"}
            </Button>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" className="h-9" onClick={() => eksporKasbon("xlsx")}>
                <FileSpreadsheet className="size-4 text-success" /> Export Excel
              </Button>
              <Button size="sm" variant="outline" className="h-9" onClick={() => eksporKasbon("pdf")}>
                <FileText className="size-4 text-danger" /> Export PDF
              </Button>
            </div>
            <p className="ml-auto text-sm text-muted-foreground">
              Total piutang kasbon:{" "}
              <b className="text-warning font-money">{formatRupiah(totalPiutang)}</b>
            </p>
          </div>

          {daftar.map((r) => {
            const sisa = r.originalAmount - r.paidAmount;
            const pelanggan = customers.find((c) => c.id === r.customerId);
            return (
              <Card key={r.id} size="sm">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle>{r.customerName}</CardTitle>
                      <CardDescription>
                        {r.saleReceipt ? `Belanja ${r.saleReceipt} • ` : ""}
                        {formatTanggal(r.createdAt)} • {pelanggan?.phone ?? "tanpa HP"}
                      </CardDescription>
                    </div>
                    <Badge variant={r.status === "paid" ? "success" : "warning"}>
                      {r.status === "paid" ? "Lunas" : r.status === "partial" ? "Cicilan" : "Belum Bayar"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="min-w-0 rounded-lg bg-muted/60 p-2">
                      <p className="text-[11px] text-muted-foreground">Kasbon Awal</p>
                      <p className="truncate text-sm font-semibold font-money">{formatRupiah(r.originalAmount)}</p>
                    </div>
                    <div className="min-w-0 rounded-lg bg-muted/60 p-2">
                      <p className="text-[11px] text-muted-foreground">Sudah Bayar</p>
                      <p className="truncate text-sm font-semibold text-success font-money">{formatRupiah(r.paidAmount)}</p>
                    </div>
                    <div className="min-w-0 rounded-lg border border-warning/40 bg-warning/10 p-2">
                      <p className="text-[11px] text-muted-foreground">Sisa</p>
                      <p className="truncate text-sm font-bold text-amber-700 font-money">{formatRupiah(sisa)}</p>
                    </div>
                  </div>

                  {r.payments.length > 0 && (
                    <div className="mt-3 rounded-lg border bg-muted/30 p-2 text-xs">
                      <p className="mb-1 flex items-center gap-1 font-semibold">
                        <History className="size-3.5" /> Riwayat pembayaran
                      </p>
                      {r.payments.map((pm) => (
                        <p key={pm.id} className="flex justify-between text-muted-foreground">
                          <span>
                            {formatWaktu(pm.paidAt)} • {pm.acceptedByName}
                          </span>
                          <span className="font-money">{formatRupiah(pm.amount)}</span>
                        </p>
                      ))}
                    </div>
                  )}

                  {sisa > 0 && (
                    <Button variant="success" className="mt-3 w-full h-auto min-h-11 whitespace-normal py-2" onClick={() => setPilih(r)}>
                      <HandCoins className="size-4" />
                      Terima Pembayaran
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {daftar.length === 0 && (
            <Card>
              <CardHeader>
                <CardDescription>
                  {aktif ? "Tidak ada kasbon yang belum lunas. Lari terus!" : "Belum ada catatan kasbon."}
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="size-4" /> Pelanggan Baru
            </CardTitle>
            <CardDescription>Daftarkan pelanggan langganan untuk buku kasbon.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input placeholder="Nama" value={nama} onChange={(e) => setNama(e.target.value)} />
            <Input inputMode="tel" placeholder="No. HP" value={telepon} onChange={(e) => setTelepon(e.target.value)} />
            <Button className="w-full" onClick={tambah}>
              Simpan
            </Button>
            <Separator className="my-2" />
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <BookUser className="size-3.5" /> {customers.length} pelanggan terdaftar
            </p>
          </CardContent>
        </Card>
      </div>

      <DialogTerimaPembayaran receivable={pilih} open={!!pilih} onOpenChange={(o) => !o && setPilih(null)} />
    </div>
  );
}
