/**
 * Dashboard API Layer
 * Pure functions for fetching raw data from Supabase
 */

import { supabase } from '@/lib/supabaseClient';

export const dashboardApi = {
    /**
     * Fetches the core dashboard raw data in a single parallel transaction
     * @param companyId The current active company ID
     * @param dateLimit The ISO string limit for filtering (e.g., last 30 days)
     */
    async fetchRawDashboardData(companyId: string, _dateLimit: string) {
        // Batch 1: Fast/Essential UI Data (5 concurrent requests instead of 10)
        const batch1 = await Promise.all([
            // 1. Invoices (recent) - Using party:party_id(name) to match sales API
            supabase.from('invoices').select('id, total_amount, issue_date, status, type, party_id, currency_code, exchange_rate, party:party_id(name)').eq('company_id', companyId).neq('status', 'void').order('issue_date', { ascending: false }).limit(1000),
            // 2. Expenses (recent) - Removing exchange_operator which doesn't exist
            supabase.from('expenses').select('id, amount, expense_date, description, status, category_id, currency_code, exchange_rate, expense_categories(name)').eq('company_id', companyId).neq('status', 'void').order('expense_date', { ascending: false }).limit(1000),
            // 3. Customer Debts (Absolute Total)
            supabase.from('party_balances').select('balance').eq('company_id', companyId).eq('type', 'customer').gt('balance', 0),
            // 4. Supplier Debts (Absolute Total)
            supabase.from('party_balances').select('balance').eq('company_id', companyId).eq('type', 'supplier').gt('balance', 0),
            // 5. Expense Categories
            supabase.from('expense_categories').select('id, name').eq('company_id', companyId),
        ]);

        const firstError1 = batch1.find((res: any) => res.error)?.error;
        if (firstError1) throw firstError1;

        const [invoicesRes, expensesRes, customersRes, suppliersRes, categoriesRes] = batch1;

        // Batch 2: Heavy Analytics & RPCs (5 concurrent requests)
        const batch2 = await Promise.all([
            // 6. Journal Entries (Bonds - recent)
            supabase.from('journal_entries').select('id, entry_date, reference_type, journal_entry_lines(debit_amount, credit_amount)').eq('company_id', companyId).in('reference_type', ['receipt_bond', 'payment_bond']).eq('status', 'posted').order('entry_date', { ascending: false }).limit(1000) as any,
            // 7. Products with stock levels
            supabase.from('products').select('id, name_ar, min_stock_level, product_stock(quantity, warehouse_id)').eq('company_id', companyId).eq('status', 'active').limit(1000) as any,
            // 8. Invoice Items (for best sellers - recent)
            supabase.from('invoice_items').select('product_id, quantity, total, products:product_id(name_ar), invoices:invoice_id!inner(company_id, type, status, issue_date)').eq('invoices.company_id', companyId).eq('invoices.type', 'sale').neq('invoices.status', 'void').limit(2000) as any,
            // 9. Server Aggregated Totals
            supabase.rpc('get_dashboard_totals' as any, { p_company_id: companyId }),
            // 10. Trial Balance for accurate Profit/Loss
            supabase.rpc('report_trial_balance', { p_company_id: companyId, p_from: '2000-01-01', p_to: new Date().toISOString().split('T')[0] })
        ]);

        const firstError2 = batch2.find((res: any) => res.error)?.error;
        if (firstError2) throw firstError2;

        const [bondsRes, productsRes, itemsRes, totalsRes, trialBalanceRes] = batch2;

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
            trialBalanceRows: trialBalanceRes.data || []
        };
    }
};
