-- Create storage buckets for various entities

-- 1. Products Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Categories Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('categories', 'categories', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Brands Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('brands', 'brands', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Avatars/Profiles Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storefront/Banners Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('storefront', 'storefront', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Attachments/Documents Bucket (for RFQs, invoices, etc)
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the buckets
-- Drop existing policies if any to avoid errors when re-running
DROP POLICY IF EXISTS "Public Access for products" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for categories" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for brands" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for storefront" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can insert objects" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own objects" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own objects" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;

-- Enable RLS
-- Read policies for public buckets
CREATE POLICY "Public Access for products" ON storage.objects FOR SELECT USING ( bucket_id = 'products' );
CREATE POLICY "Public Access for categories" ON storage.objects FOR SELECT USING ( bucket_id = 'categories' );
CREATE POLICY "Public Access for brands" ON storage.objects FOR SELECT USING ( bucket_id = 'brands' );
CREATE POLICY "Public Access for avatars" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
CREATE POLICY "Public Access for storefront" ON storage.objects FOR SELECT USING ( bucket_id = 'storefront' );

-- Authenticated users can read documents
CREATE POLICY "Authenticated users can read documents" ON storage.objects FOR SELECT TO authenticated USING ( bucket_id = 'documents' );

-- Insert policies for authenticated users
CREATE POLICY "Authenticated users can insert objects" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( 
    bucket_id IN ('products', 'categories', 'brands', 'avatars', 'storefront', 'documents') 
);

-- Update and Delete policies
CREATE POLICY "Users can update their own objects" ON storage.objects FOR UPDATE TO authenticated USING ( 
    auth.uid() = owner
);

CREATE POLICY "Users can delete their own objects" ON storage.objects FOR DELETE TO authenticated USING ( 
    auth.uid() = owner
);
