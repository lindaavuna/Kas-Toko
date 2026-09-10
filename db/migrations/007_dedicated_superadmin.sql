-- 007: Restrukturisasi akun Super Admin murni
UPDATE public.users SET is_superadmin = false WHERE email = 'budi@tokoberkah.id';

INSERT INTO public.users (id, full_name, email, password_hash, is_superadmin)
VALUES (
  gen_random_uuid(),
  'Super Admin Platform',
  'admin@billinghmb.site',
  's1$8MCcS5yfjR5h7RvxB2jj3g==$rk8aGNkowS1HdyhbYFXpUzh4K6jmucc8qDscS2uSGvE=',
  true
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  is_superadmin = true;
