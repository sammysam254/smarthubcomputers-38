-- Create ads table
CREATE TABLE public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  ad_type TEXT NOT NULL CHECK (ad_type IN ('text', 'image', 'video', 'product')),
  image_url TEXT,
  video_url TEXT,
  link_url TEXT,
  product_id UUID,
  active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Create policies for ads
CREATE POLICY "Anyone can view active ads" 
ON public.ads 
FOR SELECT 
USING (active = true);

CREATE POLICY "Admins can create ads" 
ON public.ads 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can update ads" 
ON public.ads 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete ads" 
ON public.ads 
FOR DELETE 
USING (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ads_updated_at
BEFORE UPDATE ON public.ads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();