-- ========================================================
-- Migration: Fix Dashboard Totals RPC
-- Description: Corrects the calculation of sales, purchases, expenses, and debts
-- ========================================================

CREATE OR REPLACE FUNCTION public.get_dashboard_totals(p_company_id UUID)
RETURNS JSON AS $$
DECLARE
    v_total_sales DECIMAL(20, 2);
    v_total_purchases DECIMAL(20, 2);
    v_total_expenses DECIMAL(20, 2);
    v_total_debts DECIMAL(20, 2);
    v_total_supplier_debts DECIMAL(20, 2);
BEGIN
    -- 1. Total Sales (Excluding void)
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_total_sales
    FROM public.invoices
    WHERE company_id = p_company_id 
      AND type = 'sale' 
      AND status != 'void';

    -- 2. Total Purchases (Excluding void)
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_total_purchases
    FROM public.invoices
    WHERE company_id = p_company_id 
      AND type = 'purchase' 
      AND status != 'void';

    -- 3. Total Expenses (Excluding void)
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_expenses
    FROM public.expenses
    WHERE company_id = p_company_id 
      AND status != 'void';

    -- 4. Total Customer Debts (Positive balances only)
    SELECT COALESCE(SUM(balance), 0)
    INTO v_total_debts
    FROM public.party_balances
    WHERE company_id = p_company_id 
      AND type = 'customer' 
      AND balance > 0;

    -- 5. Total Supplier Debts (Positive balances only)
    SELECT COALESCE(SUM(balance), 0)
    INTO v_total_supplier_debts
    FROM public.party_balances
    WHERE company_id = p_company_id 
      AND type = 'supplier' 
      AND balance > 0;

    RETURN json_build_object(
        'total_sales', v_total_sales,
        'total_purchases', v_total_purchases,
        'total_expenses', v_total_expenses,
        'total_debts', v_total_debts,
        'total_supplier_debts', v_total_supplier_debts
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_dashboard_totals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_totals(UUID) TO service_role;
