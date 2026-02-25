import { useQuery } from '@tanstack/react-query';
import { reportsService } from './service';
import { useAuthStore } from '../auth/store';
import { supabase } from '../../lib/supabaseClient';
// Added missing taxService import
import { taxService } from '../accounting/services/taxService';

export const useTrialBalance = (fromDate?: string, toDate?: string) => {
    const { user } = useAuthStore();
    return useQuery({
        queryKey: ['trial_balance', user?.company_id, fromDate, toDate],
        queryFn: async () => {
            if (!user?.company_id) return [];
            const { data, error } = await supabase.rpc('report_trial_balance', {
                p_company_id: user.company_id,
                p_from: fromDate || '2000-01-01',
                p_to: toDate || new Date().toISOString().split('T')[0]
            } as any);
            if (error) throw error;
            return ((data as any[]) || []).map((row: any) => ({
                id: row.account_id,
                code: row.account_code,
                name: row.account_name,
                totalDebit: Number(row.total_debit),
                totalCredit: Number(row.total_credit),
                netBalance: Number(row.balance) // Fix: SQL returns 'balance', not 'net_balance'
            }));
        },
        enabled: !!user?.company_id,
    });
};

export const useProfitAndLoss = () => {
    const { user } = useAuthStore();
    return useQuery({
        queryKey: ['profit_loss', user?.company_id],
        queryFn: async () => {
            if (!user?.company_id) return null;
            // نستخدم ميزان المراجعة لبناء قائمة الدخل بشكل لحظي
            const { data, error } = await supabase.rpc('report_trial_balance', {
                p_company_id: user.company_id,
                p_from: '2000-01-01',
                p_to: new Date().toISOString().split('T')[0]
            } as any);

            if (error) {
                console.error("Profit and Loss RPC Error:", error);
                throw error;
            }

            const revenues = ((data as unknown as any[]) || []).filter((a: any) => a.account_code.startsWith('4'));
            const expenses = ((data as unknown as any[]) || []).filter((a: any) => a.account_code.startsWith('5'));

            // Fix: SQL returns 'balance', not 'net_balance'
            const totalRevenues = revenues.reduce((s: number, a: any) => s + Math.abs(a.balance || 0), 0);
            const totalExpenses = expenses.reduce((s: number, a: any) => s + Math.abs(a.balance || 0), 0);

            return {
                revenues: revenues.map((r: any) => ({ id: r.account_id, name: r.account_name, netBalance: Math.abs(r.balance || 0) })),
                expenses: expenses.map((e: any) => ({ id: e.account_id, name: e.account_name, netBalance: Math.abs(e.balance || 0) })),
                totalRevenues,
                totalExpenses,
                netProfit: totalRevenues - totalExpenses
            };
        },
        enabled: !!user?.company_id,
    });
};

export const useDebtReport = () => {
    const { user } = useAuthStore();
    return useQuery({
        queryKey: ['debt_report', user?.company_id],
        queryFn: () => user?.company_id ? reportsService.getDebtReport(user.company_id) : Promise.reject("No Auth"),
        enabled: !!user?.company_id,
    });
};

// Added missing useBalanceSheet hook
export const useBalanceSheet = () => {
    const { user } = useAuthStore();
    return useQuery({
        queryKey: ['balance_sheet', user?.company_id],
        queryFn: () => user?.company_id ? reportsService.getBalanceSheet(user.company_id) : Promise.resolve(null),
        enabled: !!user?.company_id
    });
};

// Added missing useCurrencyDiffs hook
export const useCurrencyDiffs = () => {
    const { user } = useAuthStore();
    return useQuery({
        queryKey: ['currency_diffs', user?.company_id],
        queryFn: () => user?.company_id ? reportsService.getCurrencyDiffs(user.company_id) : Promise.resolve([]),
        enabled: !!user?.company_id
    });
};

// Added missing useCashFlow hook
export const useCashFlow = () => {
    const { user } = useAuthStore();
    return useQuery({
        queryKey: ['cash_flow', user?.company_id],
        queryFn: () => user?.company_id ? reportsService.getCashFlow(user.company_id) : Promise.resolve(null),
        enabled: !!user?.company_id
    });
};

// Added missing useVATReport hook
export const useVATReport = (fromDate: string, toDate: string) => {
    const { user } = useAuthStore();
    return useQuery({
        queryKey: ['vat_report', user?.company_id, fromDate, toDate],
        queryFn: () => user?.company_id ? taxService.getVATReport(user.company_id, fromDate, toDate) : Promise.resolve(null),
        enabled: !!user?.company_id
    });
};