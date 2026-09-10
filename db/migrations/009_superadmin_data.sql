CREATE OR REPLACE FUNCTION public.kas_superadmin_get_platform_data()
RETURNS JSON
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'metrics', (
      SELECT json_build_object(
        'total', count(*),
        'active', count(*) FILTER (WHERE subscription_status = 'active'),
        'trial', count(*) FILTER (WHERE subscription_status = 'trial'),
        'expired', count(*) FILTER (WHERE subscription_status = 'expired')
      ) FROM stores
    ),
    'stores', (
      SELECT coalesce(json_agg(
        json_build_object(
          'id', s.id,
          'name', s.name,
          'address', s.address,
          'phone', s.phone,
          'subscription_status', s.subscription_status,
          'subscription_expires_at', s.subscription_expires_at,
          'created_at', s.created_at,
          'owner_name', u.full_name,
          'owner_email', u.email,
          'is_online', EXISTS (
            SELECT 1 FROM app_sessions sess
            JOIN store_members m ON m.user_id = sess.user_id
            WHERE m.store_id = s.id AND sess.expires_at > NOW()
          ),
          'last_seen_at', (
            SELECT MAX(sess.created_at) FROM app_sessions sess
            JOIN store_members m ON m.user_id = sess.user_id
            WHERE m.store_id = s.id
          )
        ) ORDER BY s.created_at DESC
      ), '[]'::json)
      FROM stores s
      JOIN store_members sm ON sm.store_id = s.id AND sm.role = 'owner'
      JOIN users u ON u.id = sm.user_id
    )
  ) INTO v_result;
  RETURN v_result;
END;
$$;

GRANT ALL ON FUNCTION public.kas_superadmin_get_platform_data() TO kastoko_app;
