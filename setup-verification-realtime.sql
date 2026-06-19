-- 1. Add verification_requested column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_requested BOOLEAN DEFAULT false;

-- 2. Create the trigger function to notify admins
CREATE OR REPLACE FUNCTION notify_admin_on_verification()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_id UUID;
  v_sender_name TEXT;
BEGIN
  -- Check if verification_requested just changed from false to true
  IF NEW.verification_requested = true AND OLD.verification_requested = false THEN
    -- Get sender name
    v_sender_name := NEW.business_name;
    IF v_sender_name IS NULL THEN
      v_sender_name := 'A user';
    END IF;

    -- Notify all admins
    FOR v_admin_id IN SELECT id FROM public.profiles WHERE role = 'admin' LOOP
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        v_admin_id,
        'Verification Request',
        v_sender_name || ' has requested seller verification.',
        'system',
        '/admin/dashboard/users'
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach trigger to profiles
DROP TRIGGER IF EXISTS on_verification_requested ON public.profiles;
CREATE TRIGGER on_verification_requested
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE notify_admin_on_verification();

-- 4. Enable Realtime for profiles so admins can listen to real-time status updates easily
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;
