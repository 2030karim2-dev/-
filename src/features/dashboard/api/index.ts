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
    async fetchRawDashboardData(companyId: string, dateLimit: string) {
        const [
            invoicesResult,
            expensesResult,
            customersResult,
            suppliersResult,
            bondResult,
            productsResult,
            categoriesResult,
            itemsResult
        ] = await Promise.all([
            // 1. Invoices (recent)
            supabase
                .from('invoices')
                .select('id, total_amount, issue_date, status, type, party_id, currency_code, exchange_rate, parties:party_id(name)')
                .eq('company_id', companyId)
                .neq('status', 'void')
                .gte('issue_date', dateLimit)
                .order('issue_date', { ascending: false })
                .limit(1000),
            // 2. Expenses (recent)
            supabase
                .from('expenses')
                .select('id, amount, expense_date, description, status, category_id, currency_code, exchange_rate, expense_categories(name)')
                .eq('company_id', companyId)
                .neq('status', 'void')
                .gte('expense_date', dateLimit)
                .order('expense_date', { ascending: false })
                .limit(1000),
            // 3. Customers (Top 100 for balance calculation)
            supabase
                .from('parties')
                .select('id, name, balance, type')
                .eq('company_id', companyId)
                .eq('type', 'customer')
                .is('deleted_at', null)
                .order('balance', { ascending: false })
                .limit(100),
            // 4. Suppliers (Top 100)
            supabase
                .from('parties')
                .select('id, name, balance, type')
                .eq('company_id', companyId)
                .eq('type', 'supplier')
                .is('deleted_at', null)
                .order('balance', { ascending: false })
                .limit(100),
            // 5. Journal Entries (Bonds - recent)
            supabase
                .from('journal_entries')
                .select(`
          id,
          entry_date,
          reference_type,
          journal_entry_lines(debit_amount, credit_amount)
        `)
                .eq('company_id', companyId)
                .in('reference_type', ['receipt_bond', 'payment_bond'])
                .eq('status', 'posted')
                .gte('entry_date', dateLimit)
                .order('entry_date', { ascending: false })
                .limit(1000) as any,
            // 6. Products with stock levels
            supabase
                .from('products')
                .select(`
          id,
          name_ar,
          min_stock_level,
          product_stock(quantity, warehouse_id)
        `)
                .eq('company_id', companyId)
                .eq('status', 'active')
                .limit(1000) as any,
            // 7. Expense Categories
            supabase
                .from('expense_categories')
                .select('id, name')
                .eq('company_id', companyId),
            // 8. Invoice Items (for best sellers - recent)
            supabase
                .from('invoice_items')
                .select(`
          product_id,
          quantity,
          total,
          products:product_id(name_ar),
          invoices:invoice_id!inner(company_id, type, status, issue_date)
        `)
                .eq('invoices.company_id', companyId)
                .eq('invoices.type', 'sale')
                .neq('invoices.status', 'void')
                .gte('invoices.issue_date', dateLimit)
                .limit(2000) as any,
        ]);

        // Error aggregation
        const errors = [
            invoicesResult.error,
            expensesResult.error,
            customersResult.error,
            suppliersResult.error,
            bondResult.error,
            productsResult.error,
            categoriesResult.error,
            itemsResult.error
        ].filter(Boolean);

        if (errors.length > 0) {
            console.error('Errors fetching dashboard data:', errors);
            throw new Error(`Failed to fetch dashboard data: ${errors[0]?.message}`);
        }

        return {
            invoices: invoicesResult.data || [],
            expenses: expensesResult.data || [],
            customers: customersResult.data || [],
            suppliers: suppliersResult.data || [],
            bondEntries: bondResult.data || [],
            productsWithStock: productsResult.data || [],
            categories: categoriesResult.data || [],
            invoiceItems: itemsResult.data || [],
        };
    }
};
