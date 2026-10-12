-- Migration: 20260101000024_paystack_payment_reliability.sql
-- Enforces database-level uniqueness for Paystack payment references,
-- indexes authoritative payment statuses, and creates a payment_logs table.

-- 1. Ensure unique payment references across all orders (excluding nulls)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_unique_payment_reference 
ON public.orders (payment_reference) 
WHERE payment_reference IS NOT NULL;

-- 2. Fast authoritative analytics and order lookup indexes
CREATE INDEX IF NOT EXISTS idx_orders_payment_status_created_at 
ON public.orders (payment_status, created_at);

CREATE INDEX IF NOT EXISTS idx_orders_status_payment_status 
ON public.orders (status, payment_status);

-- 3. Dedicated immutable payment verification audit logs table
CREATE TABLE IF NOT EXISTS public.payment_verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_reference TEXT,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL,
    amount_kobo BIGINT,
    currency TEXT DEFAULT 'KES',
    source TEXT NOT NULL, -- 'webhook', 'inline_checkout', 'manual_reconcile'
    raw_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for log lookups
CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id ON public.payment_verification_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_reference ON public.payment_verification_logs(payment_reference);

-- Enable Row Level Security on payment_verification_logs
ALTER TABLE public.payment_verification_logs ENABLE ROW LEVEL SECURITY;

-- Only service role and admins can access payment verification logs
CREATE POLICY "Admins can view payment verification logs"
ON public.payment_verification_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
);
