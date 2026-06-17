ALTER TABLE products ADD COLUMN IF NOT EXISTS production_capacity TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS lead_time TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_methods TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS certifications TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS pricing_tiers JSONB;

-- Additional supplier statistics could just be computed, but for static/cache MVP we can add to profiles:
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS response_rate INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS average_response_time TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS completed_orders INTEGER;
