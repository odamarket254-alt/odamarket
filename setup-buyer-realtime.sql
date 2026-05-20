-- Run this in your Supabase SQL Editor to set up the realtime favorites and recent views for buyers:

CREATE TABLE IF NOT EXISTS public.recent_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES auth.users(id) NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(buyer_id, product_id)
);

ALTER TABLE public.recent_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyers manage own recent views" ON public.recent_views;
CREATE POLICY "Buyers manage own recent views" ON public.recent_views
    FOR ALL USING (auth.uid() = buyer_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.recent_views;
ALTER PUBLICATION supabase_realtime ADD TABLE public.favorites;
