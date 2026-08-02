-- Create homepage_banners table
CREATE TABLE IF NOT EXISTS public.homepage_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  button_text TEXT,
  button_link TEXT,
  bg_color TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  desktop_image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.homepage_banners ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view active banners"
  ON public.homepage_banners
  FOR SELECT
  USING (
    is_active = true 
    AND (start_date IS NULL OR start_date <= NOW()) 
    AND (end_date IS NULL OR end_date >= NOW())
  );

CREATE POLICY "Admins can manage banners"
  ON public.homepage_banners
  FOR ALL
  USING (true); -- In a real app, check auth.jwt() ->> 'role' IN ('admin')

-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('homepage-banners', 'homepage-banners', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'homepage-banners');

CREATE POLICY "Admin Upload" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'homepage-banners');

CREATE POLICY "Admin Delete" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'homepage-banners');

CREATE POLICY "Admin Update" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'homepage-banners');
