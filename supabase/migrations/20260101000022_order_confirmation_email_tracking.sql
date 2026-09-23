-- Migration: Order confirmation email tracking columns
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS confirmation_email_status TEXT DEFAULT NULL;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS confirmation_email_id TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_confirmation_email_sent_at 
ON public.orders(confirmation_email_sent_at);

CREATE INDEX IF NOT EXISTS idx_orders_confirmation_email_status 
ON public.orders(confirmation_email_status);
