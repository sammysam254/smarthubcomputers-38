-- Fix order cancellation by adding RLS policy
ALTER TABLE public.orders DROP POLICY IF EXISTS "Users can update their own orders";
CREATE POLICY "Users can update their own orders" ON public.orders 
FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending');

-- Fix flash sales - change discount_percentage to numeric to allow decimals
ALTER TABLE public.flash_sales ALTER COLUMN discount_percentage TYPE numeric;

-- Fix product deletion by adding cascade delete or soft delete approach
-- For now, we'll prevent deletion of products that have orders
-- Add a soft delete column instead
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON public.products(deleted_at);

-- Update admin policies to allow manual M-Pesa confirmation
-- Make sure we have proper admin permissions for mpesa_payments
CREATE POLICY IF NOT EXISTS "Admins can confirm mpesa payments" ON public.mpesa_payments 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Ensure proper admin permissions for order status updates
CREATE POLICY IF NOT EXISTS "Admins can update all order statuses" ON public.orders 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);