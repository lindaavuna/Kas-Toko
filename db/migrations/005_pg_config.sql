-- 005: Konfigurasi Payment Gateway di tabel stores
ALTER TABLE public.stores 
  ADD COLUMN IF NOT EXISTS pg_provider VARCHAR(32) DEFAULT 'duitku',
  ADD COLUMN IF NOT EXISTS pg_merchant_code VARCHAR(128),
  ADD COLUMN IF NOT EXISTS pg_api_key TEXT,
  ADD COLUMN IF NOT EXISTS pg_is_sandbox BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS pg_is_active BOOLEAN DEFAULT false;
