export interface RangkumanKas {
  startingCash: number;
  penjualanTunai: number;
  bayarKasbonTunai: number;
  pengeluaranTunai: number;
}

export interface HasilRekonsiliasi {
  seharusnya: number;
  actual: number;
  selisih: number;
  status: "seimbang" | "kurang" | "lebih";
}

/** Kas seharusnya = Modal Awal + Penjualan Tunai + Bayar Kasbon Tunai - Pengeluaran Tunai */
export function kasSeharusnya(r: RangkumanKas): number {
  return (
    r.startingCash + r.penjualanTunai + r.bayarKasbonTunai - r.pengeluaranTunai
  );
}

/** Bandingkan uang fisik laci dengan catatan sistem */
export function rekonsiliasiKas(uangFisik: number, seharusnya: number): HasilRekonsiliasi {
  const selisih = Math.round(uangFisik) - Math.round(seharusnya);
  const status = selisih === 0 ? "seimbang" : selisih > 0 ? "lebih" : "kurang";
  return { seharusnya: Math.round(seharusnya), actual: Math.round(uangFisik), selisih, status };
}
