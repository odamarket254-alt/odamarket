ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_wholesale BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS wholesale_price DECIMAL(10, 2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS wholesale_min_qty INTEGER DEFAULT 1;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS wholesale_unit TEXT;

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
