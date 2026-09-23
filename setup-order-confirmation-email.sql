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
