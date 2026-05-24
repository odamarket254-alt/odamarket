-- 1. Trigger for new inquiries
CREATE OR REPLACE FUNCTION notify_seller_on_new_inquiry()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    NEW.seller_id,
    'New Inquiry',
    'You have received a new inquiry from ' || NEW.name,
    'inquiry',
    '/seller/dashboard/inquiries'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_inquiry_created ON public.inquiries;
CREATE TRIGGER on_inquiry_created
  AFTER INSERT ON public.inquiries
  FOR EACH ROW EXECUTE PROCEDURE notify_seller_on_new_inquiry();

-- 2. Trigger for new messages
CREATE OR REPLACE FUNCTION notify_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_seller_id UUID;
  v_buyer_id UUID;
  v_recipient_id UUID;
  v_sender_name TEXT;
BEGIN
  -- Get inquiry details
  SELECT seller_id, buyer_id INTO v_seller_id, v_buyer_id
  FROM public.inquiries
  WHERE id = NEW.inquiry_id;

  -- Determine recipient
  IF NEW.sender_id = v_seller_id THEN
    v_recipient_id := v_buyer_id;
  ELSE
    v_recipient_id := v_seller_id;
  END IF;

  -- Only notify if there is a recipient (buyer might be null initially if guest, though we assume auth users)
  IF v_recipient_id IS NOT NULL THEN
    -- Get sender name
    SELECT business_name INTO v_sender_name FROM public.profiles WHERE id = NEW.sender_id;
    IF v_sender_name IS NULL THEN
      v_sender_name := 'User';
    END IF;

    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      v_recipient_id,
      'New Message',
      'You have a new message from ' || v_sender_name || ' regarding an inquiry.',
      'inquiry',
      CASE WHEN NEW.sender_id = v_seller_id THEN '/buyer/dashboard/inquiries' ELSE '/seller/dashboard/inquiries' END
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_created ON public.inquiry_messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.inquiry_messages
  FOR EACH ROW EXECUTE PROCEDURE notify_on_new_message();

-- Enable realtime for notifications table
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
