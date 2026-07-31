-- Run this in your Supabase SQL editor to seed standard supermarket categories
-- Note: This will delete existing categories. Remove the DELETE statement if you want to keep them.

DELETE FROM categories;

-- Insert Parent Categories
INSERT INTO categories (id, name, slug, is_active, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Fresh Produce', 'fresh-produce', true, 10),
  ('a0000000-0000-0000-0000-000000000002', 'Meat & Seafood', 'meat-seafood', true, 20),
  ('a0000000-0000-0000-0000-000000000003', 'Dairy & Eggs', 'dairy-eggs', true, 30),
  ('a0000000-0000-0000-0000-000000000004', 'Bakery', 'bakery', true, 40),
  ('a0000000-0000-0000-0000-000000000005', 'Pantry', 'pantry', true, 50),
  ('a0000000-0000-0000-0000-000000000006', 'Snacks & Beverages', 'snacks-beverages', true, 60),
  ('a0000000-0000-0000-0000-000000000007', 'Household Essentials', 'household-essentials', true, 70),
  ('a0000000-0000-0000-0000-000000000008', 'Personal Care', 'personal-care', true, 80);

-- Insert Subcategories
INSERT INTO categories (name, slug, is_active, sort_order, parent_id) VALUES
  -- Fresh Produce
  ('Fruits', 'fresh-produce-fruits', true, 1, 'a0000000-0000-0000-0000-000000000001'),
  ('Vegetables', 'fresh-produce-vegetables', true, 2, 'a0000000-0000-0000-0000-000000000001'),
  ('Organic', 'fresh-produce-organic', true, 3, 'a0000000-0000-0000-0000-000000000001'),
  
  -- Meat & Seafood
  ('Beef', 'meat-beef', true, 1, 'a0000000-0000-0000-0000-000000000002'),
  ('Chicken & Poultry', 'meat-chicken', true, 2, 'a0000000-0000-0000-0000-000000000002'),
  ('Seafood', 'meat-seafood', true, 3, 'a0000000-0000-0000-0000-000000000002'),

  -- Dairy & Eggs
  ('Milk', 'dairy-milk', true, 1, 'a0000000-0000-0000-0000-000000000003'),
  ('Cheese', 'dairy-cheese', true, 2, 'a0000000-0000-0000-0000-000000000003'),
  ('Eggs', 'dairy-eggs', true, 3, 'a0000000-0000-0000-0000-000000000003'),

  -- Bakery
  ('Bread', 'bakery-bread', true, 1, 'a0000000-0000-0000-0000-000000000004'),
  ('Pastries', 'bakery-pastries', true, 2, 'a0000000-0000-0000-0000-000000000004'),
  
  -- Pantry
  ('Canned Goods', 'pantry-canned', true, 1, 'a0000000-0000-0000-0000-000000000005'),
  ('Pasta & Rice', 'pantry-pasta-rice', true, 2, 'a0000000-0000-0000-0000-000000000005'),
  ('Spices & Seasonings', 'pantry-spices', true, 3, 'a0000000-0000-0000-0000-000000000005'),

  -- Snacks & Beverages
  ('Chips & Pretzels', 'snacks-chips', true, 1, 'a0000000-0000-0000-0000-000000000006'),
  ('Water', 'beverages-water', true, 2, 'a0000000-0000-0000-0000-000000000006'),
  ('Soda & Pop', 'beverages-soda', true, 3, 'a0000000-0000-0000-0000-000000000006');
