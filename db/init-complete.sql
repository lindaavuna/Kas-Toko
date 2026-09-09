-- ============================================================
-- KasToko POS & Backoffice UMKM — Complete Initialization SQL
-- Skema DDL Lengkap, Index, RLS, & Data Seed Demo Turnkey
-- Dihasilkan untuk inisialisasi otomatis kontainer PostgreSQL
-- ============================================================

-- 1. Inisialisasi Peran Database
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'kastoko') THEN
    CREATE ROLE kastoko LOGIN SUPERUSER PASSWORD 'rahasia_kastoko_123';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'kastoko_app') THEN
    CREATE ROLE kastoko_app LOGIN PASSWORD 'rahasia_kastoko_123';
  END IF;
END $$;

ALTER ROLE kastoko_app SET timezone TO 'Asia/Jakarta';

--
-- PostgreSQL database dump
--


-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: kas_can_read_user(uuid); Type: FUNCTION; Schema: public; Owner: kastoko
--

CREATE FUNCTION public.kas_can_read_user(p_target uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  return p_target = public.kas_user_id() or exists (
    select 1 from store_members m1
    join store_members m2 on m1.store_id = m2.store_id
    where m1.user_id = public.kas_user_id() and m2.user_id = p_target
  );
end;
$$;


ALTER FUNCTION public.kas_can_read_user(p_target uuid) OWNER TO kastoko;

--
-- Name: kas_create_session(uuid, text, integer); Type: FUNCTION; Schema: public; Owner: kastoko
--

CREATE FUNCTION public.kas_create_session(p_user uuid, p_token_hash text, p_ttl_minutes integer) RETURNS uuid
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  insert into app_sessions (user_id, token_hash, expires_at)
  values (p_user, p_token_hash, now() + make_interval(mins => p_ttl_minutes))
  returning id
$$;


ALTER FUNCTION public.kas_create_session(p_user uuid, p_token_hash text, p_ttl_minutes integer) OWNER TO kastoko;

--
-- Name: kas_daftar_kasir(uuid); Type: FUNCTION; Schema: public; Owner: kastoko
--

CREATE FUNCTION public.kas_daftar_kasir(p_store uuid) RETURNS TABLE(id uuid, nama text, email text, aktif boolean)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select m.user_id, u.full_name, u.email, m.status = 'active'
  from store_members m
  join users u on u.id = m.user_id
  where m.store_id = p_store and m.role = 'cashier'
    and public.kas_store_role(p_store) = 'owner'
  order by u.full_name
$$;


ALTER FUNCTION public.kas_daftar_kasir(p_store uuid) OWNER TO kastoko;

--
-- Name: kas_destroy_session(text); Type: FUNCTION; Schema: public; Owner: kastoko
--

CREATE FUNCTION public.kas_destroy_session(p_token_hash text) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  delete from app_sessions where token_hash = p_token_hash
$$;


ALTER FUNCTION public.kas_destroy_session(p_token_hash text) OWNER TO kastoko;

--
-- Name: kas_find_user_by_email(text); Type: FUNCTION; Schema: public; Owner: kastoko
--

CREATE FUNCTION public.kas_find_user_by_email(p_email text) RETURNS TABLE(id uuid, password_hash text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select u.id, u.password_hash from users u where lower(u.email) = lower(p_email) limit 1
$$;


ALTER FUNCTION public.kas_find_user_by_email(p_email text) OWNER TO kastoko;

--
-- Name: kas_is_member(uuid); Type: FUNCTION; Schema: public; Owner: kastoko
--

CREATE FUNCTION public.kas_is_member(p_store uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  select public.kas_store_role(p_store) is not null
$$;


ALTER FUNCTION public.kas_is_member(p_store uuid) OWNER TO kastoko;

--
-- Name: kas_is_owner(uuid); Type: FUNCTION; Schema: public; Owner: kastoko
--

CREATE FUNCTION public.kas_is_owner(p_store uuid) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  select public.kas_store_role(p_store) = 'owner'
$$;


ALTER FUNCTION public.kas_is_owner(p_store uuid) OWNER TO kastoko;

--
-- Name: kas_nomor_struk(uuid, date); Type: FUNCTION; Schema: public; Owner: kastoko
--

CREATE FUNCTION public.kas_nomor_struk(p_store uuid, p_tanggal date) RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select 'STR-' || to_char(p_tanggal, 'YYYYMMDD') || '-' ||
         lpad((count(*) + 1)::text, 2, '0')
  from sales
  where store_id = p_store
    and created_at::date = p_tanggal
$$;


ALTER FUNCTION public.kas_nomor_struk(p_store uuid, p_tanggal date) OWNER TO kastoko;

--
-- Name: kas_notif_toko(uuid, text, text, text, jsonb); Type: FUNCTION; Schema: public; Owner: kastoko
--

CREATE FUNCTION public.kas_notif_toko(p_store uuid, p_type text, p_title text, p_message text, p_data jsonb DEFAULT '{}'::jsonb) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  insert into notifications (store_id, user_id, type, title, message, data)
  select m.store_id, m.user_id, p_type, p_title, p_message, p_data
  from store_members m
  where m.store_id = p_store and m.status = 'active'
    and p_type in ('stock_low','sale_paid','sync_error')
$$;


ALTER FUNCTION public.kas_notif_toko(p_store uuid, p_type text, p_title text, p_message text, p_data jsonb) OWNER TO kastoko;

--
-- Name: kas_read_session(text); Type: FUNCTION; Schema: public; Owner: kastoko
--

CREATE FUNCTION public.kas_read_session(p_token_hash text) RETURNS TABLE(user_id uuid, session_id uuid)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select s.user_id, s.id from app_sessions s
  where s.token_hash = p_token_hash and s.expires_at > now()
$$;


ALTER FUNCTION public.kas_read_session(p_token_hash text) OWNER TO kastoko;

--
-- Name: kas_register_store(text, text, text, text, text, text, text, integer); Type: FUNCTION; Schema: public; Owner: kastoko
--

CREATE FUNCTION public.kas_register_store(p_full_name text, p_email text, p_password_hash text, p_pin_hash text, p_store_name text, p_address text, p_phone text, p_trial_days integer DEFAULT 7) RETURNS TABLE(user_id uuid, store_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_user uuid;
  v_store uuid;
begin
  if exists (select 1 from users where lower(email) = lower(p_email)) then
    raise exception 'EMAIL_PAKAI' using message = 'Email sudah dipakai toko lain.';
  end if;
  insert into users (full_name, email, password_hash)
    values (p_full_name, lower(p_email), p_password_hash) returning id into v_user;
  insert into stores (name, address, phone, subscription_status, subscription_expires_at)
    values (p_store_name, p_address, p_phone, 'trial',
            case when p_trial_days > 0 then now() + make_interval(days => p_trial_days) end)
    returning id into v_store;
  insert into store_members (store_id, user_id, role, cashier_pin)
    values (v_store, v_user, 'owner', p_pin_hash);
  return query select v_user, v_store;
end $$;


ALTER FUNCTION public.kas_register_store(p_full_name text, p_email text, p_password_hash text, p_pin_hash text, p_store_name text, p_address text, p_phone text, p_trial_days integer) OWNER TO kastoko;

--
-- Name: kas_store_role(uuid); Type: FUNCTION; Schema: public; Owner: kastoko
--

CREATE FUNCTION public.kas_store_role(p_store uuid) RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select role from store_members
  where store_id = p_store and user_id = public.kas_user_id() and status = 'active'
  limit 1
$$;


ALTER FUNCTION public.kas_store_role(p_store uuid) OWNER TO kastoko;

--
-- Name: kas_tambah_kasir(uuid, text, text, text, text); Type: FUNCTION; Schema: public; Owner: kastoko
--

CREATE FUNCTION public.kas_tambah_kasir(p_store uuid, p_nama text, p_email text, p_pin_hash text, p_password_hash text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare v_user uuid;
begin
  if public.kas_store_role(p_store) <> 'owner' then
    raise exception 'BUKAN_PEMILIK';
  end if;
  if exists (select 1 from users where lower(email) = lower(p_email)) then
    raise exception 'EMAIL_PAKAI';
  end if;
  insert into users (full_name, email, password_hash)
    values (p_nama, lower(p_email), p_password_hash) returning id into v_user;
  insert into store_members (store_id, user_id, role, cashier_pin)
    values (p_store, v_user, 'cashier', p_pin_hash);
  return v_user;
end $$;


ALTER FUNCTION public.kas_tambah_kasir(p_store uuid, p_nama text, p_email text, p_pin_hash text, p_password_hash text) OWNER TO kastoko;

--
-- Name: kas_ubah_stok(uuid, numeric); Type: FUNCTION; Schema: public; Owner: kastoko
--

CREATE FUNCTION public.kas_ubah_stok(p_product uuid, p_delta numeric) RETURNS numeric
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare v numeric;
begin
  update products
     set stock_qty = stock_qty + p_delta
   where id = p_product
     and (p_delta >= 0 or stock_qty + p_delta >= 0)
  returning stock_qty into v;
  if v is null then
    raise exception 'STOK_KURANG';
  end if;
  return v;
end $$;


ALTER FUNCTION public.kas_ubah_stok(p_product uuid, p_delta numeric) OWNER TO kastoko;

--
-- Name: kas_user_context(uuid); Type: FUNCTION; Schema: public; Owner: kastoko
--

CREATE FUNCTION public.kas_user_context(p_user uuid) RETURNS TABLE(user_id uuid, full_name text, email text, store_id uuid, store_name text, role text, ai_enabled boolean, subscription_status text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select u.id, u.full_name, u.email, s.id, s.name, m.role, s.ai_enabled, s.subscription_status
  from users u
  join store_members m on m.user_id = u.id and m.status = 'active'
  join stores s on s.id = m.store_id
  where u.id = p_user
  order by (m.role = 'owner') desc
  limit 1
$$;


ALTER FUNCTION public.kas_user_context(p_user uuid) OWNER TO kastoko;

--
-- Name: kas_user_id(); Type: FUNCTION; Schema: public; Owner: kastoko
--

CREATE FUNCTION public.kas_user_id() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select nullif(current_setting('app.user_id', true), '')::uuid
$$;


ALTER FUNCTION public.kas_user_id() OWNER TO kastoko;

--
-- Name: kas_user_pin_hash(uuid); Type: FUNCTION; Schema: public; Owner: kastoko
--

CREATE FUNCTION public.kas_user_pin_hash(p_user uuid) RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select m.cashier_pin from store_members m
  where m.user_id = p_user and m.status = 'active'
  order by (m.role = 'owner') asc -- pemilik: pin void; kasir: pin login
  limit 1
$$;


ALTER FUNCTION public.kas_user_pin_hash(p_user uuid) OWNER TO kastoko;

--
-- Name: kas_void_sale(uuid, text); Type: FUNCTION; Schema: public; Owner: kastoko
--

CREATE FUNCTION public.kas_void_sale(p_sale uuid, p_alasan text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  s record;
  it record;
begin
  select * into s from sales where id = p_sale;
  if s.id is null then
    raise exception 'TRANSAKSI_TIDAK_ADA';
  end if;
  if public.kas_store_role(s.store_id) <> 'owner' then
    raise exception 'BUKAN_PEMILIK';
  end if;
  if s.status = 'void' then
    raise exception 'SUDAH_VOID';
  end if;

  for it in select * from sale_items where sale_id = p_sale loop
    update products set stock_qty = stock_qty + it.quantity where id = it.product_id;
    insert into stock_mutations (store_id, product_id, mutation_type, reason, quantity, sale_id, note, created_by)
    values (s.store_id, it.product_id, 'in', 'sale_void', it.quantity, p_sale,
            'Batal (void): ' || coalesce(p_alasan, ''), public.kas_user_id());
  end loop;

  update sales
     set status = 'void', void_reason = coalesce(nullif(p_alasan,''), 'Tanpa keterangan'),
         voided_by = public.kas_user_id()
   where id = p_sale;

  -- pembalikan kas: pakai metode bayar awal supaya rumus laci tetap benar
  if s.status in ('paid','awaiting_payment') and s.total > 0 then
    insert into cash_flows (store_id, flow_type, amount, category, method, reference_type, reference_id)
    values (s.store_id, 'out', s.total, 'sale_payment', s.payment_method, 'sale', p_sale);
  end if;

  delete from receivables where sale_id = p_sale;

  perform public.kas_notif_toko(s.store_id, 'sale_paid', 'Transaksi Dibatalkan',
    s.receipt_number || ' dibatalkan: ' || coalesce(p_alasan, '-'));
  return s.receipt_number;
end $$;


ALTER FUNCTION public.kas_void_sale(p_sale uuid, p_alasan text) OWNER TO kastoko;

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: kastoko
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at := now();
  return new;
end $$;


ALTER FUNCTION public.set_updated_at() OWNER TO kastoko;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_sessions; Type: TABLE; Schema: public; Owner: kastoko
--

CREATE TABLE public.app_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.app_sessions OWNER TO kastoko;

--
-- Name: cash_flows; Type: TABLE; Schema: public; Owner: kastoko
--

CREATE TABLE public.cash_flows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    flow_type text NOT NULL,
    amount numeric(12,2) NOT NULL,
    category text NOT NULL,
    method text NOT NULL,
    reference_type text,
    reference_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cash_flows_category_check CHECK ((category = ANY (ARRAY['sale_payment'::text, 'receivable_payment'::text, 'purchase_payment'::text, 'payable_payment'::text, 'expense'::text, 'other_income'::text]))),
    CONSTRAINT cash_flows_flow_type_check CHECK ((flow_type = ANY (ARRAY['in'::text, 'out'::text]))),
    CONSTRAINT cash_flows_method_check CHECK ((method = ANY (ARRAY['cash'::text, 'qris_duitku'::text, 'qris_manual'::text, 'bank_transfer'::text])))
);


ALTER TABLE public.cash_flows OWNER TO kastoko;

--
-- Name: cashier_shifts; Type: TABLE; Schema: public; Owner: kastoko
--

CREATE TABLE public.cashier_shifts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    cashier_id uuid NOT NULL,
    opened_at timestamp with time zone DEFAULT now() NOT NULL,
    closed_at timestamp with time zone,
    starting_cash numeric(12,2) DEFAULT 0 NOT NULL,
    expected_cash numeric(12,2),
    actual_cash numeric(12,2),
    cash_difference numeric(12,2),
    notes text,
    status text DEFAULT 'open'::text NOT NULL,
    CONSTRAINT cashier_shifts_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text])))
);


ALTER TABLE public.cashier_shifts OWNER TO kastoko;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: kastoko
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.categories OWNER TO kastoko;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: kastoko
--

CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    name text NOT NULL,
    phone text,
    address text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.customers OWNER TO kastoko;

--
-- Name: duitku_payments; Type: TABLE; Schema: public; Owner: kastoko
--

CREATE TABLE public.duitku_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    sale_id uuid NOT NULL,
    merchant_order_id text NOT NULL,
    amount numeric(12,2) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    payment_method text,
    payment_code text,
    payment_url text,
    qr_content text,
    expiry_time timestamp with time zone,
    raw_response jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT duitku_payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'success'::text, 'cancelled'::text, 'expired'::text])))
);


ALTER TABLE public.duitku_payments OWNER TO kastoko;

--
-- Name: expenses; Type: TABLE; Schema: public; Owner: kastoko
--

CREATE TABLE public.expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    title text NOT NULL,
    category text DEFAULT 'Operasional'::text NOT NULL,
    amount numeric(12,2) NOT NULL,
    payment_method text DEFAULT 'cash'::text NOT NULL,
    note text,
    paid_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT expenses_amount_check CHECK ((amount > (0)::numeric))
);


ALTER TABLE public.expenses OWNER TO kastoko;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: kastoko
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data jsonb,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notifications_type_check CHECK ((type = ANY (ARRAY['stock_low'::text, 'sale_paid'::text, 'sync_error'::text])))
);


ALTER TABLE public.notifications OWNER TO kastoko;

--
-- Name: payable_payments; Type: TABLE; Schema: public; Owner: kastoko
--

CREATE TABLE public.payable_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    payable_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    payment_method text DEFAULT 'cash'::text NOT NULL,
    note text,
    accepted_by uuid,
    paid_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payable_payments_amount_check CHECK ((amount > (0)::numeric))
);


ALTER TABLE public.payable_payments OWNER TO kastoko;

--
-- Name: payables; Type: TABLE; Schema: public; Owner: kastoko
--

CREATE TABLE public.payables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    purchase_id uuid NOT NULL,
    supplier_id uuid NOT NULL,
    original_amount numeric(12,2) NOT NULL,
    paid_amount numeric(12,2) DEFAULT 0 NOT NULL,
    due_date date,
    status text DEFAULT 'unpaid'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payables_status_check CHECK ((status = ANY (ARRAY['unpaid'::text, 'partial'::text, 'paid'::text])))
);


ALTER TABLE public.payables OWNER TO kastoko;

--
-- Name: product_units; Type: TABLE; Schema: public; Owner: kastoko
--

CREATE TABLE public.product_units (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    unit_name text NOT NULL,
    conversion_factor numeric(10,2) NOT NULL,
    selling_price numeric(12,2) NOT NULL,
    barcode text,
    is_base_unit boolean DEFAULT false NOT NULL
);


ALTER TABLE public.product_units OWNER TO kastoko;

--
-- Name: products; Type: TABLE; Schema: public; Owner: kastoko
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    category_id uuid,
    name text NOT NULL,
    sku text NOT NULL,
    barcode text,
    unit text DEFAULT 'pcs'::text NOT NULL,
    purchase_price numeric(12,2) DEFAULT 0 NOT NULL,
    selling_price numeric(12,2) DEFAULT 0 NOT NULL,
    stock_qty numeric(12,2) DEFAULT 0 NOT NULL,
    min_stock numeric(12,2) DEFAULT 5 NOT NULL,
    image_url text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.products OWNER TO kastoko;

--
-- Name: purchase_items; Type: TABLE; Schema: public; Owner: kastoko
--

CREATE TABLE public.purchase_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    purchase_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity numeric(12,2) NOT NULL,
    unit_cost numeric(12,2) NOT NULL,
    total numeric(12,2) NOT NULL,
    CONSTRAINT purchase_items_quantity_check CHECK ((quantity > (0)::numeric))
);


ALTER TABLE public.purchase_items OWNER TO kastoko;

--
-- Name: purchases; Type: TABLE; Schema: public; Owner: kastoko
--

CREATE TABLE public.purchases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    supplier_id uuid NOT NULL,
    invoice_number text NOT NULL,
    status text DEFAULT 'paid'::text NOT NULL,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    discount numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    paid_at timestamp with time zone,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT purchases_status_check CHECK ((status = ANY (ARRAY['paid'::text, 'credit'::text, 'void'::text])))
);


ALTER TABLE public.purchases OWNER TO kastoko;

--
-- Name: receivable_payments; Type: TABLE; Schema: public; Owner: kastoko
--

CREATE TABLE public.receivable_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    receivable_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    payment_method text DEFAULT 'cash'::text NOT NULL,
    note text,
    accepted_by uuid,
    paid_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT receivable_payments_amount_check CHECK ((amount > (0)::numeric))
);


ALTER TABLE public.receivable_payments OWNER TO kastoko;

--
-- Name: receivables; Type: TABLE; Schema: public; Owner: kastoko
--

CREATE TABLE public.receivables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    sale_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    original_amount numeric(12,2) NOT NULL,
    paid_amount numeric(12,2) DEFAULT 0 NOT NULL,
    due_date date,
    status text DEFAULT 'unpaid'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT receivables_status_check CHECK ((status = ANY (ARRAY['unpaid'::text, 'partial'::text, 'paid'::text])))
);


ALTER TABLE public.receivables OWNER TO kastoko;

--
-- Name: sale_items; Type: TABLE; Schema: public; Owner: kastoko
--

CREATE TABLE public.sale_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sale_id uuid NOT NULL,
    product_id uuid NOT NULL,
    product_unit_id uuid,
    quantity numeric(12,2) NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    total numeric(12,2) NOT NULL,
    CONSTRAINT sale_items_quantity_check CHECK ((quantity > (0)::numeric))
);


ALTER TABLE public.sale_items OWNER TO kastoko;

--
-- Name: sales; Type: TABLE; Schema: public; Owner: kastoko
--

CREATE TABLE public.sales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    shift_id uuid,
    receipt_number text NOT NULL,
    cashier_id uuid NOT NULL,
    customer_id uuid,
    status text DEFAULT 'paid'::text NOT NULL,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    discount numeric(12,2) DEFAULT 0 NOT NULL,
    discount_type text DEFAULT 'fixed'::text,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    payment_method text NOT NULL,
    amount_paid numeric(12,2) DEFAULT 0 NOT NULL,
    change_amount numeric(12,2) DEFAULT 0 NOT NULL,
    transfer_ref text,
    paid_at timestamp with time zone,
    void_reason text,
    voided_by uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sales_discount_type_check CHECK ((discount_type = ANY (ARRAY['fixed'::text, 'percentage'::text]))),
    CONSTRAINT sales_payment_method_check CHECK ((payment_method = ANY (ARRAY['cash'::text, 'qris_duitku'::text, 'qris_manual'::text, 'bank_transfer'::text, 'credit'::text]))),
    CONSTRAINT sales_status_check CHECK ((status = ANY (ARRAY['awaiting_payment'::text, 'paid'::text, 'credit'::text, 'void'::text])))
);


ALTER TABLE public.sales OWNER TO kastoko;

--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: kastoko
--

CREATE TABLE public.schema_migrations (
    filename text NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.schema_migrations OWNER TO kastoko;

--
-- Name: stock_mutations; Type: TABLE; Schema: public; Owner: kastoko
--

CREATE TABLE public.stock_mutations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    product_id uuid NOT NULL,
    mutation_type text NOT NULL,
    reason text NOT NULL,
    quantity numeric(12,2) NOT NULL,
    sale_id uuid,
    purchase_id uuid,
    note text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT stock_mutations_mutation_type_check CHECK ((mutation_type = ANY (ARRAY['in'::text, 'out'::text]))),
    CONSTRAINT stock_mutations_quantity_check CHECK ((quantity > (0)::numeric)),
    CONSTRAINT stock_mutations_reason_check CHECK ((reason = ANY (ARRAY['sale'::text, 'sale_void'::text, 'purchase'::text, 'purchase_void'::text, 'adjustment'::text, 'damage'::text, 'return_in'::text, 'return_out'::text])))
);


ALTER TABLE public.stock_mutations OWNER TO kastoko;

--
-- Name: store_members; Type: TABLE; Schema: public; Owner: kastoko
--

CREATE TABLE public.store_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    cashier_pin text,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT store_members_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'cashier'::text]))),
    CONSTRAINT store_members_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])))
);


ALTER TABLE public.store_members OWNER TO kastoko;

--
-- Name: stores; Type: TABLE; Schema: public; Owner: kastoko
--

CREATE TABLE public.stores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    address text,
    phone text,
    receipt_footer text DEFAULT 'Terima kasih atas kunjungan Anda!'::text,
    currency text DEFAULT 'IDR'::text NOT NULL,
    subscription_status text DEFAULT 'active'::text NOT NULL,
    subscription_expires_at timestamp with time zone,
    ai_enabled boolean DEFAULT true NOT NULL,
    custom_ai_api_key text,
    custom_ai_base_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT stores_subscription_status_check CHECK ((subscription_status = ANY (ARRAY['trial'::text, 'active'::text, 'expired'::text])))
);


ALTER TABLE public.stores OWNER TO kastoko;

--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: kastoko
--

CREATE TABLE public.suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    name text NOT NULL,
    phone text,
    address text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.suppliers OWNER TO kastoko;

--
-- Name: users; Type: TABLE; Schema: public; Owner: kastoko
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    phone text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO kastoko;

--
-- Data for Name: cash_flows; Type: TABLE DATA; Schema: public; Owner: kastoko
--

INSERT INTO public.cash_flows VALUES ('8ae08847-a1be-4731-8888-5d2722e60a1a', '00000000-0000-4000-8000-000000000001', 'in', 44000.00, 'sale_payment', 'cash', 'sale', '1b5c773a-9a90-4584-80bb-d10bafbf277e', '2026-09-03 08:05:00+07');
INSERT INTO public.cash_flows VALUES ('c0f76f58-7fab-4a98-9b68-4df1ce7bd18a', '00000000-0000-4000-8000-000000000001', 'in', 59000.00, 'sale_payment', 'cash', 'sale', '5e35901d-155d-4514-a892-02f4bcd0307f', '2026-09-03 10:15:00+07');
INSERT INTO public.cash_flows VALUES ('fd932bad-840c-4820-bf99-9e6187d426c3', '00000000-0000-4000-8000-000000000001', 'in', 97000.00, 'sale_payment', 'cash', 'sale', '7a6145cb-7e6f-476e-928e-0bb2f097e5a5', '2026-09-03 15:42:00+07');
INSERT INTO public.cash_flows VALUES ('f364db79-328f-44b9-ac31-3a15720428b4', '00000000-0000-4000-8000-000000000001', 'in', 23000.00, 'sale_payment', 'cash', 'sale', '890af200-c4db-4e71-ba0d-a7f129e85bb7', '2026-09-04 08:02:00+07');
INSERT INTO public.cash_flows VALUES ('e964a542-564d-436a-9738-3e9713df28b6', '00000000-0000-4000-8000-000000000001', 'in', 51000.00, 'sale_payment', 'cash', 'sale', '4a93b4f2-88c3-4feb-a7a7-8faccc54ffd0', '2026-09-04 11:12:00+07');
INSERT INTO public.cash_flows VALUES ('b5b2305a-2ec0-4538-a0fb-b592aa6cf7e6', '00000000-0000-4000-8000-000000000001', 'in', 36500.00, 'sale_payment', 'cash', 'sale', '5874e56f-aa3f-42da-84bc-81bfe053f153', '2026-09-04 13:30:00+07');
INSERT INTO public.cash_flows VALUES ('68eb2c4c-83b9-425b-9cd0-bf2a73916fff', '00000000-0000-4000-8000-000000000001', 'in', 154000.00, 'sale_payment', 'cash', 'sale', 'f9112abc-5d9b-46b7-b994-a31023eb8e09', '2026-09-04 16:50:00+07');
INSERT INTO public.cash_flows VALUES ('2d57e21f-c9bb-4f7c-804c-b4fad11b08dd', '00000000-0000-4000-8000-000000000001', 'in', 40000.00, 'sale_payment', 'cash', 'sale', 'ac1445c6-22f3-4a15-a150-997ab6ec356b', '2026-09-05 08:01:00+07');
INSERT INTO public.cash_flows VALUES ('816e337e-8b01-4d38-a807-b1262e53f12b', '00000000-0000-4000-8000-000000000001', 'in', 60000.00, 'sale_payment', 'cash', 'sale', '84e276e9-d45b-4c6a-8094-dee46698cca1', '2026-09-05 10:08:00+07');
INSERT INTO public.cash_flows VALUES ('272a951c-a622-4769-b382-3e02acd5a9b9', '00000000-0000-4000-8000-000000000001', 'in', 78000.00, 'sale_payment', 'cash', 'sale', '24de0886-007b-48d3-991c-4afbb3c4127d', '2026-09-05 12:20:00+07');
INSERT INTO public.cash_flows VALUES ('851e9e29-954e-4eff-9382-324fa1b56c0c', '00000000-0000-4000-8000-000000000001', 'in', 98500.00, 'sale_payment', 'cash', 'sale', 'c4cc03c4-de9a-4675-8145-ad1a8955012b', '2026-09-05 15:45:00+07');
INSERT INTO public.cash_flows VALUES ('d014f5c3-48de-42f0-9d68-b4697662c658', '00000000-0000-4000-8000-000000000001', 'in', 60000.00, 'sale_payment', 'cash', 'sale', '73781bab-962d-4f88-bb69-d3de9ed31b93', '2026-09-06 09:10:00+07');
INSERT INTO public.cash_flows VALUES ('f46ea78a-5287-4cc6-9565-1139f822f6e8', '00000000-0000-4000-8000-000000000001', 'in', 293000.00, 'sale_payment', 'cash', 'sale', 'bc4d03a4-81c2-4f85-951a-45db15c87dc5', '2026-09-06 12:25:00+07');
INSERT INTO public.cash_flows VALUES ('132cafef-a1d7-4600-a3f1-3f12aa196bdc', '00000000-0000-4000-8000-000000000001', 'in', 186000.00, 'sale_payment', 'cash', 'sale', 'ba654baf-982d-4509-9ba6-f7702e255497', '2026-09-06 17:40:00+07');
INSERT INTO public.cash_flows VALUES ('69ab588c-14a1-48f3-bdf0-d5946ac36973', '00000000-0000-4000-8000-000000000001', 'in', 60000.00, 'sale_payment', 'cash', 'sale', 'd296dc65-f2b6-475b-b2db-8e1780e16c55', '2026-09-07 08:09:00+07');
INSERT INTO public.cash_flows VALUES ('da68edc6-ebab-4cf5-bb61-a56197cd813a', '00000000-0000-4000-8000-000000000001', 'in', 25000.00, 'sale_payment', 'cash', 'sale', 'f04bd50d-76ca-48b9-8350-71d09a405d67', '2026-09-07 10:18:00+07');
INSERT INTO public.cash_flows VALUES ('20394227-c1b6-4898-bbe9-e534070050f1', '00000000-0000-4000-8000-000000000001', 'in', 160000.00, 'sale_payment', 'cash', 'sale', '4456e5cb-774e-4208-9310-c766fd10f165', '2026-09-07 13:35:00+07');
INSERT INTO public.cash_flows VALUES ('5117f641-51d5-4588-ada0-d7150a5d130e', '00000000-0000-4000-8000-000000000001', 'in', 176500.00, 'sale_payment', 'cash', 'sale', 'f3c72e52-7083-4d57-a421-2e579086dd44', '2026-09-07 18:55:00+07');
INSERT INTO public.cash_flows VALUES ('17fc5566-ca56-4c3a-9eee-1718f7d49a07', '00000000-0000-4000-8000-000000000001', 'in', 35000.00, 'sale_payment', 'cash', 'sale', 'c58dd04b-03aa-47c0-a053-1bdfb565ee03', '2026-09-08 07:50:00+07');
INSERT INTO public.cash_flows VALUES ('0614abc5-c889-4ef1-a456-9278d1dd170a', '00000000-0000-4000-8000-000000000001', 'in', 57000.00, 'sale_payment', 'cash', 'sale', 'f7bcbdd5-a4d3-43f0-b894-4f840cbaa7d4', '2026-09-08 09:06:00+07');
INSERT INTO public.cash_flows VALUES ('60cb76d8-6589-4977-8c47-446439781d55', '00000000-0000-4000-8000-000000000001', 'in', 58000.00, 'sale_payment', 'cash', 'sale', 'f490ef8c-b58f-46b2-9500-0194cb68122b', '2026-09-08 11:16:00+07');
INSERT INTO public.cash_flows VALUES ('a885ccba-b29b-4fea-874d-08e2575be417', '00000000-0000-4000-8000-000000000001', 'in', 55500.00, 'sale_payment', 'cash', 'sale', 'f1fe5c0d-fe1d-4e8e-aa51-31b9d72bf3db', '2026-09-08 14:28:00+07');
INSERT INTO public.cash_flows VALUES ('86c3c3f7-6f86-479e-be5a-33aec8f198f0', '00000000-0000-4000-8000-000000000001', 'in', 460000.00, 'sale_payment', 'cash', 'sale', 'c6fee5e1-2c68-4185-a003-355b55552eb8', '2026-09-08 16:44:00+07');
INSERT INTO public.cash_flows VALUES ('e4fbb758-e265-467a-a83a-c479ad7efc5b', '00000000-0000-4000-8000-000000000001', 'in', 184000.00, 'sale_payment', 'cash', 'sale', '760afbe8-bc58-4a90-806c-38c969aa6ff5', '2026-09-08 18:58:00+07');
INSERT INTO public.cash_flows VALUES ('28696789-25c1-4f09-bd68-63b160bdb5aa', '00000000-0000-4000-8000-000000000001', 'in', 239000.00, 'sale_payment', 'cash', 'sale', '8eda2be0-8dbe-4aa5-bbe1-c36083e51b86', '2026-09-09 19:52:09.812+07');
INSERT INTO public.cash_flows VALUES ('ff95ae1a-a166-4d62-89a6-9bf8cd1ad0cd', '00000000-0000-4000-8000-000000000001', 'in', 44000.00, 'sale_payment', 'cash', 'sale', 'ad41a378-75b8-454b-a0b1-6eebcbb86945', '2026-09-09 21:22:09.815+07');
INSERT INTO public.cash_flows VALUES ('156c6a95-4de0-4e35-b4ce-48c1c8ab77d6', '00000000-0000-4000-8000-000000000001', 'in', 83000.00, 'sale_payment', 'cash', 'sale', '512625e4-3698-4655-a497-95a5b06e023b', '2026-09-09 23:07:09.82+07');
INSERT INTO public.cash_flows VALUES ('be4a2aed-2983-49cb-8596-e3e22a62708e', '00000000-0000-4000-8000-000000000001', 'in', 50000.00, 'receivable_payment', 'cash', 'receivable', '1f04432d-5bc1-4ca4-b09d-e4fb6028d6dc', '2026-09-04 10:30:00+07');
INSERT INTO public.cash_flows VALUES ('01718cb1-7db7-4965-8dd6-116ef3c225b2', '00000000-0000-4000-8000-000000000001', 'out', 100000.00, 'payable_payment', 'cash', 'payable', '9d13147c-9827-4614-9681-2bb11b2c87bd', '2026-09-07 11:00:00+07');
INSERT INTO public.cash_flows VALUES ('5feb7aed-9162-4b43-b317-dc1ac642a412', '00000000-0000-4000-8000-000000000001', 'out', 50000.00, 'payable_payment', 'cash', 'payable', '9d13147c-9827-4614-9681-2bb11b2c87bd', '2026-09-08 11:00:00+07');
INSERT INTO public.cash_flows VALUES ('5a273703-1c95-498a-9b0b-770227f2b82d', '00000000-0000-4000-8000-000000000001', 'out', 264000.00, 'purchase_payment', 'cash', 'purchase', 'abde13c8-fba1-4a9d-9f5c-9b67366c9888', '2026-09-07 08:30:00+07');
INSERT INTO public.cash_flows VALUES ('26535646-4bbe-4f91-9119-01f0ef70ee2a', '00000000-0000-4000-8000-000000000001', 'out', 50000.00, 'expense', 'cash', 'expense', 'cedcca14-0fe5-4945-bbb8-7cfc06c79001', '2026-09-09 09:45:00+07');
INSERT INTO public.cash_flows VALUES ('e0f6862d-9a57-4e3f-98d9-6a8aff40519e', '00000000-0000-4000-8000-000000000001', 'out', 20000.00, 'expense', 'cash', 'expense', 'befc2862-6e35-4411-8d49-e8095cf8b9ae', '2026-09-06 15:10:00+07');
INSERT INTO public.cash_flows VALUES ('d65f6581-61bc-483d-af4d-69905c2e3664', '00000000-0000-4000-8000-000000000001', 'in', 124000.00, 'sale_payment', 'cash', 'sale', 'd1ee58fa-d2f1-473b-8cc7-bd70c2c96bae', '2026-09-09 23:52:15.165595+07');
INSERT INTO public.cash_flows VALUES ('28cc98de-d718-4260-a78f-b21f35dd2658', '00000000-0000-4000-8000-000000000001', 'in', 17500.00, 'receivable_payment', 'cash', 'receivable', 'fc193bac-95f5-4f53-9bcc-d021bba13d72', '2026-09-09 23:52:24.113854+07');


--
-- Data for Name: cashier_shifts; Type: TABLE DATA; Schema: public; Owner: kastoko
--

INSERT INTO public.cashier_shifts VALUES ('1d5ee68e-314d-4916-b965-04e7d4d7d957', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003', '2026-09-08 08:00:00+07', '2026-09-08 20:05:00+07', 150000.00, 914500.00, 914500.00, 0.00, NULL, 'closed');
INSERT INTO public.cashier_shifts VALUES ('fa050348-cd73-46c0-9ee8-552c38239ba2', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003', '2026-09-09 23:52:14.304651+07', '2026-09-09 23:52:16.60288+07', 150000.00, 274000.00, 274000.00, 0.00, NULL, 'closed');
INSERT INTO public.cashier_shifts VALUES ('d9ae6f1d-b921-4948-b51d-3b4de320fbae', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003', '2026-09-09 23:52:18.156313+07', NULL, 150000.00, NULL, NULL, NULL, NULL, 'open');


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: kastoko
--

INSERT INTO public.categories VALUES ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001', 'Sembako', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.categories VALUES ('00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000001', 'Minuman', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.categories VALUES ('00000000-0000-4000-8000-000000000013', '00000000-0000-4000-8000-000000000001', 'Dapur', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.categories VALUES ('00000000-0000-4000-8000-000000000014', '00000000-0000-4000-8000-000000000001', 'Perlengkapan', '2026-09-09 23:52:09.415188+07');


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: kastoko
--

INSERT INTO public.customers VALUES ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000001', 'Bu Ani', '0812-3333-4444', 'Jl. Kenanga No. 3', true, '2026-09-09 23:52:09.415188+07');
INSERT INTO public.customers VALUES ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000001', 'Pak Joko', '0813-5555-6666', 'Jl. Anggrek No. 8', true, '2026-09-09 23:52:09.415188+07');
INSERT INTO public.customers VALUES ('00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000001', 'Mbak Lily', '0857-7777-8888', 'Perum Griya Asri', true, '2026-09-09 23:52:09.415188+07');


--
-- Data for Name: duitku_payments; Type: TABLE DATA; Schema: public; Owner: kastoko
--



--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: kastoko
--

INSERT INTO public.expenses VALUES ('cedcca14-0fe5-4945-bbb8-7cfc06c79001', '00000000-0000-4000-8000-000000000001', 'Beli token listrik toko', 'Operasional', 50000.00, 'cash', 'PLN pascabayar no. 4501', '2026-09-09 09:45:00+07', '00000000-0000-4000-8000-000000000003', '2026-09-09 09:45:00+07');
INSERT INTO public.expenses VALUES ('befc2862-6e35-4411-8d49-e8095cf8b9ae', '00000000-0000-4000-8000-000000000001', 'Iuran kebersihan kampung', 'Operasional', 20000.00, 'cash', NULL, '2026-09-09 23:52:09.415188+07', '00000000-0000-4000-8000-000000000002', '2026-09-06 15:10:00+07');


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: kastoko
--

INSERT INTO public.notifications VALUES ('f30879ac-d964-472b-a2b9-d9ab10c92dd3', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'stock_low', 'Stok Menipis', 'Minyak Goreng 1L sisa 2 (batas minimum 5). Segera kulakan!', '{}', false, '2026-09-09 20:52:09.415188+07');
INSERT INTO public.notifications VALUES ('9ea5cf3e-ec1d-499e-a9fe-ac7f05fd56ab', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'stock_low', 'Stok Menipis', 'Telur Ayam 1Kg sisa 8 (batas minimum 10).', '{}', false, '2026-09-09 20:52:09.415188+07');
INSERT INTO public.notifications VALUES ('0392a273-0d13-4d0a-aec1-e9f6e9c58840', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'sale_paid', 'Penjualan Baru', 'Siti Rahma menyelesaikan transaksi hari ini.', '{}', true, '2026-09-09 21:52:09.415188+07');
INSERT INTO public.notifications VALUES ('5777e1eb-6ee0-4e8d-bf3a-c638a620fd56', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003', 'stock_low', 'Stok Menipis', 'Jangan lupa: Minyak Goreng hampir habis.', '{}', false, '2026-09-09 22:52:09.415188+07');
INSERT INTO public.notifications VALUES ('c9d5cf5e-f85f-4d01-aa6a-738b1ec8981d', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'sale_paid', 'Penjualan Baru', 'Siti Rahma menyelesaikan STR-20260909-06 senilai 17.500', '{}', false, '2026-09-09 23:52:19.342311+07');
INSERT INTO public.notifications VALUES ('062450e6-d13f-489b-b723-929fd4ca2e82', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003', 'sale_paid', 'Penjualan Baru', 'Siti Rahma menyelesaikan STR-20260909-06 senilai 17.500', '{}', false, '2026-09-09 23:52:19.342311+07');
INSERT INTO public.notifications VALUES ('15dc30a4-f05b-43c4-8845-bc43e0b1ef97', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004', 'sale_paid', 'Penjualan Baru', 'Siti Rahma menyelesaikan STR-20260909-06 senilai 17.500', '{}', false, '2026-09-09 23:52:19.342311+07');
INSERT INTO public.notifications VALUES ('5d679220-b9e1-4120-a5c4-cd5b2dc69c22', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'sale_paid', 'Penjualan Baru', 'Siti Rahma menyelesaikan STR-20260909-05 senilai 124.000', '{}', false, '2026-09-09 23:52:15.165595+07');
INSERT INTO public.notifications VALUES ('6eb384f4-aae0-4024-b449-ebd28497a5aa', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003', 'sale_paid', 'Penjualan Baru', 'Siti Rahma menyelesaikan STR-20260909-05 senilai 124.000', '{}', false, '2026-09-09 23:52:15.165595+07');
INSERT INTO public.notifications VALUES ('317d73ae-12b4-4975-a184-7cbdebfbdb39', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004', 'sale_paid', 'Penjualan Baru', 'Siti Rahma menyelesaikan STR-20260909-05 senilai 124.000', '{}', false, '2026-09-09 23:52:15.165595+07');
INSERT INTO public.notifications VALUES ('e3cc346a-cdd6-44f8-9144-9adef8b49b53', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'sale_paid', 'Transaksi Dibatalkan', 'STR-20260909-06 dibatalkan: Salah input', '{}', false, '2026-09-09 23:52:25.771649+07');
INSERT INTO public.notifications VALUES ('c9f082e1-b7d1-440f-9409-461441e86ab4', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003', 'sale_paid', 'Transaksi Dibatalkan', 'STR-20260909-06 dibatalkan: Salah input', '{}', false, '2026-09-09 23:52:25.771649+07');
INSERT INTO public.notifications VALUES ('f1b6d242-6de9-448d-9e0b-5864ae2e91dc', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004', 'sale_paid', 'Transaksi Dibatalkan', 'STR-20260909-06 dibatalkan: Salah input', '{}', false, '2026-09-09 23:52:25.771649+07');


--
-- Data for Name: payable_payments; Type: TABLE DATA; Schema: public; Owner: kastoko
--

INSERT INTO public.payable_payments VALUES ('dcc1f85b-1b07-4e10-84cc-fd60cc31c035', '00000000-0000-4000-8000-000000000001', '9d13147c-9827-4614-9681-2bb11b2c87bd', 100000.00, 'cash', NULL, '00000000-0000-4000-8000-000000000002', '2026-09-07 11:00:00+07');
INSERT INTO public.payable_payments VALUES ('46e1a374-8dce-42fc-98d3-01d16fd6a8b6', '00000000-0000-4000-8000-000000000001', '9d13147c-9827-4614-9681-2bb11b2c87bd', 50000.00, 'cash', NULL, '00000000-0000-4000-8000-000000000002', '2026-09-08 11:00:00+07');


--
-- Data for Name: payables; Type: TABLE DATA; Schema: public; Owner: kastoko
--

INSERT INTO public.payables VALUES ('9d13147c-9827-4614-9681-2bb11b2c87bd', '00000000-0000-4000-8000-000000000001', 'f1ad813f-fac9-4699-8b41-40e6c432c096', '00000000-0000-4000-8000-000000000201', 500000.00, 150000.00, '2026-09-23', 'partial', NULL, '2026-09-05 09:00:00+07');


--
-- Data for Name: product_units; Type: TABLE DATA; Schema: public; Owner: kastoko
--

INSERT INTO public.product_units VALUES ('5ee6983c-df90-43ab-94bd-4afbf8a3e044', '00000000-0000-4000-8000-000000000105', 'Pcs', 1.00, 3000.00, NULL, true);
INSERT INTO public.product_units VALUES ('7ae56136-a94f-497f-afbe-61b005e94907', '00000000-0000-4000-8000-000000000105', 'Bal', 10.00, 28500.00, NULL, false);
INSERT INTO public.product_units VALUES ('298d7508-4843-4b12-adb7-cf11ee2b9d7a', '00000000-0000-4000-8000-000000000105', 'Dus', 40.00, 108000.00, NULL, false);
INSERT INTO public.product_units VALUES ('43317f7f-1dbe-4ede-baab-7d769eeeaa3c', '00000000-0000-4000-8000-000000000106', 'Pcs', 1.00, 3500.00, NULL, true);
INSERT INTO public.product_units VALUES ('e92a66ed-4a50-44a8-8c51-f16c1b273f88', '00000000-0000-4000-8000-000000000106', 'Pack', 12.00, 39000.00, NULL, false);
INSERT INTO public.product_units VALUES ('6401b63a-2daa-4df8-b620-29f7e1266b13', '00000000-0000-4000-8000-000000000112', 'Pcs', 1.00, 2300.00, NULL, true);
INSERT INTO public.product_units VALUES ('cad29a48-6dbb-4935-a81f-be8bf879334d', '00000000-0000-4000-8000-000000000112', 'Renceng', 10.00, 22500.00, NULL, false);


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: kastoko
--

INSERT INTO public.products VALUES ('00000000-0000-4000-8000-000000000109', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000012', 'Teh Celup 25s', 'TEH-0001', '8991003555555', 'pcs', 4500.00, 6500.00, 22.00, 8.00, '🫖', true, '2026-09-09 23:52:09.415188+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.products VALUES ('00000000-0000-4000-8000-000000000110', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000013', 'Gas LPG 3Kg', 'LPG-0001', '8991003666666', 'pcs', 16000.00, 21000.00, 9.00, 5.00, '🔥', true, '2026-09-09 23:52:09.415188+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.products VALUES ('00000000-0000-4000-8000-000000000111', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000014', 'Sabun Mandi 240ml', 'SBN-0001', '8991003777777', 'pcs', 3000.00, 4500.00, 35.00, 10.00, '🧼', true, '2026-09-09 23:52:09.415188+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.products VALUES ('00000000-0000-4000-8000-000000000112', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000014', 'Rokok Garnet Mild (Packs)', 'RKK-0001', '8991003888888', 'pcs', 20500.00, 23000.00, 40.00, 10.00, '🚬', true, '2026-09-09 23:52:09.415188+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.products VALUES ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', 'Minyak Goreng 1L', 'MNY-0001', '8991002222222', 'pcs', 16500.00, 19000.00, 2.00, 5.00, '🛢️', true, '2026-09-09 23:52:09.415188+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.products VALUES ('00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000013', 'Telur Ayam 1Kg', 'TEL-0001', '8991002444444', 'pcs', 26000.00, 30000.00, 8.00, 10.00, '🥚', true, '2026-09-09 23:52:09.415188+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.products VALUES ('00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', 'Indomie Goreng', 'DIM-0001', '8991003111111', 'pcs', 2400.00, 3000.00, 200.00, 40.00, '🍜', true, '2026-09-09 23:52:09.415188+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.products VALUES ('00000000-0000-4000-8000-000000000106', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000012', 'Air Mineral 600ml', 'AIR-0001', '8991003222222', 'pcs', 2500.00, 3500.00, 96.00, 24.00, '🥤', true, '2026-09-09 23:52:09.415188+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.products VALUES ('00000000-0000-4000-8000-000000000107', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000012', 'Susu SKM 370gr', 'SKM-0001', '8991003333333', 'pcs', 12000.00, 15000.00, 18.00, 6.00, '🥫', true, '2026-09-09 23:52:09.415188+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.products VALUES ('00000000-0000-4000-8000-000000000108', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000012', 'Kopi Sachet', 'KOP-0001', '8991003444444', 'pcs', 1200.00, 2000.00, 120.00, 30.00, '☕', true, '2026-09-09 23:52:09.415188+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.products VALUES ('00000000-0000-4000-8000-000000000113', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000013', 'Kecap Manis 550ml', 'KEC-0001', '8991004222222', 'pcs', 11000.00, 14000.00, 20.00, 6.00, '🍯', true, '2026-09-09 23:52:09.415188+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.products VALUES ('00000000-0000-4000-8000-000000000114', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000013', 'Bumbu Instan Royco 10s', 'ROY-0001', '8991004333333', 'pcs', 8000.00, 10500.00, 15.00, 5.00, '🧂', true, '2026-09-09 23:52:09.415188+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.products VALUES ('00000000-0000-4000-8000-000000000115', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000013', 'Margarin Blueband 200g', 'MGR-0001', '8991004444444', 'pcs', 9500.00, 12500.00, 14.00, 5.00, '🧈', true, '2026-09-09 23:52:09.415188+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.products VALUES ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', 'Beras Premium 5Kg', 'BRS-0001', '8991002111111', 'pcs', 55000.00, 62000.00, 38.00, 10.00, '🍚', true, '2026-09-09 23:52:09.415188+07', '2026-09-09 23:52:15.165595+07');
INSERT INTO public.products VALUES ('d1c65d9d-dea9-40de-9130-958373abd7f0', '00000000-0000-4000-8000-000000000001', NULL, 'Kerupuk Udang Bundar', 'KER-0001', NULL, 'pcs', 0.00, 5000.00, 30.00, 5.00, '📦', true, '2026-09-09 23:52:22.190075+07', '2026-09-09 23:52:22.190075+07');
INSERT INTO public.products VALUES ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', 'Gula Pasir 1Kg', 'GLA-0001', '8991002333333', 'pcs', 15000.00, 17500.00, 25.00, 5.00, '🍬', true, '2026-09-09 23:52:09.415188+07', '2026-09-09 23:52:25.771649+07');


--
-- Data for Name: purchase_items; Type: TABLE DATA; Schema: public; Owner: kastoko
--

INSERT INTO public.purchase_items VALUES ('75f816d3-beec-4dd7-81a9-7c626b70f461', 'f1ad813f-fac9-4699-8b41-40e6c432c096', '00000000-0000-4000-8000-000000000101', 8.00, 55000.00, 440000.00);
INSERT INTO public.purchase_items VALUES ('7062dab4-d8a6-40ee-91be-85f98ab20eb6', 'f1ad813f-fac9-4699-8b41-40e6c432c096', '00000000-0000-4000-8000-000000000115', 12.00, 5000.00, 60000.00);
INSERT INTO public.purchase_items VALUES ('a9c8b517-c0e5-43b5-bb2c-0ac72bbe5a0c', 'abde13c8-fba1-4a9d-9f5c-9b67366c9888', '00000000-0000-4000-8000-000000000105', 60.00, 2400.00, 144000.00);
INSERT INTO public.purchase_items VALUES ('2b29946b-66cd-4353-933d-324576d6b9bf', 'abde13c8-fba1-4a9d-9f5c-9b67366c9888', '00000000-0000-4000-8000-000000000106', 48.00, 2500.00, 120000.00);


--
-- Data for Name: purchases; Type: TABLE DATA; Schema: public; Owner: kastoko
--

INSERT INTO public.purchases VALUES ('f1ad813f-fac9-4699-8b41-40e6c432c096', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000201', 'F-2026-0905', 'credit', 500000.00, 0.00, 500000.00, NULL, 'Belanja kredit sembako mingguan', '00000000-0000-4000-8000-000000000002', '2026-09-05 09:00:00+07');
INSERT INTO public.purchases VALUES ('abde13c8-fba1-4a9d-9f5c-9b67366c9888', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000202', 'F-2026-0907', 'paid', 264000.00, 0.00, 264000.00, '2026-09-07 08:30:00+07', NULL, '00000000-0000-4000-8000-000000000002', '2026-09-07 08:30:00+07');


--
-- Data for Name: receivable_payments; Type: TABLE DATA; Schema: public; Owner: kastoko
--

INSERT INTO public.receivable_payments VALUES ('a863dd37-e73c-4e7d-adb7-9d91cdbe9281', '00000000-0000-4000-8000-000000000001', '1f04432d-5bc1-4ca4-b09d-e4fb6028d6dc', 50000.00, 'cash', 'Cicilan pertama', '00000000-0000-4000-8000-000000000003', '2026-09-04 10:30:00+07');


--
-- Data for Name: receivables; Type: TABLE DATA; Schema: public; Owner: kastoko
--

INSERT INTO public.receivables VALUES ('ccbcae00-d6f0-451a-b4c9-79c9568efcd2', '00000000-0000-4000-8000-000000000001', 'fb909148-f02b-4710-adaa-e998fd4dd7ce', '00000000-0000-4000-8000-000000000302', 84500.00, 0.00, NULL, 'unpaid', NULL, '2026-09-05 16:20:00+07');
INSERT INTO public.receivables VALUES ('9f9bc44e-581c-4899-96fb-795c6bbb2f60', '00000000-0000-4000-8000-000000000001', '4f53ec5a-9e03-4be7-8eff-e1fa62bf54ed', '00000000-0000-4000-8000-000000000301', 24000.00, 0.00, NULL, 'unpaid', NULL, '2026-09-09 23:32:09.824+07');
INSERT INTO public.receivables VALUES ('1f04432d-5bc1-4ca4-b09d-e4fb6028d6dc', '00000000-0000-4000-8000-000000000001', '4bc011ad-7390-42c5-9c76-abdc314cb4cd', '00000000-0000-4000-8000-000000000301', 200000.00, 50000.00, NULL, 'partial', NULL, '2026-09-01 09:15:00+07');


--
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: kastoko
--

INSERT INTO public.sale_items VALUES ('a31f3618-8a5a-49e8-a164-9545116b729c', '1b5c773a-9a90-4584-80bb-d10bafbf277e', '00000000-0000-4000-8000-000000000105', NULL, 8.00, 3000.00, 24000.00);
INSERT INTO public.sale_items VALUES ('a8fec5ce-d132-41b2-9a01-bd146495f700', '1b5c773a-9a90-4584-80bb-d10bafbf277e', '00000000-0000-4000-8000-000000000108', NULL, 10.00, 2000.00, 20000.00);
INSERT INTO public.sale_items VALUES ('8b706d05-e059-491b-a3d2-82c5bb8fcd12', '5e35901d-155d-4514-a892-02f4bcd0307f', '00000000-0000-4000-8000-000000000102', NULL, 2.00, 19000.00, 38000.00);
INSERT INTO public.sale_items VALUES ('a3d12518-fb20-46f8-99cd-30740a34f7d4', '5e35901d-155d-4514-a892-02f4bcd0307f', '00000000-0000-4000-8000-000000000106', NULL, 6.00, 3500.00, 21000.00);
INSERT INTO public.sale_items VALUES ('cb879a56-abe3-4d01-ba86-3bcd64ab1920', '7a6145cb-7e6f-476e-928e-0bb2f097e5a5', '00000000-0000-4000-8000-000000000101', NULL, 1.00, 62000.00, 62000.00);
INSERT INTO public.sale_items VALUES ('853137e7-5292-434b-a693-d6cb273abdd3', '7a6145cb-7e6f-476e-928e-0bb2f097e5a5', '00000000-0000-4000-8000-000000000103', NULL, 2.00, 17500.00, 35000.00);
INSERT INTO public.sale_items VALUES ('0f62117c-6c91-4d78-a463-3a85d052c568', '890af200-c4db-4e71-ba0d-a7f129e85bb7', '00000000-0000-4000-8000-000000000112', NULL, 1.00, 23000.00, 23000.00);
INSERT INTO public.sale_items VALUES ('50512d08-9b92-4f16-aa5a-0a6a78358e1e', '4a93b4f2-88c3-4feb-a7a7-8faccc54ffd0', '00000000-0000-4000-8000-000000000110', NULL, 2.00, 21000.00, 42000.00);
INSERT INTO public.sale_items VALUES ('bbf9befe-fefb-4aa1-98de-72253d1596dc', '4a93b4f2-88c3-4feb-a7a7-8faccc54ffd0', '00000000-0000-4000-8000-000000000111', NULL, 2.00, 4500.00, 9000.00);
INSERT INTO public.sale_items VALUES ('a23aedf9-28eb-4c71-9f63-5e47840a783c', '5874e56f-aa3f-42da-84bc-81bfe053f153', '00000000-0000-4000-8000-000000000107', NULL, 2.00, 15000.00, 30000.00);
INSERT INTO public.sale_items VALUES ('00c37419-9242-4c6f-bacd-9cf46d5ea238', '5874e56f-aa3f-42da-84bc-81bfe053f153', '00000000-0000-4000-8000-000000000109', NULL, 1.00, 6500.00, 6500.00);
INSERT INTO public.sale_items VALUES ('431a3848-d5e6-4c68-a64a-d7102b666905', 'f9112abc-5d9b-46b7-b994-a31023eb8e09', '00000000-0000-4000-8000-000000000101', NULL, 2.00, 62000.00, 124000.00);
INSERT INTO public.sale_items VALUES ('49ca6984-869a-45bf-b730-3ac7e558a5ec', 'f9112abc-5d9b-46b7-b994-a31023eb8e09', '00000000-0000-4000-8000-000000000104', NULL, 1.00, 30000.00, 30000.00);
INSERT INTO public.sale_items VALUES ('4f70774d-1618-4a46-aa09-8ae13aeca1c7', 'ac1445c6-22f3-4a15-a150-997ab6ec356b', '00000000-0000-4000-8000-000000000108', NULL, 20.00, 2000.00, 40000.00);
INSERT INTO public.sale_items VALUES ('17a630b9-8f17-4eb8-b424-237c410e2e02', '84e276e9-d45b-4c6a-8094-dee46698cca1', '00000000-0000-4000-8000-000000000104', NULL, 2.00, 30000.00, 60000.00);
INSERT INTO public.sale_items VALUES ('ec5615bb-e769-43be-8023-d19a0b98f428', '24de0886-007b-48d3-991c-4afbb3c4127d', '00000000-0000-4000-8000-000000000105', NULL, 12.00, 3000.00, 36000.00);
INSERT INTO public.sale_items VALUES ('41f59b68-32f5-4df8-a363-573f5ea0c4e3', '24de0886-007b-48d3-991c-4afbb3c4127d', '00000000-0000-4000-8000-000000000106', NULL, 12.00, 3500.00, 42000.00);
INSERT INTO public.sale_items VALUES ('9ddbad7f-ed07-4c91-a1e8-8f39383ee2bd', 'c4cc03c4-de9a-4675-8145-ad1a8955012b', '00000000-0000-4000-8000-000000000101', NULL, 1.00, 62000.00, 62000.00);
INSERT INTO public.sale_items VALUES ('8b7e18e4-b6e2-4898-9391-8e6ba4e09d2d', 'c4cc03c4-de9a-4675-8145-ad1a8955012b', '00000000-0000-4000-8000-000000000102', NULL, 1.00, 19000.00, 19000.00);
INSERT INTO public.sale_items VALUES ('1f73c8c4-02b8-4b95-822c-d9cb6bcd2958', 'c4cc03c4-de9a-4675-8145-ad1a8955012b', '00000000-0000-4000-8000-000000000103', NULL, 1.00, 17500.00, 17500.00);
INSERT INTO public.sale_items VALUES ('7074aa03-633c-4c8e-8899-406834a98f3b', 'fb909148-f02b-4710-adaa-e998fd4dd7ce', '00000000-0000-4000-8000-000000000113', NULL, 2.00, 14000.00, 28000.00);
INSERT INTO public.sale_items VALUES ('4d8e4aa1-667f-4c6d-addf-f41df115c4e2', 'fb909148-f02b-4710-adaa-e998fd4dd7ce', '00000000-0000-4000-8000-000000000114', NULL, 3.00, 10500.00, 31500.00);
INSERT INTO public.sale_items VALUES ('37fa9b87-02c3-4492-9e6b-df2855ecefa6', 'fb909148-f02b-4710-adaa-e998fd4dd7ce', '00000000-0000-4000-8000-000000000115', NULL, 2.00, 12500.00, 25000.00);
INSERT INTO public.sale_items VALUES ('8b355e21-7492-4df6-bdbe-e4fd6eee5a06', '73781bab-962d-4f88-bb69-d3de9ed31b93', '00000000-0000-4000-8000-000000000107', NULL, 4.00, 15000.00, 60000.00);
INSERT INTO public.sale_items VALUES ('c33f34a0-9d28-47ff-a977-bfab45ce1cf0', 'bc4d03a4-81c2-4f85-951a-45db15c87dc5', '00000000-0000-4000-8000-000000000110', NULL, 3.00, 21000.00, 63000.00);
INSERT INTO public.sale_items VALUES ('95a79445-8121-4602-b1d7-f4548906af6b', 'bc4d03a4-81c2-4f85-951a-45db15c87dc5', '00000000-0000-4000-8000-000000000112', NULL, 10.00, 23000.00, 230000.00);
INSERT INTO public.sale_items VALUES ('f020d9bf-682d-451f-8376-5ceb37cccfd0', 'ba654baf-982d-4509-9ba6-f7702e255497', '00000000-0000-4000-8000-000000000101', NULL, 3.00, 62000.00, 186000.00);
INSERT INTO public.sale_items VALUES ('427f3407-0992-4870-b07f-19ba4a23ab6c', 'd296dc65-f2b6-475b-b2db-8e1780e16c55', '00000000-0000-4000-8000-000000000105', NULL, 20.00, 3000.00, 60000.00);
INSERT INTO public.sale_items VALUES ('eba396b7-a1e4-4767-9430-3541a3681cf0', 'f04bd50d-76ca-48b9-8350-71d09a405d67', '00000000-0000-4000-8000-000000000109', NULL, 2.00, 6500.00, 13000.00);
INSERT INTO public.sale_items VALUES ('3b342a6b-3f8c-47e5-aa68-a311faed18f9', 'f04bd50d-76ca-48b9-8350-71d09a405d67', '00000000-0000-4000-8000-000000000108', NULL, 6.00, 2000.00, 12000.00);
INSERT INTO public.sale_items VALUES ('b77ca086-99b0-4bee-ad5c-6393fdb6992b', '4456e5cb-774e-4208-9310-c766fd10f165', '00000000-0000-4000-8000-000000000102', NULL, 4.00, 19000.00, 76000.00);
INSERT INTO public.sale_items VALUES ('f1c50d7f-ea27-4fbe-bb32-3285fe850f31', '4456e5cb-774e-4208-9310-c766fd10f165', '00000000-0000-4000-8000-000000000106', NULL, 24.00, 3500.00, 84000.00);
INSERT INTO public.sale_items VALUES ('cce67fce-a240-4c72-87de-e96d5d87cca0', 'f3c72e52-7083-4d57-a421-2e579086dd44', '00000000-0000-4000-8000-000000000101', NULL, 2.00, 62000.00, 124000.00);
INSERT INTO public.sale_items VALUES ('f4173ade-7d6e-4ee0-adbc-e0a03dabba37', 'f3c72e52-7083-4d57-a421-2e579086dd44', '00000000-0000-4000-8000-000000000103', NULL, 3.00, 17500.00, 52500.00);
INSERT INTO public.sale_items VALUES ('913c8d36-605f-4645-a712-258901654a38', 'c58dd04b-03aa-47c0-a053-1bdfb565ee03', '00000000-0000-4000-8000-000000000103', NULL, 2.00, 17500.00, 35000.00);
INSERT INTO public.sale_items VALUES ('7b261fa4-a3d3-4019-b9eb-19299c5fc243', 'f7bcbdd5-a4d3-43f0-b894-4f840cbaa7d4', '00000000-0000-4000-8000-000000000102', NULL, 3.00, 19000.00, 57000.00);
INSERT INTO public.sale_items VALUES ('2e064a60-29da-4a43-9d9e-e9d23b0ac9e3', 'f490ef8c-b58f-46b2-9500-0194cb68122b', '00000000-0000-4000-8000-000000000106', NULL, 12.00, 3500.00, 42000.00);
INSERT INTO public.sale_items VALUES ('14a3676c-0f97-4002-a310-a95635e7612b', 'f490ef8c-b58f-46b2-9500-0194cb68122b', '00000000-0000-4000-8000-000000000108', NULL, 8.00, 2000.00, 16000.00);
INSERT INTO public.sale_items VALUES ('971409f1-3233-4f1a-9925-6eb574ff7dd5', 'f1fe5c0d-fe1d-4e8e-aa51-31b9d72bf3db', '00000000-0000-4000-8000-000000000110', NULL, 2.00, 21000.00, 42000.00);
INSERT INTO public.sale_items VALUES ('fb4cd449-f33b-4e11-8d86-5494bd952cdd', 'f1fe5c0d-fe1d-4e8e-aa51-31b9d72bf3db', '00000000-0000-4000-8000-000000000111', NULL, 3.00, 4500.00, 13500.00);
INSERT INTO public.sale_items VALUES ('d3af992c-21aa-460f-9bfa-96b92560098a', 'c6fee5e1-2c68-4185-a003-355b55552eb8', '00000000-0000-4000-8000-000000000112', NULL, 20.00, 23000.00, 460000.00);
INSERT INTO public.sale_items VALUES ('426714b0-d399-44d7-99ee-3a41b9725c5c', '760afbe8-bc58-4a90-806c-38c969aa6ff5', '00000000-0000-4000-8000-000000000101', NULL, 2.00, 62000.00, 124000.00);
INSERT INTO public.sale_items VALUES ('0a2c1ebb-ad0f-4c71-b974-a1a84003d23f', '760afbe8-bc58-4a90-806c-38c969aa6ff5', '00000000-0000-4000-8000-000000000104', NULL, 2.00, 30000.00, 60000.00);
INSERT INTO public.sale_items VALUES ('eb5eaaf5-5cea-48f6-b20c-a2eee3f8f616', '8eda2be0-8dbe-4aa5-bbe1-c36083e51b86', '00000000-0000-4000-8000-000000000111', NULL, 2.00, 4500.00, 9000.00);
INSERT INTO public.sale_items VALUES ('2db1724a-df87-4d34-b371-1dbad5ae3bd7', '8eda2be0-8dbe-4aa5-bbe1-c36083e51b86', '00000000-0000-4000-8000-000000000112', NULL, 10.00, 23000.00, 230000.00);
INSERT INTO public.sale_items VALUES ('f17c0360-02ef-4138-a5c5-cd89fea6f829', 'ad41a378-75b8-454b-a0b1-6eebcbb86945', '00000000-0000-4000-8000-000000000105', NULL, 5.00, 3000.00, 15000.00);
INSERT INTO public.sale_items VALUES ('c98f4367-14ab-4a72-b5fa-269ee719550b', 'ad41a378-75b8-454b-a0b1-6eebcbb86945', '00000000-0000-4000-8000-000000000108', NULL, 4.00, 2000.00, 8000.00);
INSERT INTO public.sale_items VALUES ('1231e16a-62e7-4f96-bb50-9a5270acf9b4', 'ad41a378-75b8-454b-a0b1-6eebcbb86945', '00000000-0000-4000-8000-000000000110', NULL, 1.00, 21000.00, 21000.00);
INSERT INTO public.sale_items VALUES ('4e6b56ac-df75-44a8-86ec-b12826700fe6', '512625e4-3698-4655-a497-95a5b06e023b', '00000000-0000-4000-8000-000000000101', NULL, 1.00, 62000.00, 62000.00);
INSERT INTO public.sale_items VALUES ('860f2f4e-48ac-4ca6-9d80-d077fb06283f', '512625e4-3698-4655-a497-95a5b06e023b', '00000000-0000-4000-8000-000000000106', NULL, 6.00, 3500.00, 21000.00);
INSERT INTO public.sale_items VALUES ('9e5be67a-ba37-4f90-a043-95cb8bd7d3fb', '4f53ec5a-9e03-4be7-8eff-e1fa62bf54ed', '00000000-0000-4000-8000-000000000103', NULL, 1.00, 17500.00, 17500.00);
INSERT INTO public.sale_items VALUES ('ed1da98c-cd48-44aa-b144-471a5da328f1', '4f53ec5a-9e03-4be7-8eff-e1fa62bf54ed', '00000000-0000-4000-8000-000000000109', NULL, 1.00, 6500.00, 6500.00);
INSERT INTO public.sale_items VALUES ('1fe066b2-a77e-4cce-977b-ee8137fd9937', '8bb36955-1bca-483b-b259-2c86ed2eedb2', '00000000-0000-4000-8000-000000000103', NULL, 1.00, 17500.00, 17500.00);
INSERT INTO public.sale_items VALUES ('dcd43795-3649-461b-b336-2e77434f01a6', 'd1ee58fa-d2f1-473b-8cc7-bd70c2c96bae', '00000000-0000-4000-8000-000000000101', NULL, 2.00, 62000.00, 124000.00);


--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: kastoko
--

INSERT INTO public.sales VALUES ('1b5c773a-9a90-4584-80bb-d10bafbf277e', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260903-01', '00000000-0000-4000-8000-000000000003', NULL, 'paid', 44000.00, 0.00, 'fixed', 44000.00, 'cash', 44000.00, 0.00, NULL, '2026-09-03 08:05:00+07', NULL, NULL, NULL, '2026-09-03 08:05:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('5e35901d-155d-4514-a892-02f4bcd0307f', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260903-02', '00000000-0000-4000-8000-000000000003', NULL, 'paid', 59000.00, 0.00, 'fixed', 59000.00, 'cash', 59000.00, 0.00, NULL, '2026-09-03 10:15:00+07', NULL, NULL, NULL, '2026-09-03 10:15:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('7a6145cb-7e6f-476e-928e-0bb2f097e5a5', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260903-03', '00000000-0000-4000-8000-000000000003', NULL, 'paid', 97000.00, 0.00, 'fixed', 97000.00, 'cash', 97000.00, 0.00, NULL, '2026-09-03 15:42:00+07', NULL, NULL, NULL, '2026-09-03 15:42:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('890af200-c4db-4e71-ba0d-a7f129e85bb7', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260904-01', '00000000-0000-4000-8000-000000000004', NULL, 'paid', 23000.00, 0.00, 'fixed', 23000.00, 'cash', 23000.00, 0.00, NULL, '2026-09-04 08:02:00+07', NULL, NULL, NULL, '2026-09-04 08:02:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('4a93b4f2-88c3-4feb-a7a7-8faccc54ffd0', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260904-02', '00000000-0000-4000-8000-000000000003', NULL, 'paid', 51000.00, 0.00, 'fixed', 51000.00, 'cash', 51000.00, 0.00, NULL, '2026-09-04 11:12:00+07', NULL, NULL, NULL, '2026-09-04 11:12:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('5874e56f-aa3f-42da-84bc-81bfe053f153', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260904-03', '00000000-0000-4000-8000-000000000003', NULL, 'paid', 36500.00, 0.00, 'fixed', 36500.00, 'cash', 36500.00, 0.00, NULL, '2026-09-04 13:30:00+07', NULL, NULL, NULL, '2026-09-04 13:30:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('f9112abc-5d9b-46b7-b994-a31023eb8e09', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260904-04', '00000000-0000-4000-8000-000000000003', NULL, 'paid', 154000.00, 0.00, 'fixed', 154000.00, 'cash', 154000.00, 0.00, NULL, '2026-09-04 16:50:00+07', NULL, NULL, NULL, '2026-09-04 16:50:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('ac1445c6-22f3-4a15-a150-997ab6ec356b', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260905-01', '00000000-0000-4000-8000-000000000003', NULL, 'paid', 40000.00, 0.00, 'fixed', 40000.00, 'cash', 40000.00, 0.00, NULL, '2026-09-05 08:01:00+07', NULL, NULL, NULL, '2026-09-05 08:01:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('84e276e9-d45b-4c6a-8094-dee46698cca1', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260905-02', '00000000-0000-4000-8000-000000000003', NULL, 'paid', 60000.00, 0.00, 'fixed', 60000.00, 'cash', 60000.00, 0.00, NULL, '2026-09-05 10:08:00+07', NULL, NULL, NULL, '2026-09-05 10:08:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('24de0886-007b-48d3-991c-4afbb3c4127d', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260905-03', '00000000-0000-4000-8000-000000000004', NULL, 'paid', 78000.00, 0.00, 'fixed', 78000.00, 'cash', 78000.00, 0.00, NULL, '2026-09-05 12:20:00+07', NULL, NULL, NULL, '2026-09-05 12:20:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('c4cc03c4-de9a-4675-8145-ad1a8955012b', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260905-04', '00000000-0000-4000-8000-000000000003', NULL, 'paid', 98500.00, 0.00, 'fixed', 98500.00, 'cash', 98500.00, 0.00, NULL, '2026-09-05 15:45:00+07', NULL, NULL, NULL, '2026-09-05 15:45:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('fb909148-f02b-4710-adaa-e998fd4dd7ce', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260905-05', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000302', 'credit', 84500.00, 0.00, 'fixed', 84500.00, 'credit', 0.00, 0.00, NULL, '2026-09-05 16:20:00+07', NULL, NULL, NULL, '2026-09-05 16:20:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('73781bab-962d-4f88-bb69-d3de9ed31b93', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260906-01', '00000000-0000-4000-8000-000000000003', NULL, 'paid', 60000.00, 0.00, 'fixed', 60000.00, 'cash', 60000.00, 0.00, NULL, '2026-09-06 09:10:00+07', NULL, NULL, NULL, '2026-09-06 09:10:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('bc4d03a4-81c2-4f85-951a-45db15c87dc5', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260906-02', '00000000-0000-4000-8000-000000000003', NULL, 'paid', 293000.00, 0.00, 'fixed', 293000.00, 'cash', 293000.00, 0.00, NULL, '2026-09-06 12:25:00+07', NULL, NULL, NULL, '2026-09-06 12:25:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('ba654baf-982d-4509-9ba6-f7702e255497', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260906-03', '00000000-0000-4000-8000-000000000003', NULL, 'paid', 186000.00, 0.00, 'fixed', 186000.00, 'cash', 186000.00, 0.00, NULL, '2026-09-06 17:40:00+07', NULL, NULL, NULL, '2026-09-06 17:40:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('d296dc65-f2b6-475b-b2db-8e1780e16c55', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260907-01', '00000000-0000-4000-8000-000000000003', NULL, 'paid', 60000.00, 0.00, 'fixed', 60000.00, 'cash', 60000.00, 0.00, NULL, '2026-09-07 08:09:00+07', NULL, NULL, NULL, '2026-09-07 08:09:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('f04bd50d-76ca-48b9-8350-71d09a405d67', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260907-02', '00000000-0000-4000-8000-000000000004', NULL, 'paid', 25000.00, 0.00, 'fixed', 25000.00, 'cash', 25000.00, 0.00, NULL, '2026-09-07 10:18:00+07', NULL, NULL, NULL, '2026-09-07 10:18:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('4456e5cb-774e-4208-9310-c766fd10f165', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260907-03', '00000000-0000-4000-8000-000000000003', NULL, 'paid', 160000.00, 0.00, 'fixed', 160000.00, 'cash', 160000.00, 0.00, NULL, '2026-09-07 13:35:00+07', NULL, NULL, NULL, '2026-09-07 13:35:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('f3c72e52-7083-4d57-a421-2e579086dd44', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260907-04', '00000000-0000-4000-8000-000000000003', NULL, 'paid', 176500.00, 0.00, 'fixed', 176500.00, 'cash', 176500.00, 0.00, NULL, '2026-09-07 18:55:00+07', NULL, NULL, NULL, '2026-09-07 18:55:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('c58dd04b-03aa-47c0-a053-1bdfb565ee03', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260908-01', '00000000-0000-4000-8000-000000000003', NULL, 'paid', 35000.00, 0.00, 'fixed', 35000.00, 'cash', 35000.00, 0.00, NULL, '2026-09-08 07:50:00+07', NULL, NULL, NULL, '2026-09-08 07:50:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('f7bcbdd5-a4d3-43f0-b894-4f840cbaa7d4', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260908-02', '00000000-0000-4000-8000-000000000003', NULL, 'paid', 57000.00, 0.00, 'fixed', 57000.00, 'cash', 57000.00, 0.00, NULL, '2026-09-08 09:06:00+07', NULL, NULL, NULL, '2026-09-08 09:06:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('f490ef8c-b58f-46b2-9500-0194cb68122b', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260908-03', '00000000-0000-4000-8000-000000000003', NULL, 'paid', 58000.00, 0.00, 'fixed', 58000.00, 'cash', 58000.00, 0.00, NULL, '2026-09-08 11:16:00+07', NULL, NULL, NULL, '2026-09-08 11:16:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('f1fe5c0d-fe1d-4e8e-aa51-31b9d72bf3db', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260908-04', '00000000-0000-4000-8000-000000000003', NULL, 'paid', 55500.00, 0.00, 'fixed', 55500.00, 'cash', 55500.00, 0.00, NULL, '2026-09-08 14:28:00+07', NULL, NULL, NULL, '2026-09-08 14:28:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('c6fee5e1-2c68-4185-a003-355b55552eb8', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260908-05', '00000000-0000-4000-8000-000000000004', NULL, 'paid', 460000.00, 0.00, 'fixed', 460000.00, 'cash', 460000.00, 0.00, NULL, '2026-09-08 16:44:00+07', NULL, NULL, NULL, '2026-09-08 16:44:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('760afbe8-bc58-4a90-806c-38c969aa6ff5', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260908-06', '00000000-0000-4000-8000-000000000003', NULL, 'paid', 184000.00, 0.00, 'fixed', 184000.00, 'cash', 184000.00, 0.00, NULL, '2026-09-08 18:58:00+07', NULL, NULL, NULL, '2026-09-08 18:58:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('8eda2be0-8dbe-4aa5-bbe1-c36083e51b86', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260909-01', '00000000-0000-4000-8000-000000000003', NULL, 'paid', 239000.00, 0.00, 'fixed', 239000.00, 'cash', 239000.00, 0.00, NULL, '2026-09-09 19:52:09.812+07', NULL, NULL, NULL, '2026-09-09 19:52:09.812+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('ad41a378-75b8-454b-a0b1-6eebcbb86945', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260909-02', '00000000-0000-4000-8000-000000000003', NULL, 'paid', 44000.00, 0.00, 'fixed', 44000.00, 'cash', 44000.00, 0.00, NULL, '2026-09-09 21:22:09.815+07', NULL, NULL, NULL, '2026-09-09 21:22:09.815+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('512625e4-3698-4655-a497-95a5b06e023b', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260909-03', '00000000-0000-4000-8000-000000000003', NULL, 'paid', 83000.00, 0.00, 'fixed', 83000.00, 'cash', 83000.00, 0.00, NULL, '2026-09-09 23:07:09.82+07', NULL, NULL, NULL, '2026-09-09 23:07:09.82+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('4f53ec5a-9e03-4be7-8eff-e1fa62bf54ed', '00000000-0000-4000-8000-000000000001', NULL, 'STR-20260909-04', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000301', 'credit', 24000.00, 0.00, 'fixed', 24000.00, 'credit', 0.00, 0.00, NULL, '2026-09-09 23:32:09.824+07', NULL, NULL, NULL, '2026-09-09 23:32:09.824+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('4bc011ad-7390-42c5-9c76-abdc314cb4cd', '00000000-0000-4000-8000-000000000001', NULL, 'STR-LAMA-0001', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000301', 'credit', 200000.00, 0.00, 'fixed', 200000.00, 'credit', 0.00, 0.00, NULL, NULL, NULL, NULL, NULL, '2026-09-01 09:15:00+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.sales VALUES ('8bb36955-1bca-483b-b259-2c86ed2eedb2', '00000000-0000-4000-8000-000000000001', 'd9ae6f1d-b921-4948-b51d-3b4de320fbae', 'STR-20260909-06', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000301', 'void', 17500.00, 0.00, 'fixed', 17500.00, 'credit', 0.00, 0.00, NULL, NULL, 'Salah input', '00000000-0000-4000-8000-000000000002', NULL, '2026-09-09 23:52:19.342311+07', '2026-09-09 23:52:25.771649+07');
INSERT INTO public.sales VALUES ('d1ee58fa-d2f1-473b-8cc7-bd70c2c96bae', '00000000-0000-4000-8000-000000000001', 'fa050348-cd73-46c0-9ee8-552c38239ba2', 'STR-20260909-05', '00000000-0000-4000-8000-000000000003', NULL, 'paid', 124000.00, 0.00, 'fixed', 124000.00, 'cash', 124000.00, 0.00, NULL, '2026-09-09 23:52:15.165595+07', NULL, NULL, NULL, '2026-09-09 23:52:15.165595+07', '2026-09-09 23:52:15.165595+07');


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: kastoko
--

INSERT INTO public.schema_migrations VALUES ('001_schema.sql', '2026-09-09 18:25:36.558576+07');
INSERT INTO public.schema_migrations VALUES ('002_rls_auth.sql', '2026-09-09 18:25:36.924039+07');
INSERT INTO public.schema_migrations VALUES ('003_funcs.sql', '2026-09-09 18:35:08.071891+07');
INSERT INTO public.schema_migrations VALUES ('004_kasir_view.sql', '2026-09-09 18:36:57.242298+07');


--
-- Data for Name: stock_mutations; Type: TABLE DATA; Schema: public; Owner: kastoko
--

INSERT INTO public.stock_mutations VALUES ('04d78918-d6e2-4d28-99c2-69b53798a46a', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'out', 'sale', 2.00, 'd1ee58fa-d2f1-473b-8cc7-bd70c2c96bae', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-09 23:52:15.165595+07');
INSERT INTO public.stock_mutations VALUES ('8cb82029-4ea5-413f-9303-755a5b57e179', '00000000-0000-4000-8000-000000000001', 'd1c65d9d-dea9-40de-9130-958373abd7f0', 'in', 'adjustment', 30.00, NULL, NULL, 'Stok awal saat produk dibuat', '00000000-0000-4000-8000-000000000002', '2026-09-09 23:52:22.190075+07');
INSERT INTO public.stock_mutations VALUES ('13f47030-0326-472f-a8dc-3ce2b9a8b063', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103', 'out', 'sale', 1.00, '8bb36955-1bca-483b-b259-2c86ed2eedb2', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-09 23:52:19.342311+07');
INSERT INTO public.stock_mutations VALUES ('aeb1aae7-28db-42dc-8da5-39b90ca70890', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103', 'in', 'sale_void', 1.00, '8bb36955-1bca-483b-b259-2c86ed2eedb2', NULL, 'Batal (void): Salah input', '00000000-0000-4000-8000-000000000002', '2026-09-09 23:52:25.771649+07');
INSERT INTO public.stock_mutations VALUES ('426e05a0-c334-4a6b-8cdb-c7b2d8edee72', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000105', 'out', 'sale', 8.00, '1b5c773a-9a90-4584-80bb-d10bafbf277e', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-03 08:05:00+07');
INSERT INTO public.stock_mutations VALUES ('dc483398-6968-4a29-9e45-ae6fb6f61fca', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000108', 'out', 'sale', 10.00, '1b5c773a-9a90-4584-80bb-d10bafbf277e', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-03 08:05:00+07');
INSERT INTO public.stock_mutations VALUES ('8518b08a-a4ab-4e93-b807-059b71c863d7', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000102', 'out', 'sale', 2.00, '5e35901d-155d-4514-a892-02f4bcd0307f', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-03 10:15:00+07');
INSERT INTO public.stock_mutations VALUES ('d3f1a538-82bc-44e5-ade4-a7a3b5e81c38', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000106', 'out', 'sale', 6.00, '5e35901d-155d-4514-a892-02f4bcd0307f', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-03 10:15:00+07');
INSERT INTO public.stock_mutations VALUES ('aa968914-f8e7-48d1-a789-f93d476015cf', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'out', 'sale', 1.00, '7a6145cb-7e6f-476e-928e-0bb2f097e5a5', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-03 15:42:00+07');
INSERT INTO public.stock_mutations VALUES ('8f6646bc-9c29-477c-93d3-bcfde11612e2', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103', 'out', 'sale', 2.00, '7a6145cb-7e6f-476e-928e-0bb2f097e5a5', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-03 15:42:00+07');
INSERT INTO public.stock_mutations VALUES ('76dea5f5-d7e8-4585-9b21-e4c682e44b1a', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000112', 'out', 'sale', 1.00, '890af200-c4db-4e71-ba0d-a7f129e85bb7', NULL, NULL, '00000000-0000-4000-8000-000000000004', '2026-09-04 08:02:00+07');
INSERT INTO public.stock_mutations VALUES ('8e61f369-f81f-4cb1-9100-08a1b093a5b9', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000110', 'out', 'sale', 2.00, '4a93b4f2-88c3-4feb-a7a7-8faccc54ffd0', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-04 11:12:00+07');
INSERT INTO public.stock_mutations VALUES ('79f340d1-2bbf-40d0-9ef0-aa3c0446fe79', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000111', 'out', 'sale', 2.00, '4a93b4f2-88c3-4feb-a7a7-8faccc54ffd0', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-04 11:12:00+07');
INSERT INTO public.stock_mutations VALUES ('8c8dfc99-c370-45c5-a1b6-f946c3471672', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000107', 'out', 'sale', 2.00, '5874e56f-aa3f-42da-84bc-81bfe053f153', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-04 13:30:00+07');
INSERT INTO public.stock_mutations VALUES ('905bfe25-d050-477a-8ea5-088bfa28f95f', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000109', 'out', 'sale', 1.00, '5874e56f-aa3f-42da-84bc-81bfe053f153', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-04 13:30:00+07');
INSERT INTO public.stock_mutations VALUES ('30e184d1-a9af-49e8-9673-924d1a90ae56', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'out', 'sale', 2.00, 'f9112abc-5d9b-46b7-b994-a31023eb8e09', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-04 16:50:00+07');
INSERT INTO public.stock_mutations VALUES ('abef3337-b7da-4745-9a15-ab8b9429fd89', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000104', 'out', 'sale', 1.00, 'f9112abc-5d9b-46b7-b994-a31023eb8e09', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-04 16:50:00+07');
INSERT INTO public.stock_mutations VALUES ('ba45afb4-41a0-4e45-ad90-4ff9c5d490d0', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000108', 'out', 'sale', 20.00, 'ac1445c6-22f3-4a15-a150-997ab6ec356b', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-05 08:01:00+07');
INSERT INTO public.stock_mutations VALUES ('30aac446-5e8f-49e2-b191-c79ddf7def58', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000104', 'out', 'sale', 2.00, '84e276e9-d45b-4c6a-8094-dee46698cca1', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-05 10:08:00+07');
INSERT INTO public.stock_mutations VALUES ('8168110a-f8b6-4c65-bd67-045f40f053a2', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000105', 'out', 'sale', 12.00, '24de0886-007b-48d3-991c-4afbb3c4127d', NULL, NULL, '00000000-0000-4000-8000-000000000004', '2026-09-05 12:20:00+07');
INSERT INTO public.stock_mutations VALUES ('67e458ad-ec5e-448c-806c-cea1a54f8d58', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000106', 'out', 'sale', 12.00, '24de0886-007b-48d3-991c-4afbb3c4127d', NULL, NULL, '00000000-0000-4000-8000-000000000004', '2026-09-05 12:20:00+07');
INSERT INTO public.stock_mutations VALUES ('413b2252-1dd8-4b31-8532-4cfe3aff576d', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'out', 'sale', 1.00, 'c4cc03c4-de9a-4675-8145-ad1a8955012b', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-05 15:45:00+07');
INSERT INTO public.stock_mutations VALUES ('618fa8c0-9e45-452f-a5df-f2ecfcb626ed', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000102', 'out', 'sale', 1.00, 'c4cc03c4-de9a-4675-8145-ad1a8955012b', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-05 15:45:00+07');
INSERT INTO public.stock_mutations VALUES ('25b71c6f-1790-42d7-8eb0-7300d44c48be', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103', 'out', 'sale', 1.00, 'c4cc03c4-de9a-4675-8145-ad1a8955012b', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-05 15:45:00+07');
INSERT INTO public.stock_mutations VALUES ('5e01876c-4fb1-4a25-bbdd-d883004cc027', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000113', 'out', 'sale', 2.00, 'fb909148-f02b-4710-adaa-e998fd4dd7ce', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-05 16:20:00+07');
INSERT INTO public.stock_mutations VALUES ('241117a9-1c48-491e-94a6-66cec1257c90', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000114', 'out', 'sale', 3.00, 'fb909148-f02b-4710-adaa-e998fd4dd7ce', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-05 16:20:00+07');
INSERT INTO public.stock_mutations VALUES ('b79fa28f-af0b-428c-a801-742fe23cd112', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000115', 'out', 'sale', 2.00, 'fb909148-f02b-4710-adaa-e998fd4dd7ce', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-05 16:20:00+07');
INSERT INTO public.stock_mutations VALUES ('a62f98fe-e313-4760-9254-0d7b02738d17', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000107', 'out', 'sale', 4.00, '73781bab-962d-4f88-bb69-d3de9ed31b93', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-06 09:10:00+07');
INSERT INTO public.stock_mutations VALUES ('12d70545-4ab2-4de4-8b12-4d51bc27b462', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000110', 'out', 'sale', 3.00, 'bc4d03a4-81c2-4f85-951a-45db15c87dc5', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-06 12:25:00+07');
INSERT INTO public.stock_mutations VALUES ('57b07abd-4d04-432b-a3f2-12878358b399', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000112', 'out', 'sale', 10.00, 'bc4d03a4-81c2-4f85-951a-45db15c87dc5', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-06 12:25:00+07');
INSERT INTO public.stock_mutations VALUES ('30ba4b03-1493-4f7a-b49a-2741e83340d0', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'out', 'sale', 3.00, 'ba654baf-982d-4509-9ba6-f7702e255497', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-06 17:40:00+07');
INSERT INTO public.stock_mutations VALUES ('c4754467-8d94-4c47-aaa1-203ab05c401b', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000105', 'out', 'sale', 20.00, 'd296dc65-f2b6-475b-b2db-8e1780e16c55', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-07 08:09:00+07');
INSERT INTO public.stock_mutations VALUES ('c6692ec7-2131-4535-955b-7bf14ff476e1', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000109', 'out', 'sale', 2.00, 'f04bd50d-76ca-48b9-8350-71d09a405d67', NULL, NULL, '00000000-0000-4000-8000-000000000004', '2026-09-07 10:18:00+07');
INSERT INTO public.stock_mutations VALUES ('1f97e175-9c36-4755-ab12-869b28480bcf', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000108', 'out', 'sale', 6.00, 'f04bd50d-76ca-48b9-8350-71d09a405d67', NULL, NULL, '00000000-0000-4000-8000-000000000004', '2026-09-07 10:18:00+07');
INSERT INTO public.stock_mutations VALUES ('edd8a8ae-95e8-4166-91aa-6d0664a1a8d6', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000102', 'out', 'sale', 4.00, '4456e5cb-774e-4208-9310-c766fd10f165', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-07 13:35:00+07');
INSERT INTO public.stock_mutations VALUES ('523977dd-1f3c-4ec7-9e77-9b2423a2c02b', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000106', 'out', 'sale', 24.00, '4456e5cb-774e-4208-9310-c766fd10f165', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-07 13:35:00+07');
INSERT INTO public.stock_mutations VALUES ('5f2ecfa0-80ea-4887-9772-23d8502eff92', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'out', 'sale', 2.00, 'f3c72e52-7083-4d57-a421-2e579086dd44', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-07 18:55:00+07');
INSERT INTO public.stock_mutations VALUES ('164bff07-c474-4a27-afeb-89949761088e', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103', 'out', 'sale', 3.00, 'f3c72e52-7083-4d57-a421-2e579086dd44', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-07 18:55:00+07');
INSERT INTO public.stock_mutations VALUES ('01b54ee4-d158-410a-807d-84314d7d5baf', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103', 'out', 'sale', 2.00, 'c58dd04b-03aa-47c0-a053-1bdfb565ee03', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-08 07:50:00+07');
INSERT INTO public.stock_mutations VALUES ('abf7a175-e601-4146-80d0-c89e50fea4ad', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000102', 'out', 'sale', 3.00, 'f7bcbdd5-a4d3-43f0-b894-4f840cbaa7d4', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-08 09:06:00+07');
INSERT INTO public.stock_mutations VALUES ('644bd092-314c-4df2-8352-5501a28a0515', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000106', 'out', 'sale', 12.00, 'f490ef8c-b58f-46b2-9500-0194cb68122b', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-08 11:16:00+07');
INSERT INTO public.stock_mutations VALUES ('041bac35-f02a-4dad-8cbb-cae0b44b45e2', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000108', 'out', 'sale', 8.00, 'f490ef8c-b58f-46b2-9500-0194cb68122b', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-08 11:16:00+07');
INSERT INTO public.stock_mutations VALUES ('537cc1d8-f3f9-4854-a8de-bf2b4abd7ed2', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000110', 'out', 'sale', 2.00, 'f1fe5c0d-fe1d-4e8e-aa51-31b9d72bf3db', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-08 14:28:00+07');
INSERT INTO public.stock_mutations VALUES ('ed5daf4d-35e7-4868-89d7-602f675c504c', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000111', 'out', 'sale', 3.00, 'f1fe5c0d-fe1d-4e8e-aa51-31b9d72bf3db', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-08 14:28:00+07');
INSERT INTO public.stock_mutations VALUES ('e4b3c6de-761d-417a-91bd-28898ea02f15', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000112', 'out', 'sale', 20.00, 'c6fee5e1-2c68-4185-a003-355b55552eb8', NULL, NULL, '00000000-0000-4000-8000-000000000004', '2026-09-08 16:44:00+07');
INSERT INTO public.stock_mutations VALUES ('21d135b3-0d92-4aae-ab7d-f0bad0604a46', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'out', 'sale', 2.00, '760afbe8-bc58-4a90-806c-38c969aa6ff5', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-08 18:58:00+07');
INSERT INTO public.stock_mutations VALUES ('5b7578fc-53a3-4111-ba36-6b8fd8d009d6', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000104', 'out', 'sale', 2.00, '760afbe8-bc58-4a90-806c-38c969aa6ff5', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-08 18:58:00+07');
INSERT INTO public.stock_mutations VALUES ('dd6b7e0c-b25e-4583-b8b1-7b97ddd67b08', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000111', 'out', 'sale', 2.00, '8eda2be0-8dbe-4aa5-bbe1-c36083e51b86', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-09 19:52:09.812+07');
INSERT INTO public.stock_mutations VALUES ('56e7db33-bc34-4fdc-a944-4f88d7e2e87a', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000112', 'out', 'sale', 10.00, '8eda2be0-8dbe-4aa5-bbe1-c36083e51b86', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-09 19:52:09.812+07');
INSERT INTO public.stock_mutations VALUES ('52499834-ed18-4cee-8d72-e57b1d7000b3', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000105', 'out', 'sale', 5.00, 'ad41a378-75b8-454b-a0b1-6eebcbb86945', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-09 21:22:09.815+07');
INSERT INTO public.stock_mutations VALUES ('0d01ddce-a2bd-49db-bf48-af0e98cd9c36', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000108', 'out', 'sale', 4.00, 'ad41a378-75b8-454b-a0b1-6eebcbb86945', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-09 21:22:09.815+07');
INSERT INTO public.stock_mutations VALUES ('d3a0ce09-4f62-4a42-b3a8-a692d39dbc7e', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000110', 'out', 'sale', 1.00, 'ad41a378-75b8-454b-a0b1-6eebcbb86945', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-09 21:22:09.815+07');
INSERT INTO public.stock_mutations VALUES ('67a16580-23a6-428f-82ee-4700cd61c149', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'out', 'sale', 1.00, '512625e4-3698-4655-a497-95a5b06e023b', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-09 23:07:09.82+07');
INSERT INTO public.stock_mutations VALUES ('da8e2f9c-6127-4bb7-9991-afa28aaec120', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000106', 'out', 'sale', 6.00, '512625e4-3698-4655-a497-95a5b06e023b', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-09 23:07:09.82+07');
INSERT INTO public.stock_mutations VALUES ('7953b218-1b49-498f-b582-0e738adf9c07', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103', 'out', 'sale', 1.00, '4f53ec5a-9e03-4be7-8eff-e1fa62bf54ed', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-09 23:32:09.824+07');
INSERT INTO public.stock_mutations VALUES ('d9e8c179-e354-44a5-bb5d-d6804f03b3c4', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000109', 'out', 'sale', 1.00, '4f53ec5a-9e03-4be7-8eff-e1fa62bf54ed', NULL, NULL, '00000000-0000-4000-8000-000000000003', '2026-09-09 23:32:09.824+07');
INSERT INTO public.stock_mutations VALUES ('8b9f2395-35f1-45a3-842c-6edb30be2026', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'in', 'purchase', 8.00, NULL, 'f1ad813f-fac9-4699-8b41-40e6c432c096', 'Kulakan dari UD Sinar Mas', '00000000-0000-4000-8000-000000000002', '2026-09-05 09:00:00+07');
INSERT INTO public.stock_mutations VALUES ('a9d921b3-028f-46b2-83b7-3bae47d91316', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000115', 'in', 'purchase', 12.00, NULL, 'f1ad813f-fac9-4699-8b41-40e6c432c096', 'Kulakan dari UD Sinar Mas', '00000000-0000-4000-8000-000000000002', '2026-09-05 09:00:00+07');
INSERT INTO public.stock_mutations VALUES ('76e90e19-7eb1-410a-bb26-0004d864bee2', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000105', 'in', 'purchase', 60.00, NULL, 'abde13c8-fba1-4a9d-9f5c-9b67366c9888', 'Kulakan dari CV Makmur Sentosa', '00000000-0000-4000-8000-000000000002', '2026-09-07 08:30:00+07');
INSERT INTO public.stock_mutations VALUES ('c4ec3c62-82e8-4811-9ff5-1b24cebb3f36', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000106', 'in', 'purchase', 48.00, NULL, 'abde13c8-fba1-4a9d-9f5c-9b67366c9888', 'Kulakan dari CV Makmur Sentosa', '00000000-0000-4000-8000-000000000002', '2026-09-07 08:30:00+07');
INSERT INTO public.stock_mutations VALUES ('761dd7a1-37e4-4898-b705-ba3104ae9e32', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000103', 'out', 'damage', 2.00, NULL, NULL, 'Kemasan sobek dimakan tikus', '00000000-0000-4000-8000-000000000003', '2026-09-08 07:50:00+07');


--
-- Data for Name: store_members; Type: TABLE DATA; Schema: public; Owner: kastoko
--

INSERT INTO public.store_members VALUES ('572ebb7e-733d-47a3-9889-8418ec95dacd', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'owner', 's1$O87unLZ8Ngxw4+oNNN4JAg==$skXKuKM9lFerV/5OvuzJ2uhotxNsQ4ZPx6y2k8YFx6M=', 'active', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.store_members VALUES ('752335c9-3329-47c7-93d0-5534096d91a1', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003', 'cashier', 's1$R18bQFKERd3YyO3KckqAdA==$0SGtRPOEE+dTTXiuxDuUv67B+0+cMmb4ZNKPD4uOXAY=', 'active', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.store_members VALUES ('a40706f4-1c7e-47e1-8990-a946e7bb5eae', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004', 'cashier', 's1$D1ee7IE5/69OfmtHYl1iJw==$7eEwFlxjQNKdyjq2r8OE0/OCIIgx+HV2gvZ5jOwc9G4=', 'active', '2026-09-09 23:52:09.415188+07');


--
-- Data for Name: stores; Type: TABLE DATA; Schema: public; Owner: kastoko
--

INSERT INTO public.stores VALUES ('00000000-0000-4000-8000-000000000001', 'Toko Berkah Jaya', 'Jl. Melati No. 12, Surabaya', '0851-2345-6789', 'Terima kasih atas kunjungan Anda!', 'IDR', 'trial', '2026-09-23 23:52:09.415188+07', true, NULL, NULL, '2026-09-09 23:52:09.415188+07');


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: kastoko
--

INSERT INTO public.suppliers VALUES ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', 'UD Sinar Mas', '031-555-1234', 'Jl. Pasar Keputran', true, '2026-09-09 23:52:09.415188+07');
INSERT INTO public.suppliers VALUES ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000001', 'CV Makmur Sentosa', '031-555-9876', 'Jl. Tambak Mayor', true, '2026-09-09 23:52:09.415188+07');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: kastoko
--

INSERT INTO public.users VALUES ('00000000-0000-4000-8000-000000000002', 'Budi Santoso', 'budi@tokoberkah.id', 's1$k7kmzph0URj0svRkRDiW6Q==$V5/zoSMLvzNj+f/yTSYwU6TiRpnqCo40qrHQXj99n90=', '0851-2345-6789', '2026-09-09 23:52:09.415188+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.users VALUES ('00000000-0000-4000-8000-000000000003', 'Siti Rahma', 'siti@tokoberkah.id', 's1$k7kmzph0URj0svRkRDiW6Q==$V5/zoSMLvzNj+f/yTSYwU6TiRpnqCo40qrHQXj99n90=', '0812-9999-0000', '2026-09-09 23:52:09.415188+07', '2026-09-09 23:52:09.415188+07');
INSERT INTO public.users VALUES ('00000000-0000-4000-8000-000000000004', 'Rina Wati', 'rina@tokoberkah.id', 's1$k7kmzph0URj0svRkRDiW6Q==$V5/zoSMLvzNj+f/yTSYwU6TiRpnqCo40qrHQXj99n90=', NULL, '2026-09-09 23:52:09.415188+07', '2026-09-09 23:52:09.415188+07');


--
-- Name: app_sessions app_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.app_sessions
    ADD CONSTRAINT app_sessions_pkey PRIMARY KEY (id);


--
-- Name: app_sessions app_sessions_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.app_sessions
    ADD CONSTRAINT app_sessions_token_hash_key UNIQUE (token_hash);


--
-- Name: cash_flows cash_flows_pkey; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.cash_flows
    ADD CONSTRAINT cash_flows_pkey PRIMARY KEY (id);


--
-- Name: cashier_shifts cashier_shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.cashier_shifts
    ADD CONSTRAINT cashier_shifts_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_store_id_name_key; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_store_id_name_key UNIQUE (store_id, name);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: duitku_payments duitku_payments_merchant_order_id_key; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.duitku_payments
    ADD CONSTRAINT duitku_payments_merchant_order_id_key UNIQUE (merchant_order_id);


--
-- Name: duitku_payments duitku_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.duitku_payments
    ADD CONSTRAINT duitku_payments_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payable_payments payable_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.payable_payments
    ADD CONSTRAINT payable_payments_pkey PRIMARY KEY (id);


--
-- Name: payables payables_pkey; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.payables
    ADD CONSTRAINT payables_pkey PRIMARY KEY (id);


--
-- Name: payables payables_purchase_id_key; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.payables
    ADD CONSTRAINT payables_purchase_id_key UNIQUE (purchase_id);


--
-- Name: product_units product_units_pkey; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.product_units
    ADD CONSTRAINT product_units_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_store_id_barcode_key; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_store_id_barcode_key UNIQUE (store_id, barcode);


--
-- Name: products products_store_id_sku_key; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_store_id_sku_key UNIQUE (store_id, sku);


--
-- Name: purchase_items purchase_items_pkey; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_pkey PRIMARY KEY (id);


--
-- Name: purchases purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);


--
-- Name: purchases purchases_store_id_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_store_id_invoice_number_key UNIQUE (store_id, invoice_number);


--
-- Name: receivable_payments receivable_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.receivable_payments
    ADD CONSTRAINT receivable_payments_pkey PRIMARY KEY (id);


--
-- Name: receivables receivables_pkey; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.receivables
    ADD CONSTRAINT receivables_pkey PRIMARY KEY (id);


--
-- Name: receivables receivables_sale_id_key; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.receivables
    ADD CONSTRAINT receivables_sale_id_key UNIQUE (sale_id);


--
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);


--
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- Name: sales sales_store_id_receipt_number_key; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_store_id_receipt_number_key UNIQUE (store_id, receipt_number);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (filename);


--
-- Name: stock_mutations stock_mutations_pkey; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.stock_mutations
    ADD CONSTRAINT stock_mutations_pkey PRIMARY KEY (id);


--
-- Name: store_members store_members_pkey; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.store_members
    ADD CONSTRAINT store_members_pkey PRIMARY KEY (id);


--
-- Name: store_members store_members_store_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.store_members
    ADD CONSTRAINT store_members_store_id_user_id_key UNIQUE (store_id, user_id);


--
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_cash_flows_store_created; Type: INDEX; Schema: public; Owner: kastoko
--

CREATE INDEX idx_cash_flows_store_created ON public.cash_flows USING btree (store_id, created_at DESC);


--
-- Name: idx_cashier_shifts_store; Type: INDEX; Schema: public; Owner: kastoko
--

CREATE INDEX idx_cashier_shifts_store ON public.cashier_shifts USING btree (store_id, opened_at DESC);


--
-- Name: idx_notifications_user_read; Type: INDEX; Schema: public; Owner: kastoko
--

CREATE INDEX idx_notifications_user_read ON public.notifications USING btree (user_id, is_read, created_at DESC);


--
-- Name: idx_products_store_barcode; Type: INDEX; Schema: public; Owner: kastoko
--

CREATE INDEX idx_products_store_barcode ON public.products USING btree (store_id, barcode);


--
-- Name: idx_sale_items_sale; Type: INDEX; Schema: public; Owner: kastoko
--

CREATE INDEX idx_sale_items_sale ON public.sale_items USING btree (sale_id);


--
-- Name: idx_sales_receipt; Type: INDEX; Schema: public; Owner: kastoko
--

CREATE INDEX idx_sales_receipt ON public.sales USING btree (receipt_number);


--
-- Name: idx_sales_store_created; Type: INDEX; Schema: public; Owner: kastoko
--

CREATE INDEX idx_sales_store_created ON public.sales USING btree (store_id, created_at DESC);


--
-- Name: idx_stock_mutations_product; Type: INDEX; Schema: public; Owner: kastoko
--

CREATE INDEX idx_stock_mutations_product ON public.stock_mutations USING btree (product_id, created_at DESC);


--
-- Name: uq_shift_open_per_cashier; Type: INDEX; Schema: public; Owner: kastoko
--

CREATE UNIQUE INDEX uq_shift_open_per_cashier ON public.cashier_shifts USING btree (cashier_id) WHERE (status = 'open'::text);


--
-- Name: duitku_payments trg_duitku_updated; Type: TRIGGER; Schema: public; Owner: kastoko
--

CREATE TRIGGER trg_duitku_updated BEFORE UPDATE ON public.duitku_payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: products trg_products_updated; Type: TRIGGER; Schema: public; Owner: kastoko
--

CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: sales trg_sales_updated; Type: TRIGGER; Schema: public; Owner: kastoko
--

CREATE TRIGGER trg_sales_updated BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: users trg_users_updated; Type: TRIGGER; Schema: public; Owner: kastoko
--

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: app_sessions app_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.app_sessions
    ADD CONSTRAINT app_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: cash_flows cash_flows_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.cash_flows
    ADD CONSTRAINT cash_flows_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: cashier_shifts cashier_shifts_cashier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.cashier_shifts
    ADD CONSTRAINT cashier_shifts_cashier_id_fkey FOREIGN KEY (cashier_id) REFERENCES public.users(id);


--
-- Name: cashier_shifts cashier_shifts_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.cashier_shifts
    ADD CONSTRAINT cashier_shifts_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: categories categories_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: customers customers_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: duitku_payments duitku_payments_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.duitku_payments
    ADD CONSTRAINT duitku_payments_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;


--
-- Name: duitku_payments duitku_payments_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.duitku_payments
    ADD CONSTRAINT duitku_payments_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: expenses expenses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: expenses expenses_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payable_payments payable_payments_accepted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.payable_payments
    ADD CONSTRAINT payable_payments_accepted_by_fkey FOREIGN KEY (accepted_by) REFERENCES public.users(id);


--
-- Name: payable_payments payable_payments_payable_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.payable_payments
    ADD CONSTRAINT payable_payments_payable_id_fkey FOREIGN KEY (payable_id) REFERENCES public.payables(id) ON DELETE CASCADE;


--
-- Name: payable_payments payable_payments_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.payable_payments
    ADD CONSTRAINT payable_payments_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: payables payables_purchase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.payables
    ADD CONSTRAINT payables_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.purchases(id) ON DELETE CASCADE;


--
-- Name: payables payables_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.payables
    ADD CONSTRAINT payables_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: payables payables_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.payables
    ADD CONSTRAINT payables_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: product_units product_units_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.product_units
    ADD CONSTRAINT product_units_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: products products_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: purchase_items purchase_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: purchase_items purchase_items_purchase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.purchases(id) ON DELETE CASCADE;


--
-- Name: purchases purchases_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: purchases purchases_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: purchases purchases_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: receivable_payments receivable_payments_accepted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.receivable_payments
    ADD CONSTRAINT receivable_payments_accepted_by_fkey FOREIGN KEY (accepted_by) REFERENCES public.users(id);


--
-- Name: receivable_payments receivable_payments_receivable_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.receivable_payments
    ADD CONSTRAINT receivable_payments_receivable_id_fkey FOREIGN KEY (receivable_id) REFERENCES public.receivables(id) ON DELETE CASCADE;


--
-- Name: receivable_payments receivable_payments_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.receivable_payments
    ADD CONSTRAINT receivable_payments_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: receivables receivables_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.receivables
    ADD CONSTRAINT receivables_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: receivables receivables_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.receivables
    ADD CONSTRAINT receivables_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;


--
-- Name: receivables receivables_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.receivables
    ADD CONSTRAINT receivables_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: sale_items sale_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: sale_items sale_items_product_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_product_unit_id_fkey FOREIGN KEY (product_unit_id) REFERENCES public.product_units(id);


--
-- Name: sale_items sale_items_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;


--
-- Name: sales sales_cashier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_cashier_id_fkey FOREIGN KEY (cashier_id) REFERENCES public.users(id);


--
-- Name: sales sales_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: sales sales_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.cashier_shifts(id) ON DELETE SET NULL;


--
-- Name: sales sales_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: sales sales_voided_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_voided_by_fkey FOREIGN KEY (voided_by) REFERENCES public.users(id);


--
-- Name: stock_mutations stock_mutations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.stock_mutations
    ADD CONSTRAINT stock_mutations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: stock_mutations stock_mutations_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.stock_mutations
    ADD CONSTRAINT stock_mutations_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: stock_mutations stock_mutations_purchase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.stock_mutations
    ADD CONSTRAINT stock_mutations_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.purchases(id) ON DELETE SET NULL;


--
-- Name: stock_mutations stock_mutations_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.stock_mutations
    ADD CONSTRAINT stock_mutations_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE SET NULL;


--
-- Name: stock_mutations stock_mutations_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.stock_mutations
    ADD CONSTRAINT stock_mutations_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: store_members store_members_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.store_members
    ADD CONSTRAINT store_members_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: store_members store_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.store_members
    ADD CONSTRAINT store_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: suppliers suppliers_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kastoko
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: app_sessions; Type: ROW SECURITY; Schema: public; Owner: kastoko
--

ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: cash_flows; Type: ROW SECURITY; Schema: public; Owner: kastoko
--

ALTER TABLE public.cash_flows ENABLE ROW LEVEL SECURITY;

--
-- Name: cashier_shifts; Type: ROW SECURITY; Schema: public; Owner: kastoko
--

ALTER TABLE public.cashier_shifts ENABLE ROW LEVEL SECURITY;

--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: kastoko
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: customers; Type: ROW SECURITY; Schema: public; Owner: kastoko
--

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

--
-- Name: duitku_payments; Type: ROW SECURITY; Schema: public; Owner: kastoko
--

ALTER TABLE public.duitku_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: expenses; Type: ROW SECURITY; Schema: public; Owner: kastoko
--

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: kastoko
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: cash_flows p_cash_insert; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_cash_insert ON public.cash_flows FOR INSERT WITH CHECK (public.kas_is_member(store_id));


--
-- Name: cash_flows p_cash_read; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_cash_read ON public.cash_flows FOR SELECT USING (public.kas_is_member(store_id));


--
-- Name: categories p_categories_owner; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_categories_owner ON public.categories USING (public.kas_is_owner(store_id)) WITH CHECK (public.kas_is_owner(store_id));


--
-- Name: categories p_categories_read; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_categories_read ON public.categories FOR SELECT USING (public.kas_is_member(store_id));


--
-- Name: customers p_customers_any; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_customers_any ON public.customers FOR INSERT WITH CHECK (public.kas_is_member(store_id));


--
-- Name: customers p_customers_owner; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_customers_owner ON public.customers FOR UPDATE USING (public.kas_is_owner(store_id));


--
-- Name: customers p_customers_owner_del; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_customers_owner_del ON public.customers FOR DELETE USING (public.kas_is_owner(store_id));


--
-- Name: customers p_customers_read; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_customers_read ON public.customers FOR SELECT USING (public.kas_is_member(store_id));


--
-- Name: duitku_payments p_duitku_all; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_duitku_all ON public.duitku_payments USING (public.kas_is_member(store_id)) WITH CHECK (public.kas_is_member(store_id));


--
-- Name: expenses p_exp_read; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_exp_read ON public.expenses FOR SELECT USING (public.kas_is_member(store_id));


--
-- Name: expenses p_exp_write; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_exp_write ON public.expenses USING (public.kas_is_member(store_id)) WITH CHECK (public.kas_is_member(store_id));


--
-- Name: store_members p_members_owner_delete; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_members_owner_delete ON public.store_members FOR DELETE USING ((public.kas_is_owner(store_id) AND (role = 'cashier'::text)));


--
-- Name: store_members p_members_owner_update; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_members_owner_update ON public.store_members FOR UPDATE USING (public.kas_is_owner(store_id));


--
-- Name: store_members p_members_owner_write; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_members_owner_write ON public.store_members FOR INSERT WITH CHECK (public.kas_is_owner(store_id));


--
-- Name: store_members p_members_read; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_members_read ON public.store_members FOR SELECT USING (((user_id = public.kas_user_id()) OR public.kas_is_owner(store_id)));


--
-- Name: stock_mutations p_mutations_insert; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_mutations_insert ON public.stock_mutations FOR INSERT WITH CHECK (public.kas_is_member(store_id));


--
-- Name: stock_mutations p_mutations_read; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_mutations_read ON public.stock_mutations FOR SELECT USING (public.kas_is_member(store_id));


--
-- Name: notifications p_notif_insert; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_notif_insert ON public.notifications FOR INSERT WITH CHECK (public.kas_is_member(store_id));


--
-- Name: notifications p_notif_read; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_notif_read ON public.notifications FOR SELECT USING ((user_id = public.kas_user_id()));


--
-- Name: notifications p_notif_update; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_notif_update ON public.notifications FOR UPDATE USING ((user_id = public.kas_user_id()));


--
-- Name: payables p_pay_read; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_pay_read ON public.payables FOR SELECT USING (public.kas_is_member(store_id));


--
-- Name: payables p_pay_update; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_pay_update ON public.payables FOR UPDATE USING (public.kas_is_member(store_id));


--
-- Name: payables p_pay_write; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_pay_write ON public.payables FOR INSERT WITH CHECK (public.kas_is_owner(store_id));


--
-- Name: payable_payments p_paypay_insert; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_paypay_insert ON public.payable_payments FOR INSERT WITH CHECK (public.kas_is_member(store_id));


--
-- Name: payable_payments p_paypay_read; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_paypay_read ON public.payable_payments FOR SELECT USING (public.kas_is_member(store_id));


--
-- Name: products p_products_owner; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_products_owner ON public.products USING (public.kas_is_owner(store_id)) WITH CHECK (public.kas_is_owner(store_id));


--
-- Name: products p_products_read; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_products_read ON public.products FOR SELECT USING (public.kas_is_member(store_id));


--
-- Name: product_units p_punits_owner; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_punits_owner ON public.product_units USING ((EXISTS ( SELECT 1
   FROM public.products p
  WHERE ((p.id = product_units.product_id) AND public.kas_is_owner(p.store_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.products p
  WHERE ((p.id = product_units.product_id) AND public.kas_is_owner(p.store_id)))));


--
-- Name: product_units p_punits_read; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_punits_read ON public.product_units FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.products p
  WHERE ((p.id = product_units.product_id) AND public.kas_is_member(p.store_id)))));


--
-- Name: purchases p_purchases_owner; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_purchases_owner ON public.purchases USING (public.kas_is_owner(store_id)) WITH CHECK (public.kas_is_owner(store_id));


--
-- Name: purchases p_purchases_read; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_purchases_read ON public.purchases FOR SELECT USING (public.kas_is_member(store_id));


--
-- Name: purchase_items p_puritems_owner; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_puritems_owner ON public.purchase_items USING ((EXISTS ( SELECT 1
   FROM public.purchases p
  WHERE ((p.id = purchase_items.purchase_id) AND public.kas_is_owner(p.store_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.purchases p
  WHERE ((p.id = purchase_items.purchase_id) AND public.kas_is_owner(p.store_id)))));


--
-- Name: purchase_items p_puritems_read; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_puritems_read ON public.purchase_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.purchases p
  WHERE ((p.id = purchase_items.purchase_id) AND public.kas_is_member(p.store_id)))));


--
-- Name: receivables p_receiv_read; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_receiv_read ON public.receivables FOR SELECT USING (public.kas_is_member(store_id));


--
-- Name: receivables p_receiv_update; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_receiv_update ON public.receivables FOR UPDATE USING (public.kas_is_member(store_id));


--
-- Name: receivables p_receiv_write; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_receiv_write ON public.receivables FOR INSERT WITH CHECK (public.kas_is_member(store_id));


--
-- Name: receivable_payments p_recpay_insert; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_recpay_insert ON public.receivable_payments FOR INSERT WITH CHECK (public.kas_is_member(store_id));


--
-- Name: receivable_payments p_recpay_read; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_recpay_read ON public.receivable_payments FOR SELECT USING (public.kas_is_member(store_id));


--
-- Name: sale_items p_saleitems_insert; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_saleitems_insert ON public.sale_items FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.sales s
  WHERE ((s.id = sale_items.sale_id) AND (s.cashier_id = public.kas_user_id())))));


--
-- Name: sale_items p_saleitems_read; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_saleitems_read ON public.sale_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.sales s
  WHERE ((s.id = sale_items.sale_id) AND public.kas_is_member(s.store_id)))));


--
-- Name: sales p_sales_insert; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_sales_insert ON public.sales FOR INSERT WITH CHECK ((public.kas_is_member(store_id) AND (cashier_id = public.kas_user_id())));


--
-- Name: sales p_sales_read; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_sales_read ON public.sales FOR SELECT USING (public.kas_is_member(store_id));


--
-- Name: sales p_sales_update; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_sales_update ON public.sales FOR UPDATE USING (public.kas_is_member(store_id)) WITH CHECK (((status <> 'void'::text) OR public.kas_is_owner(store_id)));


--
-- Name: app_sessions p_sessions_own; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_sessions_own ON public.app_sessions USING ((user_id = public.kas_user_id()));


--
-- Name: cashier_shifts p_shifts_read; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_shifts_read ON public.cashier_shifts FOR SELECT USING (public.kas_is_member(store_id));


--
-- Name: cashier_shifts p_shifts_update; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_shifts_update ON public.cashier_shifts FOR UPDATE USING ((public.kas_is_owner(store_id) OR (cashier_id = public.kas_user_id())));


--
-- Name: cashier_shifts p_shifts_write; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_shifts_write ON public.cashier_shifts FOR INSERT WITH CHECK ((public.kas_is_member(store_id) AND (cashier_id = public.kas_user_id())));


--
-- Name: stores p_stores_member; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_stores_member ON public.stores FOR SELECT USING (public.kas_is_member(id));


--
-- Name: stores p_stores_owner_update; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_stores_owner_update ON public.stores FOR UPDATE USING (public.kas_is_owner(id));


--
-- Name: suppliers p_suppliers_owner; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_suppliers_owner ON public.suppliers USING (public.kas_is_owner(store_id)) WITH CHECK (public.kas_is_owner(store_id));


--
-- Name: suppliers p_suppliers_read; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_suppliers_read ON public.suppliers FOR SELECT USING (public.kas_is_member(store_id));


--
-- Name: users p_users_read; Type: POLICY; Schema: public; Owner: kastoko
--

CREATE POLICY p_users_read ON public.users FOR SELECT USING (public.kas_can_read_user(id));


--
-- Name: payable_payments; Type: ROW SECURITY; Schema: public; Owner: kastoko
--

ALTER TABLE public.payable_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: payables; Type: ROW SECURITY; Schema: public; Owner: kastoko
--

ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;

--
-- Name: product_units; Type: ROW SECURITY; Schema: public; Owner: kastoko
--

ALTER TABLE public.product_units ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: kastoko
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: purchase_items; Type: ROW SECURITY; Schema: public; Owner: kastoko
--

ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

--
-- Name: purchases; Type: ROW SECURITY; Schema: public; Owner: kastoko
--

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

--
-- Name: receivable_payments; Type: ROW SECURITY; Schema: public; Owner: kastoko
--

ALTER TABLE public.receivable_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: receivables; Type: ROW SECURITY; Schema: public; Owner: kastoko
--

ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;

--
-- Name: sale_items; Type: ROW SECURITY; Schema: public; Owner: kastoko
--

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

--
-- Name: sales; Type: ROW SECURITY; Schema: public; Owner: kastoko
--

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_mutations; Type: ROW SECURITY; Schema: public; Owner: kastoko
--

ALTER TABLE public.stock_mutations ENABLE ROW LEVEL SECURITY;

--
-- Name: store_members; Type: ROW SECURITY; Schema: public; Owner: kastoko
--

ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;

--
-- Name: stores; Type: ROW SECURITY; Schema: public; Owner: kastoko
--

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

--
-- Name: suppliers; Type: ROW SECURITY; Schema: public; Owner: kastoko
--

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: kastoko
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO kastoko_app;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.armor(bytea) TO kastoko_app;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.armor(bytea, text[], text[]) TO kastoko_app;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.crypt(text, text) TO kastoko_app;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.dearmor(text) TO kastoko_app;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.decrypt(bytea, bytea, text) TO kastoko_app;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.decrypt_iv(bytea, bytea, bytea, text) TO kastoko_app;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.digest(bytea, text) TO kastoko_app;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.digest(text, text) TO kastoko_app;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.encrypt(bytea, bytea, text) TO kastoko_app;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.encrypt_iv(bytea, bytea, bytea, text) TO kastoko_app;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.gen_random_bytes(integer) TO kastoko_app;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.gen_random_uuid() TO kastoko_app;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.gen_salt(text) TO kastoko_app;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.gen_salt(text, integer) TO kastoko_app;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.hmac(bytea, bytea, text) TO kastoko_app;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.hmac(text, text, text) TO kastoko_app;


--
-- Name: FUNCTION kas_can_read_user(p_target uuid); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.kas_can_read_user(p_target uuid) TO kastoko_app;


--
-- Name: FUNCTION kas_create_session(p_user uuid, p_token_hash text, p_ttl_minutes integer); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.kas_create_session(p_user uuid, p_token_hash text, p_ttl_minutes integer) TO kastoko_app;


--
-- Name: FUNCTION kas_daftar_kasir(p_store uuid); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.kas_daftar_kasir(p_store uuid) TO kastoko_app;


--
-- Name: FUNCTION kas_destroy_session(p_token_hash text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.kas_destroy_session(p_token_hash text) TO kastoko_app;


--
-- Name: FUNCTION kas_find_user_by_email(p_email text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.kas_find_user_by_email(p_email text) TO kastoko_app;


--
-- Name: FUNCTION kas_is_member(p_store uuid); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.kas_is_member(p_store uuid) TO kastoko_app;


--
-- Name: FUNCTION kas_is_owner(p_store uuid); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.kas_is_owner(p_store uuid) TO kastoko_app;


--
-- Name: FUNCTION kas_nomor_struk(p_store uuid, p_tanggal date); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.kas_nomor_struk(p_store uuid, p_tanggal date) TO kastoko_app;


--
-- Name: FUNCTION kas_notif_toko(p_store uuid, p_type text, p_title text, p_message text, p_data jsonb); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.kas_notif_toko(p_store uuid, p_type text, p_title text, p_message text, p_data jsonb) TO kastoko_app;


--
-- Name: FUNCTION kas_read_session(p_token_hash text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.kas_read_session(p_token_hash text) TO kastoko_app;


--
-- Name: FUNCTION kas_register_store(p_full_name text, p_email text, p_password_hash text, p_pin_hash text, p_store_name text, p_address text, p_phone text, p_trial_days integer); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.kas_register_store(p_full_name text, p_email text, p_password_hash text, p_pin_hash text, p_store_name text, p_address text, p_phone text, p_trial_days integer) TO kastoko_app;


--
-- Name: FUNCTION kas_store_role(p_store uuid); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.kas_store_role(p_store uuid) TO kastoko_app;


--
-- Name: FUNCTION kas_tambah_kasir(p_store uuid, p_nama text, p_email text, p_pin_hash text, p_password_hash text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.kas_tambah_kasir(p_store uuid, p_nama text, p_email text, p_pin_hash text, p_password_hash text) TO kastoko_app;


--
-- Name: FUNCTION kas_ubah_stok(p_product uuid, p_delta numeric); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.kas_ubah_stok(p_product uuid, p_delta numeric) TO kastoko_app;


--
-- Name: FUNCTION kas_user_context(p_user uuid); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.kas_user_context(p_user uuid) TO kastoko_app;


--
-- Name: FUNCTION kas_user_id(); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.kas_user_id() TO kastoko_app;


--
-- Name: FUNCTION kas_user_pin_hash(p_user uuid); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.kas_user_pin_hash(p_user uuid) TO kastoko_app;


--
-- Name: FUNCTION kas_void_sale(p_sale uuid, p_alasan text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.kas_void_sale(p_sale uuid, p_alasan text) TO kastoko_app;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.pgp_armor_headers(text, OUT key text, OUT value text) TO kastoko_app;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.pgp_key_id(bytea) TO kastoko_app;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.pgp_pub_decrypt(bytea, bytea) TO kastoko_app;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.pgp_pub_decrypt(bytea, bytea, text) TO kastoko_app;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.pgp_pub_decrypt(bytea, bytea, text, text) TO kastoko_app;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea) TO kastoko_app;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea, text) TO kastoko_app;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO kastoko_app;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.pgp_pub_encrypt(text, bytea) TO kastoko_app;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.pgp_pub_encrypt(text, bytea, text) TO kastoko_app;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.pgp_pub_encrypt_bytea(bytea, bytea) TO kastoko_app;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.pgp_pub_encrypt_bytea(bytea, bytea, text) TO kastoko_app;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.pgp_sym_decrypt(bytea, text) TO kastoko_app;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.pgp_sym_decrypt(bytea, text, text) TO kastoko_app;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.pgp_sym_decrypt_bytea(bytea, text) TO kastoko_app;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.pgp_sym_decrypt_bytea(bytea, text, text) TO kastoko_app;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.pgp_sym_encrypt(text, text) TO kastoko_app;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.pgp_sym_encrypt(text, text, text) TO kastoko_app;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.pgp_sym_encrypt_bytea(bytea, text) TO kastoko_app;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.pgp_sym_encrypt_bytea(bytea, text, text) TO kastoko_app;


--
-- Name: FUNCTION set_updated_at(); Type: ACL; Schema: public; Owner: kastoko
--

GRANT ALL ON FUNCTION public.set_updated_at() TO kastoko_app;


--
-- Name: TABLE app_sessions; Type: ACL; Schema: public; Owner: kastoko
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.app_sessions TO kastoko_app;


--
-- Name: TABLE cash_flows; Type: ACL; Schema: public; Owner: kastoko
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.cash_flows TO kastoko_app;


--
-- Name: TABLE cashier_shifts; Type: ACL; Schema: public; Owner: kastoko
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.cashier_shifts TO kastoko_app;


--
-- Name: TABLE categories; Type: ACL; Schema: public; Owner: kastoko
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.categories TO kastoko_app;


--
-- Name: TABLE customers; Type: ACL; Schema: public; Owner: kastoko
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.customers TO kastoko_app;


--
-- Name: TABLE duitku_payments; Type: ACL; Schema: public; Owner: kastoko
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.duitku_payments TO kastoko_app;


--
-- Name: TABLE expenses; Type: ACL; Schema: public; Owner: kastoko
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.expenses TO kastoko_app;


--
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: kastoko
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.notifications TO kastoko_app;


--
-- Name: TABLE payable_payments; Type: ACL; Schema: public; Owner: kastoko
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.payable_payments TO kastoko_app;


--
-- Name: TABLE payables; Type: ACL; Schema: public; Owner: kastoko
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.payables TO kastoko_app;


--
-- Name: TABLE product_units; Type: ACL; Schema: public; Owner: kastoko
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.product_units TO kastoko_app;


--
-- Name: TABLE products; Type: ACL; Schema: public; Owner: kastoko
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.products TO kastoko_app;


--
-- Name: TABLE purchase_items; Type: ACL; Schema: public; Owner: kastoko
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.purchase_items TO kastoko_app;


--
-- Name: TABLE purchases; Type: ACL; Schema: public; Owner: kastoko
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.purchases TO kastoko_app;


--
-- Name: TABLE receivable_payments; Type: ACL; Schema: public; Owner: kastoko
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.receivable_payments TO kastoko_app;


--
-- Name: TABLE receivables; Type: ACL; Schema: public; Owner: kastoko
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.receivables TO kastoko_app;


--
-- Name: TABLE sale_items; Type: ACL; Schema: public; Owner: kastoko
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.sale_items TO kastoko_app;


--
-- Name: TABLE sales; Type: ACL; Schema: public; Owner: kastoko
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.sales TO kastoko_app;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: public; Owner: kastoko
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.schema_migrations TO kastoko_app;


--
-- Name: TABLE stock_mutations; Type: ACL; Schema: public; Owner: kastoko
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.stock_mutations TO kastoko_app;


--
-- Name: TABLE store_members; Type: ACL; Schema: public; Owner: kastoko
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.store_members TO kastoko_app;


--
-- Name: TABLE stores; Type: ACL; Schema: public; Owner: kastoko
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.stores TO kastoko_app;


--
-- Name: TABLE suppliers; Type: ACL; Schema: public; Owner: kastoko
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.suppliers TO kastoko_app;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: kastoko
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.users TO kastoko_app;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: kastoko
--

ALTER DEFAULT PRIVILEGES FOR ROLE kastoko IN SCHEMA public GRANT SELECT,USAGE ON SEQUENCES TO kastoko_app;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: kastoko
--

ALTER DEFAULT PRIVILEGES FOR ROLE kastoko IN SCHEMA public GRANT ALL ON FUNCTIONS TO kastoko_app;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: kastoko
--

ALTER DEFAULT PRIVILEGES FOR ROLE kastoko IN SCHEMA public GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO kastoko_app;


--
-- PostgreSQL database dump complete
--


