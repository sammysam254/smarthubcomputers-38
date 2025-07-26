-- Create admin user with sammyseth260@gmail.com
-- First, let's create a proper admin role system
CREATE OR REPLACE FUNCTION public.create_admin_user()
RETURNS void AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Create the admin user in auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'sammyseth260@gmail.com',
    crypt('58369234', gen_salt('bf')),
    NOW(),
    NOW(),
    '',
    NOW(),
    '',
    NOW(),
    '',
    '',
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin User"}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NOW(),
    '',
    0,
    NULL,
    '',
    NOW()
  ) RETURNING id INTO admin_user_id;

  -- Create profile for admin user
  INSERT INTO public.profiles (
    user_id,
    full_name,
    role
  ) VALUES (
    admin_user_id,
    'Admin User',
    'admin'
  );
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to create admin user
SELECT public.create_admin_user();

-- Drop the function as it's no longer needed
DROP FUNCTION public.create_admin_user();

-- Update RLS policies to support admin access
-- Create a security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update policies to allow admin access
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.is_admin());

-- Update other admin-related policies
DROP POLICY IF EXISTS "Authenticated users can access flash_sales" ON public.flash_sales;
CREATE POLICY "Anyone can view flash_sales" ON public.flash_sales FOR SELECT USING (true);
CREATE POLICY "Admins can manage flash_sales" ON public.flash_sales FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can access promotions" ON public.promotions;
CREATE POLICY "Anyone can view promotions" ON public.promotions FOR SELECT USING (true);
CREATE POLICY "Admins can manage promotions" ON public.promotions FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can access vouchers" ON public.vouchers;
CREATE POLICY "Anyone can view vouchers" ON public.vouchers FOR SELECT USING (true);
CREATE POLICY "Admins can manage vouchers" ON public.vouchers FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can access payments" ON public.mpesa_payments;
CREATE POLICY "Admins can access payments" ON public.mpesa_payments FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can access ncba payments" ON public.ncba_loop_payments;
CREATE POLICY "Admins can access ncba payments" ON public.ncba_loop_payments FOR ALL USING (public.is_admin());

-- Support ticket policies - users can access their own, admins can access all
DROP POLICY IF EXISTS "Users can access their support tickets" ON public.support_tickets;
CREATE POLICY "Users can access own tickets or admins can access all" 
ON public.support_tickets FOR ALL 
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can access their ticket messages" ON public.ticket_messages;
CREATE POLICY "Users can access own messages or admins can access all" 
ON public.ticket_messages FOR ALL 
USING (auth.uid() = sender_id OR public.is_admin());