-- Fix for "Database error deleting user"
-- This script updates all foreign key constraints pointing to auth.users in the public schema
-- to include ON DELETE CASCADE. This allows users to be cleanly deleted from the Supabase dashboard.

DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT 
            tc.table_schema, 
            tc.table_name, 
            tc.constraint_name, 
            kcu.column_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_schema = 'public'
    ) 
    LOOP
        -- Check if this constraint references auth.users(id)
        -- We do this as a dynamic check to ensure we target the right constraints
        DECLARE
            is_auth_users BOOLEAN;
        BEGIN
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.constraint_column_usage ccu
                WHERE ccu.constraint_name = r.constraint_name
                  AND ccu.table_schema = 'auth'
                  AND ccu.table_name = 'users'
            ) INTO is_auth_users;

            IF is_auth_users THEN
                EXECUTE 'ALTER TABLE ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) || 
                        ' DROP CONSTRAINT ' || quote_ident(r.constraint_name);
                        
                EXECUTE 'ALTER TABLE ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) || 
                        ' ADD CONSTRAINT ' || quote_ident(r.constraint_name) || 
                        ' FOREIGN KEY (' || quote_ident(r.column_name) || 
                        ') REFERENCES auth.users(id) ON DELETE CASCADE';
                        
                RAISE NOTICE 'Updated constraint % on %.% to ON DELETE CASCADE', r.constraint_name, r.table_schema, r.table_name;
            END IF;
        END;
    END LOOP;
END $$;
