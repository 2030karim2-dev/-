-- =========================================================================
-- Migration: Atomic WAC Calculation RPC
-- =========================================================================

CREATE OR REPLACE FUNCTION public.calculate_and_update_wac(
    p_product_id UUID,
    p_added_qty NUMERIC,
    p_unit_price NUMERIC
) RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_total_stock NUMERIC;
    v_current_cost NUMERIC;
    v_new_wac NUMERIC;
BEGIN
    -- 1. Lock the product row so no other transaction can read/update the cost simultaneously
    SELECT cost_price
    INTO v_current_cost
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with ID % not found.', p_product_id;
    END IF;

    -- 2. Calculate current total stock across all warehouses
    SELECT COALESCE(SUM(quantity), 0)
    INTO v_current_total_stock
    FROM public.product_stock
    WHERE product_id = p_product_id;

    -- 3. WAC Formula
    -- If current stock is 0 or negative, the new cost is just the new unit price.
    IF v_current_total_stock <= 0 THEN
        v_new_wac := p_unit_price;
    ELSIF p_added_qty <= 0 THEN
        -- If we are returning without a price, just keep current cost
        v_new_wac := v_current_cost;
    ELSE
        -- WAC = ((Current Stock * Current Cost) + (Added Qty * New Unit Price)) / (Current Stock + Added Qty)
        v_new_wac := ((v_current_total_stock * v_current_cost) + (p_added_qty * p_unit_price)) / (v_current_total_stock + p_added_qty);
    END IF;

    -- 4. Update the product with the newly calculated WAC safely
    UPDATE public.products
    SET cost_price = v_new_wac
    WHERE id = p_product_id;

    RETURN v_new_wac;
END;
$$;
