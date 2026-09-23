-- =========================================================================
-- ODA MARKET: User Soft Delete Schema Migration
-- =========================================================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_is_deleted ON public.profiles(is_deleted);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at);
