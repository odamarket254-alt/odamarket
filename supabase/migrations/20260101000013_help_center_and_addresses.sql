CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    ticket_number TEXT NOT NULL UNIQUE DEFAULT 'TKT-' || upper(substr(md5(random()::text), 1, 8)),
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    order_id TEXT,
    status TEXT NOT NULL DEFAULT 'Open',
    priority TEXT DEFAULT 'Medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tickets" ON support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
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
    order_id UUID REFERENCES orders(id),
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE reward_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own points" ON reward_points FOR SELECT USING (auth.uid() = user_id);

