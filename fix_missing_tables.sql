-- Missing Tables Fix for OdaMarket

-- 1. PHONE VERIFICATIONS
CREATE TABLE IF NOT EXISTS public.phone_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone TEXT NOT NULL UNIQUE,
    otp_hash TEXT NOT NULL,
    expires_at BIGINT NOT NULL,
    attempts INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for service role" ON public.phone_verifications FOR SELECT TO service_role USING (true);
CREATE POLICY "Enable insert access for service role" ON public.phone_verifications FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Enable update access for service role" ON public.phone_verifications FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete access for service role" ON public.phone_verifications FOR DELETE TO service_role USING (true);

-- 2. SUPPLIERS
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active suppliers" ON public.suppliers FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admin write suppliers" ON public.suppliers FOR ALL USING (public.is_admin());

-- Add supplier_id to products if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='supplier_id') THEN
        ALTER TABLE public.products ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. HOMEPAGE SECTIONS
CREATE TABLE IF NOT EXISTS public.homepage_sections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., 'hero', 'banner', 'product_grid', 'category_grid'
    content JSONB,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active homepage_sections" ON public.homepage_sections FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admin write homepage_sections" ON public.homepage_sections FOR ALL USING (public.is_admin());

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
