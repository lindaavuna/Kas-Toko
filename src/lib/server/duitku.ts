import crypto from "node:crypto";

export interface KonfigurasiDuitku {
  merchantCode: string;
  apiKey: string;
  sandbox: boolean;
  callbackUrl: string;
}

export function ambilKonfigurasiDuitku(): KonfigurasiDuitku {
  return {
    merchantCode: process.env.DUITKU_MERCHANT_CODE || "D12345Mock",
    apiKey: process.env.DUITKU_API_KEY || "mock_duitku_api_key_kastoko",
    sandbox: process.env.DUITKU_SANDBOX !== "false",
    callbackUrl:
      process.env.DUITKU_CALLBACK_URL || "https://kastoko.local/api/payment/duitku/callback",
  };
}

/**
 * Formula MD5 Request Inquiry Duitku:
 * MD5(merchantCode + merchantOrderId + paymentAmount + apiKey)
 */
export function hitungSignatureRequest(
  merchantCode: string,
  merchantOrderId: string,
  amount: number,
  apiKey: string
): string {
  const raw = `${merchantCode}${merchantOrderId}${Math.round(amount)}${apiKey}`;
  return crypto.createHash("md5").update(raw).digest("hex");
}

/**
 * Formula MD5 Callback Notification Duitku:
 * MD5(merchantCode + paymentAmount + merchantOrderId + apiKey)
 */
export function hitungSignatureCallback(
  merchantCode: string,
  merchantOrderId: string,
  amount: number,
  apiKey: string
): string {
  const raw = `${merchantCode}${Math.round(amount)}${merchantOrderId}${apiKey}`;
  return crypto.createHash("md5").update(raw).digest("hex");
}

export function verifikasiSignatureCallback(
  merchantCode: string,
  merchantOrderId: string,
  amount: number,
  apiKey: string,
  signatureDiterima: string
): boolean {
  const signatureDihitung = hitungSignatureCallback(
    merchantCode,
    merchantOrderId,
    amount,
    apiKey
  );
  return signatureDihitung.toLowerCase() === signatureDiterima.toLowerCase();
}

export interface InputBuatQris {
  merchantOrderId: string;
  amount: number;
  productDetails: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface HasilBuatQris {
  sukses: boolean;
  merchantOrderId: string;
  reference?: string;
  qrString?: string;
  paymentUrl?: string;
  pesan?: string;
}

/**
 * Membuat transaksi QRIS Duitku (ShopeePay/Nobu QRIS) atau mode simulasi jika belum ada API key resmi
 */
export async function buatTransaksiQris(
  input: InputBuatQris,
  config: KonfigurasiDuitku = ambilKonfigurasiDuitku()
): Promise<HasilBuatQris> {
  const amountInt = Math.round(input.amount);
  const signature = hitungSignatureRequest(
    config.merchantCode,
    input.merchantOrderId,
    amountInt,
    config.apiKey
  );

  // Jika kunci masih bernilai mock atau dalam pengujian lokal tanpa internet
  if (config.apiKey.startsWith("mock_") || !process.env.DUITKU_API_KEY) {
    const mockQr = `00020101021226670016ID.CO.DUITKU.WWW01189360099900000100010215${input.merchantOrderId}520454115303360540${amountInt}5802ID5913KASTOKO POS6007JAKARTA6304`;
    return {
      sukses: true,
      merchantOrderId: input.merchantOrderId,
      reference: `MOCK-REF-${Date.now()}`,
      qrString: mockQr,
      paymentUrl: `https://sandbox.duitku.com/mock-pay/${input.merchantOrderId}`,
      pesan: "Transaksi simulasi QRIS Duitku berhasil dibuat.",
    };
  }

  const endpoint = config.sandbox
    ? "https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry"
    : "https://passport.duitku.com/webapi/api/merchant/v2/inquiry";

  const payload = {
    merchantCode: config.merchantCode,
    paymentAmount: amountInt,
    paymentMethod: "SP", // ShopeePay / QRIS Duitku
    merchantOrderId: input.merchantOrderId,
    productDetails: input.productDetails,
    email: input.customerEmail || "kasir@kastoko.local",
    phoneNumber: input.customerPhone || "081234567890",
    callbackUrl: config.callbackUrl,
    returnUrl: config.callbackUrl,
    signature,
    expiryPeriod: 15, // 15 menit kedaluwarsa
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        sukses: false,
        merchantOrderId: input.merchantOrderId,
        pesan: `Gagal membuat QRIS Duitku (${res.status}): ${errText}`,
      };
    }

    const data = (await res.json()) as {
      statusCode: string;
      statusMessage: string;
      reference: string;
      qrString?: string;
      paymentUrl?: string;
    };

    if (data.statusCode === "00") {
      return {
        sukses: true,
        merchantOrderId: input.merchantOrderId,
        reference: data.reference,
        qrString: data.qrString,
        paymentUrl: data.paymentUrl,
      };
    }

    return {
      sukses: false,
      merchantOrderId: input.merchantOrderId,
      pesan: data.statusMessage || "Penolakan dari sistem Duitku",
    };
  } catch (err: unknown) {
    const pesan = err instanceof Error ? err.message : String(err);
    return {
      sukses: false,
      merchantOrderId: input.merchantOrderId,
      pesan: `Gagal koneksi ke gateway Duitku: ${pesan}`,
    };
  }
}
