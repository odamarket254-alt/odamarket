SELECT 
  (SELECT count(*) FROM public.orders) as orders_count,
  (SELECT count(*) FROM public.products) as products_count,
  (SELECT count(*) FROM public.profiles) as profiles_count;
