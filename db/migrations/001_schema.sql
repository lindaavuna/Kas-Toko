-- ============================================================
-- KasToko — skema inti (adaptasi Bab 10 PRD untuk PostgreSQL 16 lokal).
-- users menggantikan auth.users Supabase; struktur kolom lain mengikuti.
-- ============================================================
create extension if not exists "pgcrypto";

create table public.users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  receipt_footer text default 'Terima kasih atas kunjungan Anda!',
  currency text not null default 'IDR',
  subscription_status text not null default 'active' check (subscription_status in ('trial', 'active', 'expired')),
  subscription_expires_at timestamptz,
  ai_enabled boolean not null default true,
  custom_ai_api_key text,
  custom_ai_base_url text,
  created_at timestamptz not null default now()
);

create table public.store_members (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('owner', 'cashier')),
  cashier_pin text, -- hash PIN (kasir login + otorisasi void utk owner)
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  unique(store_id, user_id)
);

-- Sesi login aplikasi (token_hash = sha256 dari token cookie)
create table public.app_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.cashier_shifts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  cashier_id uuid not null references public.users(id),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  starting_cash numeric(12,2) not null default 0,
  expected_cash numeric(12,2),
  actual_cash numeric(12,2),
  cash_difference numeric(12,2),
  notes text,
  status text not null default 'open' check (status in ('open', 'closed'))
);
create index idx_cashier_shifts_store on public.cashier_shifts(store_id, opened_at desc);
-- satu shift terbuka per kasir — kunci anti buka-lagi-yang-sudah-buka
create unique index uq_shift_open_per_cashier on public.cashier_shifts(cashier_id) where status = 'open';

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique(store_id, name)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  phone text,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  phone text,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  sku text not null,
  barcode text,
  unit text not null default 'pcs',
  purchase_price numeric(12,2) not null default 0,
  selling_price numeric(12,2) not null default 0,
  stock_qty numeric(12,2) not null default 0,
  min_stock numeric(12,2) not null default 5,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, sku),
  unique(store_id, barcode)
);
create index idx_products_store_barcode on public.products(store_id, barcode);

create table public.product_units (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  unit_name text not null,
  conversion_factor numeric(10,2) not null,
  selling_price numeric(12,2) not null,
  barcode text,
  is_base_unit boolean not null default false
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  shift_id uuid references public.cashier_shifts(id) on delete set null,
  receipt_number text not null,
  cashier_id uuid not null references public.users(id),
  customer_id uuid references public.customers(id) on delete set null,
  status text not null default 'paid'
    check (status in ('awaiting_payment', 'paid', 'credit', 'void')),
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  discount_type text default 'fixed' check (discount_type in ('fixed', 'percentage')),
  total numeric(12,2) not null default 0,
  payment_method text not null
    check (payment_method in ('cash', 'qris_duitku', 'qris_manual', 'bank_transfer', 'credit')),
  amount_paid numeric(12,2) not null default 0,
  change_amount numeric(12,2) not null default 0,
  transfer_ref text,
  paid_at timestamptz,
  void_reason text,
  voided_by uuid references public.users(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, receipt_number)
);
create index idx_sales_store_created on public.sales(store_id, created_at desc);
create index idx_sales_receipt on public.sales(receipt_number);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_unit_id uuid references public.product_units(id),
  quantity numeric(12,2) not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  total numeric(12,2) not null
);
create index idx_sale_items_sale on public.sale_items(sale_id);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id),
  invoice_number text not null,
  status text not null default 'paid' check (status in ('paid', 'credit', 'void')),
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  paid_at timestamptz,
  notes text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  unique(store_id, invoice_number)
);

create table public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity numeric(12,2) not null check (quantity > 0),
  unit_cost numeric(12,2) not null,
  total numeric(12,2) not null
);

-- Mutasi adalah log: tidak boleh diubah/dihapus setelah tercatat
create table public.stock_mutations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id),
  mutation_type text not null check (mutation_type in ('in', 'out')),
  reason text not null
    check (reason in ('sale', 'sale_void', 'purchase', 'purchase_void', 'adjustment', 'damage', 'return_in', 'return_out')),
  quantity numeric(12,2) not null check (quantity > 0),
  sale_id uuid references public.sales(id) on delete set null,
  purchase_id uuid references public.purchases(id) on delete set null,
  note text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);
create index idx_stock_mutations_product on public.stock_mutations(product_id, created_at desc);

create table public.receivables (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  sale_id uuid not null unique references public.sales(id) on delete cascade,
  customer_id uuid not null references public.customers(id),
  original_amount numeric(12,2) not null,
  paid_amount numeric(12,2) not null default 0,
  due_date date,
  status text not null default 'unpaid' check (status in ('unpaid', 'partial', 'paid')),
  notes text,
  created_at timestamptz not null default now()
);

create table public.receivable_payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  receivable_id uuid not null references public.receivables(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null default 'cash',
  note text,
  accepted_by uuid references public.users(id),
  paid_at timestamptz not null default now()
);

create table public.payables (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  purchase_id uuid not null unique references public.purchases(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id),
  original_amount numeric(12,2) not null,
  paid_amount numeric(12,2) not null default 0,
  due_date date,
  status text not null default 'unpaid' check (status in ('unpaid', 'partial', 'paid')),
  notes text,
  created_at timestamptz not null default now()
);

create table public.payable_payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  payable_id uuid not null references public.payables(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null default 'cash',
  note text,
  accepted_by uuid references public.users(id),
  paid_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  title text not null,
  category text not null default 'Operasional',
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null default 'cash',
  note text,
  paid_at timestamptz not null default now(),
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table public.cash_flows (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  flow_type text not null check (flow_type in ('in', 'out')),
  amount numeric(12,2) not null,
  category text not null
    check (category in ('sale_payment', 'receivable_payment', 'purchase_payment', 'payable_payment', 'expense', 'other_income')),
  method text not null check (method in ('cash', 'qris_duitku', 'qris_manual', 'bank_transfer')),
  reference_type text,
  reference_id uuid,
  created_at timestamptz not null default now()
);
create index idx_cash_flows_store_created on public.cash_flows(store_id, created_at desc);

create table public.duitku_payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  merchant_order_id text not null unique,
  amount numeric(12,2) not null,
  status text not null default 'pending'
    check (status in ('pending', 'success', 'cancelled', 'expired')),
  payment_method text,
  payment_code text,
  payment_url text,
  qr_content text,
  expiry_time timestamptz,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('stock_low', 'sale_paid', 'sync_error')),
  title text not null,
  message text not null,
  data jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notifications_user_read on public.notifications(user_id, is_read, created_at desc);

-- updated_at otomatis
create function public.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger trg_users_updated before update on public.users
  for each row execute function public.set_updated_at();
create trigger trg_products_updated before update on public.products
  for each row execute function public.set_updated_at();
create trigger trg_sales_updated before update on public.sales
  for each row execute function public.set_updated_at();
create trigger trg_duitku_updated before update on public.duitku_payments
  for each row execute function public.set_updated_at();
