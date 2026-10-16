-- ==============================================================================
-- Migration: Firebase Cloud Messaging (FCM) Device Tokens & Preferences
-- Table: public.fcm_tokens
-- ==============================================================================

-- 1. Create fcm_tokens table
CREATE TABLE IF NOT EXISTS public.fcm_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    device_type TEXT DEFAULT 'desktop',
    platform TEXT DEFAULT 'web',
    browser TEXT DEFAULT 'browser',
    is_pwa BOOLEAN DEFAULT false,
    user_agent TEXT,
    preferences JSONB DEFAULT '{"orders": true, "promotions": false, "price_drops": false, "security": true}'::jsonb,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Indexes for efficient lookup and deduplication
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON public.fcm_tokens(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_fcm_tokens_token ON public.fcm_tokens(token);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- 4. Clean up any existing policies to ensure idempotency
DROP POLICY IF EXISTS "Users can view own FCM tokens" ON public.fcm_tokens;
DROP POLICY IF EXISTS "Users can insert own FCM tokens" ON public.fcm_tokens;
DROP POLICY IF EXISTS "Users can update own FCM tokens" ON public.fcm_tokens;
DROP POLICY IF EXISTS "Users can delete own FCM tokens" ON public.fcm_tokens;

-- 5. RLS Policies
-- SELECT: Users can only see their own registered device tokens
CREATE POLICY "Users can view own FCM tokens"
ON public.fcm_tokens
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Authenticated users can insert their own device tokens
CREATE POLICY "Users can insert own FCM tokens"
ON public.fcm_tokens
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update preferences or activity on their own tokens
CREATE POLICY "Users can update own FCM tokens"
ON public.fcm_tokens
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can remove device tokens on logout or permission revoke
CREATE POLICY "Users can delete own FCM tokens"
ON public.fcm_tokens
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6. Add idempotency and link support to public.notifications if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'idempotency_key'
    ) THEN
        ALTER TABLE public.notifications 
        ADD COLUMN idempotency_key TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'data'
    ) THEN
        ALTER TABLE public.notifications 
        ADD COLUMN data JSONB;
    END IF;
END $$;
