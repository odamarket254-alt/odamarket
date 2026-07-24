BEGIN;
-- Enable real-time for all relevant buyer tables
DO $$
DECLARE
    tables text[] := ARRAY[
        'products',
        'orders',
        'order_items',
        'wishlists',
        'carts',
        'inquiries',
        'reviews',
        'notifications',
        'activity_logs'
    ];
    t text;
BEGIN
    FOR t IN SELECT unnest(tables) LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL;', t);
        END IF;
    END LOOP;
END $$;

-- Drop existing publication if any, or just create it if it's missing (it usually exists by default)
-- Supabase uses `supabase_realtime` publication.
DO $$
DECLARE
    tables text[] := ARRAY[
        'products',
        'orders',
        'order_items',
        'wishlists',
        'carts',
        'inquiries',
        'reviews',
        'notifications',
        'activity_logs'
    ];
    t text;
BEGIN
    FOR t IN SELECT unnest(tables) LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            -- Check if it's already in the publication
            IF NOT EXISTS (
                SELECT 1 
                FROM pg_publication_tables 
                WHERE pubname = 'supabase_realtime' 
                AND schemaname = 'public' 
                AND tablename = t
            ) THEN
                EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
            END IF;
        END IF;
    END LOOP;
END $$;
COMMIT;
