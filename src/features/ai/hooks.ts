
import { useQuery } from '@tanstack/react-query';
import { aiService } from './service';
import { FinancialDataSnapshot } from './types';
import { useProfitAndLoss, useDebtReport, useCashFlow } from '../reports/hooks';
import { useProducts } from '../inventory/hooks';

export const useAIInsights = (data: FinancialDataSnapshot | null) => {
  return useQuery({
    queryKey: ['ai_insights', data],
    queryFn: () => data ? aiService.generateReportAnalysis(data) : Promise.reject("No Data"),
    enabled: !!data,
    staleTime: 1000 * 60 * 30, // 30 mins
    retry: false
  });
};

export const useFinancialHealth = () => {
  // Use `isPending` to capture both initial loading and disabled state loading
  const { data: pl, isPending: isPlPending, isError: isPlError } = useProfitAndLoss();
  const { data: debt, isPending: isDebtPending, isError: isDebtError } = useDebtReport();
  const { data: cashFlow, isPending: isCashPending, isError: isCashError } = useCashFlow();
  const { stats: inventoryStats, isPending: isInventoryPending, isError: isInventoryError } = useProducts('');

  // The overall loading state is true if ANY of the dependencies are still pending
  // We ignore pending state if a hook returned an error (it won't resolve)
  const isDataLoading =
    (!isPlError && isPlPending) ||
    (!isDebtError && isDebtPending) ||
    (!isCashError && isCashPending) ||
    (!isInventoryError && isInventoryPending);

  // The Data is available only when Profit & Loss is available (core requirement)
  const isDataAvailable = !!pl && !isDataLoading && !isPlError;

  // If baseline data fails completely (e.g. no P&L), we can't do analysis
  const isCriticalDataError = isPlError;

  // Aggregate data into Snapshot only when fully available (or fallback to 0 for minor failures)
  const snapshot: FinancialDataSnapshot | null = isDataAvailable ? {
    revenue: pl.totalRevenues || 0,
    expenses: pl.totalExpenses || 0,
    netProfit: pl.netProfit || 0,
    grossMargin: pl.totalRevenues > 0 ? ((pl.totalRevenues - pl.totalExpenses) / pl.totalRevenues) * 100 : 0,
    netMargin: pl.totalRevenues > 0 ? (pl.netProfit / pl.totalRevenues) * 100 : 0,

    growth_metrics: {
      revenue_growth: 0,
      expense_growth: 0
    },

    topExpenses: (pl.expenses || []).sort((a: any, b: any) => b.netBalance - a.netBalance).slice(0, 5).map((e: any) => ({
      name: e.name,
      amount: e.netBalance
    })),

    debt_metrics: {
      total_receivables: debt?.summary?.receivables || 0,
      total_payables: debt?.summary?.payables || 0,
      cash_on_hand: cashFlow?.currentLiquidity || 0
    },

    inventory_metrics: {
      total_valuation: inventoryStats?.totalValue || 0,
      low_stock_count: inventoryStats?.lowStockCount || 0
    }
  } : null;

  // Only trigger AI if snapshot is valid AND specifically enabled
  const aiQuery = useAIInsights(snapshot);

  return {
    financialData: snapshot,
    aiAnalysis: aiQuery.data,
    // Overall isLoading is true if financial data is loading OR AI is fetching
    isLoading: isDataLoading || (isDataAvailable && aiQuery.isPending),
    // isError is true ONLY if the critical underlying data failed OR if the AI request threw an exception
    isError: isCriticalDataError || aiQuery.isError,
    refetch: aiQuery.refetch
  };
};