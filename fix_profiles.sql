-- Add full_name to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
UPDATE public.profiles SET full_name = CONCAT(first_name, ' ', last_name) WHERE full_name IS NULL AND (first_name IS NOT NULL OR last_name IS NOT NULL);

NOTIFY pgrst, 'reload schema';
