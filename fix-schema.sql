-- Run this in your Supabase SQL Editor to fix the schema issues:

-- 1. Make title optional (if it exists)
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'title') THEN 
    ALTER TABLE public.products ALTER COLUMN title DROP NOT NULL;
  END IF; 
END $$;

-- 2. Ensure name column exists
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name TEXT;

-- 3. Copy title data to name if name is empty
UPDATE public.products SET name = title WHERE name IS NULL AND title IS NOT NULL;

-- 4. Reload schema cache for PostgREST to pick up the changes
NOTIFY pgrst, 'reload schema';
