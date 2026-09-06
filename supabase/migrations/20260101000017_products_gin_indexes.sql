-- 1. Enable the pg_trgm extension (required for GIN trigram indexes on text)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create the GIN index on the product name
CREATE INDEX IF NOT EXISTS idx_products_name_gin 
ON public.products USING GIN (name gin_trgm_ops);

-- 3. Create the GIN index on the product description
CREATE INDEX IF NOT EXISTS idx_products_description_gin 
ON public.products USING GIN (description gin_trgm_ops);
