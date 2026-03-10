-- ========================================================
-- Migration: Restore Financial Reports RPCs
-- Description: Re-creates report_profit_loss and report_balance_sheet
-- ========================================================

-- 1. Profit & Loss Report
CREATE OR REPLACE FUNCTION public.report_profit_loss(
    p_company_id UUID,
    p_from DATE DEFAULT '2000-01-01',
    p_to DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
    v_revenues JSON;
    v_expenses JSON;
    v_total_revenues DECIMAL(20, 2) := 0;
    v_total_expenses DECIMAL(20, 2) := 0;
    v_net_profit DECIMAL(20, 2) := 0;
BEGIN
    -- Temporary table for balances
    CREATE TEMP TABLE tmp_balances ON COMMIT DROP AS
    SELECT 
        a.id, 
        a.code, 
        a.name_ar AS name, 
        a.type,
        COALESCE(SUM(jel.debit_amount), 0) AS total_debit,
        COALESCE(SUM(jel.credit_amount), 0) AS total_credit
    FROM 
        public.accounts a
    LEFT JOIN 
        public.journal_entry_lines jel ON a.id = jel.account_id
    LEFT JOIN 
        public.journal_entries je ON jel.journal_entry_id = je.id 
        AND je.status = 'posted'
        AND je.entry_date >= p_from 
        AND je.entry_date <= p_to
        AND je.company_id = p_company_id
    WHERE 
        a.company_id = p_company_id
        AND a.type IN ('revenue', 'expense')
    GROUP BY 
        a.id, a.code, a.name_ar, a.type;

    -- Calculate Revenues (Credit - Debit)
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', id, 'code', code, 'name', name,
            'netBalance', (total_credit - total_debit)
        )
    ), '[]'::json)
    INTO v_revenues
    FROM tmp_balances WHERE type = 'revenue' AND (total_credit - total_debit) != 0;

    SELECT COALESCE(SUM(total_credit - total_debit), 0)
    INTO v_total_revenues
    FROM tmp_balances WHERE type = 'revenue';

    -- Calculate Expenses (Debit - Credit)
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', id, 'code', code, 'name', name,
            'netBalance', (total_debit - total_credit)
        )
    ), '[]'::json)
    INTO v_expenses
    FROM tmp_balances WHERE type = 'expense' AND (total_debit - total_credit) != 0;

    SELECT COALESCE(SUM(total_debit - total_credit), 0)
    INTO v_total_expenses
    FROM tmp_balances WHERE type = 'expense';

    -- Net Profit
    v_net_profit := v_total_revenues - v_total_expenses;

    RETURN json_build_object(
        'revenues', v_revenues,
        'expenses', v_expenses,
        'totalRevenues', v_total_revenues,
        'totalExpenses', v_total_expenses,
        'netProfit', v_net_profit
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Balance Sheet Report
CREATE OR REPLACE FUNCTION public.report_balance_sheet(
    p_company_id UUID,
    p_from DATE DEFAULT '2000-01-01',
    p_to DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
    v_assets JSON;
    v_liabilities JSON;
    v_equity JSON;
    v_total_assets DECIMAL(20, 2) := 0;
    v_total_liabilities DECIMAL(20, 2) := 0;
    v_total_equity DECIMAL(20, 2) := 0;
    v_net_profit DECIMAL(20, 2) := 0;
    v_difference DECIMAL(20, 2) := 0;
    v_is_balanced BOOLEAN;
BEGIN
    -- Temporary table for balances
    CREATE TEMP TABLE tmp_bs_balances ON COMMIT DROP AS
    SELECT 
        a.id, 
        a.code, 
        a.name_ar AS name, 
        a.type,
        COALESCE(SUM(jel.debit_amount), 0) AS total_debit,
        COALESCE(SUM(jel.credit_amount), 0) AS total_credit
    FROM 
        public.accounts a
    LEFT JOIN 
        public.journal_entry_lines jel ON a.id = jel.account_id
    LEFT JOIN 
        public.journal_entries je ON jel.journal_entry_id = je.id 
        AND je.status = 'posted'
        AND je.entry_date <= p_to
        AND je.company_id = p_company_id
    WHERE 
        a.company_id = p_company_id
    GROUP BY 
        a.id, a.code, a.name_ar, a.type;

    -- Calculate Assets (Debit - Credit)
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', id, 'code', code, 'name', name,
            'netBalance', (total_debit - total_credit)
        )
    ), '[]'::json)
    INTO v_assets
    FROM tmp_bs_balances WHERE type = 'asset' AND (total_debit - total_credit) != 0;

    SELECT COALESCE(SUM(total_debit - total_credit), 0)
    INTO v_total_assets
    FROM tmp_bs_balances WHERE type = 'asset';

    -- Calculate Liabilities (Credit - Debit)
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', id, 'code', code, 'name', name,
            'netBalance', (total_credit - total_debit)
        )
    ), '[]'::json)
    INTO v_liabilities
    FROM tmp_bs_balances WHERE type = 'liability' AND (total_credit - total_debit) != 0;

    SELECT COALESCE(SUM(total_credit - total_debit), 0)
    INTO v_total_liabilities
    FROM tmp_bs_balances WHERE type = 'liability';

    -- Calculate Equity (Credit - Debit)
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', id, 'code', code, 'name', name,
            'netBalance', (total_credit - total_debit)
        )
    ), '[]'::json)
    INTO v_equity
    FROM tmp_bs_balances WHERE type = 'equity' AND (total_credit - total_debit) != 0;

    SELECT COALESCE(SUM(total_credit - total_debit), 0)
    INTO v_total_equity
    FROM tmp_bs_balances WHERE type = 'equity';

    -- Get Net Profit from P&L limits
    SELECT CAST(report_profit_loss->>'netProfit' AS DECIMAL)
    INTO v_net_profit
    FROM public.report_profit_loss(p_company_id, p_from, p_to);

    -- Calculate Totals
    v_total_equity := v_total_equity + v_net_profit;
    v_difference := v_total_assets - (v_total_liabilities + v_total_equity);
    v_is_balanced := (ABS(v_difference) < 0.01);

    RETURN json_build_object(
        'assets', v_assets,
        'liabilities', v_liabilities,
        'equity', v_equity,
        'totalAssets', v_total_assets,
        'totalLiabilities', v_total_liabilities,
        'totalEquity', v_total_equity,
        'netProfit', v_net_profit,
        'isBalanced', v_is_balanced,
        'difference', v_difference
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.report_profit_loss(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_profit_loss(UUID, DATE, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION public.report_balance_sheet(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_balance_sheet(UUID, DATE, DATE) TO service_role;
