-- Fix the RLS policies to use role::text to avoid enum validation errors
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'support_tickets'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON support_tickets', pol.policyname);
    END LOOP;
END $$;

-- Allow users to view their own tickets
CREATE POLICY "Users can view their own tickets" 
ON support_tickets FOR SELECT USING (auth.uid() = customer_id);

-- Allow anyone (even unauthenticated) to submit a ticket
CREATE POLICY "Enable insert for everyone" 
ON support_tickets FOR INSERT WITH CHECK (true);

-- Allow admins to view and update tickets
CREATE POLICY "Admins can view all tickets" 
ON support_tickets FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role::text IN ('admin', 'super_admin', 'support_agent'))
);

CREATE POLICY "Admins can update tickets" 
ON support_tickets FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role::text IN ('admin', 'super_admin', 'support_agent'))
);


-- Do the same for support_ticket_messages
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'support_ticket_messages'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON support_ticket_messages', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "Users can view their ticket messages" 
ON support_ticket_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_id AND customer_id = auth.uid())
);

CREATE POLICY "Users can insert ticket messages" 
ON support_ticket_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM support_tickets WHERE id = ticket_id AND customer_id = auth.uid())
);

CREATE POLICY "Admins can view and reply to all tickets" 
ON support_ticket_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role::text IN ('admin', 'super_admin', 'support_agent'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role::text IN ('admin', 'super_admin', 'support_agent'))
);
