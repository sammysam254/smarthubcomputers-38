
-- Add a policy to allow users to update their own orders (for cancellation)
CREATE POLICY "Users can update their own orders" ON public.orders 
FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending');

-- Update orders table to ensure we have all necessary columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT NOT NULL DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address TEXT NOT NULL DEFAULT '';

-- Create an index for faster order queries
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
