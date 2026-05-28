-- Fix for: "Seller can see products but public can't"
-- The issue was caused by foreign keys incorrectly pointing to auth.users instead of profiles.
-- The PostgREST API relies on foreign keys pointing to public.profiles to join user data (profiles) with products. 
-- We will restore these foreign keys, while keeping ON DELETE CASCADE to allow user deletion.

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


-- 4. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
