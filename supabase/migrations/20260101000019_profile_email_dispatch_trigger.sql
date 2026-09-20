-- Migration: 20260101000019_profile_email_dispatch_trigger.sql
-- Description: Implement a PostgreSQL trigger function that executes upon a new row insertion
--              in the public.profiles table to invoke an external API request for email dispatch.

-- 1. Ensure pg_net extension is enabled (Supabase standard for async HTTP requests from Postgres)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Create the trigger function to invoke the external email dispatch API
CREATE OR REPLACE FUNCTION public.handle_new_profile_email_dispatch()
RETURNS TRIGGER AS $$
DECLARE
  v_webhook_url TEXT;
  v_payload JSONB;
  v_headers JSONB;
  v_request_id BIGINT;
BEGIN
  -- Only trigger if the new profile has a valid email
  IF NEW.email IS NULL OR TRIM(NEW.email) = '' THEN
    RETURN NEW;
  END IF;

  -- Construct standard webhook payload containing profile attributes
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

  -- Determine target webhook URL (configurable via app.settings.profile_webhook_url or default application URL)
  v_webhook_url := COALESCE(
    NULLIF(current_setting('app.settings.profile_webhook_url', true), ''),
    'https://odamarket.co.ke/api/webhooks/profile-created'
  );

  v_headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'User-Agent', 'ODA-PostgreSQL-Trigger/1.0',
    'X-Supabase-Event', 'profiles.insert'
  );

  -- Asynchronously invoke external API request via pg_net
  -- Wrapped in safe exception handling block so network or endpoint delays never block row insertion
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
      RAISE WARNING '[handle_new_profile_email_dispatch] HTTP dispatch notice for profile %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.handle_new_profile_email_dispatch() TO postgres, authenticated, anon, service_role;

-- 3. Bind the trigger to public.profiles AFTER INSERT
DROP TRIGGER IF EXISTS on_profile_created_email_dispatch ON public.profiles;
CREATE TRIGGER on_profile_created_email_dispatch
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile_email_dispatch();

COMMENT ON FUNCTION public.handle_new_profile_email_dispatch() IS 'Executes upon a new row insertion in public.profiles to invoke external API request for email dispatch';
