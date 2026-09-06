-- 1. Enable pg_trgm for better text search if not enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Add GIN indexes for fast ILIKE search on products
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_description_trgm ON public.products USING GIN (description gin_trgm_ops);

-- 3. Add standard indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products (brand_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products (price);
CREATE INDEX IF NOT EXISTS idx_products_sale_price ON public.products (sale_price);

-- 4. Create an RPC function to get aggregate product stats efficiently
CREATE OR REPLACE FUNCTION get_product_aggregates(search_query TEXT DEFAULT '')
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    WITH filtered_products AS (
        SELECT category_id, brand_id, price, sale_price
        FROM products
        WHERE is_active = true
        AND (search_query = '' OR name ILIKE '%' || search_query || '%')
    )
    SELECT json_build_object(
        'category_counts', (
            SELECT json_object_agg(COALESCE(category_id::text, 'unknown'), count)
            FROM (SELECT category_id, count(*) as count FROM filtered_products GROUP BY category_id) c
        ),
        'brand_counts', (
            SELECT json_object_agg(COALESCE(brand_id::text, 'unknown'), count)
            FROM (SELECT brand_id, count(*) as count FROM filtered_products GROUP BY brand_id) b
        ),
        'min_price', (SELECT COALESCE(MIN(COALESCE(sale_price, price)), 0) FROM filtered_products),
        'max_price', (SELECT COALESCE(MAX(COALESCE(sale_price, price)), 0) FROM filtered_products)
    ) INTO result;
    
    RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
