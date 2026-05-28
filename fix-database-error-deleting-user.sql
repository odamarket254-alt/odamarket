-- Fix for: "Failed to delete user: Database error deleting user"
-- This happens when tables in your database reference 'auth.users'
-- but do not have 'ON DELETE CASCADE' enabled on the foreign key constraints.
-- 
-- UPDATE: Foreign keys must reference 'profiles' rather than 'auth.users' directly
-- for PostgREST joins to work (e.g. .select("*, profiles(*)")). Since profiles -> auth.users
-- uses ON DELETE CASCADE, cascading deletes will propagate correctly.

-- 1. Fix 'products' table references
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_seller_id_fkey;

ALTER TABLE public.products
  ADD CONSTRAINT products_seller_id_fkey 
  FOREIGN KEY (seller_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;


-- 2. Fix 'inquiries' table references
ALTER TABLE public.inquiries
  DROP CONSTRAINT IF EXISTS inquiries_seller_id_fkey,
  DROP CONSTRAINT IF EXISTS inquiries_buyer_id_fkey;

ALTER TABLE public.inquiries
  ADD CONSTRAINT inquiries_seller_id_fkey 
  FOREIGN KEY (seller_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.inquiries
  ADD CONSTRAINT inquiries_buyer_id_fkey 
  FOREIGN KEY (buyer_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;


-- 3. Fix 'recent_views' table references
ALTER TABLE public.recent_views
  DROP CONSTRAINT IF EXISTS recent_views_buyer_id_fkey;

ALTER TABLE public.recent_views
  ADD CONSTRAINT recent_views_buyer_id_fkey 
  FOREIGN KEY (buyer_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;


-- 4. Fix 'support_messages' table (if it references profiles)
-- Only if applicable based on custom setup
ALTER TABLE public.support_messages
  DROP CONSTRAINT IF EXISTS support_messages_sender_id_fkey;
  
-- Ignoring the ADD CONSTRAINT if the column doesn't exist.
-- (Will gracefully fail if column isn't there, which is fine)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema='public' 
          AND table_name='support_messages' 
          AND column_name='sender_id'
    ) THEN
        ALTER TABLE public.support_messages
          ADD CONSTRAINT support_messages_sender_id_fkey 
          FOREIGN KEY (sender_id) 
          REFERENCES public.profiles(id) 
          ON DELETE CASCADE;
    END IF;
END $$;
