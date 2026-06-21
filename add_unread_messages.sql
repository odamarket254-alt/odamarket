-- Run this migration in the Supabase SQL Editor

-- 1. Add unread counts and last message info to inquiries table
ALTER TABLE inquiries 
ADD COLUMN buyer_unread_count INTEGER DEFAULT 0,
ADD COLUMN seller_unread_count INTEGER DEFAULT 0,
ADD COLUMN last_message_text TEXT,
ADD COLUMN last_message_time TIMESTAMPTZ,
ADD COLUMN last_message_sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 2. Add is_read to inquiry_messages
ALTER TABLE inquiry_messages
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- 3. Add policies if they do not exist
DROP POLICY IF EXISTS "Users can update read status" ON inquiry_messages;
CREATE POLICY "Users can update read status" ON inquiry_messages FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM inquiries 
    WHERE inquiries.id = inquiry_id 
    AND (inquiries.seller_id = auth.uid() OR inquiries.buyer_id = auth.uid())
  )
);

-- Note: Inquiries update policy should allow participants to update the unread counts
DROP POLICY IF EXISTS "Participants can update inquiries" ON inquiries;
CREATE POLICY "Participants can update inquiries" ON inquiries FOR UPDATE USING (
  buyer_id = auth.uid() OR seller_id = auth.uid()
);
