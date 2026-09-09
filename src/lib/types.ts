export type Role = "owner" | "cashier";
export type PaymentMethod =
  | "cash"
  | "qris_duitku"
  | "qris_manual"
  | "bank_transfer"
  | "credit";
export type SaleStatus = "awaiting_payment" | "paid" | "credit" | "void";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  storeId: string;
  storeName: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface ProductUnit {
  unitName: string;
  conversionFactor: number;
  sellingPrice: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  unit: string;
  categoryId?: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQty: number;
  minStock: number;
  emoji: string;
  fotoUrl?: string;
  units?: ProductUnit[];
  isActive: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  address?: string;
}

export interface CartLine {
  productId: string;
  name: string;
  unit: string;
  price: number;
  qty: number;
  emoji: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  unit: string;
  qty: number;
  price: number;
  total: number;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeAmount: number;
  status: SaleStatus;
  transferRef?: string;
  voidReason?: string;
  createdAt: string;
}

export interface Shift {
  id: string;
  cashierId: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  startingCash: number;
  actualCash?: number;
  expectedCash?: number;
  difference?: number;
  status: "open" | "closed";
}

export type MutationType = "in" | "out";
export type MutationReason =
  | "sale"
  | "sale_void"
  | "purchase"
  | "damage"
  | "adjustment";
export interface StockMutation {
  id: string;
  productId: string;
  productName: string;
  type: MutationType;
  reason: MutationReason;
  qty: number;
  note?: string;
  refNumber?: string;
  byName: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  byName: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  items: { productName: string; qty: number; unitCost: number; total: number }[];
  total: number;
  status: "paid" | "credit";
  createdAt: string;
  createdByName: string;
}

export interface ReceivablePayment {
  id: string;
  amount: number;
  note?: string;
  acceptedByName: string;
  paidAt: string;
}

export interface Receivable {
  id: string;
  customerId: string;
  customerName: string;
  saleReceipt?: string;
  originalAmount: number;
  paidAmount: number;
  status: "unpaid" | "partial" | "paid";
  payments: ReceivablePayment[];
  createdAt: string;
}

export interface Payable {
  id: string;
  supplierId: string;
  supplierName: string;
  purchaseInvoice: string;
  originalAmount: number;
  paidAmount: number;
  status: "unpaid" | "partial" | "paid";
  payments: { id: string; amount: number; paidAt: string }[];
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: "stock_low" | "sale_paid" | "sync_error";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface CashierAccount {
  id: string;
  name: string;
  email: string;
  pin: string;
  isActive: boolean;
}

/** Petugas login utk komponen client (serializable) */
export interface Petugas {
  id: string;
  nama: string;
  peran: Role;
  storeId: string;
  storeName: string;
}

/** Info toko utk struk & dialog */
export interface InfoToko {
  nama: string;
  alamat: string;
  telepon: string;
  kakiStruk: string;
}
