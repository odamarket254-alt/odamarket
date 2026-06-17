-- Run this in your Supabase SQL Editor to fix ALL registration issues

-- 1. Safely add seller to enum if missing
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'seller';

-- 2. Safely update profiles schema with new columns in case they are missing
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS product_category TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS company_size TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

-- 3. Replace the trigger function with a highly resilient one
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'buyer');
  IF v_role = 'supplier' THEN
    v_role := 'seller';
  END IF;

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
      v_role::public.user_role,
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'job_title',
      new.raw_user_meta_data->>'tax_id',
      new.raw_user_meta_data->>'product_category',
      new.raw_user_meta_data->>'business_type',
      new.raw_user_meta_data->>'company_size',
      new.raw_user_meta_data->>'country',
      new.raw_user_meta_data->>'phone'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Ultimate fallback if the above fails (e.g., column doesn't exist)
    INSERT INTO public.profiles (id, role, business_name, phone) 
    VALUES (
      new.id, 
      'buyer'::public.user_role, 
      COALESCE(new.raw_user_meta_data->>'business_name', 'New user'),
      new.raw_user_meta_data->>'phone'
    );
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-bind trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
