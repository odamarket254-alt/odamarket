CREATE OR REPLACE FUNCTION search_products_autocomplete(search_term TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    image_url TEXT,
    price DECIMAL,
    sale_price DECIMAL,
    stock INT,
    match_rank INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.name, p.slug, p.image_url, p.price, p.sale_price, p.stock,
        CASE 
            WHEN p.name ILIKE search_term || '%' THEN 1
            ELSE 2
        END as match_rank
    FROM products p
    WHERE p.is_active = true
      AND (p.name ILIKE '%' || search_term || '%' OR p.description ILIKE '%' || search_term || '%')
    ORDER BY match_rank ASC, p.name ASC
    LIMIT 8;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
