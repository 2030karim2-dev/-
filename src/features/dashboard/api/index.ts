/**
 * Dashboard API Layer
 * Pure functions for fetching raw data from Supabase
 */

import { supabase } from '@/core/database/api';

export const dashboardApi = {
    /**
     * Fetches the core dashboard raw data in a single parallel transaction
     * @param companyId The current active company ID
     * @param dateLimit The ISO string limit for filtering (e.g., last 30 days)
     */
    async fetchRawDashboardData(companyId: string, dateLimit: string, signal?: AbortSignal) {
        // Batch 1: Fast/Essential UI Data — filtered by dateLimit (last 90 days)
        const batch1 = await Promise.all([
            // 1. Invoices — only last 90 days, max 200 records
            supabase.from('invoices')
                .select('id, total_amount, issue_date, status, type, party_id, currency_code, exchange_rate, party:party_id(name)')
                .eq('company_id', companyId)
                .neq('status', 'void')
                .gte('issue_date', dateLimit)
                .order('issue_date', { ascending: false })
                .limit(200)
                .abortSignal(signal as any),

            // 2. Expenses — only last 90 days, max 200 records
            supabase.from('expenses')
                .select('id, amount, expense_date, description, status, category_id, currency_code, exchange_rate, expense_categories(name)')
                .eq('company_id', companyId)
                .neq('status', 'void')
                .gte('expense_date', dateLimit)
                .order('expense_date', { ascending: false })
                .limit(200)
                .abortSignal(signal as any),

            // 3. Customer Debts (View — already aggregated server-side)
            supabase.from('party_balances')
                .select('balance')
                .eq('company_id', companyId)
                .eq('type', 'customer')
                .gt('balance', 0)
                .abortSignal(signal as any),

            // 4. Supplier Debts (View — already aggregated server-side)
            supabase.from('party_balances')
                .select('balance')
                .eq('company_id', companyId)
                .eq('type', 'supplier')
                .gt('balance', 0)
                .abortSignal(signal as any),

            // 5. Expense Categories (tiny table, no limit needed)
            supabase.from('expense_categories')
                .select('id, name')
                .eq('company_id', companyId)
                .abortSignal(signal as any),
        ]);

        const firstError1 = batch1.find((res: any) => res.error)?.error;
        if (firstError1) throw firstError1;

        const [invoicesRes, expensesRes, customersRes, suppliersRes, categoriesRes] = batch1;

        // Batch 2: Analytics data — kept lightweight
        const batch2 = await Promise.all([
            // 6. Bonds (Journal entries) — last 90 days, max 100
            supabase.from('journal_entries')
                .select('id, entry_date, reference_type, journal_entry_lines(debit_amount, credit_amount)')
                .eq('company_id', companyId)
                .in('reference_type', ['receipt_bond', 'payment_bond'])
                .eq('status', 'posted')
                .gte('entry_date', dateLimit)
                .order('entry_date', { ascending: false })
                .limit(100)
                .abortSignal(signal as any) as any,

            // 7. Products with stock — only active, max 500 (for low-stock widget)
            supabase.from('products')
                .select('id, name_ar, min_stock_level, product_stock(quantity, warehouse_id)')
                .eq('company_id', companyId)
                .eq('status', 'active')
                .limit(500)
                .abortSignal(signal as any) as any,

            // 8. Best-selling items — last 90 days, max 100 (for top products widget)
            supabase.from('invoice_items')
                .select('product_id, quantity, total, products:product_id(name_ar), invoices:invoice_id!inner(company_id, type, status, issue_date)')
                .eq('invoices.company_id', companyId)
                .eq('invoices.type', 'sale')
                .neq('invoices.status', 'void')
                .gte('invoices.issue_date', dateLimit)
                .limit(100)
                .abortSignal(signal as any) as any,

            // 9. Server Aggregated Totals (lightweight RPC)
            supabase.rpc('get_dashboard_totals' as any, { p_company_id: companyId })
                .abortSignal(signal as any),

            // NOTE: report_trial_balance intentionally removed from batch.
            // It reads ALL journal entries from year 2000 — very heavy.
            // Use useDashboardTrialBalance() hook on-demand instead.
        ]);

        const firstError2 = batch2.find((res: any) => res.error)?.error;
        if (firstError2) throw firstError2;

        const [bondsRes, productsRes, itemsRes, totalsRes] = batch2;

        return {
            invoices: invoicesRes.data || [],
            expenses: expensesRes.data || [],
            customers: customersRes.data || [],
            suppliers: suppliersRes.data || [],
            bondEntries: bondsRes.data || [],
            productsWithStock: productsRes.data || [],
            categories: categoriesRes.data || [],
            invoiceItems: itemsRes.data || [],
            serverTotals: totalsRes.data || {},
            trialBalanceRows: [],  // always empty here — fetched separately on-demand
        };
    }

};
