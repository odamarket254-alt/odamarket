-- Add product_image and subtotal columns to order_items table

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS product_image TEXT,
ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2);

-- Update subtotal to be equal to total_price if it's null
UPDATE order_items
SET subtotal = total_price
WHERE subtotal IS NULL AND total_price IS NOT NULL;

-- Optionally, we can make subtotal NOT NULL if required by your application.
-- ALTER TABLE order_items ALTER COLUMN subtotal SET NOT NULL;
