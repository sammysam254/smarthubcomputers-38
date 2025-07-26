-- Create notification subscriptions table
CREATE TABLE public.notification_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.notification_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies (allow anyone to subscribe/unsubscribe - no auth required)
CREATE POLICY "Anyone can subscribe to notifications" 
ON public.notification_subscriptions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view their subscription" 
ON public.notification_subscriptions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update their subscription" 
ON public.notification_subscriptions 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete their subscription" 
ON public.notification_subscriptions 
FOR DELETE 
USING (true);

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage all subscriptions" 
ON public.notification_subscriptions 
FOR ALL 
USING (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_notification_subscriptions_updated_at
BEFORE UPDATE ON public.notification_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();