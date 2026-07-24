-- Fix the wishlists table if it was created with a different schema before
BEGIN;

-- Check if buyer_id exists, if not, maybe we rename user_id or add it
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

COMMIT;
