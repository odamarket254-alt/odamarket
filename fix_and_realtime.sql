BEGIN;

-- 1. Ensure the wishlists table exists with the correct schema
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(buyer_id, product_id)
);

-- Fix if it was created with `user_id` previously
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wishlists' AND column_name='buyer_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wishlists' AND column_name='user_id') THEN
            ALTER TABLE public.wishlists RENAME COLUMN user_id TO buyer_id;
        ELSE
            ALTER TABLE public.wishlists ADD COLUMN buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 2. Create a 'wishlist' view in case any queries use the singular name (fixes the 42P01 error)
CREATE OR REPLACE VIEW public.wishlist AS SELECT * FROM public.wishlists;

-- 3. Enable RLS and setup policies for wishlists
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wishlists' AND policyname = 'Users can view their own wishlists') THEN
        CREATE POLICY "Users can view their own wishlists" ON public.wishlists FOR SELECT USING (auth.uid() = buyer_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wishlists' AND policyname = 'Users can insert their own wishlists') THEN
        CREATE POLICY "Users can insert their own wishlists" ON public.wishlists FOR INSERT WITH CHECK (auth.uid() = buyer_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wishlists' AND policyname = 'Users can delete their own wishlists') THEN
        CREATE POLICY "Users can delete their own wishlists" ON public.wishlists FOR DELETE USING (auth.uid() = buyer_id);
    END IF;
END $$;

-- 4. Enable Realtime for all Buyer-facing tables
DO $$
DECLARE
    tables text[] := ARRAY[
        'products',
        'orders',
        'order_items',
        'wishlists',
        'carts',
        'inquiries',
        'reviews',
        'notifications',
        'activity_logs'
    ];
    t text;
BEGIN
    FOR t IN SELECT unnest(tables) LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            -- Add to publication if not already added
            IF NOT EXISTS (
                SELECT 1 
                FROM pg_publication_tables 
                WHERE pubname = 'supabase_realtime' 
                AND schemaname = 'public' 
                AND tablename = t
            ) THEN
                EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
            END IF;
        END IF;
    END LOOP;
END $$;

COMMIT;
