
-- Create flash_sales table
CREATE TABLE public.flash_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  original_price NUMERIC NOT NULL,
  sale_price NUMERIC NOT NULL,
  discount_percentage NUMERIC NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  quantity_limit INTEGER,
  sold_quantity INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create vouchers table
CREATE TABLE public.vouchers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  minimum_purchase_amount NUMERIC DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create shipping_addresses table
CREATE TABLE public.shipping_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city VARCHAR(100) NOT NULL,
  county VARCHAR(100),
  postal_code VARCHAR(20),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mpesa_payments table
CREATE TABLE public.mpesa_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  mpesa_message TEXT NOT NULL,
  mpesa_code VARCHAR(50),
  amount NUMERIC NOT NULL,
  phone_number VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  confirmed_by UUID,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create voucher_usage table to track voucher usage
CREATE TABLE public.voucher_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voucher_id UUID REFERENCES public.vouchers(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  discount_amount NUMERIC NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mpesa_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for flash_sales
CREATE POLICY "Flash sales are viewable by everyone" ON public.flash_sales FOR SELECT USING (true);
CREATE POLICY "Admins can insert flash sales" ON public.flash_sales FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update flash sales" ON public.flash_sales FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete flash sales" ON public.flash_sales FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for vouchers
CREATE POLICY "Active vouchers are viewable by everyone" ON public.vouchers FOR SELECT USING (active = true OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert vouchers" ON public.vouchers FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update vouchers" ON public.vouchers FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete vouchers" ON public.vouchers FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for shipping_addresses
CREATE POLICY "Users can view their own shipping addresses" ON public.shipping_addresses FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert their own shipping addresses" ON public.shipping_addresses FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update their own shipping addresses" ON public.shipping_addresses FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete their own shipping addresses" ON public.shipping_addresses FOR DELETE USING (auth.uid()::text = user_id::text);

-- RLS policies for mpesa_payments
CREATE POLICY "Users can view their own mpesa payments" ON public.mpesa_payments FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = mpesa_payments.order_id AND orders.user_id::text = auth.uid()::text));
CREATE POLICY "Users can insert their own mpesa payments" ON public.mpesa_payments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = mpesa_payments.order_id AND orders.user_id::text = auth.uid()::text));
CREATE POLICY "Admins can view all mpesa payments" ON public.mpesa_payments FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update mpesa payments" ON public.mpesa_payments FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for voucher_usage
CREATE POLICY "Users can view their own voucher usage" ON public.voucher_usage FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert their own voucher usage" ON public.voucher_usage FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Admins can view all voucher usage" ON public.voucher_usage FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_flash_sales_updated_at BEFORE UPDATE ON public.flash_sales FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_vouchers_updated_at BEFORE UPDATE ON public.vouchers FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_shipping_addresses_updated_at BEFORE UPDATE ON public.shipping_addresses FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_mpesa_payments_updated_at BEFORE UPDATE ON public.mpesa_payments FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Add columns to orders table for shipping and voucher support
ALTER TABLE public.orders ADD COLUMN shipping_address_id UUID REFERENCES public.shipping_addresses(id);
ALTER TABLE public.orders ADD COLUMN voucher_id UUID REFERENCES public.vouchers(id);
ALTER TABLE public.orders ADD COLUMN voucher_discount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN shipping_fee NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'mpesa';
