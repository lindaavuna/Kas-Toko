import Dexie, { type Table } from "dexie";
import type { Product, Customer, CartItem, PaymentMethod } from "../types";

export interface TransaksiOffline {
  localId: string;
  storeId: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeAmount: number;
  transferRef?: string;
  receiptNumber: string;
  createdAt: string;
  synced: boolean;
  syncError?: string;
}

export interface LogSinkronisasi {
  id?: number;
  waktu: string;
  totalDiproses: number;
  totalSukses: number;
  totalGagal: number;
  pesan: string;
}

export class KasTokoDexie extends Dexie {
  products!: Table<Product, string>;
  customers!: Table<Customer, string>;
  offline_sales!: Table<TransaksiOffline, string>;
  sync_logs!: Table<LogSinkronisasi, number>;

  constructor() {
    super("KasTokoOfflineDB");
    this.version(1).stores({
      products: "id, sku, barcode, categoryId, name, sellingPrice, stockQty, isActive",
      customers: "id, name, phone",
      offline_sales: "localId, storeId, receiptNumber, cashierId, synced, createdAt",
      sync_logs: "++id, waktu",
    });
  }
}

export const offlineDb = typeof window !== "undefined" ? new KasTokoDexie() : (null as unknown as KasTokoDexie);
