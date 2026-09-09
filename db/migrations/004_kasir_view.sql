-- 004: daftar kasir utk pemilik (email user lain tidak bisa dibaca langsung)
create or replace function public.kas_daftar_kasir(p_store uuid)
returns table (id uuid, nama text, email text, aktif boolean)
language sql stable security definer set search_path = public as $$
  select m.user_id, u.full_name, u.email, m.status = 'active'
  from store_members m
  join users u on u.id = m.user_id
  where m.store_id = p_store and m.role = 'cashier'
    and public.kas_store_role(p_store) = 'owner'
  order by u.full_name
$$;
