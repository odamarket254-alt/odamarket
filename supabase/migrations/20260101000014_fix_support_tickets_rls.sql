DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'support_tickets' AND cmd = 'INSERT'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON support_tickets', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "Enable insert for everyone" ON support_tickets FOR INSERT WITH CHECK (true);
