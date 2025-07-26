-- Grant admin privileges to sammdev.ai@gmail.com
UPDATE public.profiles 
SET role = 'admin', updated_at = now()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'sammdev.ai@gmail.com'
);

-- If no profile exists, create one
INSERT INTO public.profiles (user_id, role, full_name, created_at, updated_at)
SELECT 
  id,
  'admin',
  COALESCE(raw_user_meta_data->>'full_name', email),
  now(),
  now()
FROM auth.users 
WHERE email = 'sammdev.ai@gmail.com' 
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.users.id
  );