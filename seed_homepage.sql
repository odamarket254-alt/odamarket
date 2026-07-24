-- Clear existing sections to avoid duplicates during testing (optional)
DELETE FROM public.homepage_sections;

-- Insert Hero Banner Section
INSERT INTO public.homepage_sections (name, title, type, sort_order, settings)
VALUES ('Main Hero Banner', null, 'hero_banner', 0, '{"auto_play": true}'::jsonb);

-- Insert Category Grid Section
INSERT INTO public.homepage_sections (name, title, subtitle, type, sort_order, settings)
VALUES ('Categories', 'Shop by Category', 'Find exactly what you need', 'category_grid', 1, '{}'::jsonb);

-- Insert Flash Deals Grid Section
INSERT INTO public.homepage_sections (name, title, type, sort_order, settings)
VALUES ('Flash Deals', 'Flash Deals', 'flash_deals', 2, '{"layout": "carousel", "max_products": 10, "show_view_all": true, "background_color": "rose-50"}'::jsonb);

-- Insert New Arrivals Grid Section
INSERT INTO public.homepage_sections (name, title, subtitle, type, sort_order, settings)
VALUES ('New Arrivals', 'New Arrivals', 'Fresh in store today', 'new_arrivals', 3, '{"layout": "grid", "max_products": 10, "show_view_all": true}'::jsonb);

-- Insert Best Sellers Grid Section
INSERT INTO public.homepage_sections (name, title, type, sort_order, settings)
VALUES ('Best Sellers', 'Best Sellers', 'best_sellers', 4, '{"layout": "carousel", "max_products": 10, "show_view_all": true}'::jsonb);
