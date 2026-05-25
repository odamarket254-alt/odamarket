-- Create support_messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  subject text,
  message text not null,
  status text default 'unread',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert messages
CREATE POLICY "Anyone can insert support messages"
ON public.support_messages FOR INSERT TO public
WITH CHECK (true);

-- Allow admins to view/manage all messages
CREATE POLICY "Admins can manage support messages"
ON public.support_messages FOR ALL TO public
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
