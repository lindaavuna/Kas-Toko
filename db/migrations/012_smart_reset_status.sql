CREATE OR REPLACE FUNCTION public.kas_superadmin_set_store_status(p_store_id uuid, p_status text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_status = 'trial' THEN
    -- Reset kembali ke masa uji coba 7 hari dari HARI INI
    UPDATE stores
    SET subscription_status = 'trial',
        subscription_expires_at = NOW() + INTERVAL '7 days',
        updated_at = NOW()
    WHERE id = p_store_id;
  ELSIF p_status = 'active_30' THEN
    -- Reset aktif 30 hari mulai HARI INI
    UPDATE stores
    SET subscription_status = 'active',
        subscription_expires_at = NOW() + INTERVAL '30 days',
        updated_at = NOW()
    WHERE id = p_store_id;
  ELSIF p_status = 'active_365' THEN
    -- Reset aktif 1 tahun mulai HARI INI
    UPDATE stores
    SET subscription_status = 'active',
        subscription_expires_at = NOW() + INTERVAL '1 year',
        updated_at = NOW()
    WHERE id = p_store_id;
  ELSIF p_status = 'expired' THEN
    -- Suspend / Kunci toko sekarang juga
    UPDATE stores
    SET subscription_status = 'expired',
        subscription_expires_at = NOW() - INTERVAL '1 second',
        updated_at = NOW()
    WHERE id = p_store_id;
  ELSE
    UPDATE stores
    SET subscription_status = p_status,
        updated_at = NOW()
    WHERE id = p_store_id;
  END IF;
  RETURN FOUND;
END;
$$;
GRANT ALL ON FUNCTION public.kas_superadmin_set_store_status(uuid, text) TO kastoko_app;
