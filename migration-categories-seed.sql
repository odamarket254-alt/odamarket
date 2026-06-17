ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE CASCADE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS level INT DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE OR REPLACE FUNCTION update_modified_column()   
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;   
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_categories_modtime ON categories;
CREATE TRIGGER update_categories_modtime
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Note: We must make slug unique, which it already is in supabase-schema.sql.
-- But the subcategory names might clash, so we'll ensure they don't by appending parent name to slug.

DO $$
DECLARE
    parent_id UUID;
BEGIN

    -- 1. Agriculture & Farming
    INSERT INTO categories (name, slug, description, icon, level, sort_order)
    VALUES ('Agriculture & Farming', 'agriculture-farming', 'Agricultural machinery, farming equipment, seeds, fertilizers.', 'Sprout', 0, 1)
    ON CONFLICT (name) DO UPDATE SET icon = 'Sprout', level = 0, sort_order = 1
    RETURNING id INTO parent_id;
    
    INSERT INTO categories (name, slug, description, parent_id, level, sort_order)
    VALUES 
        ('Tractors & Machinery', 'tractors-machinery-ag', '', parent_id, 1, 1),
        ('Fertilizers', 'fertilizers-ag', '', parent_id, 1, 2),
        ('Seeds & Plants', 'seeds-plants-ag', '', parent_id, 1, 3),
        ('Agrochemicals', 'agrochemicals-ag', '', parent_id, 1, 4),
        ('Livestock Supplies', 'livestock-supplies-ag', '', parent_id, 1, 5)
    ON CONFLICT (slug) DO NOTHING;

    -- 2. Construction & Building Materials
    INSERT INTO categories (name, slug, description, icon, level, sort_order)
    VALUES ('Construction & Building Materials', 'construction-building', 'Cement, steel, roofing, and structural materials.', 'HardHat', 0, 2)
    ON CONFLICT (name) DO UPDATE SET icon = 'HardHat', level = 0, sort_order = 2
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, slug, description, parent_id, level, sort_order)
    VALUES 
        ('Cement & Concrete', 'cement-concrete-const', '', parent_id, 1, 1),
        ('Steel & Metals', 'steel-metals-const', '', parent_id, 1, 2),
        ('Lumber & Wood', 'lumber-wood-const', '', parent_id, 1, 3),
        ('Roofing', 'roofing-const', '', parent_id, 1, 4),
        ('Plumbing & Pipes', 'plumbing-pipes-const', '', parent_id, 1, 5)
    ON CONFLICT (slug) DO NOTHING;

    -- 3. Industrial Equipment
    INSERT INTO categories (name, slug, description, icon, level, sort_order)
    VALUES ('Industrial Equipment', 'industrial-equipment', 'Factory machinery and industrial tools.', 'Factory', 0, 3)
    ON CONFLICT (name) DO UPDATE SET icon = 'Factory', level = 0, sort_order = 3
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, slug, description, parent_id, level, sort_order)
    VALUES 
        ('Generators', 'generators-ind', '', parent_id, 1, 1),
        ('Pumps', 'pumps-ind', '', parent_id, 1, 2),
        ('Valves', 'valves-ind', '', parent_id, 1, 3),
        ('Compressors', 'compressors-ind', '', parent_id, 1, 4),
        ('Machine Tools', 'machine-tools-ind', '', parent_id, 1, 5)
    ON CONFLICT (slug) DO NOTHING;

    -- 4. Electrical & Electronics
    INSERT INTO categories (name, slug, description, icon, level, sort_order)
    VALUES ('Electrical & Electronics', 'electrical-electronics', 'Cables, lighting, motors and switchgears.', 'Cpu', 0, 4)
    ON CONFLICT (name) DO UPDATE SET icon = 'Cpu', level = 0, sort_order = 4
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, slug, description, parent_id, level, sort_order)
    VALUES 
        ('Cables & Wires', 'cables-wires-elec', '', parent_id, 1, 1),
        ('Lighting & Fixtures', 'lighting-fixtures-elec', '', parent_id, 1, 2),
        ('Motors', 'motors-elec', '', parent_id, 1, 3),
        ('Circuit Breakers', 'circuit-breakers-elec', '', parent_id, 1, 4),
        ('Transformers', 'transformers-elec', '', parent_id, 1, 5)
    ON CONFLICT (slug) DO NOTHING;

    -- 5. Packaging & Printing
    INSERT INTO categories (name, slug, description, icon, level, sort_order)
    VALUES ('Packaging & Printing', 'packaging-printing', 'Boxes, plastic wrap, tags, printing supplies.', 'Package', 0, 5)
    ON CONFLICT (name) DO UPDATE SET icon = 'Package', level = 0, sort_order = 5
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, slug, description, parent_id, level, sort_order)
    VALUES 
        ('Corrugated Boxes', 'corrugated-boxes-pack', '', parent_id, 1, 1),
        ('Plastic Packaging', 'plastic-packaging-pack', '', parent_id, 1, 2),
        ('Labels & Tags', 'labels-tags-pack', '', parent_id, 1, 3),
        ('Printing Inks', 'printing-inks-pack', '', parent_id, 1, 4),
        ('Paper Bags', 'paper-bags-pack', '', parent_id, 1, 5)
    ON CONFLICT (slug) DO NOTHING;

    -- 6. Office & Business Supplies
    INSERT INTO categories (name, slug, description, icon, level, sort_order)
    VALUES ('Office & Business Supplies', 'office-business', 'Printers, stationery, commercial furniture.', 'Briefcase', 0, 6)
    ON CONFLICT (name) DO UPDATE SET icon = 'Briefcase', level = 0, sort_order = 6
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, slug, description, parent_id, level, sort_order)
    VALUES 
        ('Printers & Scanners', 'printers-scanners-off', '', parent_id, 1, 1),
        ('Stationery', 'stationery-off', '', parent_id, 1, 2),
        ('Office Furniture', 'office-furniture-off', '', parent_id, 1, 3),
        ('Breakroom Supplies', 'breakroom-supplies-off', '', parent_id, 1, 4),
        ('Toners & Cartridges', 'toners-cartridges-off', '', parent_id, 1, 5)
    ON CONFLICT (slug) DO NOTHING;

    -- 7. Hospitality & Restaurant Supplies
    INSERT INTO categories (name, slug, description, icon, level, sort_order)
    VALUES ('Hospitality & Restaurant Supplies', 'hospitality-restaurant', 'Commercial kitchen gear, tableware.', 'Utensils', 0, 7)
    ON CONFLICT (name) DO UPDATE SET icon = 'Utensils', level = 0, sort_order = 7
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, slug, description, parent_id, level, sort_order)
    VALUES 
        ('Commercial Refrigeration', 'refrigeration-hosp', '', parent_id, 1, 1),
        ('Cutlery & Tableware', 'cutlery-tableware-hosp', '', parent_id, 1, 2),
        ('Ovens & Ranges', 'ovens-hosp', '', parent_id, 1, 3),
        ('Janitorial Supplies', 'janitorial-hosp', '', parent_id, 1, 4)
    ON CONFLICT (slug) DO NOTHING;

    -- 8. Healthcare & Medical
    INSERT INTO categories (name, slug, description, icon, level, sort_order)
    VALUES ('Healthcare & Medical', 'healthcare-medical', 'Devices, consumables, clinical furniture.', 'Stethoscope', 0, 8)
    ON CONFLICT (name) DO UPDATE SET icon = 'Stethoscope', level = 0, sort_order = 8
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, slug, description, parent_id, level, sort_order)
    VALUES 
        ('Medical Devices', 'devices-health', '', parent_id, 1, 1),
        ('Surgical Instruments', 'instruments-health', '', parent_id, 1, 2),
        ('Consumables', 'consumables-health', '', parent_id, 1, 3),
        ('Hospital Furniture', 'furniture-health', '', parent_id, 1, 4)
    ON CONFLICT (slug) DO NOTHING;

    -- 9. Food & Beverage
    INSERT INTO categories (name, slug, description, icon, level, sort_order)
    VALUES ('Food & Beverage', 'food-beverage', 'Bulk ingredients, spices, and commercial food supply.', 'Coffee', 0, 9)
    ON CONFLICT (name) DO UPDATE SET icon = 'Coffee', level = 0, sort_order = 9
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, slug, description, parent_id, level, sort_order)
    VALUES 
        ('Spices & Seasonings', 'spices-fb', '', parent_id, 1, 1),
        ('Grains & Cereals', 'grains-fb', '', parent_id, 1, 2),
        ('Beverage Syrups', 'syrups-fb', '', parent_id, 1, 3),
        ('Dairy Formulations', 'dairy-fb', '', parent_id, 1, 4)
    ON CONFLICT (slug) DO NOTHING;

    -- 10. Chemicals
    INSERT INTO categories (name, slug, description, icon, level, sort_order)
    VALUES ('Chemicals', 'chemicals', 'Industrial chemicals, pigments, solvents.', 'FlaskConical', 0, 10)
    ON CONFLICT (name) DO UPDATE SET icon = 'FlaskConical', level = 0, sort_order = 10
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, slug, description, parent_id, level, sort_order)
    VALUES 
        ('Industrial Chemicals', 'industrial-chem', '', parent_id, 1, 1),
        ('Pigments & Dyes', 'pigments-chem', '', parent_id, 1, 2),
        ('Solvents', 'solvents-chem', '', parent_id, 1, 3),
        ('Adhesives', 'adhesives-chem', '', parent_id, 1, 4)
    ON CONFLICT (slug) DO NOTHING;

    -- 11. Textile & Apparel
    INSERT INTO categories (name, slug, description, icon, level, sort_order)
    VALUES ('Textile & Apparel', 'textile-apparel', 'Fabrics, commercial uniforms, yarns.', 'Shirt', 0, 11)
    ON CONFLICT (name) DO UPDATE SET icon = 'Shirt', level = 0, sort_order = 11
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, slug, description, parent_id, level, sort_order)
    VALUES 
        ('Bulk Fabrics', 'fabrics-tex', '', parent_id, 1, 1),
        ('Commercial Uniforms', 'uniforms-tex', '', parent_id, 1, 2),
        ('Yarns & Threads', 'yarns-tex', '', parent_id, 1, 3)
    ON CONFLICT (slug) DO NOTHING;

    -- 12. Safety & Security
    INSERT INTO categories (name, slug, description, icon, level, sort_order)
    VALUES ('Safety & Security', 'safety-security', 'CCTV, PPE, access control systems.', 'Shield', 0, 12)
    ON CONFLICT (name) DO UPDATE SET icon = 'Shield', level = 0, sort_order = 12
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, slug, description, parent_id, level, sort_order)
    VALUES 
        ('CCTV & Surveillance', 'cctv-sec', '', parent_id, 1, 1),
        ('Personal Protective Equipment (PPE)', 'ppe-sec', '', parent_id, 1, 2),
        ('Fire Protection', 'fire-sec', '', parent_id, 1, 3),
        ('Access Control', 'access-sec', '', parent_id, 1, 4)
    ON CONFLICT (slug) DO NOTHING;

    -- 13. Automotive & Transport
    INSERT INTO categories (name, slug, description, icon, level, sort_order)
    VALUES ('Automotive & Transport', 'automotive-transport', 'Commercial truck parts, tires, fleet tools.', 'Car', 0, 13)
    ON CONFLICT (name) DO UPDATE SET icon = 'Car', level = 0, sort_order = 13
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, slug, description, parent_id, level, sort_order)
    VALUES 
        ('Spare Parts', 'parts-auto', '', parent_id, 1, 1),
        ('Commercial Tires', 'tires-auto', '', parent_id, 1, 2),
        ('Lubricants', 'lubricants-auto', '', parent_id, 1, 3),
        ('Batteries', 'batteries-auto', '', parent_id, 1, 4)
    ON CONFLICT (slug) DO NOTHING;

    -- 14. ICT & Technology
    INSERT INTO categories (name, slug, description, icon, level, sort_order)
    VALUES ('ICT & Technology', 'ict-technology', 'Servers, B2B software, enterprise networks.', 'Monitor', 0, 14)
    ON CONFLICT (name) DO UPDATE SET icon = 'Monitor', level = 0, sort_order = 14
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, slug, description, parent_id, level, sort_order)
    VALUES 
        ('Servers & Storage', 'servers-ict', '', parent_id, 1, 1),
        ('Networking Gear', 'networking-ict', '', parent_id, 1, 2),
        ('Enterprise Software', 'software-ict', '', parent_id, 1, 3)
    ON CONFLICT (slug) DO NOTHING;

    -- 15. Furniture & Interior
    INSERT INTO categories (name, slug, description, icon, level, sort_order)
    VALUES ('Furniture & Interior', 'furniture-interior', 'Desks, flooring, commercial cabinets.', 'Sofa', 0, 15)
    ON CONFLICT (name) DO UPDATE SET icon = 'Sofa', level = 0, sort_order = 15
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, slug, description, parent_id, level, sort_order)
    VALUES 
        ('Desks & Workstations', 'desks-furn', '', parent_id, 1, 1),
        ('Chairs & Seating', 'chairs-furn', '', parent_id, 1, 2),
        ('Commercial Flooring', 'flooring-furn', '', parent_id, 1, 3)
    ON CONFLICT (slug) DO NOTHING;

    -- 16. Energy & Power
    INSERT INTO categories (name, slug, description, icon, level, sort_order)
    VALUES ('Energy & Power', 'energy-power', 'Solar, inverters, bulk power modules.', 'Zap', 0, 16)
    ON CONFLICT (name) DO UPDATE SET icon = 'Zap', level = 0, sort_order = 16
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, slug, description, parent_id, level, sort_order)
    VALUES 
        ('Solar Panels', 'solar-energy', '', parent_id, 1, 1),
        ('Inverters', 'inverters-energy', '', parent_id, 1, 2),
        ('Large Batteries', 'batteries-energy', '', parent_id, 1, 3)
    ON CONFLICT (slug) DO NOTHING;

    -- 17. Logistics & Warehousing
    INSERT INTO categories (name, slug, description, icon, level, sort_order)
    VALUES ('Logistics & Warehousing', 'logistics-warehousing', 'Materials handling, pallet jacks, racks.', 'Warehouse', 0, 17)
    ON CONFLICT (name) DO UPDATE SET icon = 'Warehouse', level = 0, sort_order = 17
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, slug, description, parent_id, level, sort_order)
    VALUES 
        ('Pallet Jacks', 'pallet-jacks-log', '', parent_id, 1, 1),
        ('Racking Systems', 'racking-log', '', parent_id, 1, 2),
        ('Strapping', 'strapping-log', '', parent_id, 1, 3)
    ON CONFLICT (slug) DO NOTHING;

    -- 18. Education Supplies
    INSERT INTO categories (name, slug, description, icon, level, sort_order)
    VALUES ('Education Supplies', 'education-supplies', 'School gear, lab equipment, textbooks.', 'BookOpen', 0, 18)
    ON CONFLICT (name) DO UPDATE SET icon = 'BookOpen', level = 0, sort_order = 18
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, slug, description, parent_id, level, sort_order)
    VALUES 
        ('Laboratory Gear', 'lab-edu', '', parent_id, 1, 1),
        ('Classroom Furniture', 'furniture-edu', '', parent_id, 1, 2),
        ('Whiteboards', 'boards-edu', '', parent_id, 1, 3)
    ON CONFLICT (slug) DO NOTHING;

    -- 19. Mining & Heavy Equipment
    INSERT INTO categories (name, slug, description, icon, level, sort_order)
    VALUES ('Mining & Heavy Equipment', 'mining-heavy-equipment', 'Drilling rigs, loaders, crushers.', 'Pickaxe', 0, 19)
    ON CONFLICT (name) DO UPDATE SET icon = 'Pickaxe', level = 0, sort_order = 19
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, slug, description, parent_id, level, sort_order)
    VALUES 
        ('Excavators', 'excavators-mining', '', parent_id, 1, 1),
        ('Crushers', 'crushers-mining', '', parent_id, 1, 2),
        ('Drilling Rigs', 'drills-mining', '', parent_id, 1, 3)
    ON CONFLICT (slug) DO NOTHING;

    -- 20. Business Services
    INSERT INTO categories (name, slug, description, icon, level, sort_order)
    VALUES ('Business Services', 'business-services', 'Consulting, marketing, IT support.', 'LineChart', 0, 20)
    ON CONFLICT (name) DO UPDATE SET icon = 'LineChart', level = 0, sort_order = 20
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, slug, description, parent_id, level, sort_order)
    VALUES 
        ('IT Consulting', 'it-biz', '', parent_id, 1, 1),
        ('Accounting', 'accounting-biz', '', parent_id, 1, 2),
        ('Legal Services', 'legal-biz', '', parent_id, 1, 3)
    ON CONFLICT (slug) DO NOTHING;

END $$;

-- Migration script to link existing products to the newly created categories based on textual names
DO $$
DECLARE
    cat_ag UUID;
    cat_const UUID;
    cat_pack UUID;
    cat_elec UUID;
    cat_manu UUID;
BEGIN
    SELECT id INTO cat_ag FROM categories WHERE slug = 'agriculture-farming' LIMIT 1;
    SELECT id INTO cat_const FROM categories WHERE slug = 'construction-building' LIMIT 1;
    SELECT id INTO cat_pack FROM categories WHERE slug = 'packaging-printing' LIMIT 1;
    SELECT id INTO cat_elec FROM categories WHERE slug = 'electrical-electronics' LIMIT 1;
    SELECT id INTO cat_manu FROM categories WHERE slug = 'industrial-equipment' LIMIT 1;

    -- We check if there's a category column (as a text field) to migrate.
    -- We can only execute these if the column actually exists to prevent errors.
    -- However, the simplest way is to catch duplicate exceptions or column missing.
    -- Let's just try to update category_id if there is a category column.
    
    -- In postgres, you can check if a column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='category') THEN
        EXECUTE format('UPDATE products SET category_id = %L WHERE category ILIKE ''%%Agriculture%%'' OR category ILIKE ''%%Livestock%%'';', cat_ag);
        EXECUTE format('UPDATE products SET category_id = %L WHERE category ILIKE ''%%Construction%%'';', cat_const);
        EXECUTE format('UPDATE products SET category_id = %L WHERE category ILIKE ''%%Packaging%%'';', cat_pack);
        EXECUTE format('UPDATE products SET category_id = %L WHERE category ILIKE ''%%Electronic%%'';', cat_elec);
        EXECUTE format('UPDATE products SET category_id = %L WHERE category ILIKE ''%%Manufacturing%%'' OR category ILIKE ''%%Machinery%%'';', cat_manu);
    END IF;
END $$;

