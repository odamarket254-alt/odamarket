-- ============================================================================
-- ODA Market: Login Two-Factor Email OTP Challenges Table & RLS Policies
-- ============================================================================
-- Purpose:
--   Stores hashed 6-digit login OTP challenges generated after successful
--   Supabase email/password authentication. Plaintext OTPs are never stored.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.login_otp_challenges (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  challenge_token_hash TEXT NOT NULL,
  encrypted_session TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  resend_available_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  verified_at TIMESTAMPTZ NULL,
  invalidated_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_otp_challenges_user_id
  ON public.login_otp_challenges(user_id);

CREATE INDEX IF NOT EXISTS idx_login_otp_challenges_email_created
  ON public.login_otp_challenges(email, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.login_otp_challenges ENABLE ROW LEVEL SECURITY;

-- Revoke all direct access from anon and authenticated frontend roles.
-- All OTP creation, verification, and invalidation happens strictly server-side
-- using the Supabase service_role key.
REVOKE ALL ON public.login_otp_challenges FROM anon, authenticated;
GRANT ALL ON public.login_otp_challenges TO service_role;

DROP POLICY IF EXISTS "Service role full access on login_otp_challenges" ON public.login_otp_challenges;
CREATE POLICY "Service role full access on login_otp_challenges"
  ON public.login_otp_challenges
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
