-- Migration: Robust Stock Deduction Fix
-- Description: Standardizes transaction types, makes stock recalculation safer against legacy/mixed data, and fixes YER-specific quantity scaling issues.
-- Author: Antigravity

-- 1. Redefine Product Stock Recalculation Function (Robust Version)
CREATE OR REPLACE FUNCTION public.recalculate_product_stock_for_warehouse(p_product_id UUID, p_warehouse_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total NUMERIC;
BEGIN
    -- Comprehensive SUM of all inventory transactions
    SELECT COALESCE(SUM(
        CASE 
            -- Standard Positives
            WHEN transaction_type IN ('in', 'sales_return', 'purchase', 'transfer_in', 'adj_in') THEN ABS(quantity)
            -- Standard Negatives
            WHEN transaction_type IN ('out', 'sales', 'sale', 'purchase_return', 'transfer_out', 'adj_out') THEN -ABS(quantity)
            -- Legacy Case-Insensitive / Upper
            WHEN UPPER(transaction_type) = 'IN' THEN ABS(quantity)
            WHEN UPPER(transaction_type) = 'OUT' THEN -ABS(quantity)
            WHEN UPPER(transaction_type) = 'ADJ' THEN quantity -- Preserve sign for ADJ
            -- Fallback: Use quantity as is
            ELSE quantity 
        END
    ), 0)
    INTO v_total
    FROM public.inventory_transactions
    WHERE product_id = p_product_id AND warehouse_id = p_warehouse_id;

    -- Update product_stock table
    INSERT INTO public.product_stock (product_id, warehouse_id, quantity)
    VALUES (p_product_id, p_warehouse_id, v_total)
    ON CONFLICT (product_id, warehouse_id) 
    DO UPDATE SET quantity = EXCLUDED.quantity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Redefine Commit Sales Invoice RPC (Consistent Version)
CREATE OR REPLACE FUNCTION public.commit_sales_invoice(
    p_company_id UUID,
    p_user_id UUID,
    p_party_id UUID,
    p_items JSONB, -- Array of {product_id, quantity, unit_price}
    p_payment_method TEXT,
    p_notes TEXT DEFAULT NULL,
    p_treasury_account_id UUID DEFAULT NULL,
    p_currency TEXT DEFAULT 'SAR',
    p_exchange_rate NUMERIC DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
    v_invoice_id UUID;
    v_invoice_number TEXT;
    v_item JSONB;
    v_total_amount NUMERIC := 0;
    v_warehouse_id UUID;
    v_result JSONB;
BEGIN
    -- 1. Generate Invoice Number (Fixed Syntax)
    SELECT 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((COALESCE(MAX(SUBSTRING(invoice_number FROM 14)), '0')::INT + 1)::TEXT, 4, '0')
    INTO v_invoice_number
    FROM public.invoices
    WHERE company_id = p_company_id AND type = 'sale' AND invoice_number LIKE 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';

    IF v_invoice_number IS NULL THEN
        v_invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-0001';
    END IF;

    -- 2. Calculate Total Amount (in Foreign Currency)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_total_amount := v_total_amount + ( (v_item->>'quantity')::NUMERIC * (v_item->>'unit_price')::NUMERIC );
    END LOOP;

    -- 3. Create Invoice Header
    INSERT INTO public.invoices (
        company_id, created_by, party_id, invoice_number, 
        total_amount, status, type, payment_method, notes,
        currency_code, exchange_rate, issue_date
    )
    VALUES (
        p_company_id, p_user_id, p_party_id, v_invoice_number,
        v_total_amount, 'posted', 'sale', p_payment_method, p_notes,
        p_currency, p_exchange_rate, NOW()
    )
    RETURNING id INTO v_invoice_id;

    -- 4. Process Items (Log Transactions - Triggers handle stock)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Insert Invoice Item (All monetary values in Foreign Currency)
        INSERT INTO public.invoice_items (
            invoice_id, product_id, quantity, unit_price, total
        )
        VALUES (
            v_invoice_id, (v_item->>'product_id')::UUID, 
            (v_item->>'quantity')::NUMERIC, 
            (v_item->>'unit_price')::NUMERIC,
            (v_item->>'quantity')::NUMERIC * (v_item->>'unit_price')::NUMERIC
        );

        -- Standardize Warehouse selection
        SELECT warehouse_id INTO v_warehouse_id 
        FROM public.product_stock 
        WHERE product_id = (v_item->>'product_id')::UUID 
        ORDER BY quantity DESC LIMIT 1;

        IF v_warehouse_id IS NULL THEN
            SELECT id INTO v_warehouse_id FROM public.warehouses WHERE company_id = p_company_id LIMIT 1;
        END IF;

        -- Record Inventory Transaction
        -- CRITICAL: Use 'sales' (plural) and POSITIVE quantity to align with trigger's preferred logic.
        INSERT INTO public.inventory_transactions (
            company_id, product_id, warehouse_id, transaction_type, 
            quantity, reference_id, reference_type
        )
        VALUES (
            p_company_id, (v_item->>'product_id')::UUID, v_warehouse_id, 'sales',
            (v_item->>'quantity')::NUMERIC, v_invoice_id, 'invoice'
        );
    END LOOP;

    -- 5. Prepare Result
    v_result := jsonb_build_object(
        'id', v_invoice_id,
        'invoice_number', v_invoice_number,
        'total_amount', v_total_amount
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger Global Stock Sync/Recalculation
-- This clears any historical errors caused by previously faulty logic.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT product_id, warehouse_id FROM public.product_stock
    LOOP
        PERFORM public.recalculate_product_stock_for_warehouse(r.product_id, r.warehouse_id);
    END LOOP;
END;
$$;
