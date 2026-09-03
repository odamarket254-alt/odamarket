CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_number TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES auth.users(id),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    order_id TEXT,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open',
    priority TEXT DEFAULT 'Normal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets" ON support_tickets FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Users can create tickets" ON support_tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all tickets" ON support_tickets FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'support_agent'))
);
CREATE POLICY "Admins can update tickets" ON support_tickets FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'support_agent'))
);

CREATE TABLE IF NOT EXISTS delivery_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    county TEXT NOT NULL,
    town_city TEXT NOT NULL,
    area_location TEXT,
    street_building TEXT NOT NULL,
    delivery_instructions TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE delivery_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own addresses" ON delivery_addresses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS reward_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    points INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    order_id TEXT,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE reward_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own points" ON reward_points FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION handle_order_reward_points()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    IF NOT EXISTS (SELECT 1 FROM reward_points WHERE order_id = NEW.id::text) THEN
      INSERT INTO reward_points (user_id, points, transaction_type, order_id, description)
      VALUES (
        NEW.user_id, 
        FLOOR(NEW.total / 1000), 
        'Earned', 
        NEW.id::text, 
        'Points earned for order ' || NEW.id::text
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_delivered ON orders;
CREATE TRIGGER on_order_delivered
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_reward_points();
