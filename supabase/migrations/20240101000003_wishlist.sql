BEGIN;

CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(buyer_id, product_id)
);

-- Enable RLS
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own wishlists" ON public.wishlists
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Users can insert their own wishlists" ON public.wishlists
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can delete their own wishlists" ON public.wishlists
  FOR DELETE USING (auth.uid() = buyer_id);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE wishlists;

COMMIT;
