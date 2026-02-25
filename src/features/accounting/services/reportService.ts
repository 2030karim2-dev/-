
import { accountsApi, reportsApi } from '../api/index';
import { TrialBalanceItem, LedgerEntry } from '../types/index';
import { supabase } from '../../../lib/supabaseClient';

// دالة مساعدة لجلب أحدث أسعار الصرف
const fetchLatestRates = async (companyId: string): Promise<Record<string, number>> => {
    const { data } = await (supabase.from('exchange_rates') as any)
        .select('currency_code, rate_to_base')
        .eq('company_id', companyId)
        .order('effective_date', { ascending: false });

    const rateMap: Record<string, number> = {};
    (data || []).forEach((r: any) => {
        // أخذ أول (أحدث) سعر لكل عملة فقط
        if (!rateMap[r.currency_code]) {
            rateMap[r.currency_code] = Number(r.rate_to_base) || 1;
        }
    });
    return rateMap;
};

export const reportService = {
    getLedger: async (companyId: string, accountId: string, fromDate?: string, toDate?: string): Promise<LedgerEntry[]> => {
        let query = (supabase.from('journal_entry_lines') as any)
            .select(`
            journal:journal_entry_id(entry_date, entry_number, status, company_id),
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

        let balance = 0;
        return (data || []).map((line: any) => {
            balance += (line.debit_amount || 0) - (line.credit_amount || 0);
            return {
                date: line.journal?.entry_date,
                journal_id: '',
                entry_number: line.journal?.entry_number,
                description: line.description || '',
                debit: line.debit_amount || 0,
                credit: line.credit_amount || 0,
                balance,
                currency_code: line.currency_code,
                exchange_rate: line.exchange_rate,
                foreign_amount: line.foreign_amount
            };
        });
    },

    getTrialBalance: async (companyId: string, fromDate?: string, toDate?: string): Promise<TrialBalanceItem[]> => {
        // الخطوة 1: جلب كافة الحسابات
        const { data: accounts, error: accError } = await accountsApi.getAccounts(companyId);
        if (accError) throw accError;

        // الخطوة 2: جلب كافة القيود المرحلة خلال الفترة
        const { data: lines, error: linesError } = await reportsApi.getJournalLines(companyId, fromDate, toDate);
        if (linesError) throw linesError;

        // الخطوة 2.5: جلب أسعار الصرف للتحويل
        const rateMap = await fetchLatestRates(companyId);

        // الخطوة 3: تجميع الحركات المدينة والدائنة لكل حساب (المبالغ مخزنة بالعملة الأساسية)
        const balanceMap = new Map<string, { total_debit: number; total_credit: number }>();
        (lines as any[] || []).forEach(line => {
            const aid = line.account?.id || line.account_id;
            const current = balanceMap.get(aid) || { total_debit: 0, total_credit: 0 };

            current.total_debit += (line.debit_amount || 0);
            current.total_credit += (line.credit_amount || 0);
            balanceMap.set(aid, current);
        });

        // الخطوة 4: دمج هيكل الحسابات مع الأرصدة المجمعة
        return (accounts || []).map((acc: any) => {
            const balances = balanceMap.get(acc.id) || { total_debit: 0, total_credit: 0 };
            const net_balance = balances.total_debit - balances.total_credit;

            return {
                account_id: acc.id,
                code: acc.code,
                name: acc.name_ar,
                type: acc.type,
                total_debit: balances.total_debit,
                total_credit: balances.total_credit,
                net_balance,
                currency_code: acc.currency_code || 'SAR' // إضافة كود العملة للواجهة
            };
        });
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

        return {
            incomeStatement: { revenues, expenses, netIncome },
            balanceSheet: { assets, liabilities, equity, netIncome }
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

        // 2.5. جلب أسعار الصرف
        const rateMap = await fetchLatestRates(companyId);

        // 3. Aggregate by month (using base amounts)
        (lines as any[] || []).forEach(line => {
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

        return monthlyData;
    }
};