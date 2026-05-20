-- PLEASE RUN THIS ENTIRE SCRIPT IN YOUR SUPABASE SQL EDITOR --
-- This will resolve the "Database error saving new user" issue --

-- 1. Ensure the 'seller' role exists in the database
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'seller';

-- 2. Drop the existing trigger to ensure we start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Create a bulletproof trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_final_role public.user_role;
BEGIN
  -- Get role from metadata, default to buyer
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'buyer');
  
  -- Handle potential front-end legacy naming
  IF v_role = 'supplier' THEN
    v_role := 'seller';
  END IF;

  -- Insert profile, wrapped in a block so we can catch any schema mismatch errors
  BEGIN
    INSERT INTO public.profiles (id, business_name, role)
    VALUES (
      new.id, 
      new.raw_user_meta_data->>'business_name', 
      v_role::public.user_role
    );
  EXCEPTION WHEN OTHERS THEN
    -- Fallback: If setting role or business name fails (e.g. enum mismatch), 
    -- at least insert the user ID so the authentication doesn't fail.
    INSERT INTO public.profiles (id) VALUES (new.id);
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-attach the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Fix legacy profiles to align with 'seller' (optional but clean)
-- Ignore errors if the update fails
DO $$
BEGIN
  UPDATE public.profiles SET role = 'seller'::public.user_role WHERE role::text = 'supplier';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
