-- This will create the necessary tables and enable realtime for them --

-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES public.profiles(id),
    name TEXT NOT NULL,
    category TEXT,
    price TEXT,
    stock TEXT,
    status TEXT DEFAULT 'active',
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns exist if table was already created
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.profiles(id);

-- 2. Create Inquiries Table
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) NOT NULL,
    seller_id UUID REFERENCES public.profiles(id) NOT NULL,
    buyer_id UUID REFERENCES public.profiles(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT NOT NULL,
    phone TEXT,
    quantity TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns exist for inquiries
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id);
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.profiles(id);

-- 3. Enable RLS (Row Level Security)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for Products
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products
    FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Sellers can view own products" ON public.products;
CREATE POLICY "Sellers can view own products" ON public.products
    FOR SELECT USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers can insert own products" ON public.products;
CREATE POLICY "Sellers can insert own products" ON public.products
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers can update own products" ON public.products;
CREATE POLICY "Sellers can update own products" ON public.products
    FOR UPDATE USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers can delete own products" ON public.products;
CREATE POLICY "Sellers can delete own products" ON public.products
    FOR DELETE USING (auth.uid() = seller_id);

-- 5. Create Policies for Inquiries
DROP POLICY IF EXISTS "Sellers can view inquiries" ON public.inquiries;
CREATE POLICY "Sellers can view inquiries" ON public.inquiries
    FOR SELECT USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Anyone can insert inquiries" ON public.inquiries;
CREATE POLICY "Anyone can insert inquiries" ON public.inquiries
    FOR INSERT WITH CHECK (true);

-- 6. Important: Enable Realtime for these tables
-- This is critical for the "LET EVERYTHING BE IN REALTIME" feature
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.inquiries;

-- 7. Reload schema cache
NOTIFY pgrst, 'reload schema';

