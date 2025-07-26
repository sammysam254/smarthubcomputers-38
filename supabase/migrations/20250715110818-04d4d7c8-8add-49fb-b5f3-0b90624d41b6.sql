-- Update existing user to be admin and create helper functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Try to update existing user's profile to admin
DO $$
DECLARE
  admin_user_uuid UUID;
BEGIN
  -- Find the user by email
  SELECT id INTO admin_user_uuid 
  FROM auth.users 
  WHERE email = 'sammyseth260@gmail.com';
  
  IF admin_user_uuid IS NOT NULL THEN
    -- Update or insert profile
    INSERT INTO public.profiles (user_id, full_name, role)
    VALUES (admin_user_uuid, 'Admin User', 'admin')
    ON CONFLICT (user_id) 
    DO UPDATE SET role = 'admin', full_name = 'Admin User';
  END IF;
END $$;

-- Update policies to allow admin access
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (public.is_admin());

-- Update flash sales policies
DROP POLICY IF EXISTS "Authenticated users can access flash_sales" ON public.flash_sales;
DROP POLICY IF EXISTS "Anyone can view flash_sales" ON public.flash_sales;
DROP POLICY IF EXISTS "Admins can manage flash_sales" ON public.flash_sales;

CREATE POLICY "Anyone can view flash_sales" ON public.flash_sales FOR SELECT USING (true);
CREATE POLICY "Admins can insert flash_sales" ON public.flash_sales FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update flash_sales" ON public.flash_sales FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete flash_sales" ON public.flash_sales FOR DELETE USING (public.is_admin());

-- Update promotions policies
DROP POLICY IF EXISTS "Authenticated users can access promotions" ON public.promotions;
DROP POLICY IF EXISTS "Anyone can view promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admins can manage promotions" ON public.promotions;

CREATE POLICY "Anyone can view promotions" ON public.promotions FOR SELECT USING (true);
CREATE POLICY "Admins can insert promotions" ON public.promotions FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update promotions" ON public.promotions FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete promotions" ON public.promotions FOR DELETE USING (public.is_admin());

-- Update vouchers policies
DROP POLICY IF EXISTS "Authenticated users can access vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Anyone can view vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Admins can manage vouchers" ON public.vouchers;

CREATE POLICY "Anyone can view vouchers" ON public.vouchers FOR SELECT USING (true);
CREATE POLICY "Admins can insert vouchers" ON public.vouchers FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update vouchers" ON public.vouchers FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete vouchers" ON public.vouchers FOR DELETE USING (public.is_admin());

-- Update payment policies
DROP POLICY IF EXISTS "Authenticated users can access payments" ON public.mpesa_payments;
DROP POLICY IF EXISTS "Admins can access payments" ON public.mpesa_payments;
CREATE POLICY "Admins can access payments" ON public.mpesa_payments FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can access ncba payments" ON public.ncba_loop_payments;
DROP POLICY IF EXISTS "Admins can access ncba payments" ON public.ncba_loop_payments;
CREATE POLICY "Admins can access ncba payments" ON public.ncba_loop_payments FOR ALL USING (public.is_admin());

-- Support ticket policies
DROP POLICY IF EXISTS "Users can access their support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can access own tickets or admins can access all" ON public.support_tickets;
CREATE POLICY "Users can access own tickets or admins can access all" 
ON public.support_tickets FOR ALL 
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can access their ticket messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "Users can access own messages or admins can access all" ON public.ticket_messages;
CREATE POLICY "Users can access own messages or admins can access all" 
ON public.ticket_messages FOR ALL 
USING (auth.uid() = sender_id OR public.is_admin());