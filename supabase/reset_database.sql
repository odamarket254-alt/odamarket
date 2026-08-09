-- Reset Database Script for Supabase
-- This script completely wipes the public schema and custom storage configurations.
-- DANGER: THIS WILL DELETE ALL DATA IN THE PUBLIC SCHEMA.

-- 1. Drop all tables, views, functions, and sequences in the public schema
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Restore default permissions for public schema
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- 2. Clean up storage buckets (DANGER: Deletes all files and buckets)
DELETE FROM storage.objects;
DELETE FROM storage.buckets;

-- 3. Reset auth users (Optional, usually we leave auth.users alone but if a complete wipe is needed:)
-- DELETE FROM auth.users; 
-- Note: Deleting auth.users can break active sessions, usually dropping public schema is enough.

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
