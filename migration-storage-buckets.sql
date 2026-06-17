-- Create a storage bucket for category images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'category-images' );

CREATE POLICY "Authenticated users can upload images" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'category-images' );

CREATE POLICY "Authenticated users can update images" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING ( bucket_id = 'category-images' );

CREATE POLICY "Authenticated users can delete images" 
ON storage.objects FOR DELETE 
TO authenticated 
USING ( bucket_id = 'category-images' );
