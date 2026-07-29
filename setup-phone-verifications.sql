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

-- Add RLS policies (allow service role only since this is server-side managed)
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for service role" ON public.phone_verifications
    FOR SELECT TO service_role USING (true);
    
CREATE POLICY "Enable insert access for service role" ON public.phone_verifications
    FOR INSERT TO service_role WITH CHECK (true);
    
CREATE POLICY "Enable update access for service role" ON public.phone_verifications
    FOR UPDATE TO service_role USING (true) WITH CHECK (true);
    
CREATE POLICY "Enable delete access for service role" ON public.phone_verifications
    FOR DELETE TO service_role USING (true);
