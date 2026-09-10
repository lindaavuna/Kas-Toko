ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS yearly_subscription_fee INT DEFAULT 550000;
