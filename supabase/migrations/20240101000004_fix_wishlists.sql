BEGIN;

CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(buyer_id, product_id)
);

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

-- Enable RLS
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
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

-- Create a view for wishlist in case any legacy code queries it
CREATE OR REPLACE VIEW public.wishlist AS SELECT * FROM public.wishlists;

COMMIT;
