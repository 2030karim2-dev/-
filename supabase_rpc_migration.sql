-- 1. RPC for Bonds Statistics
CREATE OR REPLACE FUNCTION get_bonds_stats(p_company_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_amount NUMERIC := 0;
    v_total_count INT := 0;
    v_avg_amount NUMERIC := 0;
    
    v_receipt_count INT := 0;
    v_receipt_amount NUMERIC := 0;
    
    v_payment_count INT := 0;
    v_payment_amount NUMERIC := 0;
    
    v_net_amount NUMERIC := 0;
    
    v_chart_data JSON;
    v_account_data JSON;
BEGIN
    SELECT 
        COALESCE(SUM(COALESCE(base_amount, amount)), 0),
        COUNT(*),
        
        COUNT(*) FILTER (WHERE type = 'receipt'),
        COALESCE(SUM(COALESCE(base_amount, amount)) FILTER (WHERE type = 'receipt'), 0),
        
        COUNT(*) FILTER (WHERE type = 'payment'),
        COALESCE(SUM(COALESCE(base_amount, amount)) FILTER (WHERE type = 'payment'), 0)
    INTO 
        v_total_amount,
        v_total_count,
        v_receipt_count,
        v_receipt_amount,
        v_payment_count,
        v_payment_amount
    FROM bonds
    WHERE company_id = p_company_id;

    IF v_total_count > 0 THEN
        v_avg_amount := v_total_amount / v_total_count;
    END IF;
    
    v_net_amount := v_receipt_amount - v_payment_amount;

    WITH dates AS (
        SELECT date_trunc('day', NOW() - (n || ' days')::interval)::date AS d
        FROM generate_series(0, 29) n
    ),
    daily_stats AS (
        SELECT 
            d.d AS date,
            COALESCE(SUM(COALESCE(b.base_amount, b.amount)), 0) AS amount,
            COUNT(b.id) AS count
        FROM dates d
        LEFT JOIN bonds b ON d.d = b.date AND b.company_id = p_company_id
        GROUP BY d.d
    )
    SELECT json_agg(json_build_object(
        'date', date,
        'amount', amount,
        'count', count
    ) ORDER BY date ASC)
    INTO v_chart_data
    FROM daily_stats;

    WITH account_stats AS (
        SELECT 
            account_name AS name,
            COALESCE(SUM(COALESCE(base_amount, amount)), 0) AS amount,
            COUNT(*) AS count
        FROM bonds
        WHERE company_id = p_company_id
        GROUP BY account_name
        ORDER BY amount DESC
        LIMIT 5
    )
    SELECT COALESCE(json_agg(json_build_object(
        'name', name,
        'amount', amount,
        'count', count
    )), '[]'::json)
    INTO v_account_data
    FROM account_stats;

    RETURN json_build_object(
        'totalAmount', v_total_amount,
        'count', v_total_count,
        'avgAmount', v_avg_amount,
        'chartData', COALESCE(v_chart_data, '[]'::json),
        'accountData', v_account_data,
        'totals', json_build_object(
            'receiptCount', v_receipt_count,
            'receiptAmount', v_receipt_amount,
            'paymentCount', v_payment_count,
            'paymentAmount', v_payment_amount,
            'netAmount', v_net_amount
        )
    );
END;
$$;

-- 2. RPC for Item Movements with Running Balance
CREATE OR REPLACE FUNCTION get_item_movements_with_balance(p_company_id UUID, p_product_id UUID)
RETURNS TABLE (
    id UUID,
    date TIMESTAMPTZ,
    quantity NUMERIC, -- Positive display quantity
    transaction_type TEXT, -- 'in' or 'out'
    original_type TEXT,
    reference_type TEXT,
    source_user TEXT,
    source_name TEXT,
    document_number TEXT,
    notes TEXT,
    raw_quantity NUMERIC,
    balance_after NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH raw_movements AS (
        SELECT 
            m.id,
            m.created_at AS date,
            m.quantity AS db_qty,
            m.transaction_type AS original_type,
            m.reference_type,
            m.reference_id,
            m.notes,
            COALESCE(u.email, 'System') AS source_user
        FROM stock_movements m
        LEFT JOIN auth.users u ON m.created_by = u.id
        WHERE m.product_id = p_product_id AND m.company_id = p_company_id
    ),
    resolved_invoices AS (
        SELECT 
            r.id,
            CASE 
                WHEN LOWER(i.type) IN ('sale', 'sales') THEN 'فاتورة بيع #' || i.invoice_number
                WHEN LOWER(i.type) = 'purchase' THEN 'فاتورة شراء #' || i.invoice_number
                WHEN LOWER(i.type) IN ('return_sale', 'sale_return', 'sales_return') THEN 'مردود مبيعات #' || i.invoice_number
                WHEN LOWER(i.type) IN ('return_purchase', 'purchase_return') THEN 'مردود مشتريات #' || i.invoice_number
                ELSE 'فاتورة #' || i.invoice_number
            END AS doc_num,
            COALESCE(p.name, '---') AS src_name
        FROM raw_movements r
        JOIN invoices i ON r.reference_id = i.id
        LEFT JOIN parties p ON i.party_id = p.id
        WHERE r.reference_type ILIKE '%invoice%'
    ),
    resolved_transfers AS (
        SELECT 
            r.id,
            'مناقلة مخزنية' AS doc_num,
            COALESCE(wf.name_ar, '?') || ' ◄ ' || COALESCE(wt.name_ar, '?') AS src_name
        FROM raw_movements r
        JOIN stock_transfers t ON r.reference_id = t.id
        LEFT JOIN warehouses wf ON t.from_warehouse_id = wf.id
        LEFT JOIN warehouses wt ON t.to_warehouse_id = wt.id
        WHERE r.reference_type = 'transfer'
    ),
    processed AS (
        SELECT 
            r.id,
            r.date,
            ABS(COALESCE(r.db_qty, 0)) AS quantity,
            CASE 
                WHEN LOWER(r.original_type) IN ('purchase', 'sales_return', 'return_sale', 'adj_in', 'transfer_in', 'initial') THEN 'in'
                WHEN LOWER(r.original_type) IN ('sales', 'purchase_return', 'return_purchase', 'adj_out', 'transfer_out') THEN 'out'
                ELSE CASE WHEN COALESCE(r.db_qty, 0) > 0 THEN 'in' ELSE 'out' END
            END AS transaction_type,
            r.original_type,
            r.reference_type,
            r.source_user::TEXT,
            COALESCE(i.src_name, t.src_name, CASE WHEN r.reference_type = 'audit' THEN 'تسوية جردية' ELSE '---' END)::TEXT AS source_name,
            COALESCE(i.doc_num, t.doc_num, CASE WHEN r.reference_type = 'audit' THEN 'جرد مخزني' ELSE '---' END)::TEXT AS document_number,
            COALESCE(r.notes, '')::TEXT AS notes,
            COALESCE(r.db_qty, 0) AS raw_quantity
        FROM raw_movements r
        LEFT JOIN resolved_invoices i ON r.id = i.id
        LEFT JOIN resolved_transfers t ON r.id = t.id
    ),
    balanced AS (
        SELECT 
            p.*,
            SUM(p.raw_quantity) OVER (ORDER BY p.date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS balance_after
        FROM processed p
    )
    SELECT * FROM balanced ORDER BY date DESC;
END;
$$;
