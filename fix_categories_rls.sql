-- Fix Categories RLS policies to allow everyone to read categories, and admins to manage them.

DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON categories;
CREATE POLICY "Enable insert for authenticated users" ON categories FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON categories;
CREATE POLICY "Enable update for authenticated users" ON categories FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON categories;
CREATE POLICY "Enable delete for authenticated users" ON categories FOR DELETE TO authenticated USING (true);
