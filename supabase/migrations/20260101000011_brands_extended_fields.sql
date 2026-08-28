-- Migration to add extended columns to public.brands table
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS homepage_status BOOLEAN DEFAULT false;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS seo_keywords TEXT;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
