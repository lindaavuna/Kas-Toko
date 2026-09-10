-- 006: Modul Super Admin Platform
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN DEFAULT false;

-- Jadikan user pertama (Budi Santoso) sebagai superadmin default
UPDATE public.users SET is_superadmin = true WHERE email = 'budi@tokoberkah.id';

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id INT PRIMARY KEY DEFAULT 1,
  platform_name TEXT DEFAULT 'KasToko Cloud Platform',
  monthly_subscription_fee INT DEFAULT 50000,
  trial_days INT DEFAULT 7,
  pg_provider VARCHAR(32) DEFAULT 'paywuz',
  pg_merchant_code VARCHAR(128),
  pg_api_key TEXT,
  pg_is_sandbox BOOLEAN DEFAULT true,
  pg_is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.platform_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
