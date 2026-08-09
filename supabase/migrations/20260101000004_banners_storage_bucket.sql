-- Create the banners storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the banners bucket
-- Allow public access to view/download banners
CREATE POLICY "Public Access for Banners"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'banners');

-- Allow admins to insert/upload banners
CREATE POLICY "Admin Upload Access for Banners"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'banners' AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE public.profiles.id = auth.uid() 
            AND public.profiles.role = 'admin'
        )
    );

-- Allow admins to update banners
CREATE POLICY "Admin Update Access for Banners"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'banners' AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE public.profiles.id = auth.uid() 
            AND public.profiles.role = 'admin'
        )
    );

-- Allow admins to delete banners
CREATE POLICY "Admin Delete Access for Banners"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'banners' AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE public.profiles.id = auth.uid() 
            AND public.profiles.role = 'admin'
        )
    );
