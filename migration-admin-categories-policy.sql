-- Allow Admins (and effectively authenticated users in this MVP) to manage categories
-- Execute this in the Supabase SQL editor if deletion is still being blocked by RLS policies.

CREATE POLICY "Enable insert for authenticated users" ON categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON categories FOR DELETE TO authenticated USING (true);
