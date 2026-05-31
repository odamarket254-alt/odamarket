-- Run this in your Supabase SQL Editor to fix the admin verification issue

-- Policy to allow admins to update other profiles
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Policy to allow admins to view all inquiries
CREATE POLICY "Admins can view all inquiries" ON inquiries FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
