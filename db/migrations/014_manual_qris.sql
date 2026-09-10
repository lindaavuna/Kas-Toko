-- Kolom QRIS manual untuk Platform Owner (uang sewa)
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS manual_qris_image TEXT,
  ADD COLUMN IF NOT EXISTS manual_bank_name VARCHAR(64),
  ADD COLUMN IF NOT EXISTS manual_bank_account VARCHAR(64),
  ADD COLUMN IF NOT EXISTS manual_bank_holder VARCHAR(128),
  ADD COLUMN IF NOT EXISTS manual_qris_is_active BOOLEAN DEFAULT true;

-- Kolom QRIS manual untuk Toko Ritel (kasir POS)
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS manual_qris_image TEXT,
  ADD COLUMN IF NOT EXISTS manual_bank_name VARCHAR(64),
  ADD COLUMN IF NOT EXISTS manual_bank_account VARCHAR(64),
  ADD COLUMN IF NOT EXISTS manual_bank_holder VARCHAR(128);
