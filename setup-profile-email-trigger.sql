-- =========================================================================
-- ODA MARKET: PostgreSQL Trigger for External Email Dispatch on Profile Insert
-- =========================================================================
-- Run this script in the Supabase SQL Editor to install or update the trigger function.

-- 1. Enable pg_net extension (Supabase async HTTP client)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_profile_email_dispatch()
RETURNS TRIGGER AS $$
DECLARE
  v_webhook_url TEXT;
  v_payload JSONB;
  v_headers JSONB;
  v_request_id BIGINT;
BEGIN
  -- Only execute when an email address is present
  IF NEW.email IS NULL OR TRIM(NEW.email) = '' THEN
    RETURN NEW;
  END IF;

  -- Build the JSON payload to send to the external webhook
  v_payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'profiles',
    'schema', 'public',
    'event', 'profile.created',
    'created_at', now(),
    'record', jsonb_build_object(
      'id', NEW.id,
      'email', NEW.email,
      'first_name', COALESCE(NEW.first_name, ''),
      'last_name', COALESCE(NEW.last_name, ''),
      'role', COALESCE(NEW.role::text, 'customer'),
      'phone_number', COALESCE(NEW.phone_number, ''),
      'created_at', NEW.created_at
    )
  );

  -- Webhook endpoint URL:
  -- Can be configured dynamically with:
  -- ALTER DATABASE postgres SET "app.settings.profile_webhook_url" = 'https://your-domain.com/api/webhooks/profile-created';
  v_webhook_url := COALESCE(
    NULLIF(current_setting('app.settings.profile_webhook_url', true), ''),
    'https://odamarket.co.ke/api/webhooks/profile-created'
  );

  v_headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'User-Agent', 'ODA-PostgreSQL-Trigger/1.0',
    'X-Supabase-Event', 'profiles.insert'
  );

  -- Safe HTTP dispatch using pg_net
  BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname IN ('net', 'extensions') AND p.proname = 'http_post'
    ) THEN
      SELECT net.http_post(
        url := v_webhook_url,
        headers := v_headers,
        body := v_payload
      ) INTO v_request_id;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING '[handle_new_profile_email_dispatch] HTTP dispatch warning for profile %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions to relevant roles
GRANT EXECUTE ON FUNCTION public.handle_new_profile_email_dispatch() TO postgres, authenticated, anon, service_role;

-- 3. Bind the trigger to public.profiles
DROP TRIGGER IF EXISTS on_profile_created_email_dispatch ON public.profiles;
CREATE TRIGGER on_profile_created_email_dispatch
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile_email_dispatch();

-- Verify trigger setup
SELECT tgname, relname 
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE tgname = 'on_profile_created_email_dispatch';
