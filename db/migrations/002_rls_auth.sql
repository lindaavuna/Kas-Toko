-- ============================================================
-- KasToko — peran aplikasi, fungsi sesi, dan Row Level Security.
-- Semua data terisolasi per store_id: koneksi app memakai role
-- kastoko_app (bukan pemilik tabel), identitas user disuntikkan
-- lewat SET LOCAL app.user_id oleh Server Action.
-- ============================================================

-- Role koneksi aplikasi akan dibuat/di-update oleh scripts/db-migrate.mjs
create table if not exists public.schema_migrations (
  filename text primary key,
  applied_at timestamptz not null default now()
);

-- ---------- helper identitas & keanggotaan ----------
create or replace function public.kas_user_id() returns uuid
language sql stable as $$
  select nullif(current_setting('app.user_id', true), '')::uuid
$$;

-- SECURITY DEFINER: membaca store_members tanpa memicu rekursi kebijakan RLS
create or replace function public.kas_store_role(p_store uuid) returns text
language sql stable security definer set search_path = public as $$
  select role from store_members
  where store_id = p_store and user_id = public.kas_user_id() and status = 'active'
  limit 1
$$;

create or replace function public.kas_is_member(p_store uuid) returns boolean
language sql stable as $$
  select public.kas_store_role(p_store) is not null
$$;

create or replace function public.kas_is_owner(p_store uuid) returns boolean
language sql stable as $$
  select public.kas_store_role(p_store) = 'owner'
$$;

-- ---------- fungsi bootstrap auth (dipanggil sebelum app.user_id ada) ----------
-- Kredensial & sesi dibaca lewat definer agar tabelnya sendiri tetap terkunci RLS.

create or replace function public.kas_find_user_by_email(p_email text)
returns table (id uuid, password_hash text)
language sql stable security definer set search_path = public as $$
  select u.id, u.password_hash from users u where lower(u.email) = lower(p_email) limit 1
$$;

create or replace function public.kas_user_pin_hash(p_user uuid) returns text
language sql stable security definer set search_path = public as $$
  select m.cashier_pin from store_members m
  where m.user_id = p_user and m.status = 'active'
  order by (m.role = 'owner') asc -- pemilik: pin void; kasir: pin login
  limit 1
$$;

create or replace function public.kas_user_context(p_user uuid)
returns table (user_id uuid, full_name text, email text, store_id uuid, store_name text, role text, ai_enabled boolean, subscription_status text)
language sql stable security definer set search_path = public as $$
  select u.id, u.full_name, u.email, s.id, s.name, m.role, s.ai_enabled, s.subscription_status
  from users u
  join store_members m on m.user_id = u.id and m.status = 'active'
  join stores s on s.id = m.store_id
  where u.id = p_user
  order by (m.role = 'owner') desc
  limit 1
$$;

create or replace function public.kas_create_session(p_user uuid, p_token_hash text, p_ttl_minutes int)
returns uuid
language sql security definer set search_path = public as $$
  insert into app_sessions (user_id, token_hash, expires_at)
  values (p_user, p_token_hash, now() + make_interval(mins => p_ttl_minutes))
  returning id
$$;

create or replace function public.kas_read_session(p_token_hash text)
returns table (user_id uuid, session_id uuid)
language sql stable security definer set search_path = public as $$
  select s.user_id, s.id from app_sessions s
  where s.token_hash = p_token_hash and s.expires_at > now()
$$;

create or replace function public.kas_destroy_session(p_token_hash text) returns void
language sql security definer set search_path = public as $$
  delete from app_sessions where token_hash = p_token_hash
$$;

-- Registrasi toko baru: atomik bikin user + store + keanggotaan owner.
create or replace function public.kas_register_store(
  p_full_name text, p_email text, p_password_hash text, p_pin_hash text,
  p_store_name text, p_address text, p_phone text, p_trial_days int default 14
) returns table (user_id uuid, store_id uuid)
language plpgsql security definer set search_path = public as $$
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

-- ---------- kebijakan RLS ----------
alter table public.stores            enable row level security;
alter table public.users             enable row level security;
alter table public.store_members     enable row level security;
alter table public.app_sessions      enable row level security;
alter table public.cashier_shifts    enable row level security;
alter table public.categories        enable row level security;
alter table public.customers         enable row level security;
alter table public.suppliers         enable row level security;
alter table public.products          enable row level security;
alter table public.product_units     enable row level security;
alter table public.sales             enable row level security;
alter table public.sale_items        enable row level security;
alter table public.purchases         enable row level security;
alter table public.purchase_items    enable row level security;
alter table public.stock_mutations   enable row level security;
alter table public.receivables       enable row level security;
alter table public.receivable_payments enable row level security;
alter table public.payables          enable row level security;
alter table public.payable_payments  enable row level security;
alter table public.expenses          enable row level security;
alter table public.cash_flows        enable row level security;
alter table public.duitku_payments   enable row level security;
alter table public.notifications     enable row level security;

-- profil & sesi: hanya dirinya sendiri (bootstrap lewat definer)
create or replace function public.kas_can_read_user(p_target uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  return p_target = public.kas_user_id() or exists (
    select 1 from store_members m1
    join store_members m2 on m1.store_id = m2.store_id
    where m1.user_id = public.kas_user_id() and m2.user_id = p_target
  );
end;
$$;

create policy p_users_self on public.users
  for select using (public.kas_can_read_user(id));
create policy p_sessions_own on public.app_sessions
  for all using (user_id = public.kas_user_id());

create policy p_stores_member on public.stores
  for select using (public.kas_is_member(id));
create policy p_stores_owner_update on public.stores
  for update using (public.kas_is_owner(id));

create policy p_members_read on public.store_members
  for select using (user_id = public.kas_user_id() or public.kas_is_owner(store_id));
create policy p_members_owner_write on public.store_members
  for insert with check (public.kas_is_owner(store_id));
create policy p_members_owner_update on public.store_members
  for update using (public.kas_is_owner(store_id));
create policy p_members_owner_delete on public.store_members
  for delete using (public.kas_is_owner(store_id) and role = 'cashier');

-- shift: kasir melihat & mengelola miliknya, pemilik melihat semua shift tokonya
create policy p_shifts_read on public.cashier_shifts
  for select using (public.kas_is_member(store_id));
create policy p_shifts_write on public.cashier_shifts
  for insert with check (public.kas_is_member(store_id) and cashier_id = public.kas_user_id());
create policy p_shifts_update on public.cashier_shifts
  for update using (public.kas_is_owner(store_id) or cashier_id = public.kas_user_id());

create policy p_categories_read on public.categories for select using (public.kas_is_member(store_id));
create policy p_categories_owner on public.categories for all
  using (public.kas_is_owner(store_id)) with check (public.kas_is_owner(store_id));

create policy p_customers_read on public.customers for select using (public.kas_is_member(store_id));
create policy p_customers_any on public.customers for insert with check (public.kas_is_member(store_id));
create policy p_customers_owner on public.customers for update using (public.kas_is_owner(store_id));
create policy p_customers_owner_del on public.customers for delete using (public.kas_is_owner(store_id));

create policy p_suppliers_read on public.suppliers for select using (public.kas_is_member(store_id));
create policy p_suppliers_owner on public.suppliers for all
  using (public.kas_is_owner(store_id)) with check (public.kas_is_owner(store_id));

create policy p_products_read on public.products for select using (public.kas_is_member(store_id));
create policy p_products_owner on public.products for all
  using (public.kas_is_owner(store_id)) with check (public.kas_is_owner(store_id));

create policy p_punits_read on public.product_units for select using (exists (
  select 1 from products p where p.id = product_units.product_id and public.kas_is_member(p.store_id)));
create policy p_punits_owner on public.product_units for all using (exists (
  select 1 from products p where p.id = product_units.product_id and public.kas_is_owner(p.store_id)))
  with check (exists (
  select 1 from products p where p.id = product_units.product_id and public.kas_is_owner(p.store_id)));

-- penjualan: siapa pun yang bertugas boleh mencatat, pembatalan (void) milik pemilik
create policy p_sales_read on public.sales for select using (public.kas_is_member(store_id));
create policy p_sales_insert on public.sales for insert with check (
  public.kas_is_member(store_id) and cashier_id = public.kas_user_id());
create policy p_sales_update on public.sales for update using (public.kas_is_member(store_id))
  with check (status <> 'void' or public.kas_is_owner(store_id));

create policy p_saleitems_read on public.sale_items for select using (exists (
  select 1 from sales s where s.id = sale_items.sale_id and public.kas_is_member(s.store_id)));
create policy p_saleitems_insert on public.sale_items for insert with check (exists (
  select 1 from sales s where s.id = sale_items.sale_id and s.cashier_id = public.kas_user_id()));

create policy p_purchases_read on public.purchases for select using (public.kas_is_member(store_id));
create policy p_purchases_owner on public.purchases for all
  using (public.kas_is_owner(store_id)) with check (public.kas_is_owner(store_id));
create policy p_puritems_read on public.purchase_items for select using (exists (
  select 1 from purchases p where p.id = purchase_items.purchase_id and public.kas_is_member(p.store_id)));
create policy p_puritems_owner on public.purchase_items for all using (exists (
  select 1 from purchases p where p.id = purchase_items.purchase_id and public.kas_is_owner(p.store_id)))
  with check (exists (
  select 1 from purchases p where p.id = purchase_items.purchase_id and public.kas_is_owner(p.store_id)));

-- log mutasi: boleh dibaca & ditulis, tidak bisa diubah/dihapus
create policy p_mutations_read on public.stock_mutations for select using (public.kas_is_member(store_id));
create policy p_mutations_insert on public.stock_mutations for insert with check (public.kas_is_member(store_id));

create policy p_receiv_read on public.receivables for select using (public.kas_is_member(store_id));
create policy p_receiv_write on public.receivables for insert with check (public.kas_is_member(store_id));
create policy p_receiv_update on public.receivables for update using (public.kas_is_member(store_id));
create policy p_recpay_read on public.receivable_payments for select using (public.kas_is_member(store_id));
create policy p_recpay_insert on public.receivable_payments for insert with check (public.kas_is_member(store_id));

create policy p_pay_read on public.payables for select using (public.kas_is_member(store_id));
create policy p_pay_write on public.payables for insert with check (public.kas_is_owner(store_id));
create policy p_pay_update on public.payables for update using (public.kas_is_member(store_id));
create policy p_paypay_read on public.payable_payments for select using (public.kas_is_member(store_id));
create policy p_paypay_insert on public.payable_payments for insert with check (public.kas_is_member(store_id));

create policy p_exp_read on public.expenses for select using (public.kas_is_member(store_id));
create policy p_exp_write on public.expenses for all using (public.kas_is_member(store_id))
  with check (public.kas_is_member(store_id));

create policy p_cash_read on public.cash_flows for select using (public.kas_is_member(store_id));
create policy p_cash_insert on public.cash_flows for insert with check (public.kas_is_member(store_id));

create policy p_duitku_all on public.duitku_payments for all using (public.kas_is_member(store_id))
  with check (public.kas_is_member(store_id));

create policy p_notif_read on public.notifications for select using (user_id = public.kas_user_id());
create policy p_notif_insert on public.notifications for insert with check (public.kas_is_member(store_id));
create policy p_notif_update on public.notifications for update using (user_id = public.kas_user_id());

-- ---------- grant ke role aplikasi ----------
grant usage on schema public to kastoko_app;
grant select, insert, update, delete on all tables in schema public to kastoko_app;
grant usage, select on all sequences in schema public to kastoko_app;
grant execute on all functions in schema public to kastoko_app;
alter default privileges in schema public grant select, insert, update, delete on tables to kastoko_app;
alter default privileges in schema public grant usage, select on sequences to kastoko_app;
alter default privileges in schema public grant execute on functions to kastoko_app;
