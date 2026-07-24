
-- Supermarket Categories Seed Script

-- 1. Insert Main Categories
INSERT INTO public.categories (name, slug, description, sort_order, status, featured, navigation_status, homepage_status, created_at, updated_at)
VALUES ('Fresh Produce', 'fresh-produce', 'Fresh Produce Category', 10, 'active', true, true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order, status = 'active';

INSERT INTO public.categories (name, slug, description, sort_order, status, featured, navigation_status, homepage_status, created_at, updated_at)
VALUES ('Meat & Seafood', 'meat-seafood', 'Meat & Seafood Category', 20, 'active', true, true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order, status = 'active';

INSERT INTO public.categories (name, slug, description, sort_order, status, featured, navigation_status, homepage_status, created_at, updated_at)
VALUES ('Bakery', 'bakery', 'Bakery Category', 30, 'active', true, true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order, status = 'active';

INSERT INTO public.categories (name, slug, description, sort_order, status, featured, navigation_status, homepage_status, created_at, updated_at)
VALUES ('Dairy & Eggs', 'dairy-eggs', 'Dairy & Eggs Category', 40, 'active', true, true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order, status = 'active';

INSERT INTO public.categories (name, slug, description, sort_order, status, featured, navigation_status, homepage_status, created_at, updated_at)
VALUES ('Frozen Foods', 'frozen-foods', 'Frozen Foods Category', 50, 'active', true, true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order, status = 'active';

INSERT INTO public.categories (name, slug, description, sort_order, status, featured, navigation_status, homepage_status, created_at, updated_at)
VALUES ('Rice, Pasta & Grains', 'rice-pasta-grains', 'Rice, Pasta & Grains Category', 60, 'active', true, true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order, status = 'active';

INSERT INTO public.categories (name, slug, description, sort_order, status, featured, navigation_status, homepage_status, created_at, updated_at)
VALUES ('Canned & Packaged Foods', 'canned-packaged-foods', 'Canned & Packaged Foods Category', 70, 'active', true, true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order, status = 'active';

INSERT INTO public.categories (name, slug, description, sort_order, status, featured, navigation_status, homepage_status, created_at, updated_at)
VALUES ('Snacks', 'snacks', 'Snacks Category', 80, 'active', true, true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order, status = 'active';

INSERT INTO public.categories (name, slug, description, sort_order, status, featured, navigation_status, homepage_status, created_at, updated_at)
VALUES ('Beverages', 'beverages', 'Beverages Category', 90, 'active', true, true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order, status = 'active';

INSERT INTO public.categories (name, slug, description, sort_order, status, featured, navigation_status, homepage_status, created_at, updated_at)
VALUES ('Alcohol', 'alcohol', 'Alcohol Category', 100, 'active', true, true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order, status = 'active';

INSERT INTO public.categories (name, slug, description, sort_order, status, featured, navigation_status, homepage_status, created_at, updated_at)
VALUES ('Baby', 'baby', 'Baby Category', 110, 'active', true, true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order, status = 'active';

INSERT INTO public.categories (name, slug, description, sort_order, status, featured, navigation_status, homepage_status, created_at, updated_at)
VALUES ('Beauty & Cosmetics', 'beauty-cosmetics', 'Beauty & Cosmetics Category', 120, 'active', true, true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order, status = 'active';

INSERT INTO public.categories (name, slug, description, sort_order, status, featured, navigation_status, homepage_status, created_at, updated_at)
VALUES ('Personal Care', 'personal-care', 'Personal Care Category', 130, 'active', true, true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order, status = 'active';

INSERT INTO public.categories (name, slug, description, sort_order, status, featured, navigation_status, homepage_status, created_at, updated_at)
VALUES ('Household', 'household', 'Household Category', 140, 'active', true, true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order, status = 'active';

INSERT INTO public.categories (name, slug, description, sort_order, status, featured, navigation_status, homepage_status, created_at, updated_at)
VALUES ('Cleaning Supplies', 'cleaning-supplies', 'Cleaning Supplies Category', 150, 'active', true, true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order, status = 'active';

INSERT INTO public.categories (name, slug, description, sort_order, status, featured, navigation_status, homepage_status, created_at, updated_at)
VALUES ('Pet Supplies', 'pet-supplies', 'Pet Supplies Category', 160, 'active', true, true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order, status = 'active';

INSERT INTO public.categories (name, slug, description, sort_order, status, featured, navigation_status, homepage_status, created_at, updated_at)
VALUES ('Kitchen & Dining', 'kitchen-dining', 'Kitchen & Dining Category', 170, 'active', true, true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order, status = 'active';

INSERT INTO public.categories (name, slug, description, sort_order, status, featured, navigation_status, homepage_status, created_at, updated_at)
VALUES ('Home Appliances', 'home-appliances', 'Home Appliances Category', 180, 'active', true, true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order, status = 'active';

INSERT INTO public.categories (name, slug, description, sort_order, status, featured, navigation_status, homepage_status, created_at, updated_at)
VALUES ('Stationery', 'stationery', 'Stationery Category', 190, 'active', true, true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order, status = 'active';

INSERT INTO public.categories (name, slug, description, sort_order, status, featured, navigation_status, homepage_status, created_at, updated_at)
VALUES ('Electronics', 'electronics', 'Electronics Category', 200, 'active', true, true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order, status = 'active';

INSERT INTO public.categories (name, slug, description, sort_order, status, featured, navigation_status, homepage_status, created_at, updated_at)
VALUES ('Automotive', 'automotive', 'Automotive Category', 210, 'active', true, true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order, status = 'active';

INSERT INTO public.categories (name, slug, description, sort_order, status, featured, navigation_status, homepage_status, created_at, updated_at)
VALUES ('Garden', 'garden', 'Garden Category', 220, 'active', true, true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order, status = 'active';

INSERT INTO public.categories (name, slug, description, sort_order, status, featured, navigation_status, homepage_status, created_at, updated_at)
VALUES ('Party Supplies', 'party-supplies', 'Party Supplies Category', 230, 'active', true, true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order, status = 'active';

INSERT INTO public.categories (name, slug, description, sort_order, status, featured, navigation_status, homepage_status, created_at, updated_at)
VALUES ('Gifts', 'gifts', 'Gifts Category', 240, 'active', true, true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order, status = 'active';

INSERT INTO public.categories (name, slug, description, sort_order, status, featured, navigation_status, homepage_status, created_at, updated_at)
VALUES ('Health & Pharmacy', 'health-pharmacy', 'Health & Pharmacy Category', 250, 'active', true, true, true, NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET sort_order = EXCLUDED.sort_order, status = 'active';


-- 2. Insert Subcategories
DO $$ 
DECLARE
    parent_record RECORD;
BEGIN
    -- Parent: Fresh Produce
    SELECT id INTO parent_record FROM public.categories WHERE slug = 'fresh-produce' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Fresh Fruits', 'fresh-fruits', 'Fresh Fruits Products', parent_record.id, 10, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Fresh Vegetables', 'fresh-vegetables', 'Fresh Vegetables Products', parent_record.id, 20, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Herbs', 'herbs', 'Herbs Products', parent_record.id, 30, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Salad Mixes', 'salad-mixes', 'Salad Mixes Products', parent_record.id, 40, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Mushrooms', 'mushrooms', 'Mushrooms Products', parent_record.id, 50, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Organic Produce', 'organic-produce', 'Organic Produce Products', parent_record.id, 60, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Cut Fruits', 'cut-fruits', 'Cut Fruits Products', parent_record.id, 70, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Fresh Juice', 'fresh-juice', 'Fresh Juice Products', parent_record.id, 80, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
    END IF;

    -- Parent: Meat & Seafood
    SELECT id INTO parent_record FROM public.categories WHERE slug = 'meat-seafood' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Beef', 'beef', 'Beef Products', parent_record.id, 10, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Chicken', 'chicken', 'Chicken Products', parent_record.id, 20, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Goat', 'goat', 'Goat Products', parent_record.id, 30, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Lamb', 'lamb', 'Lamb Products', parent_record.id, 40, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Pork', 'pork', 'Pork Products', parent_record.id, 50, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Fish', 'fish', 'Fish Products', parent_record.id, 60, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Prawns', 'prawns', 'Prawns Products', parent_record.id, 70, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Crab', 'crab', 'Crab Products', parent_record.id, 80, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Lobster', 'lobster', 'Lobster Products', parent_record.id, 90, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Sausages', 'sausages', 'Sausages Products', parent_record.id, 100, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Minced Meat', 'minced-meat', 'Minced Meat Products', parent_record.id, 110, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Bacon', 'bacon', 'Bacon Products', parent_record.id, 120, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Ham', 'ham', 'Ham Products', parent_record.id, 130, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
    END IF;

    -- Parent: Bakery
    SELECT id INTO parent_record FROM public.categories WHERE slug = 'bakery' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Bread', 'bread', 'Bread Products', parent_record.id, 10, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Cakes', 'cakes', 'Cakes Products', parent_record.id, 20, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Cookies', 'cookies', 'Cookies Products', parent_record.id, 30, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Muffins', 'muffins', 'Muffins Products', parent_record.id, 40, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Croissants', 'croissants', 'Croissants Products', parent_record.id, 50, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Doughnuts', 'doughnuts', 'Doughnuts Products', parent_record.id, 60, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Pastries', 'pastries', 'Pastries Products', parent_record.id, 70, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Buns', 'buns', 'Buns Products', parent_record.id, 80, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Tortillas', 'tortillas', 'Tortillas Products', parent_record.id, 90, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Pizza Bases', 'pizza-bases', 'Pizza Bases Products', parent_record.id, 100, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
    END IF;

    -- Parent: Dairy & Eggs
    SELECT id INTO parent_record FROM public.categories WHERE slug = 'dairy-eggs' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Milk', 'milk', 'Milk Products', parent_record.id, 10, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Fresh Milk', 'fresh-milk', 'Fresh Milk Products', parent_record.id, 20, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Long Life Milk', 'long-life-milk', 'Long Life Milk Products', parent_record.id, 30, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Cheese', 'cheese', 'Cheese Products', parent_record.id, 40, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Butter', 'butter', 'Butter Products', parent_record.id, 50, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Margarine', 'margarine', 'Margarine Products', parent_record.id, 60, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Yoghurt', 'yoghurt', 'Yoghurt Products', parent_record.id, 70, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Cream', 'cream', 'Cream Products', parent_record.id, 80, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Eggs', 'eggs', 'Eggs Products', parent_record.id, 90, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Custard', 'custard', 'Custard Products', parent_record.id, 100, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
    END IF;

    -- Parent: Frozen Foods
    SELECT id INTO parent_record FROM public.categories WHERE slug = 'frozen-foods' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Frozen Chicken', 'frozen-chicken', 'Frozen Chicken Products', parent_record.id, 10, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Frozen Fish', 'frozen-fish', 'Frozen Fish Products', parent_record.id, 20, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Frozen Vegetables', 'frozen-vegetables', 'Frozen Vegetables Products', parent_record.id, 30, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Frozen Pizza', 'frozen-pizza', 'Frozen Pizza Products', parent_record.id, 40, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Frozen Fries', 'frozen-fries', 'Frozen Fries Products', parent_record.id, 50, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Ice Cream', 'ice-cream', 'Ice Cream Products', parent_record.id, 60, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Frozen Snacks', 'frozen-snacks', 'Frozen Snacks Products', parent_record.id, 70, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Frozen Fruits', 'frozen-fruits', 'Frozen Fruits Products', parent_record.id, 80, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
    END IF;

    -- Parent: Rice, Pasta & Grains
    SELECT id INTO parent_record FROM public.categories WHERE slug = 'rice-pasta-grains' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Rice', 'rice', 'Rice Products', parent_record.id, 10, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Pasta', 'pasta', 'Pasta Products', parent_record.id, 20, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Noodles', 'noodles', 'Noodles Products', parent_record.id, 30, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Spaghetti', 'spaghetti', 'Spaghetti Products', parent_record.id, 40, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Flour', 'flour', 'Flour Products', parent_record.id, 50, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Maize Flour', 'maize-flour', 'Maize Flour Products', parent_record.id, 60, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Wheat Flour', 'wheat-flour', 'Wheat Flour Products', parent_record.id, 70, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Oats', 'oats', 'Oats Products', parent_record.id, 80, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Breakfast Cereals', 'breakfast-cereals', 'Breakfast Cereals Products', parent_record.id, 90, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Beans', 'beans', 'Beans Products', parent_record.id, 100, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Lentils', 'lentils', 'Lentils Products', parent_record.id, 110, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
    END IF;

    -- Parent: Canned & Packaged Foods
    SELECT id INTO parent_record FROM public.categories WHERE slug = 'canned-packaged-foods' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Canned Beans', 'canned-beans', 'Canned Beans Products', parent_record.id, 10, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Canned Fish', 'canned-fish', 'Canned Fish Products', parent_record.id, 20, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Tomatoes', 'tomatoes', 'Tomatoes Products', parent_record.id, 30, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Soup', 'soup', 'Soup Products', parent_record.id, 40, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Sweet Corn', 'sweet-corn', 'Sweet Corn Products', parent_record.id, 50, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Peas', 'peas', 'Peas Products', parent_record.id, 60, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Pasta Sauce', 'pasta-sauce', 'Pasta Sauce Products', parent_record.id, 70, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Jam', 'jam', 'Jam Products', parent_record.id, 80, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Peanut Butter', 'peanut-butter', 'Peanut Butter Products', parent_record.id, 90, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
    END IF;

    -- Parent: Snacks
    SELECT id INTO parent_record FROM public.categories WHERE slug = 'snacks' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Crisps', 'crisps', 'Crisps Products', parent_record.id, 10, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Popcorn', 'popcorn', 'Popcorn Products', parent_record.id, 20, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Biscuits', 'biscuits', 'Biscuits Products', parent_record.id, 30, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Chocolate', 'chocolate', 'Chocolate Products', parent_record.id, 40, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Candy', 'candy', 'Candy Products', parent_record.id, 50, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Chewing Gum', 'chewing-gum', 'Chewing Gum Products', parent_record.id, 60, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Nuts', 'nuts', 'Nuts Products', parent_record.id, 70, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Trail Mix', 'trail-mix', 'Trail Mix Products', parent_record.id, 80, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
    END IF;

    -- Parent: Beverages
    SELECT id INTO parent_record FROM public.categories WHERE slug = 'beverages' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Soft Drinks', 'soft-drinks', 'Soft Drinks Products', parent_record.id, 10, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Juices', 'juices', 'Juices Products', parent_record.id, 20, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Water', 'water', 'Water Products', parent_record.id, 30, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Energy Drinks', 'energy-drinks', 'Energy Drinks Products', parent_record.id, 40, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Sports Drinks', 'sports-drinks', 'Sports Drinks Products', parent_record.id, 50, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Tea', 'tea', 'Tea Products', parent_record.id, 60, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Coffee', 'coffee', 'Coffee Products', parent_record.id, 70, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Drinking Chocolate', 'drinking-chocolate', 'Drinking Chocolate Products', parent_record.id, 80, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Syrups', 'syrups', 'Syrups Products', parent_record.id, 90, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
    END IF;

    -- Parent: Alcohol
    SELECT id INTO parent_record FROM public.categories WHERE slug = 'alcohol' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Beer', 'beer', 'Beer Products', parent_record.id, 10, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Wine', 'wine', 'Wine Products', parent_record.id, 20, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Whisky', 'whisky', 'Whisky Products', parent_record.id, 30, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Vodka', 'vodka', 'Vodka Products', parent_record.id, 40, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Gin', 'gin', 'Gin Products', parent_record.id, 50, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Rum', 'rum', 'Rum Products', parent_record.id, 60, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Brandy', 'brandy', 'Brandy Products', parent_record.id, 70, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Champagne', 'champagne', 'Champagne Products', parent_record.id, 80, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Cider', 'cider', 'Cider Products', parent_record.id, 90, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
    END IF;

    -- Parent: Baby
    SELECT id INTO parent_record FROM public.categories WHERE slug = 'baby' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Baby Food', 'baby-food', 'Baby Food Products', parent_record.id, 10, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Baby Formula', 'baby-formula', 'Baby Formula Products', parent_record.id, 20, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Diapers', 'diapers', 'Diapers Products', parent_record.id, 30, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Wipes', 'wipes', 'Wipes Products', parent_record.id, 40, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Baby Lotion', 'baby-lotion', 'Baby Lotion Products', parent_record.id, 50, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Baby Shampoo', 'baby-shampoo', 'Baby Shampoo Products', parent_record.id, 60, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Baby Soap', 'baby-soap', 'Baby Soap Products', parent_record.id, 70, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Baby Powder', 'baby-powder', 'Baby Powder Products', parent_record.id, 80, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
    END IF;

    -- Parent: Beauty & Cosmetics
    SELECT id INTO parent_record FROM public.categories WHERE slug = 'beauty-cosmetics' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Makeup', 'makeup', 'Makeup Products', parent_record.id, 10, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Lipstick', 'lipstick', 'Lipstick Products', parent_record.id, 20, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Foundation', 'foundation', 'Foundation Products', parent_record.id, 30, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Powder', 'powder', 'Powder Products', parent_record.id, 40, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Mascara', 'mascara', 'Mascara Products', parent_record.id, 50, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Skincare', 'skincare', 'Skincare Products', parent_record.id, 60, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Face Wash', 'face-wash', 'Face Wash Products', parent_record.id, 70, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Toner', 'toner', 'Toner Products', parent_record.id, 80, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Moisturizer', 'moisturizer', 'Moisturizer Products', parent_record.id, 90, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
    END IF;

    -- Parent: Personal Care
    SELECT id INTO parent_record FROM public.categories WHERE slug = 'personal-care' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Soap', 'soap', 'Soap Products', parent_record.id, 10, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Body Wash', 'body-wash', 'Body Wash Products', parent_record.id, 20, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Shampoo', 'shampoo', 'Shampoo Products', parent_record.id, 30, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Conditioner', 'conditioner', 'Conditioner Products', parent_record.id, 40, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Toothpaste', 'toothpaste', 'Toothpaste Products', parent_record.id, 50, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Toothbrush', 'toothbrush', 'Toothbrush Products', parent_record.id, 60, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Mouthwash', 'mouthwash', 'Mouthwash Products', parent_record.id, 70, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Deodorant', 'deodorant', 'Deodorant Products', parent_record.id, 80, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Perfume', 'perfume', 'Perfume Products', parent_record.id, 90, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Lotion', 'lotion', 'Lotion Products', parent_record.id, 100, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Shaving', 'shaving', 'Shaving Products', parent_record.id, 110, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Feminine Care', 'feminine-care', 'Feminine Care Products', parent_record.id, 120, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
    END IF;

    -- Parent: Household
    SELECT id INTO parent_record FROM public.categories WHERE slug = 'household' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Detergent', 'detergent', 'Detergent Products', parent_record.id, 10, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Dishwashing', 'dishwashing', 'Dishwashing Products', parent_record.id, 20, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Bleach', 'bleach', 'Bleach Products', parent_record.id, 30, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Floor Cleaner', 'floor-cleaner', 'Floor Cleaner Products', parent_record.id, 40, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Air Fresheners', 'air-fresheners', 'Air Fresheners Products', parent_record.id, 50, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Garbage Bags', 'garbage-bags', 'Garbage Bags Products', parent_record.id, 60, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Toilet Paper', 'toilet-paper', 'Toilet Paper Products', parent_record.id, 70, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Paper Towels', 'paper-towels', 'Paper Towels Products', parent_record.id, 80, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Tissue', 'tissue', 'Tissue Products', parent_record.id, 90, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
    END IF;

    -- Parent: Cleaning Supplies
    SELECT id INTO parent_record FROM public.categories WHERE slug = 'cleaning-supplies' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Brushes', 'brushes', 'Brushes Products', parent_record.id, 10, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Mops', 'mops', 'Mops Products', parent_record.id, 20, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Buckets', 'buckets', 'Buckets Products', parent_record.id, 30, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Gloves', 'gloves', 'Gloves Products', parent_record.id, 40, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Sponges', 'sponges', 'Sponges Products', parent_record.id, 50, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Cleaning Cloths', 'cleaning-cloths', 'Cleaning Cloths Products', parent_record.id, 60, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
    END IF;

    -- Parent: Pet Supplies
    SELECT id INTO parent_record FROM public.categories WHERE slug = 'pet-supplies' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Dog Food', 'dog-food', 'Dog Food Products', parent_record.id, 10, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Cat Food', 'cat-food', 'Cat Food Products', parent_record.id, 20, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Pet Snacks', 'pet-snacks', 'Pet Snacks Products', parent_record.id, 30, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Cat Litter', 'cat-litter', 'Cat Litter Products', parent_record.id, 40, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Pet Shampoo', 'pet-shampoo', 'Pet Shampoo Products', parent_record.id, 50, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Pet Toys', 'pet-toys', 'Pet Toys Products', parent_record.id, 60, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
    END IF;

    -- Parent: Kitchen & Dining
    SELECT id INTO parent_record FROM public.categories WHERE slug = 'kitchen-dining' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Plates', 'plates', 'Plates Products', parent_record.id, 10, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Cups', 'cups', 'Cups Products', parent_record.id, 20, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Glasses', 'glasses', 'Glasses Products', parent_record.id, 30, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Bowls', 'bowls', 'Bowls Products', parent_record.id, 40, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Cutlery', 'cutlery', 'Cutlery Products', parent_record.id, 50, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Pots', 'pots', 'Pots Products', parent_record.id, 60, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Pans', 'pans', 'Pans Products', parent_record.id, 70, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Storage Containers', 'storage-containers', 'Storage Containers Products', parent_record.id, 80, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
    END IF;

    -- Parent: Home Appliances
    SELECT id INTO parent_record FROM public.categories WHERE slug = 'home-appliances' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Blenders', 'blenders', 'Blenders Products', parent_record.id, 10, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Microwaves', 'microwaves', 'Microwaves Products', parent_record.id, 20, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Electric Kettles', 'electric-kettles', 'Electric Kettles Products', parent_record.id, 30, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Toasters', 'toasters', 'Toasters Products', parent_record.id, 40, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Rice Cookers', 'rice-cookers', 'Rice Cookers Products', parent_record.id, 50, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Irons', 'irons', 'Irons Products', parent_record.id, 60, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Fans', 'fans', 'Fans Products', parent_record.id, 70, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
    END IF;

    -- Parent: Stationery
    SELECT id INTO parent_record FROM public.categories WHERE slug = 'stationery' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Pens', 'pens', 'Pens Products', parent_record.id, 10, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Books', 'books', 'Books Products', parent_record.id, 20, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Notebooks', 'notebooks', 'Notebooks Products', parent_record.id, 30, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Printing Paper', 'printing-paper', 'Printing Paper Products', parent_record.id, 40, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Files', 'files', 'Files Products', parent_record.id, 50, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Markers', 'markers', 'Markers Products', parent_record.id, 60, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
    END IF;

    -- Parent: Electronics
    SELECT id INTO parent_record FROM public.categories WHERE slug = 'electronics' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Batteries', 'batteries', 'Batteries Products', parent_record.id, 10, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Chargers', 'chargers', 'Chargers Products', parent_record.id, 20, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Earphones', 'earphones', 'Earphones Products', parent_record.id, 30, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Extension Cables', 'extension-cables', 'Extension Cables Products', parent_record.id, 40, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Power Banks', 'power-banks', 'Power Banks Products', parent_record.id, 50, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Flash Drives', 'flash-drives', 'Flash Drives Products', parent_record.id, 60, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
    END IF;

    -- Parent: Automotive
    SELECT id INTO parent_record FROM public.categories WHERE slug = 'automotive' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Engine Oil', 'engine-oil', 'Engine Oil Products', parent_record.id, 10, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Car Wash', 'car-wash', 'Car Wash Products', parent_record.id, 20, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Coolant', 'coolant', 'Coolant Products', parent_record.id, 30, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Air Fresheners', 'air-fresheners', 'Air Fresheners Products', parent_record.id, 40, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Wiper Fluid', 'wiper-fluid', 'Wiper Fluid Products', parent_record.id, 50, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
    END IF;

    -- Parent: Garden
    SELECT id INTO parent_record FROM public.categories WHERE slug = 'garden' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Seeds', 'seeds', 'Seeds Products', parent_record.id, 10, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Fertilizer', 'fertilizer', 'Fertilizer Products', parent_record.id, 20, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Watering Cans', 'watering-cans', 'Watering Cans Products', parent_record.id, 30, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Flower Pots', 'flower-pots', 'Flower Pots Products', parent_record.id, 40, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
    END IF;

    -- Parent: Party Supplies
    SELECT id INTO parent_record FROM public.categories WHERE slug = 'party-supplies' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Balloons', 'balloons', 'Balloons Products', parent_record.id, 10, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Disposable Plates', 'disposable-plates', 'Disposable Plates Products', parent_record.id, 20, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Cups', 'cups', 'Cups Products', parent_record.id, 30, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Decorations', 'decorations', 'Decorations Products', parent_record.id, 40, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Candles', 'candles', 'Candles Products', parent_record.id, 50, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
    END IF;

    -- Parent: Gifts
    SELECT id INTO parent_record FROM public.categories WHERE slug = 'gifts' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Gift Hampers', 'gift-hampers', 'Gift Hampers Products', parent_record.id, 10, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Gift Cards', 'gift-cards', 'Gift Cards Products', parent_record.id, 20, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Flowers', 'flowers', 'Flowers Products', parent_record.id, 30, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Chocolates', 'chocolates', 'Chocolates Products', parent_record.id, 40, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
    END IF;

    -- Parent: Health & Pharmacy
    SELECT id INTO parent_record FROM public.categories WHERE slug = 'health-pharmacy' LIMIT 1;
    IF FOUND THEN
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Vitamins', 'vitamins', 'Vitamins Products', parent_record.id, 10, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Supplements', 'supplements', 'Supplements Products', parent_record.id, 20, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Pain Relief', 'pain-relief', 'Pain Relief Products', parent_record.id, 30, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('First Aid', 'first-aid', 'First Aid Products', parent_record.id, 40, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Thermometers', 'thermometers', 'Thermometers Products', parent_record.id, 50, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Face Masks', 'face-masks', 'Face Masks Products', parent_record.id, 60, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
        INSERT INTO public.categories (name, slug, description, parent_id, sort_order, status, navigation_status, created_at, updated_at)
        VALUES ('Sanitizers', 'sanitizers', 'Sanitizers Products', parent_record.id, 70, 'active', true, NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order, status = 'active';
    END IF;

END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_status ON public.categories(status);
