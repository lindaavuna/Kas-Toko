-- ============================================================
-- 003: fungsi bisnis SECURITY DEFINER.
-- Why definer: role app tidak punya UPDATE penuh ke products (harga & margin
-- milik owner), tapi stok harus jalan saat kasir menjual. Guard peran
-- dilakukan DI DALAM fungsi lewat kas_store_role()/kas_user_id().
-- ============================================================

-- ubah stok atomik; tolak jadi negatif kecuali diminta (opname boleh)
create or replace function public.kas_ubah_stok(p_product uuid, p_delta numeric)
returns numeric
language plpgsql security definer set search_path = public as $$
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

-- nomor struk harian per toko: STR-YYYYMMDD-NN
create or replace function public.kas_nomor_struk(p_store uuid, p_tanggal date)
returns text
language sql stable security definer set search_path = public as $$
  select 'STR-' || to_char(p_tanggal, 'YYYYMMDD') || '-' ||
         lpad((count(*) + 1)::text, 2, '0')
  from sales
  where store_id = p_store
    and created_at::date = p_tanggal
$$;

-- kirim notifikasi ke seluruh anggota toko aktif (kasir tidak boleh membaca
-- daftar user owner untuk diisi manual, jadi helper ini yang isi)
create or replace function public.kas_notif_toko(
  p_store uuid, p_type text, p_title text, p_message text, p_data jsonb default '{}'
) returns void
language sql security definer set search_path = public as $$
  insert into notifications (store_id, user_id, type, title, message, data)
  select m.store_id, m.user_id, p_type, p_title, p_message, p_data
  from store_members m
  where m.store_id = p_store and m.status = 'active'
    and p_type in ('stock_low','sale_paid','sync_error')
$$;

-- VOID transaksi: hanya pemilik; kembalikan stok, potong kas, hapus piutang
-- terkait, catat mutasi sale_void, dan tandai alasan — satu atomik.
create or replace function public.kas_void_sale(p_sale uuid, p_alasan text)
returns text
language plpgsql security definer set search_path = public as $$
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

-- pemilik menambah akun kasir (password acak; login cukup email + PIN)
create or replace function public.kas_tambah_kasir(
  p_store uuid, p_nama text, p_email text, p_pin_hash text, p_password_hash text
) returns uuid
language plpgsql security definer set search_path = public as $$
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
