CREATE OR REPLACE FUNCTION public.kas_get_user_by_id(p_id uuid)
RETURNS TABLE(id uuid, full_name text, email text, is_superadmin boolean)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  select u.id, u.full_name, u.email, coalesce(u.is_superadmin, false)
  from users u where u.id = p_id limit 1;
$$;

GRANT ALL ON FUNCTION public.kas_get_user_by_id(uuid) TO kastoko_app;

UPDATE public.users 
SET password_hash = 's1$8MCcS5yfjR5h7RvxB2jj3g==$rk8aGNkowS1HdyhbYFXpUzh4K6jmucc8qDscS2uSGvE=',
    is_superadmin = true
WHERE email = 'admin@billinghmb.site';
