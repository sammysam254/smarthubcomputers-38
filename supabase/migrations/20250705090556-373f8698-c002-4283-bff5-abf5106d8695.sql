-- Create ncba_loop_payments table to track NCBA Loop paybill payments
CREATE TABLE public.ncba_loop_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  ncba_loop_message TEXT NOT NULL,
  phone_number VARCHAR(20),
  paybill_number VARCHAR(20),
  account_number VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ncba_loop_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for ncba_loop_payments
CREATE POLICY "Users can view their own NCBA Loop payments" 
ON public.ncba_loop_payments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = ncba_loop_payments.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own NCBA Loop payments" 
ON public.ncba_loop_payments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = ncba_loop_payments.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all NCBA Loop payments" 
ON public.ncba_loop_payments 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update NCBA Loop payments" 
ON public.ncba_loop_payments 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ncba_loop_payments_updated_at
BEFORE UPDATE ON public.ncba_loop_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();