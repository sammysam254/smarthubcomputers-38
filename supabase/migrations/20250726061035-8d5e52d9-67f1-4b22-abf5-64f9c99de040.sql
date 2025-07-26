-- Add images column to products table to match the code expectations
ALTER TABLE public.products ADD COLUMN images text DEFAULT '[]';