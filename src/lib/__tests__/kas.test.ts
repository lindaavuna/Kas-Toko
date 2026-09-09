import { describe, expect, it } from "vitest";
import { kasSeharusnya, rekonsiliasiKas } from "../kas";

describe("Rekonsiliasi uang laci kasir (Tutup Kasir)", () => {
  it("kas seharusnya = modal + tunai masuk - pengeluaran", () => {
    expect(
      kasSeharusnya({
        startingCash: 150000,
        penjualanTunai: 320000,
        bayarKasbonTunai: 50000,
        pengeluaranTunai: 50000,
      })
    ).toBe(470000);
  });

  it("uang cocok -> status seimbang", () => {
    const hasil = rekonsiliasiKas(470000, 470000);
    expect(hasil.status).toBe("seimbang");
    expect(hasil.selisih).toBe(0);
  });

  it("uang fisik kurang -> status kurang dengan nominal selisih", () => {
    const hasil = rekonsiliasiKas(455000, 470000);
    expect(hasil.status).toBe("kurang");
    expect(hasil.selisih).toBe(-15000);
  });

  it("uang fisik lebih -> status lebih", () => {
    const hasil = rekonsiliasiKas(500000, 470000);
    expect(hasil.status).toBe("lebih");
    expect(hasil.selisih).toBe(30000);
  });
});
