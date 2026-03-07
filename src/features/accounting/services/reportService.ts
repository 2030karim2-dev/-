
import { reportsApi } from '../api/index';
import { TrialBalanceItem, LedgerEntry } from '../types/index';
import { supabase } from '../../../lib/supabaseClient';
import { logger } from '../../../core/utils/logger';


export const reportService = {
    getLedger: async (companyId: string, accountId: string, fromDate?: string, toDate?: string): Promise<LedgerEntry[]> => {
        // Fix #14: Get account type to correctly compute running balance
        const { data: accountData } = await supabase.from('accounts')
            .select('type')
            .eq('id', accountId)
            .single();
        const accountType = accountData?.type || 'asset';
        const isDebitNature = ['asset', 'expense'].includes(accountType);

        let query = supabase.from('journal_entry_lines')
            .select(`
            journal:journal_entries(entry_date, entry_number, status, company_id),
            debit_amount, credit_amount, description,
            currency_code, exchange_rate, foreign_amount
        `)
            .eq('account_id', accountId)
            .eq('journal.company_id', companyId)
            .eq('journal.status', 'posted');

        if (fromDate) query = query.gte('journal.entry_date', fromDate);
        if (toDate) query = query.lte('journal.entry_date', toDate);

        const { data, error } = await query;
        if (error) throw error;

        // Calculate Opening Balance for the period before fromDate
        let openingBalance = 0;
        if (fromDate) {
            const { data: beforeData } = await supabase.from('journal_entry_lines')
                .select('debit_amount, credit_amount')
                .eq('account_id', accountId)
                .eq('journal.status', 'posted')
                .lt('journal.entry_date', fromDate);

            (beforeData || []).forEach(l => {
                if (isDebitNature) {
                    openingBalance += (Number(l.debit_amount) || 0) - (Number(l.credit_amount) || 0);
                } else {
                    openingBalance += (Number(l.credit_amount) || 0) - (Number(l.debit_amount) || 0);
                }
            });
        }

        let balance = openingBalance;
        return (data || []).map((line) => {
            // Debit-nature accounts (asset/expense): balance = debit - credit
            // Credit-nature accounts (liability/equity/revenue): balance = credit - debit
            if (isDebitNature) {
                balance += (Number(line.debit_amount) || 0) - (Number(line.credit_amount) || 0);
            } else {
                balance += (Number(line.credit_amount) || 0) - (Number(line.debit_amount) || 0);
            }
            return {
                date: line.journal?.entry_date,
                journal_id: '',
                journal_entry_id: '',
                entry_number: line.journal?.entry_number,
                description: line.description || '',
                debit_amount: Number(line.debit_amount) || 0,
                credit_amount: Number(line.credit_amount) || 0,
                balance,
                currency_code: line.currency_code || 'SAR',
                exchange_rate: Number(line.exchange_rate),
                foreign_amount: Number(line.foreign_amount)
            };
        });
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

    getFinancials: async (companyId: string, fromDate?: string, toDate?: string) => {
        const tb = await reportService.getTrialBalance(companyId, fromDate, toDate);

        const revenues = tb.filter(x => x.type === 'revenue');
        const expenses = tb.filter(x => x.type === 'expense');
        const assets = tb.filter(x => x.type === 'asset');
        const liabilities = tb.filter(x => x.type === 'liability');
        const equity = tb.filter(x => x.type === 'equity');

        const totalRevenue = revenues.reduce((sum, x) => sum + Math.abs(x.net_balance), 0);
        const totalExpense = expenses.reduce((sum, x) => sum + x.net_balance, 0);
        const netIncome = totalRevenue - totalExpense;

        // Calculate balance sheet totals
        const totalAssets = assets.reduce((sum, x) => sum + x.net_balance, 0);
        const totalLiabilities = Math.abs(liabilities.reduce((sum, x) => sum + x.net_balance, 0));
        const totalEquityBeforeIncome = Math.abs(equity.reduce((sum, x) => sum + x.net_balance, 0));
        const totalEquity = totalEquityBeforeIncome + netIncome;

        // Validate balance sheet equation: Assets = Liabilities + Equity
        const balanceDifference = Math.abs(totalAssets - (totalLiabilities + totalEquity));
        const isBalanced = balanceDifference < 0.01;

        if (!isBalanced) {
            logger.warn('Accounting', 'Balance sheet is not balanced', {
                totalAssets,
                totalLiabilities,
                totalEquity,
                difference: balanceDifference,
                companyId,
                fromDate,
                toDate
            });
        }

        return {
            incomeStatement: {
                revenues,
                expenses,
                netIncome,
                totalRevenue,
                totalExpense
            },
            balanceSheet: {
                assets,
                liabilities,
                equity,
                netIncome,
                totals: {
                    assets: totalAssets,
                    liabilities: totalLiabilities,
                    equity: totalEquity
                },
                isBalanced,
                difference: balanceDifference
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