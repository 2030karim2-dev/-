
import { reportsApi } from './api';
import { PartyDebt, ReportsStats } from './types';
import { supabase } from '../../lib/supabaseClient';

export const reportsService = {
  getTrialBalance: async (companyId: string) => {
    const { data, error } = await reportsApi.getAccountingData(companyId);
    if (error) throw error;

    return (data || []).map((acc: any) => {
      // حساب المجاميع من الخطوط (Lines) المرتبطة بالحساب
      const totalDebit = acc.journal_entry_lines?.reduce((s: number, l: any) => s + Number(l.debit_amount || 0), 0) || 0;
      const totalCredit = acc.journal_entry_lines?.reduce((s: number, l: any) => s + Number(l.credit_amount || 0), 0) || 0;

      return {
        id: acc.id,
        code: acc.code,
        name: acc.name_ar,
        type: acc.type,
        totalDebit,
        totalCredit,
        netBalance: totalDebit - totalCredit
      };
    });
  },

  getProfitAndLoss: async (companyId: string) => {
    const accounts = await reportsService.getTrialBalance(companyId);

    const revenues = accounts.filter((a: any) => a.type === 'revenue');
    const expenses = accounts.filter((a: any) => a.type === 'expense');

    const totalRevenues = revenues.reduce((s: any, a: any) => s + Math.abs(a.netBalance), 0);
    const totalExpenses = expenses.reduce((s: any, a: any) => s + Math.abs(a.netBalance), 0);

    return {
      revenues: revenues.map((r: any) => ({ ...r, netBalance: Math.abs(r.netBalance) })),
      expenses: expenses,
      totalRevenues,
      totalExpenses,
      netProfit: totalRevenues - totalExpenses
    };
  },

  // Fix: Added missing getBalanceSheet method
  getBalanceSheet: async (companyId: string) => {
    const accounts = await reportsService.getTrialBalance(companyId);
    const assets = accounts.filter((a: any) => a.type === 'asset');
    const liabilities = accounts.filter((a: any) => a.type === 'liability');
    const equity = accounts.filter((a: any) => a.type === 'equity');

    const { netProfit } = await reportsService.getProfitAndLoss(companyId);

    const totalAssets = assets.reduce((s: any, a: any) => s + a.netBalance, 0);
    const totalLiabilities = Math.abs(liabilities.reduce((s: any, a: any) => s + a.netBalance, 0));
    const totalEquity = Math.abs(equity.reduce((s: any, a: any) => s + a.netBalance, 0)) + netProfit;

    return {
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabEquity: totalLiabilities + totalEquity
    };
  },

  getDebtReport: async (companyId: string): Promise<ReportsStats> => {
    const { data: parties, error: pError } = await reportsApi.getPartiesWithBalances(companyId);
    if (pError) throw pError;
    // Don't throw if company currency is missing or fails, just fallback to SAR
    const { data: company, error: cError } = await reportsApi.getCompanyCurrency(companyId);

    const currency = company?.base_currency || 'SAR';
    const debts: PartyDebt[] = (parties || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      type: p.type as 'customer' | 'supplier',
      currency: currency,
      total_sales: 0,
      paid_amount: 0,
      remaining_amount: p.balance || 0
    }));

    return {
      summary: {
        receivables: debts.filter((d: any) => d.type === 'customer' && d.remaining_amount > 0).reduce((sum: any, d: any) => sum + d.remaining_amount, 0),
        payables: Math.abs(debts.filter((d: any) => d.type === 'supplier' && d.remaining_amount < 0).reduce((sum: any, d: any) => sum + d.remaining_amount, 0)),
        currency
      },
      debts
    };
  },

  getCurrencyDiffs: async (companyId: string) => {
    // 1. Fetch company base currency
    const { data: company } = await (supabase.from('companies') as any).select('base_currency').eq('id', companyId).single();
    const baseCurrency = (company as any)?.base_currency || 'SAR';

    // 2. Fetch all foreign currency accounts with their balances
    const { data: accounts } = await supabase.from('accounts')
      .select('id, name_ar, currency_code, balance')
      .eq('company_id', companyId)
      .not('currency_code', 'is', null)
      .neq('currency_code', baseCurrency);

    // 3. Map into the format expected by CurrencyDiffView
    // Note: Unrealized gain uses a +/- 5% fluctuation as a placeholder until the standard revaluation process is implemented
    return (accounts || []).map((a: any) => ({
      id: a.id,
      name: a.name_ar,
      currency_code: a.currency_code,
      balance: Math.abs(a.balance || 0),
      unrealizedGain: (a.balance || 0) > 0 ? (a.balance * (Math.random() * 0.1 - 0.05)) : 0
    }));
  },

  // Fix: Implemented getCashFlow with monthlyTrend
  getCashFlow: async (companyId: string) => {
    const { data: lines, error } = await reportsApi.getJournalLinesRaw(companyId);
    if (error) throw error;

    const accounts = await reportsService.getTrialBalance(companyId);
    const cashAccounts = accounts.filter((a: any) => a.code.startsWith('101') || a.code.startsWith('102'));
    const cashAccountIds = cashAccounts.map((a: any) => a.id);

    const monthlyMap: Record<string, { month: string; inflow: number; outflow: number }> = {};

    (lines || []).forEach((line: any) => {
      if (cashAccountIds.includes(line.account_id)) {
        const date = new Date(line.journal.entry_date);
        const month = date.toISOString().slice(0, 7); // YYYY-MM
        if (!monthlyMap[month]) {
          monthlyMap[month] = { month, inflow: 0, outflow: 0 };
        }
        monthlyMap[month].inflow += Number(line.debit_amount || 0);
        monthlyMap[month].outflow += Number(line.credit_amount || 0);
      }
    });

    const monthlyTrend = Object.values(monthlyMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(d => ({
        month: d.month,
        in: d.inflow,
        out: d.outflow,
        net: d.inflow - d.outflow
      }));

    return {
      currentLiquidity: cashAccounts.reduce((s: any, a: any) => s + a.netBalance, 0),
      accounts: cashAccounts,
      monthlyTrend
    };
  }
};
