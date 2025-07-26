-- Add product_ids field to promotions table to allow selecting specific products for promotions
ALTER TABLE public.promotions ADD COLUMN product_ids TEXT[];

-- Add index for better performance when querying by product_ids
CREATE INDEX idx_promotions_product_ids ON public.promotions USING GIN(product_ids);