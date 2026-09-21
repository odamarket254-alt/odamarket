-- =========================================================================
-- ODA MARKET: Fix "Database error deleting user" in Supabase
-- =========================================================================
-- Root Cause:
-- When a user is deleted from Supabase (auth.users), PostgreSQL attempts to remove
-- the user's records. However, tables referencing auth.users(id) or public.profiles(id)
-- (such as delivery_addresses, support_tickets, reward_points, orders, etc.) were created
-- WITHOUT "ON DELETE CASCADE" (or with "ON DELETE RESTRICT").
-- This causes PostgreSQL to throw a foreign key constraint violation:
-- "ERROR: update or delete on table 'users' violates foreign key constraint on table ..."
-- GoTrue / Supabase surfaces this as: "failed to delete user: Database error deleting user".
--
-- Instructions:
-- Run this entire script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql).
-- =========================================================================

-- PART 1: DYNAMIC SCRIPT TO UPDATE ALL FOREIGN KEYS TO ON DELETE CASCADE
-- -------------------------------------------------------------------------
DO $$ 
DECLARE
    r RECORD;
    v_fk_count INT := 0;
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
                
                v_fk_count := v_fk_count + 1;
                RAISE NOTICE 'Updated constraint % on %.% (%) -> ON DELETE CASCADE', 
                    r.constraint_name, r.table_schema, r.table_name, r.column_name;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Skipped constraint % on %.%: %', r.constraint_name, r.table_name, SQLERRM;
            END;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Successfully updated % foreign key constraints to ON DELETE CASCADE.', v_fk_count;
END $$;


-- PART 2: EXPLICIT SAFETY UPDATES FOR KNOWN TABLES
-- -------------------------------------------------------------------------

-- 1. delivery_addresses
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
END $$;

-- 2. support_tickets
DO $$
BEGIN
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
END $$;

-- 3. reward_points
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reward_points') THEN
        ALTER TABLE public.reward_points DROP CONSTRAINT IF EXISTS reward_points_user_id_fkey;
        ALTER TABLE public.reward_points 
          ADD CONSTRAINT reward_points_user_id_fkey 
          FOREIGN KEY (user_id) 
          REFERENCES auth.users(id) 
          ON DELETE CASCADE;
    END IF;
END $$;

-- 4. orders
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
        ALTER TABLE public.orders 
          ADD CONSTRAINT orders_user_id_fkey 
          FOREIGN KEY (user_id) 
          REFERENCES public.profiles(id) 
          ON DELETE CASCADE;
    END IF;
END $$;

-- 5. cart_items
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cart_items') THEN
        ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_fkey;
        ALTER TABLE public.cart_items 
          ADD CONSTRAINT cart_items_user_id_fkey 
          FOREIGN KEY (user_id) 
          REFERENCES public.profiles(id) 
          ON DELETE CASCADE;
    END IF;
END $$;

-- 6. wishlists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wishlists') THEN
        ALTER TABLE public.wishlists DROP CONSTRAINT IF EXISTS wishlists_user_id_fkey;
        ALTER TABLE public.wishlists DROP CONSTRAINT IF EXISTS wishlists_buyer_id_fkey;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wishlists' AND column_name = 'user_id') THEN
            ALTER TABLE public.wishlists 
              ADD CONSTRAINT wishlists_user_id_fkey 
              FOREIGN KEY (user_id) 
              REFERENCES public.profiles(id) 
              ON DELETE CASCADE;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wishlists' AND column_name = 'buyer_id') THEN
            ALTER TABLE public.wishlists 
              ADD CONSTRAINT wishlists_buyer_id_fkey 
              FOREIGN KEY (buyer_id) 
              REFERENCES public.profiles(id) 
              ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 7. notifications
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
        ALTER TABLE public.notifications 
          ADD CONSTRAINT notifications_user_id_fkey 
          FOREIGN KEY (user_id) 
          REFERENCES public.profiles(id) 
          ON DELETE CASCADE;
    END IF;
END $$;

-- 8. saved_for_later
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saved_for_later') THEN
        ALTER TABLE public.saved_for_later DROP CONSTRAINT IF EXISTS saved_for_later_user_id_fkey;
        ALTER TABLE public.saved_for_later 
          ADD CONSTRAINT saved_for_later_user_id_fkey 
          FOREIGN KEY (user_id) 
          REFERENCES public.profiles(id) 
          ON DELETE CASCADE;
    END IF;
END $$;

-- 9. price_drop_alerts & back_in_stock_notifications
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'price_drop_alerts') THEN
        ALTER TABLE public.price_drop_alerts DROP CONSTRAINT IF EXISTS price_drop_alerts_user_id_fkey;
        ALTER TABLE public.price_drop_alerts 
          ADD CONSTRAINT price_drop_alerts_user_id_fkey 
          FOREIGN KEY (user_id) 
          REFERENCES public.profiles(id) 
          ON DELETE CASCADE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'back_in_stock_notifications') THEN
        ALTER TABLE public.back_in_stock_notifications DROP CONSTRAINT IF EXISTS back_in_stock_notifications_user_id_fkey;
        ALTER TABLE public.back_in_stock_notifications 
          ADD CONSTRAINT back_in_stock_notifications_user_id_fkey 
          FOREIGN KEY (user_id) 
          REFERENCES public.profiles(id) 
          ON DELETE CASCADE;
    END IF;
END $$;

-- 10. inquiries & recent_views
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inquiries') THEN
        ALTER TABLE public.inquiries DROP CONSTRAINT IF EXISTS inquiries_buyer_id_fkey;
        ALTER TABLE public.inquiries DROP CONSTRAINT IF EXISTS inquiries_seller_id_fkey;
        ALTER TABLE public.inquiries ADD CONSTRAINT inquiries_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        ALTER TABLE public.inquiries ADD CONSTRAINT inquiries_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recent_views') THEN
        ALTER TABLE public.recent_views DROP CONSTRAINT IF EXISTS recent_views_buyer_id_fkey;
        ALTER TABLE public.recent_views DROP CONSTRAINT IF EXISTS recent_views_user_id_fkey;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'recent_views' AND column_name = 'buyer_id') THEN
            ALTER TABLE public.recent_views ADD CONSTRAINT recent_views_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'recent_views' AND column_name = 'user_id') THEN
            ALTER TABLE public.recent_views ADD CONSTRAINT recent_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 11. reviews & products
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
        ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
        ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
        ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_seller_id_fkey;
        ALTER TABLE public.products ADD CONSTRAINT products_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 12. RFQ tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rfqs') THEN
        ALTER TABLE public.rfqs DROP CONSTRAINT IF EXISTS rfqs_buyer_id_fkey;
        ALTER TABLE public.rfqs ADD CONSTRAINT rfqs_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rfq_responses') THEN
        ALTER TABLE public.rfq_responses DROP CONSTRAINT IF EXISTS rfq_responses_supplier_id_fkey;
        ALTER TABLE public.rfq_responses ADD CONSTRAINT rfq_responses_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 13. Ensure profiles -> auth.users is ON DELETE CASCADE
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- PART 3: HELPER FUNCTION TO PURGE OR DELETE A USER SAFELY (OPTIONAL RPC)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS JSONB AS $$
BEGIN
    -- Check caller is admin/service_role
    IF auth.role() != 'service_role' AND NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can delete users';
    END IF;

    -- Clean up related tables explicitly first
    DELETE FROM public.delivery_addresses WHERE user_id = target_user_id;
    DELETE FROM public.reward_points WHERE user_id = target_user_id;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'support_tickets') THEN
        DELETE FROM public.support_tickets WHERE user_id = target_user_id OR customer_id = target_user_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cart_items') THEN
        DELETE FROM public.cart_items WHERE user_id = target_user_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wishlists') THEN
        DELETE FROM public.wishlists WHERE user_id = target_user_id OR buyer_id = target_user_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        DELETE FROM public.notifications WHERE user_id = target_user_id;
    END IF;

    DELETE FROM public.profiles WHERE id = target_user_id;
    DELETE FROM auth.users WHERE id = target_user_id;

    RETURN jsonb_build_object('success', true, 'deleted_user_id', target_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO service_role, authenticated;
