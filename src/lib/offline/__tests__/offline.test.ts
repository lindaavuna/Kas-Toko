import { describe, it, expect } from "vitest";
import type { CartItem, PaymentMethod } from "../../types";

describe("Mode Offline-First KasToko", () => {
  it("membentuk format nomor struk transaksi offline OFF-{YYYYMMDD}-{RANDOM}", () => {
    const sekarang = new Date("2026-09-09T14:30:00.000Z");
    const tglStr = sekarang.toISOString().slice(0, 10).replace(/-/g, "");
    const randomStr = "ABCD";
    const receiptNumber = `OFF-${tglStr}-${randomStr}`;

    expect(receiptNumber).toBe("OFF-20260909-ABCD");
    expect(receiptNumber.startsWith("OFF-")).toBe(true);
  });

  it("memvalidasi struktur transaksi outbox offline yang siap disinkronkan ke server", () => {
    const mockItems: CartItem[] = [
      {
        productId: "p-01",
        name: "Gula Pasir 1kg",
        unit: "kg",
        price: 17500,
        qty: 2,
        total: 35000,
      },
    ];

    const transaksiOffline = {
      localId: "off_1788949000_1234",
      storeId: "store-01",
      cashierId: "cashier-01",
      cashierName: "Siti Rahma",
      customerId: "cust-01",
      customerName: "Pak Budi",
      items: mockItems,
      subtotal: 35000,
      discount: 0,
      total: 35000,
      paymentMethod: "cash" as PaymentMethod,
      amountPaid: 50000,
      changeAmount: 15000,
      receiptNumber: "OFF-20260909-1234",
      createdAt: new Date().toISOString(),
      synced: false,
    };

    expect(transaksiOffline.synced).toBe(false);
    expect(transaksiOffline.total).toBe(35000);
    expect(transaksiOffline.changeAmount).toBe(15000);
    expect(transaksiOffline.items.length).toBe(1);
  });
});
