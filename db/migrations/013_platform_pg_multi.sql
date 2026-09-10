ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS duitku_merchant_code VARCHAR(128),
  ADD COLUMN IF NOT EXISTS duitku_api_key TEXT,
  ADD COLUMN IF NOT EXISTS duitku_is_sandbox BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS duitku_is_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS paywuz_api_key TEXT,
  ADD COLUMN IF NOT EXISTS paywuz_is_sandbox BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS paywuz_is_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS primary_gateway VARCHAR(32) DEFAULT 'paywuz',
  ADD COLUMN IF NOT EXISTS enable_failover BOOLEAN DEFAULT true;
