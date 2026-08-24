INSERT INTO public.homepage_sections (id, name, title, type, is_active, sort_order, settings)
VALUES 
  (gen_random_uuid(), 'Featured Products', 'Featured Products', 'featured_products', true, 1, '{"layout": "carousel", "max_products": 10, "products_per_row_desktop": 5, "products_per_row_tablet": 4, "products_per_row_mobile": 2, "show_view_all": true}'),
  (gen_random_uuid(), 'Flash Sales', 'Flash Sales', 'flash_deals', true, 2, '{"layout": "carousel", "max_products": 10, "products_per_row_desktop": 5, "products_per_row_tablet": 4, "products_per_row_mobile": 2, "show_view_all": true}'),
  (gen_random_uuid(), 'Best Deals of the Week', 'Best Deals of the Week', 'best_deals', true, 3, '{"layout": "carousel", "max_products": 10, "products_per_row_desktop": 5, "products_per_row_tablet": 4, "products_per_row_mobile": 2, "show_view_all": true}'),
  (gen_random_uuid(), 'New Arrivals', 'New Arrivals', 'new_arrivals', true, 4, '{"layout": "carousel", "max_products": 10, "products_per_row_desktop": 5, "products_per_row_tablet": 4, "products_per_row_mobile": 2, "show_view_all": true}'),
  (gen_random_uuid(), 'Wholesale Products', 'Wholesale Products', 'wholesale_products', true, 5, '{"layout": "carousel", "max_products": 10, "products_per_row_desktop": 5, "products_per_row_tablet": 4, "products_per_row_mobile": 2, "show_view_all": true}'),
  (gen_random_uuid(), 'Lowest Price Everyday', 'Lowest Price Everyday', 'lowest_price', true, 6, '{"layout": "carousel", "max_products": 10, "products_per_row_desktop": 5, "products_per_row_tablet": 4, "products_per_row_mobile": 2, "show_view_all": true}'),
  (gen_random_uuid(), 'Electronics Zone', 'Electronics Zone', 'electronics_zone', true, 7, '{"layout": "carousel", "max_products": 10, "products_per_row_desktop": 5, "products_per_row_tablet": 4, "products_per_row_mobile": 2, "show_view_all": true}')
ON CONFLICT DO NOTHING;
