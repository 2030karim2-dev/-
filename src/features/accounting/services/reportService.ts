
import { reportsApi } from '../api/index';
import { TrialBalanceItem, LedgerEntry } from '../types/index';
import { supabase } from '../../../lib/supabaseClient';


export const reportService = {
    // ⚡ Server-side ledger via RPC — no frontend running balance calculation
    getLedger: async (companyId: string, accountId: string, fromDate?: string, toDate?: string): Promise<LedgerEntry[]> => {
        const { data, error } = await supabase.rpc('get_account_ledger', {
            p_company_id: companyId,
            p_account_id: accountId,
            ...(fromDate ? { p_from: fromDate } : {}),
            ...(toDate ? { p_to: toDate } : {})
        });
        if (error) throw error;

        const result = data as any;
        return (result.entries || []).map((line: any) => ({
            date: line.entry_date,
            journal_id: '',
            journal_entry_id: '',
            entry_number: line.entry_number,
            description: line.description || '',
            debit_amount: Number(line.debit_amount) || 0,
            credit_amount: Number(line.credit_amount) || 0,
            balance: Number(line.balance) || 0,
            currency_code: line.currency_code || 'SAR',
            exchange_rate: Number(line.exchange_rate) || 1,
            foreign_amount: Number(line.foreign_amount) || 0
        }));
    },

    getTrialBalance: async (companyId: string, fromDate?: string, toDate?: string): Promise<TrialBalanceItem[]> => {
        // Fix #15: Use server-side RPC which correctly handles account types
        const now = new Date();
        const from = fromDate || `${now.getFullYear()}-01-01`;
        const to = toDate || now.toISOString().split('T')[0];

        const { data, error } = await supabase.rpc('report_trial_balance', {
            p_company_id: companyId,
            p_from: from,
            p_to: to
        });
        if (error) throw error;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data || []).map((row: any) => ({
            account_id: row.account_id,
            code: row.account_code,
            name: row.account_name,
            type: row.account_type,
            total_debit: Number(row.total_debit) || 0,
            total_credit: Number(row.total_credit) || 0,
            // Server-side already computes balance based on account type
            net_balance: Number(row.balance) || 0,
            currency_code: 'SAR'
        }));
    },

    // ⚡ Server-side financials via RPCs
    getFinancials: async (companyId: string, fromDate?: string, toDate?: string) => {
        // P&L from server
        const { data: plData, error: plError } = await supabase.rpc('report_profit_loss', {
            p_company_id: companyId,
            ...(fromDate ? { p_from: fromDate } : {}),
            ...(toDate ? { p_to: toDate } : {})
        });
        if (plError) throw plError;
        const pl = plData as any;

        // Balance Sheet from server
        const { data: bsData, error: bsError } = await supabase.rpc('report_balance_sheet', {
            p_company_id: companyId,
            ...(fromDate ? { p_from: fromDate } : {}),
            ...(toDate ? { p_to: toDate } : {})
        });
        if (bsError) throw bsError;
        const bs = bsData as any;

        // Map account arrays to TrialBalanceItem format
        const mapToTBI = (items: any[], type: string) => (items || []).map((a: any) => ({
            account_id: a.id, code: a.code, name: a.name, type,
            total_debit: 0, total_credit: 0,
            net_balance: a.netBalance || 0, currency_code: 'SAR'
        }));

        return {
            incomeStatement: {
                revenues: mapToTBI(pl.revenues, 'revenue'),
                expenses: mapToTBI(pl.expenses, 'expense'),
                netIncome: pl.netProfit || 0,
                totalRevenue: pl.totalRevenues || 0,
                totalExpense: pl.totalExpenses || 0
            },
            balanceSheet: {
                assets: mapToTBI(bs.assets, 'asset'),
                liabilities: mapToTBI(bs.liabilities, 'liability'),
                equity: mapToTBI(bs.equity, 'equity'),
                netIncome: bs.netProfit || 0,
                totals: {
                    assets: bs.totalAssets || 0,
                    liabilities: bs.totalLiabilities || 0,
                    equity: bs.totalEquity || 0
                },
                isBalanced: bs.isBalanced ?? true,
                difference: bs.difference || 0
            }
        };
    },

    getMonthlyPerformance: async (companyId: string, year: number) => {
        // 1. Define result structure (Jan-Dec)
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
            name: new Date(0, i).toLocaleString('ar-SA', { month: 'long' }),
            revenues: 0,
            expenses: 0,
            monthIndex: i
        }));

        // 2. Fetch all posted journal lines for the year
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        const { data: lines, error } = await reportsApi.getJournalLines(companyId, startDate, endDate);
        if (error) throw error;

        // NOTE: journal_entry_lines store base currency (SAR) amounts.
        // No currency conversion needed — foreign_amount & exchange_rate are documentary only.

        // 3. Aggregate by month (using base amounts)
        (lines || []).forEach(line => {
            const date = new Date(line.journal.entry_date);
            const month = date.getMonth(); // 0-11
            const type = line.account?.type;

            // Revenue: Credit is positive
            if (type === 'revenue') {
                monthlyData[month].revenues += ((line.credit_amount || 0) - (line.debit_amount || 0));
            }
            // Expense: Debit is positive
            else if (type === 'expense') {
                monthlyData[month].expenses += ((line.debit_amount || 0) - (line.credit_amount || 0));
            }
        });

        return monthlyData.map(d => ({
            ...d,
            revenues: Math.max(0, d.revenues),
            expenses: Math.max(0, d.expenses)
        }));
    }
};