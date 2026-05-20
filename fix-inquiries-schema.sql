-- Run this in your Supabase SQL Editor to fix the schema issues with the inquiries table:

-- 1. Ensure all required columns exist in the inquiries table
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS quantity TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 2. Reload schema cache for PostgREST to pick up the new columns
NOTIFY pgrst, 'reload schema';
