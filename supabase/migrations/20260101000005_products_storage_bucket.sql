-- Create the products storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to view/download products
CREATE POLICY "Public Access for Products"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'products');

-- Allow admins to insert/upload products
CREATE POLICY "Admin Upload Access for Products"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'products' AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE public.profiles.id = auth.uid() 
            AND public.profiles.role = 'admin'
        )
    );

-- Allow admins to update products
CREATE POLICY "Admin Update Access for Products"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'products' AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE public.profiles.id = auth.uid() 
            AND public.profiles.role = 'admin'
        )
    );

-- Allow admins to delete products
CREATE POLICY "Admin Delete Access for Products"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'products' AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE public.profiles.id = auth.uid() 
            AND public.profiles.role = 'admin'
        )
    );
