-- Odamarket Supermarket Categories Seed SQL

DO $$
DECLARE
  p_groceries UUID;
  p_fresh_food UUID;
  p_meat_seafood UUID;
  p_dairy_eggs UUID;
  p_bakery UUID;
  p_beverages UUID;
  p_snacks_confectionery UUID;
  p_household_cleaning UUID;
  p_personal_care UUID;
  p_beauty_cosmetics UUID;
  p_baby_kids UUID;
  p_health_wellness UUID;
  p_home_kitchen UUID;
  p_electronics UUID;
  p_phones_accessories UUID;
  p_fashion UUID;
  p_footwear UUID;
  p_stationery_office UUID;
  p_pet_care UUID;
  p_automotive UUID;
  p_hardware_diy UUID;
  p_sports_fitness UUID;
  p_garden_outdoor UUID;
  p_toys_games UUID;
  p_party_events UUID;
  p_seasonal_special_offers UUID;
BEGIN

  -- Groceries
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Groceries', 'groceries', true, 10)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_groceries;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Rice & Pasta', 'rice-pasta', p_groceries, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Cooking Oil & Ghee', 'cooking-oil-ghee', p_groceries, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Flour & Baking', 'flour-baking', p_groceries, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Sugar & Sweeteners', 'sugar-sweeteners', p_groceries, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Spices & Seasoning', 'spices-seasoning', p_groceries, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Canned & Preserved Foods', 'canned-preserved-foods', p_groceries, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Sauces & Condiments', 'sauces-condiments', p_groceries, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

  -- Fresh Food
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Fresh Food', 'fresh-food', true, 20)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_fresh_food;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Fresh Vegetables', 'fresh-vegetables', p_fresh_food, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Fresh Fruits', 'fresh-fruits', p_fresh_food, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Herbs & Spices', 'herbs-spices', p_fresh_food, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Salads', 'salads', p_fresh_food, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

  -- Meat & Seafood
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Meat & Seafood', 'meat-seafood', true, 30)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_meat_seafood;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Beef', 'beef', p_meat_seafood, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Chicken', 'chicken', p_meat_seafood, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Pork', 'pork', p_meat_seafood, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Mutton & Lamb', 'mutton-lamb', p_meat_seafood, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Fish & Seafood', 'fish-seafood', p_meat_seafood, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Sausages & Processed Meat', 'sausages-processed-meat', p_meat_seafood, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

  -- Dairy & Eggs
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Dairy & Eggs', 'dairy-eggs', true, 40)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_dairy_eggs;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Milk', 'milk', p_dairy_eggs, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Eggs', 'eggs', p_dairy_eggs, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Cheese', 'cheese', p_dairy_eggs, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Butter & Margarine', 'butter-margarine', p_dairy_eggs, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Yogurt', 'yogurt', p_dairy_eggs, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Cream', 'cream', p_dairy_eggs, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

  -- Bakery
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Bakery', 'bakery', true, 50)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_bakery;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Bread', 'bread', p_bakery, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Cakes & Pastries', 'cakes-pastries', p_bakery, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Biscuits & Cookies', 'biscuits-cookies', p_bakery, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Buns & Rolls', 'buns-rolls', p_bakery, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

  -- Beverages
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Beverages', 'beverages', true, 60)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_beverages;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Water', 'water', p_beverages, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Sodas & Carbonated Drinks', 'sodas-carbonated-drinks', p_beverages, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Juices', 'juices', p_beverages, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Coffee', 'coffee', p_beverages, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Tea', 'tea', p_beverages, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Energy & Sports Drinks', 'energy-sports-drinks', p_beverages, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

  -- Snacks & Confectionery
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Snacks & Confectionery', 'snacks-confectionery', true, 70)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_snacks_confectionery;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Crisps & Chips', 'crisps-chips', p_snacks_confectionery, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Chocolates', 'chocolates', p_snacks_confectionery, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Sweets & Candies', 'sweets-candies', p_snacks_confectionery, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Nuts & Seeds', 'nuts-seeds', p_snacks_confectionery, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Popcorn', 'popcorn', p_snacks_confectionery, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

  -- Household & Cleaning
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Household & Cleaning', 'household-cleaning', true, 80)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_household_cleaning;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Laundry Detergents', 'laundry-detergents', p_household_cleaning, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Dishwashing', 'dishwashing', p_household_cleaning, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Surface Cleaners', 'surface-cleaners', p_household_cleaning, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Air Fresheners', 'air-fresheners', p_household_cleaning, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Paper Products', 'paper-products', p_household_cleaning, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Trash Bags', 'trash-bags', p_household_cleaning, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Pest Control', 'pest-control', p_household_cleaning, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

  -- Personal Care
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Personal Care', 'personal-care', true, 90)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_personal_care;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Bath & Body', 'bath-body', p_personal_care, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Hair Care', 'hair-care', p_personal_care, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Oral Care', 'oral-care', p_personal_care, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Deodorants & Antiperspirants', 'deodorants-antiperspirants', p_personal_care, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Feminine Care', 'feminine-care', p_personal_care, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Shaving & Grooming', 'shaving-grooming', p_personal_care, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Hand Wash & Sanitizers', 'hand-wash-sanitizers', p_personal_care, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

  -- Beauty & Cosmetics
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Beauty & Cosmetics', 'beauty-cosmetics', true, 100)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_beauty_cosmetics;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Makeup', 'makeup', p_beauty_cosmetics, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Skincare', 'skincare', p_beauty_cosmetics, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Fragrances', 'fragrances', p_beauty_cosmetics, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Nail Care', 'nail-care', p_beauty_cosmetics, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

  -- Baby & Kids
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Baby & Kids', 'baby-kids', true, 110)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_baby_kids;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Diapers & Wipes', 'diapers-wipes', p_baby_kids, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Baby Food & Formula', 'baby-food-formula', p_baby_kids, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Baby Bath & Skincare', 'baby-bath-skincare', p_baby_kids, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Baby Accessories', 'baby-accessories', p_baby_kids, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

  -- Health & Wellness
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Health & Wellness', 'health-wellness', true, 120)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_health_wellness;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Vitamins & Supplements', 'vitamins-supplements', p_health_wellness, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('First Aid', 'first-aid', p_health_wellness, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Pain Relievers', 'pain-relievers', p_health_wellness, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Digestive Health', 'digestive-health', p_health_wellness, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Cold & Flu', 'cold-flu', p_health_wellness, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

  -- Home & Kitchen
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Home & Kitchen', 'home-kitchen', true, 130)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_home_kitchen;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Cookware', 'cookware', p_home_kitchen, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Tableware & Cutlery', 'tableware-cutlery', p_home_kitchen, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Food Storage', 'food-storage', p_home_kitchen, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Kitchen Towels & Aprons', 'kitchen-towels-aprons', p_home_kitchen, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Bedding', 'bedding', p_home_kitchen, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Bath Towels', 'bath-towels', p_home_kitchen, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Home Decor', 'home-decor', p_home_kitchen, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

  -- Electronics
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Electronics', 'electronics', true, 140)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_electronics;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Televisions', 'televisions', p_electronics, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Home Audio', 'home-audio', p_electronics, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Small Appliances', 'small-appliances', p_electronics, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Large Appliances', 'large-appliances', p_electronics, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

  -- Phones & Accessories
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Phones & Accessories', 'phones-accessories', true, 150)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_phones_accessories;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Smartphones', 'smartphones', p_phones_accessories, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Feature Phones', 'feature-phones', p_phones_accessories, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Phone Cases', 'phone-cases', p_phones_accessories, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Chargers & Cables', 'chargers-cables', p_phones_accessories, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Power Banks', 'power-banks', p_phones_accessories, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Earphones & Headphones', 'earphones-headphones', p_phones_accessories, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

  -- Fashion
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Fashion', 'fashion', true, 160)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_fashion;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Men's Clothing', 'men-s-clothing', p_fashion, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Women's Clothing', 'women-s-clothing', p_fashion, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Kids' Clothing', 'kids-clothing', p_fashion, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Underwear & Socks', 'underwear-socks', p_fashion, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Bags & Wallets', 'bags-wallets', p_fashion, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Watches & Jewelry', 'watches-jewelry', p_fashion, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

  -- Footwear
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Footwear', 'footwear', true, 170)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_footwear;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Men's Shoes', 'men-s-shoes', p_footwear, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Women's Shoes', 'women-s-shoes', p_footwear, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Kids' Shoes', 'kids-shoes', p_footwear, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Slippers & Sandals', 'slippers-sandals', p_footwear, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

  -- Stationery & Office
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Stationery & Office', 'stationery-office', true, 180)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_stationery_office;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Notebooks & Paper', 'notebooks-paper', p_stationery_office, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Pens & Pencils', 'pens-pencils', p_stationery_office, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Files & Folders', 'files-folders', p_stationery_office, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('School Supplies', 'school-supplies', p_stationery_office, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

  -- Pet Care
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Pet Care', 'pet-care', true, 190)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_pet_care;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Dog Food', 'dog-food', p_pet_care, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Cat Food', 'cat-food', p_pet_care, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Pet Accessories', 'pet-accessories', p_pet_care, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Pet Grooming', 'pet-grooming', p_pet_care, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

  -- Automotive
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Automotive', 'automotive', true, 200)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_automotive;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Car Care & Cleaning', 'car-care-cleaning', p_automotive, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Motor Oils & Fluids', 'motor-oils-fluids', p_automotive, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Car Accessories', 'car-accessories', p_automotive, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

  -- Hardware & DIY
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Hardware & DIY', 'hardware-diy', true, 210)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_hardware_diy;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Tools', 'tools', p_hardware_diy, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Electricals', 'electricals', p_hardware_diy, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Plumbing', 'plumbing', p_hardware_diy, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Paints & Adhesives', 'paints-adhesives', p_hardware_diy, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

  -- Sports & Fitness
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Sports & Fitness', 'sports-fitness', true, 220)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_sports_fitness;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Fitness Equipment', 'fitness-equipment', p_sports_fitness, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Sports Gear', 'sports-gear', p_sports_fitness, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Activewear', 'activewear', p_sports_fitness, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

  -- Garden & Outdoor
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Garden & Outdoor', 'garden-outdoor', true, 230)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_garden_outdoor;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Gardening Tools', 'gardening-tools', p_garden_outdoor, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Outdoor Seating', 'outdoor-seating', p_garden_outdoor, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('BBQ & Grills', 'bbq-grills', p_garden_outdoor, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

  -- Toys & Games
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Toys & Games', 'toys-games', true, 240)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_toys_games;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Action Figures', 'action-figures', p_toys_games, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Dolls', 'dolls', p_toys_games, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Board Games', 'board-games', p_toys_games, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Educational Toys', 'educational-toys', p_toys_games, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Outdoor Play', 'outdoor-play', p_toys_games, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

  -- Party & Events
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Party & Events', 'party-events', true, 250)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_party_events;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Party Decorations', 'party-decorations', p_party_events, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Disposable Tableware', 'disposable-tableware', p_party_events, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Gift Wrap & Cards', 'gift-wrap-cards', p_party_events, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

  -- Seasonal & Special Offers
  INSERT INTO public.categories (name, slug, is_active, sort_order)
  VALUES ('Seasonal & Special Offers', 'seasonal-special-offers', true, 260)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO p_seasonal_special_offers;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Holiday Specials', 'holiday-specials', p_seasonal_special_offers, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Clearance', 'clearance', p_seasonal_special_offers, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;
  INSERT INTO public.categories (name, slug, parent_id, is_active)
  VALUES ('Bundles & Offers', 'bundles-offers', p_seasonal_special_offers, true)
  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;

END $$;
