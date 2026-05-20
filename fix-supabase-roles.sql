-- Run this snippet in your Supabase SQL Editor to update your existing user_role enum
-- It adds 'seller' to the existing enum without dropping it, and updates any legacy 'supplier' accounts to 'seller'

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'seller';

-- Wait a moment for the new enum value to be registered, then you can run:
-- UPDATE profiles SET role = 'seller' WHERE role = 'supplier'::user_role;
