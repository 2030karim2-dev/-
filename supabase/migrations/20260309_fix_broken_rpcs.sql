-- ============================================================
-- BUG FIX 1: get_bonds_stats
-- Problem: References non-existent 'bonds' table, 'base_amount', 'date', 'account_name' columns
-- Fix: Use 'payments' table with correct columns (amount, payment_date, account_id + JOIN accounts)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_bonds_stats(p_company_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
        COALESCE(SUM(amount * COALESCE(exchange_rate, 1)), 0),
        COUNT(*),
        COUNT(*) FILTER (WHERE type = 'receipt'),
        COALESCE(SUM(amount * COALESCE(exchange_rate, 1)) FILTER (WHERE type = 'receipt'), 0),
        COUNT(*) FILTER (WHERE type = 'payment'),
        COALESCE(SUM(amount * COALESCE(exchange_rate, 1)) FILTER (WHERE type = 'payment'), 0)
    INTO v_total_amount, v_total_count, v_receipt_count, v_receipt_amount, v_payment_count, v_payment_amount
    FROM payments
    WHERE company_id = p_company_id AND status != 'void' AND deleted_at IS NULL;

    IF v_total_count > 0 THEN v_avg_amount := v_total_amount / v_total_count; END IF;
    v_net_amount := v_receipt_amount - v_payment_amount;

    -- Chart data for last 30 days
    WITH dates AS (
        SELECT date_trunc('day', NOW() - (n || ' days')::interval)::date AS d FROM generate_series(0, 29) n
    ),
    daily_stats AS (
        SELECT d.d AS date,
            COALESCE(SUM(b.amount * COALESCE(b.exchange_rate, 1)), 0) AS amount,
            COUNT(b.id) AS count
        FROM dates d
        LEFT JOIN payments b ON d.d = b.payment_date AND b.company_id = p_company_id AND b.status != 'void' AND b.deleted_at IS NULL
        GROUP BY d.d
    )
    SELECT json_agg(json_build_object('date', date, 'amount', amount, 'count', count) ORDER BY date ASC)
    INTO v_chart_data FROM daily_stats;

    -- Top 5 accounts by volume
    WITH account_stats AS (
        SELECT COALESCE(a.name, 'غير محدد') AS name,
            COALESCE(SUM(py.amount * COALESCE(py.exchange_rate, 1)), 0) AS amount,
            COUNT(*) AS count
        FROM payments py LEFT JOIN accounts a ON py.account_id = a.id
        WHERE py.company_id = p_company_id AND py.status != 'void' AND py.deleted_at IS NULL
        GROUP BY a.name ORDER BY amount DESC LIMIT 5
    )
    SELECT COALESCE(json_agg(json_build_object('name', name, 'amount', amount, 'count', count)), '[]'::json)
    INTO v_account_data FROM account_stats;

    RETURN json_build_object(
        'totalAmount', v_total_amount, 'count', v_total_count, 'avgAmount', v_avg_amount,
        'chartData', COALESCE(v_chart_data, '[]'::json), 'accountData', v_account_data,
        'totals', json_build_object('receiptCount', v_receipt_count, 'receiptAmount', v_receipt_amount,
            'paymentCount', v_payment_count, 'paymentAmount', v_payment_amount, 'netAmount', v_net_amount)
    );
END;
$function$;

-- ============================================================
-- BUG FIX 2: get_customer_stats
-- Problem: References 'is_active' (doesn't exist), 'party_type' (doesn't exist)
-- Fix: Use 'status' = 'active' and 'type' = 'customer'
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_customer_stats(p_company_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalCustomers', COUNT(*),
        'activeCustomers', COUNT(*) FILTER (WHERE status = 'active'),
        'newThisMonth', COUNT(*) FILTER (WHERE customer_since >= DATE_TRUNC('month', CURRENT_DATE)),
        'avgInvoicesPerCustomer', COALESCE(AVG(total_invoices_count), 0),
        'totalOutstanding', COALESCE(SUM(balance), 0),
        'highValueCustomers', COUNT(*) FILTER (WHERE total_paid_amount > 10000)
    )
    INTO result
    FROM parties
    WHERE company_id = p_company_id AND type = 'customer' AND deleted_at IS NULL;
    RETURN result;
END;
$function$;

-- ============================================================
-- BUG FIX 3: get_top_customers_by_revenue
-- Problem: References 'party_type' (doesn't exist on parties table)
-- Fix: Use 'type' = 'customer'
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_top_customers_by_revenue(p_company_id uuid, p_limit integer DEFAULT 10)
 RETURNS TABLE(id uuid, name text, total_revenue numeric, invoice_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name::text,
        COALESCE(p.total_paid_amount, 0) as total_revenue,
        p.total_invoices_count::bigint as invoice_count
    FROM parties p
    WHERE p.company_id = p_company_id 
      AND p.type = 'customer'
      AND p.deleted_at IS NULL
    ORDER BY p.total_paid_amount DESC NULLS LAST
    LIMIT p_limit;
END;
$function$;

-- ============================================================
-- BUG FIX 4: get_inventory_valuation
-- Problem: References 'selling_price' (doesn't exist on products)
-- Fix: Use 'sale_price'
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_inventory_valuation(p_company_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cost_value numeric;
  v_market_value numeric;
  v_total_products bigint;
  v_total_stock numeric;
BEGIN
  SELECT 
    COALESCE(SUM(ps.quantity * p.cost_price), 0),
    COALESCE(SUM(ps.quantity * p.sale_price), 0),
    COUNT(DISTINCT p.id),
    COALESCE(SUM(ps.quantity), 0)
  INTO v_cost_value, v_market_value, v_total_products, v_total_stock
  FROM products p
  LEFT JOIN product_stock ps ON p.id = ps.product_id
  WHERE p.company_id = p_company_id AND p.deleted_at IS NULL;

  RETURN json_build_object(
    'costValue', v_cost_value,
    'marketValue', v_market_value,
    'profit', v_market_value - v_cost_value,
    'profitMargin', CASE WHEN v_cost_value > 0 THEN ((v_market_value - v_cost_value) / v_cost_value * 100) ELSE 0 END,
    'totalProducts', v_total_products,
    'totalStock', v_total_stock
  );
END;
$function$;

-- ============================================================
-- BUG FIX 5: get_potential_duplicates
-- Problem: References 'stock_quantity' column (doesn't exist on products)
-- Fix: JOIN with product_stock to get actual stock quantity
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_potential_duplicates(p_company_id uuid)
 RETURNS TABLE(product_a_id uuid, product_a_name text, product_a_sku text, product_a_brand text, product_a_stock numeric, product_a_price numeric, product_b_id uuid, product_b_name text, product_b_sku text, product_b_brand text, product_b_stock numeric, product_b_price numeric, similarity real)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        p1.id as product_a_id, 
        p1.name_ar as product_a_name, 
        p1.sku as product_a_sku,
        p1.brand as product_a_brand,
        COALESCE((SELECT SUM(ps.quantity) FROM product_stock ps WHERE ps.product_id = p1.id), 0)::NUMERIC as product_a_stock,
        p1.sale_price::NUMERIC as product_a_price,
        p2.id as product_b_id, 
        p2.name_ar as product_b_name, 
        p2.sku as product_b_sku,
        p2.brand as product_b_brand,
        COALESCE((SELECT SUM(ps.quantity) FROM product_stock ps WHERE ps.product_id = p2.id), 0)::NUMERIC as product_b_stock,
        p2.sale_price::NUMERIC as product_b_price,
        similarity(p1.name_ar, p2.name_ar) as sim
    FROM products p1
    JOIN products p2 ON p1.id < p2.id
    WHERE p1.company_id = p_company_id 
      AND p2.company_id = p_company_id
      AND p1.deleted_at IS NULL
      AND p2.deleted_at IS NULL
      AND similarity(p1.name_ar, p2.name_ar) > 0.6
    ORDER BY sim DESC;
END;
$function$;

-- ============================================================
-- BUG FIX 6: get_vehicle_products
-- Problem: References 'price' column (doesn't exist), uses pf.notes (may not exist)
-- Fix: Use 'sale_price', use COALESCE for notes
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_vehicle_products(v_id uuid)
 RETURNS TABLE(product_id uuid, fitment_id uuid, name text, sku text, part_number text, price numeric, total_stock numeric, notes text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as product_id,
        pf.id as fitment_id,
        p.name_ar as name, 
        p.sku,
        p.part_number,
        p.sale_price as price,
        COALESCE((SELECT SUM(quantity) FROM product_stock ps WHERE ps.product_id = p.id), 0) as total_stock,
        COALESCE(pf.notes, '')::text as notes
    FROM product_fitment pf
    JOIN products p ON pf.product_id = p.id
    WHERE pf.vehicle_id = v_id
    AND p.status = 'active';
END;
$function$;

-- ============================================================
-- BUG FIX 7: get_item_movements_with_balance
-- Problem: References 'stock_movements' table (doesn't exist), 'notes' column (doesn't exist)
-- Fix: Use 'inventory_transactions' table, remove notes reference
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_item_movements_with_balance(p_company_id uuid, p_product_id uuid)
 RETURNS TABLE(id uuid, date timestamp with time zone, quantity numeric, transaction_type text, original_type text, reference_type text, source_user text, source_name text, document_number text, notes text, raw_quantity numeric, balance_after numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
            ''::text AS notes,
            COALESCE(u.email, 'System') AS source_user
        FROM inventory_transactions m
        LEFT JOIN auth.users u ON m.created_by = u.id
        WHERE m.product_id = p_product_id AND m.company_id = p_company_id AND m.deleted_at IS NULL
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
$function$;

-- ============================================================
-- BUG FIX 8: log_cron_backup_event
-- Problem: References wrong column names in audit_logs (table_name, record_id, changes)
-- Fix: Use correct columns (entity, entity_id, details)
-- Already fixed via search_path migration batch 1
-- ============================================================

-- ============================================================
-- BUG FIX 9: recalculate_all_party_balances
-- Already fixed via search_path migration (delegates to recalculate_party_balance_from_ledger)
-- ============================================================
