-- Run this in your Supabase SQL Editor to set up the realtime inquiries chat:

CREATE TABLE IF NOT EXISTS public.inquiry_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.inquiry_messages ENABLE ROW LEVEL SECURITY;

-- Allow sellers and buyers of the inquiry to see all its messages
CREATE POLICY "Users can view inquiry messages if they are the buyer or seller" ON public.inquiry_messages
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.inquiries 
            WHERE id = inquiry_messages.inquiry_id 
            AND (seller_id = auth.uid() OR buyer_id = auth.uid())
        )
    );

-- Allow buyers and sellers to send messages
CREATE POLICY "Users can insert messages into their inquiries" ON public.inquiry_messages
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.inquiries 
            WHERE id = inquiry_messages.inquiry_id 
            AND (seller_id = auth.uid() OR buyer_id = auth.uid())
        )
        AND sender_id = auth.uid()
    );

-- Add to publication for realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.inquiry_messages;
