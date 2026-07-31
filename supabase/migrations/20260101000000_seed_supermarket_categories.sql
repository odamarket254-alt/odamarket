-- Run this in your Supabase SQL editor to seed standard supermarket categories
-- Note: This will delete existing categories and all products associated with them if ON DELETE CASCADE is set, 
-- or set product category_id to NULL if ON DELETE SET NULL is set.

-- Optional: Delete existing categories
-- DELETE FROM categories;

-- 1. Insert Parent Categories
INSERT INTO categories (id, name, slug, is_active, sort_order, image_url, featured, status, navigation_status) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Deals & Offers', 'deals-offers', true, 10, null, true, 'active', true),
  ('a0000000-0000-0000-0000-000000000002', 'Fresh Produce', 'fresh-produce', true, 20, 'https://images.unsplash.com/photo-1610348725531-843dcf5aad8c?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000003', 'Meat & Poultry', 'meat-poultry', true, 30, 'https://images.unsplash.com/photo-1607623814075-e51df1bd682f?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000004', 'Fish & Seafood', 'fish-seafood', true, 40, 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000005', 'Dairy & Eggs', 'dairy-eggs', true, 50, 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000006', 'Bakery', 'bakery', true, 60, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000007', 'Frozen Foods', 'frozen-foods', true, 70, 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000008', 'Snacks', 'snacks', true, 80, 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000009', 'Beverages', 'beverages', true, 90, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000010', 'Alcohol', 'alcohol', true, 100, 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000011', 'Cooking Essentials', 'cooking-essentials', true, 110, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000012', 'Pantry', 'pantry', true, 120, 'https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000013', 'Herbs & Spices', 'herbs-spices', true, 130, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000014', 'Condiments & Sauces', 'condiments-sauces', true, 140, 'https://images.unsplash.com/photo-1528750711917-15e9e03d3ce6?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000015', 'Breakfast', 'breakfast', true, 150, 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000016', 'Baby Care', 'baby-care', true, 160, 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000017', 'Beauty & Personal Care', 'beauty-personal-care', true, 170, 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000018', 'Health & Wellness', 'health-wellness', true, 180, 'https://images.unsplash.com/photo-1584308666744-24d5e4a055d2?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000019', 'Oral Care', 'oral-care', true, 190, 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000020', 'Household Essentials', 'household-essentials', true, 200, 'https://images.unsplash.com/photo-1584820927498-cafe4c478a54?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000021', 'Paper & Disposable', 'paper-disposable', true, 210, 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000022', 'Pet Care', 'pet-care', true, 220, 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000023', 'Electronics', 'electronics', true, 230, 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000024', 'Kitchen & Dining', 'kitchen-dining', true, 240, 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000025', 'Home & Living', 'home-living', true, 250, 'https://images.unsplash.com/photo-1583847268964-b28ce8f258a1?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000026', 'Party Supplies', 'party-supplies', true, 260, 'https://images.unsplash.com/photo-1530103862676-de88d6174bb0?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000027', 'Stationery', 'stationery', true, 270, 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000028', 'Automotive', 'automotive', true, 280, 'https://images.unsplash.com/photo-1600706432502-77a0e2e32770?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true),
  ('a0000000-0000-0000-0000-000000000029', 'Pharmacy', 'pharmacy', true, 290, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=400&h=400', true, 'active', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, slug = EXCLUDED.slug, image_url = EXCLUDED.image_url, 
  sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active, featured = EXCLUDED.featured, status = EXCLUDED.status;

-- 2. Insert Subcategories
INSERT INTO categories (name, slug, is_active, sort_order, parent_id, status, navigation_status) VALUES
  -- Fresh Produce
  ('Fruits', 'fresh-produce-fruits', true, 10, 'a0000000-0000-0000-0000-000000000002', 'active', true),
  ('Vegetables', 'fresh-produce-vegetables', true, 20, 'a0000000-0000-0000-0000-000000000002', 'active', true),
  ('Herbs', 'fresh-produce-herbs', true, 30, 'a0000000-0000-0000-0000-000000000002', 'active', true),
  ('Salads', 'fresh-produce-salads', true, 40, 'a0000000-0000-0000-0000-000000000002', 'active', true),
  ('Organic Produce', 'fresh-produce-organic-produce', true, 50, 'a0000000-0000-0000-0000-000000000002', 'active', true),
  ('Fresh Mushrooms', 'fresh-produce-fresh-mushrooms', true, 60, 'a0000000-0000-0000-0000-000000000002', 'active', true),
  ('Fresh Spices', 'fresh-produce-fresh-spices', true, 70, 'a0000000-0000-0000-0000-000000000002', 'active', true),
  ('Avocados', 'fresh-produce-avocados', true, 80, 'a0000000-0000-0000-0000-000000000002', 'active', true),
  ('Citrus Fruits', 'fresh-produce-citrus-fruits', true, 90, 'a0000000-0000-0000-0000-000000000002', 'active', true),
  ('Seasonal Fruits', 'fresh-produce-seasonal-fruits', true, 100, 'a0000000-0000-0000-0000-000000000002', 'active', true),

  -- Meat & Poultry
  ('Beef', 'meat-poultry-beef', true, 10, 'a0000000-0000-0000-0000-000000000003', 'active', true),
  ('Chicken', 'meat-poultry-chicken', true, 20, 'a0000000-0000-0000-0000-000000000003', 'active', true),
  ('Goat Meat', 'meat-poultry-goat-meat', true, 30, 'a0000000-0000-0000-0000-000000000003', 'active', true),
  ('Lamb', 'meat-poultry-lamb', true, 40, 'a0000000-0000-0000-0000-000000000003', 'active', true),
  ('Pork', 'meat-poultry-pork', true, 50, 'a0000000-0000-0000-0000-000000000003', 'active', true),
  ('Turkey', 'meat-poultry-turkey', true, 60, 'a0000000-0000-0000-0000-000000000003', 'active', true),
  ('Sausages', 'meat-poultry-sausages', true, 70, 'a0000000-0000-0000-0000-000000000003', 'active', true),
  ('Bacon', 'meat-poultry-bacon', true, 80, 'a0000000-0000-0000-0000-000000000003', 'active', true),
  ('Minced Meat', 'meat-poultry-minced-meat', true, 90, 'a0000000-0000-0000-0000-000000000003', 'active', true),
  ('Steaks', 'meat-poultry-steaks', true, 100, 'a0000000-0000-0000-0000-000000000003', 'active', true),
  ('Organ Meat', 'meat-poultry-organ-meat', true, 110, 'a0000000-0000-0000-0000-000000000003', 'active', true),

  -- Fish & Seafood
  ('Fresh Fish', 'fish-seafood-fresh-fish', true, 10, 'a0000000-0000-0000-0000-000000000004', 'active', true),
  ('Frozen Fish', 'fish-seafood-frozen-fish', true, 20, 'a0000000-0000-0000-0000-000000000004', 'active', true),
  ('Tilapia', 'fish-seafood-tilapia', true, 30, 'a0000000-0000-0000-0000-000000000004', 'active', true),
  ('Nile Perch', 'fish-seafood-nile-perch', true, 40, 'a0000000-0000-0000-0000-000000000004', 'active', true),
  ('Salmon', 'fish-seafood-salmon', true, 50, 'a0000000-0000-0000-0000-000000000004', 'active', true),
  ('Tuna', 'fish-seafood-tuna', true, 60, 'a0000000-0000-0000-0000-000000000004', 'active', true),
  ('Prawns', 'fish-seafood-prawns', true, 70, 'a0000000-0000-0000-0000-000000000004', 'active', true),
  ('Shrimp', 'fish-seafood-shrimp', true, 80, 'a0000000-0000-0000-0000-000000000004', 'active', true),
  ('Crab', 'fish-seafood-crab', true, 90, 'a0000000-0000-0000-0000-000000000004', 'active', true),
  ('Lobster', 'fish-seafood-lobster', true, 100, 'a0000000-0000-0000-0000-000000000004', 'active', true),
  ('Octopus', 'fish-seafood-octopus', true, 110, 'a0000000-0000-0000-0000-000000000004', 'active', true),
  ('Squid', 'fish-seafood-squid', true, 120, 'a0000000-0000-0000-0000-000000000004', 'active', true),

  -- Dairy & Eggs
  ('Milk', 'dairy-eggs-milk', true, 10, 'a0000000-0000-0000-0000-000000000005', 'active', true),
  ('Yoghurt', 'dairy-eggs-yoghurt', true, 20, 'a0000000-0000-0000-0000-000000000005', 'active', true),
  ('Cheese', 'dairy-eggs-cheese', true, 30, 'a0000000-0000-0000-0000-000000000005', 'active', true),
  ('Butter', 'dairy-eggs-butter', true, 40, 'a0000000-0000-0000-0000-000000000005', 'active', true),
  ('Margarine', 'dairy-eggs-margarine', true, 50, 'a0000000-0000-0000-0000-000000000005', 'active', true),
  ('Cream', 'dairy-eggs-cream', true, 60, 'a0000000-0000-0000-0000-000000000005', 'active', true),
  ('Eggs', 'dairy-eggs-eggs', true, 70, 'a0000000-0000-0000-0000-000000000005', 'active', true),
  ('Flavoured Milk', 'dairy-eggs-flavoured-milk', true, 80, 'a0000000-0000-0000-0000-000000000005', 'active', true),
  ('Dairy Alternatives', 'dairy-eggs-dairy-alternatives', true, 90, 'a0000000-0000-0000-0000-000000000005', 'active', true),

  -- Bakery
  ('Bread', 'bakery-bread', true, 10, 'a0000000-0000-0000-0000-000000000006', 'active', true),
  ('Buns', 'bakery-buns', true, 20, 'a0000000-0000-0000-0000-000000000006', 'active', true),
  ('Croissants', 'bakery-croissants', true, 30, 'a0000000-0000-0000-0000-000000000006', 'active', true),
  ('Cakes', 'bakery-cakes', true, 40, 'a0000000-0000-0000-0000-000000000006', 'active', true),
  ('Cookies', 'bakery-cookies', true, 50, 'a0000000-0000-0000-0000-000000000006', 'active', true),
  ('Biscuits', 'bakery-biscuits', true, 60, 'a0000000-0000-0000-0000-000000000006', 'active', true),
  ('Doughnuts', 'bakery-doughnuts', true, 70, 'a0000000-0000-0000-0000-000000000006', 'active', true),
  ('Muffins', 'bakery-muffins', true, 80, 'a0000000-0000-0000-0000-000000000006', 'active', true),
  ('Pizza Bases', 'bakery-pizza-bases', true, 90, 'a0000000-0000-0000-0000-000000000006', 'active', true),
  ('Wraps', 'bakery-wraps', true, 100, 'a0000000-0000-0000-0000-000000000006', 'active', true),

  -- Frozen Foods
  ('Frozen Vegetables', 'frozen-foods-frozen-vegetables', true, 10, 'a0000000-0000-0000-0000-000000000007', 'active', true),
  ('Frozen Fruits', 'frozen-foods-frozen-fruits', true, 20, 'a0000000-0000-0000-0000-000000000007', 'active', true),
  ('Frozen Chicken', 'frozen-foods-frozen-chicken', true, 30, 'a0000000-0000-0000-0000-000000000007', 'active', true),
  ('Frozen Fish', 'frozen-foods-frozen-fish', true, 40, 'a0000000-0000-0000-0000-000000000007', 'active', true),
  ('Frozen Beef', 'frozen-foods-frozen-beef', true, 50, 'a0000000-0000-0000-0000-000000000007', 'active', true),
  ('Ice Cream', 'frozen-foods-ice-cream', true, 60, 'a0000000-0000-0000-0000-000000000007', 'active', true),
  ('Frozen Pizza', 'frozen-foods-frozen-pizza', true, 70, 'a0000000-0000-0000-0000-000000000007', 'active', true),
  ('Frozen Chips', 'frozen-foods-frozen-chips', true, 80, 'a0000000-0000-0000-0000-000000000007', 'active', true),
  ('Frozen Snacks', 'frozen-foods-frozen-snacks', true, 90, 'a0000000-0000-0000-0000-000000000007', 'active', true),

  -- Snacks
  ('Crisps', 'snacks-crisps', true, 10, 'a0000000-0000-0000-0000-000000000008', 'active', true),
  ('Popcorn', 'snacks-popcorn', true, 20, 'a0000000-0000-0000-0000-000000000008', 'active', true),
  ('Chocolate', 'snacks-chocolate', true, 30, 'a0000000-0000-0000-0000-000000000008', 'active', true),
  ('Candy', 'snacks-candy', true, 40, 'a0000000-0000-0000-0000-000000000008', 'active', true),
  ('Nuts', 'snacks-nuts', true, 50, 'a0000000-0000-0000-0000-000000000008', 'active', true),
  ('Trail Mix', 'snacks-trail-mix', true, 60, 'a0000000-0000-0000-0000-000000000008', 'active', true),
  ('Crackers', 'snacks-crackers', true, 70, 'a0000000-0000-0000-0000-000000000008', 'active', true),
  ('Chewing Gum', 'snacks-chewing-gum', true, 80, 'a0000000-0000-0000-0000-000000000008', 'active', true),
  ('Energy Bars', 'snacks-energy-bars', true, 90, 'a0000000-0000-0000-0000-000000000008', 'active', true)
ON CONFLICT (slug) DO NOTHING;

  -- Beverages
INSERT INTO categories (name, slug, is_active, sort_order, parent_id, status, navigation_status) VALUES
  ('Soft Drinks', 'beverages-soft-drinks', true, 10, 'a0000000-0000-0000-0000-000000000009', 'active', true),
  ('Juices', 'beverages-juices', true, 20, 'a0000000-0000-0000-0000-000000000009', 'active', true),
  ('Water', 'beverages-water', true, 30, 'a0000000-0000-0000-0000-000000000009', 'active', true),
  ('Energy Drinks', 'beverages-energy-drinks', true, 40, 'a0000000-0000-0000-0000-000000000009', 'active', true),
  ('Sports Drinks', 'beverages-sports-drinks', true, 50, 'a0000000-0000-0000-0000-000000000009', 'active', true),
  ('Tea', 'beverages-tea', true, 60, 'a0000000-0000-0000-0000-000000000009', 'active', true),
  ('Coffee', 'beverages-coffee', true, 70, 'a0000000-0000-0000-0000-000000000009', 'active', true),
  ('Hot Chocolate', 'beverages-hot-chocolate', true, 80, 'a0000000-0000-0000-0000-000000000009', 'active', true),
  ('Milk Drinks', 'beverages-milk-drinks', true, 90, 'a0000000-0000-0000-0000-000000000009', 'active', true)
ON CONFLICT (slug) DO NOTHING;

-- Alcohol
INSERT INTO categories (name, slug, is_active, sort_order, parent_id, status, navigation_status) VALUES
  ('Beer', 'alcohol-beer', true, 10, 'a0000000-0000-0000-0000-000000000010', 'active', true),
  ('Wine', 'alcohol-wine', true, 20, 'a0000000-0000-0000-0000-000000000010', 'active', true),
  ('Whisky', 'alcohol-whisky', true, 30, 'a0000000-0000-0000-0000-000000000010', 'active', true),
  ('Vodka', 'alcohol-vodka', true, 40, 'a0000000-0000-0000-0000-000000000010', 'active', true),
  ('Gin', 'alcohol-gin', true, 50, 'a0000000-0000-0000-0000-000000000010', 'active', true),
  ('Rum', 'alcohol-rum', true, 60, 'a0000000-0000-0000-0000-000000000010', 'active', true),
  ('Brandy', 'alcohol-brandy', true, 70, 'a0000000-0000-0000-0000-000000000010', 'active', true),
  ('Champagne', 'alcohol-champagne', true, 80, 'a0000000-0000-0000-0000-000000000010', 'active', true),
  ('Liqueurs', 'alcohol-liqueurs', true, 90, 'a0000000-0000-0000-0000-000000000010', 'active', true),
  ('Ciders', 'alcohol-ciders', true, 100, 'a0000000-0000-0000-0000-000000000010', 'active', true)
ON CONFLICT (slug) DO NOTHING;
