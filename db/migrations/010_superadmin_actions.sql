-- Fungsi ubah status toko oleh Super Admin
CREATE OR REPLACE FUNCTION public.kas_superadmin_set_store_status(p_store_id uuid, p_status text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE stores
  SET subscription_status = p_status,
      updated_at = NOW()
  WHERE id = p_store_id;
  RETURN FOUND;
END;
$$;
GRANT ALL ON FUNCTION public.kas_superadmin_set_store_status(uuid, text) TO kastoko_app;

-- Fungsi perpanjang sewa toko oleh Super Admin
CREATE OR REPLACE FUNCTION public.kas_superadmin_extend_store(p_store_id uuid, p_days integer)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE stores
  SET subscription_expires_at = COALESCE(
        CASE WHEN subscription_expires_at > NOW() THEN subscription_expires_at ELSE NOW() END,
        NOW()
      ) + make_interval(days => p_days),
      subscription_status = 'active',
      updated_at = NOW()
  WHERE id = p_store_id;
  RETURN FOUND;
END;
$$;
GRANT ALL ON FUNCTION public.kas_superadmin_extend_store(uuid, integer) TO kastoko_app;
