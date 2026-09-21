-- Migration: 20260101000020_cascade_user_deletions.sql
-- Description: Ensure all foreign key references to auth.users and public.profiles support ON DELETE CASCADE

-- 1. Dynamic block to cascade all foreign keys pointing to auth.users and public.profiles
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT 
            tc.table_schema, 
            tc.table_name, 
            tc.constraint_name, 
            kcu.column_name,
            ccu.table_schema AS foreign_table_schema,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            rc.delete_rule
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.referential_constraints AS rc
            ON tc.constraint_name = rc.constraint_name
            AND tc.table_schema = rc.constraint_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON rc.unique_constraint_name = ccu.constraint_name
            AND rc.unique_constraint_schema = ccu.constraint_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_schema = 'public'
          AND (
            (ccu.table_schema = 'auth' AND ccu.table_name = 'users')
            OR
            (ccu.table_schema = 'public' AND ccu.table_name = 'profiles')
          )
          AND rc.delete_rule != 'CASCADE'
    ) 
    LOOP
        IF r.delete_rule != 'SET NULL' OR r.column_name IN ('user_id', 'buyer_id', 'seller_id', 'customer_id') THEN
            BEGIN
                EXECUTE 'ALTER TABLE ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) || 
                        ' DROP CONSTRAINT ' || quote_ident(r.constraint_name);
                
                EXECUTE 'ALTER TABLE ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) || 
                        ' ADD CONSTRAINT ' || quote_ident(r.constraint_name) || 
                        ' FOREIGN KEY (' || quote_ident(r.column_name) || 
                        ') REFERENCES ' || quote_ident(r.foreign_table_schema) || '.' || quote_ident(r.foreign_table_name) || 
                        '(' || quote_ident(r.foreign_column_name) || ') ON DELETE CASCADE';
            EXCEPTION WHEN OTHERS THEN
                -- Gracefully continue if constraint is locked or already modified
                NULL;
            END;
        END IF;
    END LOOP;
END $$;

-- 2. Explicit safeguards for delivery_addresses, support_tickets, and reward_points
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'delivery_addresses') THEN
        ALTER TABLE public.delivery_addresses DROP CONSTRAINT IF EXISTS delivery_addresses_user_id_fkey;
        ALTER TABLE public.delivery_addresses 
          ADD CONSTRAINT delivery_addresses_user_id_fkey 
          FOREIGN KEY (user_id) 
          REFERENCES auth.users(id) 
          ON DELETE CASCADE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'support_tickets') THEN
        ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_user_id_fkey;
        ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_customer_id_fkey;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'user_id') THEN
            ALTER TABLE public.support_tickets 
              ADD CONSTRAINT support_tickets_user_id_fkey 
              FOREIGN KEY (user_id) 
              REFERENCES auth.users(id) 
              ON DELETE CASCADE;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'customer_id') THEN
            ALTER TABLE public.support_tickets 
              ADD CONSTRAINT support_tickets_customer_id_fkey 
              FOREIGN KEY (customer_id) 
              REFERENCES auth.users(id) 
              ON DELETE CASCADE;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reward_points') THEN
        ALTER TABLE public.reward_points DROP CONSTRAINT IF EXISTS reward_points_user_id_fkey;
        ALTER TABLE public.reward_points 
          ADD CONSTRAINT reward_points_user_id_fkey 
          FOREIGN KEY (user_id) 
          REFERENCES auth.users(id) 
          ON DELETE CASCADE;
    END IF;
END $$;
