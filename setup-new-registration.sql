-- Migration for new registration fields

-- 1. Add new columns to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS product_category TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS company_size TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

-- 2. Update the auth trigger function to map the new metadata fields
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    business_name, 
    role,
    full_name,
    job_title,
    tax_id,
    product_category,
    business_type,
    company_size,
    country,
    phone
  )
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'business_name', 
    COALESCE(new.raw_user_meta_data->>'role', 'buyer')::user_role,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'job_title',
    new.raw_user_meta_data->>'tax_id',
    new.raw_user_meta_data->>'product_category',
    new.raw_user_meta_data->>'business_type',
    new.raw_user_meta_data->>'company_size',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
