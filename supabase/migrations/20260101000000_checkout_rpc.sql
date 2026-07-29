-- Create a custom type for order items input
DROP TYPE IF EXISTS checkout_item_input CASCADE;
CREATE TYPE checkout_item_input AS (
    product_id UUID,
    quantity INT
);

CREATE OR REPLACE FUNCTION process_checkout(
    p_user_id UUID,
    p_items JSONB,
    p_shipping_details JSONB,
    p_payment_method TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id UUID;
    v_total_amount DECIMAL(10,2) := 0;
    v_item JSONB;
    v_product_id UUID;
    v_quantity INT;
    v_product_price DECIMAL(10,2);
    v_stock_quantity INT;
BEGIN
    -- 1. Create the order first (we will update total amount later)
    INSERT INTO public.orders (user_id, status, shipping_address, payment_method, total_amount)
    VALUES (p_user_id, 'pending', p_shipping_details, p_payment_method, 0)
    RETURNING id INTO v_order_id;

    -- 2. Loop through items, lock product rows, validate stock, and create order items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_quantity := (v_item->>'quantity')::INT;

        IF v_quantity <= 0 THEN
            RAISE EXCEPTION 'Invalid quantity % for product %', v_quantity, v_product_id;
        END IF;

        -- Lock the row for update to prevent race conditions (prevent overselling)
        SELECT price, stock_quantity
        INTO v_product_price, v_stock_quantity
        FROM public.products
        WHERE id = v_product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % not found', v_product_id;
        END IF;

        IF v_stock_quantity < v_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Requested: %', v_product_id, v_stock_quantity, v_quantity;
        END IF;

        -- Deduct inventory
        UPDATE public.products
        SET stock_quantity = stock_quantity - v_quantity
        WHERE id = v_product_id;

        -- Add to total amount
        v_total_amount := v_total_amount + (v_product_price * v_quantity);

        -- Insert order item
        INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, subtotal)
        VALUES (v_order_id, v_product_id, v_quantity, v_product_price, v_product_price * v_quantity);
    END LOOP;

    -- 3. Update the order with the final total amount calculated securely on backend
    UPDATE public.orders
    SET total_amount = v_total_amount
    WHERE id = v_order_id;

    RETURN v_order_id;
END;
$$;
