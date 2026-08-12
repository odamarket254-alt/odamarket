ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_wholesale BOOLEAN DEFAULT false; ALTER TABLE public.products ADD COLUMN IF NOT EXISTS wholesale_unit TEXT; NOTIFY pgrst, 'reload schema';
