import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import {
  hitungSignatureRequest,
  hitungSignatureCallback,
  verifikasiSignatureCallback,
  buatTransaksiQris,
} from "../duitku";

describe("Integrasi Payment Gateway Duitku QRIS", () => {
  const merchantCode = "D9876";
  const apiKey = "kunci_rahasia_merchant_kasir";
  const orderId = "KT-ORDER-001";
  const amount = 25000;

  it("menghitung signature request MD5 sesuai spesifikasi Duitku", () => {
    const rawExpected = `${merchantCode}${orderId}${amount}${apiKey}`;
    const hashExpected = crypto.createHash("md5").update(rawExpected).digest("hex");

    const signature = hitungSignatureRequest(merchantCode, orderId, amount, apiKey);
    expect(signature).toBe(hashExpected);
  });

  it("menghitung dan memverifikasi signature callback webhook Duitku", () => {
    const rawExpected = `${merchantCode}${amount}${orderId}${apiKey}`;
    const hashExpected = crypto.createHash("md5").update(rawExpected).digest("hex");

    const signature = hitungSignatureCallback(merchantCode, orderId, amount, apiKey);
    expect(signature).toBe(hashExpected);

    // Verifikasi valid
    const valid = verifikasiSignatureCallback(
      merchantCode,
      orderId,
      amount,
      apiKey,
      hashExpected
    );
    expect(valid).toBe(true);

    // Verifikasi tidak valid jika nominal diubah (manipulasi tampering)
    const invalid = verifikasiSignatureCallback(
      merchantCode,
      orderId,
      amount + 1000,
      apiKey,
      hashExpected
    );
    expect(invalid).toBe(false);
  });

  it("buatTransaksiQris membuat objek transaksi QRIS berformat valid", async () => {
    const hasil = await buatTransaksiQris({
      merchantOrderId: "KT-TEST-999",
      amount: 50000,
      productDetails: "Belanja Sembako",
    });

    expect(hasil.sukses).toBe(true);
    expect(hasil.merchantOrderId).toBe("KT-TEST-999");
    expect(hasil.qrString).toBeDefined();
    expect(hasil.qrString?.startsWith("000201")).toBe(true);
  });
});
