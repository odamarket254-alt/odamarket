-- =========================================================================
-- ODA MARKET: Order Confirmation Email Tracking & Idempotency Schema
-- =========================================================================
-- This migration adds dedicated tracking columns to the public.orders table
-- for recording Resend order confirmation email dispatch state.
--
-- Note: The application server code already includes a graceful fallback 
-- that tracks email state in orders.notes JSON, so the system is fully
-- operational immediately. Applying this migration provides optimized
-- column-level indexing, query performance, and reporting.

-- 1. Add confirmation email tracking columns safely
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS confirmation_email_status TEXT DEFAULT NULL;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS confirmation_email_id TEXT DEFAULT NULL;

-- 2. Add performance indexes for filtering and admin dashboards
CREATE INDEX IF NOT EXISTS idx_orders_confirmation_email_sent_at 
ON public.orders(confirmation_email_sent_at);

CREATE INDEX IF NOT EXISTS idx_orders_confirmation_email_status 
ON public.orders(confirmation_email_status);

-- 3. Document columns for developers and schema explorers
COMMENT ON COLUMN public.orders.confirmation_email_sent_at IS 
'Timestamp when the Resend order confirmation email was dispatched to the customer';

COMMENT ON COLUMN public.orders.confirmation_email_status IS 
'Dispatch state of the confirmation email: sent, failed, or pending';

COMMENT ON COLUMN public.orders.confirmation_email_id IS 
'Resend email ID for delivery tracking and logs';

-- 4. Create order_email_events table for multi-event idempotency (order_confirmation, payment_success, payment_failed, order_ready, order_cancelled, welcome, email_verification, seller_new_order)
CREATE TABLE IF NOT EXISTS public.order_email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID DEFAULT NULL,
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  template_id TEXT DEFAULT NULL,
  resend_id TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT DEFAULT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (order_id, email_type, recipient_email)
);

CREATE INDEX IF NOT EXISTS idx_order_email_events_order_type
ON public.order_email_events(order_id, email_type);

CREATE INDEX IF NOT EXISTS idx_order_email_events_user_type
ON public.order_email_events(user_id, email_type);

