-- =========================================================================
-- ODA MARKET: Pending Order Payment Reminder History Schema
-- =========================================================================
-- Run this script in Supabase SQL Editor if migrations have not been applied.
-- Enables admin-only audit logging and 24-hour duplicate cooldown enforcement
-- for Pending Order Payment Reminders dispatched via Resend.

CREATE TABLE IF NOT EXISTS public.order_payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  buyer_id UUID DEFAULT NULL,
  buyer_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  resend_email_id TEXT DEFAULT NULL,
  error_message TEXT DEFAULT NULL,
  sent_by_admin_id UUID NOT NULL,
  sent_by_admin_email TEXT DEFAULT NULL,
  sent_by_admin_name TEXT DEFAULT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_payment_reminders_order_sent_at
  ON public.order_payment_reminders (order_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_payment_reminders_buyer_id
  ON public.order_payment_reminders (buyer_id);

ALTER TABLE public.order_payment_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view order payment reminders" ON public.order_payment_reminders;
CREATE POLICY "Admins can view order payment reminders"
  ON public.order_payment_reminders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'moderator', 'support_agent')
    )
  );

DROP POLICY IF EXISTS "Admins can insert order payment reminders" ON public.order_payment_reminders;
CREATE POLICY "Admins can insert order payment reminders"
  ON public.order_payment_reminders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'moderator', 'support_agent')
    )
  );
