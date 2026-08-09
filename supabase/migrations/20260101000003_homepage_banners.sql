CREATE TABLE IF NOT EXISTS public.homepage_banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    badge TEXT,
    button_text TEXT,
    button_link TEXT,
    secondary_button_text TEXT,
    secondary_button_link TEXT,
    desktop_image_url TEXT,
    mobile_image_url TEXT,
    bg_overlay_opacity INTEGER DEFAULT 20,
    bg_color TEXT,
    position INTEGER DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.homepage_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
    ON public.homepage_banners FOR SELECT
    USING (true);

CREATE POLICY "Enable all access for admins"
    ON public.homepage_banners FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE public.profiles.id = auth.uid() 
            AND public.profiles.role = 'admin'
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_homepage_banners_updated_at
    BEFORE UPDATE ON public.homepage_banners
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
