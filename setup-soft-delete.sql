-- =========================================================================
-- ODA MARKET: User Soft Delete Schema Migration
-- =========================================================================
-- Safe user account deactivation without foreign key constraint errors.
-- Run in Supabase SQL Editor if you want database column-level soft delete tracking.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_is_deleted ON public.profiles(is_deleted);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at);

COMMENT ON COLUMN public.profiles.is_deleted IS 'Indicates whether the account has been soft-deleted (deactivated/archived)';
COMMENT ON COLUMN public.profiles.deleted_at IS 'Timestamp when the account was soft-deleted';

-- Helper function to perform soft delete directly via SQL if desired
CREATE OR REPLACE FUNCTION public.soft_delete_user(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark profile as soft deleted
  UPDATE public.profiles
  SET is_deleted = TRUE,
      deleted_at = NOW(),
      updated_at = NOW()
  WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'user_id', target_user_id,
    'deleted_at', NOW()
  );
END;
$$;

-- Helper function to restore a soft deleted user directly via SQL
CREATE OR REPLACE FUNCTION public.restore_soft_deleted_user(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Unmark profile soft deleted
  UPDATE public.profiles
  SET is_deleted = FALSE,
      deleted_at = NULL,
      updated_at = NOW()
  WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'user_id', target_user_id,
    'restored_at', NOW()
  );
END;
$$;
