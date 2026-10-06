-- =========================================================================
-- ODA MARKET: Buyer Account Settings Schema Migration
-- Supports persistent buyer payment methods, notification preferences,
-- buyer preferences, and delivery addresses with Row Level Security (RLS)
-- =========================================================================

-- 1. Buyer Payment Methods Table (Safe non-sensitive payment information)
CREATE TABLE IF NOT EXISTS public.buyer_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('mpesa', 'airtel', 'card', 'bank', 'cash')),
    phone TEXT,
    card_brand TEXT,
    card_last4 TEXT,
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    cardholder_name TEXT,
    nickname TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.buyer_payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyers manage own payment methods" ON public.buyer_payment_methods;
CREATE POLICY "Buyers manage own payment methods" ON public.buyer_payment_methods
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Buyer General Preferences Table
CREATE TABLE IF NOT EXISTS public.buyer_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT DEFAULT 'KES',
    language TEXT DEFAULT 'en',
    theme TEXT DEFAULT 'system',
    delivery_window TEXT DEFAULT 'anytime',
    packaging_preference TEXT DEFAULT 'eco_friendly',
    substitution_rule TEXT DEFAULT 'call_first',
    save_cart BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.buyer_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyers manage own preferences" ON public.buyer_preferences;
CREATE POLICY "Buyers manage own preferences" ON public.buyer_preferences
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Buyer Notification Preferences Table
CREATE TABLE IF NOT EXISTS public.buyer_notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    order_confirmations BOOLEAN DEFAULT true,
    order_status_updates BOOLEAN DEFAULT true,
    promotions_and_deals BOOLEAN DEFAULT true,
    whatsapp_updates BOOLEAN DEFAULT true,
    price_drop_alerts BOOLEAN DEFAULT false,
    security_alerts BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.buyer_notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyers manage own notification preferences" ON public.buyer_notification_preferences;
CREATE POLICY "Buyers manage own notification preferences" ON public.buyer_notification_preferences
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Ensure delivery_addresses and profiles are included in Realtime publications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'buyer_payment_methods'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.buyer_payment_methods;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'delivery_addresses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_addresses;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
