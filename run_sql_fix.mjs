import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;

const env = fs.readFileSync('.env.local', 'utf-8');
const connectionMatch = env.match(/DATABASE_URL=(.+)/);

let connectionString = '';
if (connectionMatch) {
    connectionString = connectionMatch[1].trim();
} else {
    // Construct from Supabase env vars if direct URL isn't available
    const mainEnv = fs.readFileSync('.env', 'utf-8');
    const urlMatch = mainEnv.match(/VITE_SUPABASE_URL=https:\/\/(.+)\.supabase\.co/);
    if (urlMatch) {
        // This is a placeholder, direct connection string is usually required for pg.
        // I will try to read the full node connection string from a common location.
        console.error("Direct DATABASE_URL not found in .env.local. Trying to connect via project ID requires standard postgres password.");
        process.exit(1);
    }
}

const sql = `
-- Fix: Revert 'sales' back to 'sale' in commit_sales_invoice

CREATE OR REPLACE FUNCTION public.commit_sales_invoice(
    p_company_id UUID,
    p_user_id UUID,
    p_party_id UUID,
    p_items JSONB,
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
    -- 1. Generate Invoice Number
    SELECT 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((COALESCE(MAX(SUBSTRING(invoice_number FROM 14)), '0')::INT + 1)::TEXT, 4, '0')
    INTO v_invoice_number
    FROM public.invoices
    WHERE company_id = p_company_id AND type = 'sale' AND invoice_number LIKE 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';

    IF v_invoice_number IS NULL THEN
        v_invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-0001';
    END IF;

    -- 2. Calculate Total Amount
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

    -- 4. Process Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Insert Invoice Item
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
        -- CRITICAL: Reverted to strictly 'sale' (singular) to satisfy database check constraints.
        INSERT INTO public.inventory_transactions (
            company_id, product_id, warehouse_id, transaction_type, 
            quantity, reference_id, reference_type
        )
        VALUES (
            p_company_id, (v_item->>'product_id')::UUID, v_warehouse_id, 'sale',
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
`;

async function run() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log("Connected to database. Executing fix...");
        await client.query(sql);
        console.log("Fix executed successfully.");
    } catch (err) {
        console.error("Error executing fix:", err);
    } finally {
        await client.end();
    }
}

run();
