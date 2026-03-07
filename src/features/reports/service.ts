
import { reportsApi } from './api';
import { PartyDebt, ReportsStats } from './types';
import { supabase } from '../../lib/supabaseClient';


// Type definitions for report data

interface TrialBalanceItem {
  id: string;
  code: string;
  name: string;
  type: string;
  totalDebit: number;
  totalCredit: number;
  netBalance: number;
}

interface CurrencyAccount {
  id: string;
  name: string;
  currency_code: string;
  balance: number;
  unrealizedGain: number;
}

interface MonthlyCashFlow {
  month: string;
  in: number;
  out: number;
  net: number;
}


export const reportsService = {
  getTrialBalance: async (companyId: string): Promise<TrialBalanceItem[]> => {
    // Use server-side RPC which correctly handles account types
    const now = new Date();
    const fromDate = `${now.getFullYear()}-01-01`;
    const toDate = now.toISOString().split('T')[0];

    const { data, error } = await reportsApi.getTrialBalanceRPC(companyId, fromDate, toDate);
    if (error) throw error;

    return (data || []).map((acc: any) => ({
      id: acc.account_id,
      code: acc.account_code,
      name: acc.account_name,
      type: acc.account_type,
      totalDebit: Number(acc.total_debit) || 0,
      totalCredit: Number(acc.total_credit) || 0,
      // Server-side already computes balance based on account type
      netBalance: Number(acc.balance) || 0
    }));
  },

  getProfitAndLoss: async (companyId: string): Promise<{
    revenues: TrialBalanceItem[];
    expenses: TrialBalanceItem[];
    totalRevenues: number;
    totalExpenses: number;
    netProfit: number;
  }> => {
    const accounts: TrialBalanceItem[] = await reportsService.getTrialBalance(companyId);

    const revenues = accounts.filter((a) => a.type === 'revenue');
    const expenses = accounts.filter((a) => a.type === 'expense');

    const totalRevenues = revenues.reduce((s: number, a) => s + Math.abs(a.netBalance), 0);
    const totalExpenses = expenses.reduce((s: number, a) => s + Math.abs(a.netBalance), 0);

    return {
      revenues: revenues.map((r) => ({ ...r, netBalance: Math.abs(r.netBalance) })),
      expenses: expenses,
      totalRevenues,
      totalExpenses,
      netProfit: totalRevenues - totalExpenses
    };
  },

  // ⚡ Fix: getBalanceSheet no longer calls getProfitAndLoss separately (was causing double fetch)
  getBalanceSheet: async (companyId: string): Promise<{
    assets: TrialBalanceItem[];
    liabilities: TrialBalanceItem[];
    equity: TrialBalanceItem[];
    totalAssets: number;
    totalLiabEquity: number;
  }> => {
    const accounts: TrialBalanceItem[] = await reportsService.getTrialBalance(companyId);
    const assets = accounts.filter((a) => a.type === 'asset');
    const liabilities = accounts.filter((a) => a.type === 'liability');
    const equity = accounts.filter((a) => a.type === 'equity');

    // ⚡ Compute net profit inline instead of calling getProfitAndLoss (which would re-fetch trial balance)
    const revenues = accounts.filter((a) => a.type === 'revenue');
    const expenses = accounts.filter((a) => a.type === 'expense');
    const totalRevenues = revenues.reduce((s: number, a) => s + Math.abs(a.netBalance), 0);
    const totalExpenses = expenses.reduce((s: number, a) => s + Math.abs(a.netBalance), 0);
    const netProfit = totalRevenues - totalExpenses;

    const totalAssets = assets.reduce((s: number, a) => s + a.netBalance, 0);
    const totalLiabilities = Math.abs(liabilities.reduce((s: number, a) => s + a.netBalance, 0));
    const totalEquity = Math.abs(equity.reduce((s: number, a) => s + a.netBalance, 0)) + netProfit;

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
    const { data: company } = await reportsApi.getCompanyCurrency(companyId);

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
        receivables: debts.filter((d) => d.type === 'customer' && d.remaining_amount > 0).reduce((sum: number, d) => sum + d.remaining_amount, 0),
        payables: Math.abs(debts.filter((d) => d.type === 'supplier' && d.remaining_amount < 0).reduce((sum: number, d) => sum + d.remaining_amount, 0)),
        currency
      },
      debts
    };
  },

  // ⚡ Fix: Removed Math.random() — unrealized gain is now set to 0 until proper exchange rate revaluation is implemented
  getCurrencyDiffs: async (companyId: string): Promise<CurrencyAccount[]> => {
    // 1. Fetch company base currency
    const { data: company } = await supabase
      .from('companies')
      .select('base_currency')
      .eq('id', companyId)
      .single();
    const baseCurrency = company?.base_currency || 'SAR';

    // 2. Fetch all foreign currency accounts with their balances
    const { data: accounts } = await supabase.from('accounts')
      .select('id, name_ar, currency_code, balance')
      .eq('company_id', companyId)
      .not('currency_code', 'is', null)
      .neq('currency_code', baseCurrency);

    // 3. Map into the format expected by CurrencyDiffView
    // ⚡ unrealizedGain is now 0 — will be calculated from real exchange rates when implemented
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (accounts || []).map((a: any): CurrencyAccount => ({
      id: a.id,
      name: a.name_ar,
      currency_code: a.currency_code,
      balance: Math.abs(a.balance || 0),
      unrealizedGain: 0 // ⚡ Previously Math.random() — now 0 until revaluation is implemented
    }));
  },

  // ⚡ Optimized: Uses server-side RPCs instead of fetching all journal lines
  getCashFlow: async (companyId: string): Promise<{
    currentLiquidity: number;
    monthlyTrend: MonthlyCashFlow[];
  }> => {
    // 1. Get monthly cash flow from RPC (server-side aggregation)
    const { data: monthlyData, error } = await supabase.rpc('report_cash_flow', {
      p_company_id: companyId
    });
    if (error) throw error;

    // 2. Get current liquidity from RPC
    const { data: liquidity, error: liqError } = await supabase.rpc('get_cash_liquidity', {
      p_company_id: companyId
    });
    if (liqError) throw liqError;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const monthlyTrend = ((monthlyData || []) as Array<{ month: string, inflow: number, outflow: number, net: number }>).map(d => ({
      month: d.month,
      in: Math.max(0, Number(d.inflow) || 0),
      out: Math.max(0, Number(d.outflow) || 0),
      net: Number(d.net) || 0
    }));

    return {
      currentLiquidity: Number(liquidity) || 0,
      monthlyTrend
    };
  }
};
