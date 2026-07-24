-- Enable real-time for relevant tables
BEGIN;

-- Check if the publication 'supabase_realtime' exists, and if not, this will just attempt to add to it assuming it exists in Supabase by default
ALTER PUBLICATION supabase_realtime ADD TABLE inquiries;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE categories;

-- Add any other relevant tables here, e.g., 'messages', 'notifications', etc., if they exist

COMMIT;
