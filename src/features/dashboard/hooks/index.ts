import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../auth/store';
import { dashboardApi } from '../api/index';
import { calculateDashboardStats } from '../services/dashboardStats';
import { calculateDashboardInsights } from '../services/dashboardInsights';
import { useMemo } from 'react';
import { toBaseCurrency, formatCurrency } from '../../../core/utils/currencyUtils';
import type { DashboardDataPayload } from '../models';

// Re-export specific hooks from the old structure for backwards compatibility
export {
  useSalesChart,
  useInventoryChart,
  useRecentActivity,
  useTopProducts,
  useTopCustomers,
  useDashboardAlerts
} from './useDashboard';

export const useDashboardData = () => {
  const { user } = useAuthStore();
  const companyId = user?.company_id;

  // 1. Fetch Raw Data using React Query
  const rawDataQuery = useQuery({
    queryKey: ['dashboard_raw_data', companyId],
    queryFn: async () => {
      if (!companyId) return Promise.reject('No company ID');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateLimit = thirtyDaysAgo.toISOString().split('T')[0];
      return dashboardApi.fetchRawDashboardData(companyId, dateLimit);
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
  });

  // 2. Compute Base Metrics using useMemo
  const baseMetrics = useMemo(() => {
    if (!rawDataQuery.data) return null;
    const { invoices, expenses, bondEntries } = rawDataQuery.data;

    // Process Bonds
    const bonds = bondEntries.map((entry: any) => {
      const lines = entry.journal_entry_lines || [];
      const amount = lines.reduce((sum: number, l: any) => sum + Number(l.debit_amount || 0), 0);
      return {
        id: entry.id,
        type: entry.reference_type === 'receipt_bond' ? 'receipt' : 'payment',
        amount,
        date: entry.entry_date
      };
    });

    const receiptBonds = bonds.filter((b: any) => b.type?.trim().toLowerCase() === 'receipt').reduce((sum: number, b: any) => sum + Number(b.amount), 0);
    const paymentBonds = bonds.filter((b: any) => b.type?.trim().toLowerCase() === 'payment').reduce((sum: number, b: any) => sum + Number(b.amount), 0);

    // Process Totals with case-insensitive type checks and returns handling
    const sales = invoices.filter((i: any) => i.type?.trim().toLowerCase() === 'sale').reduce((sum: number, i: any) => sum + toBaseCurrency(i), 0);
    const saleReturns = invoices.filter((i: any) => ['return_sale', 'sale_return', 'sales_return'].includes(i.type?.trim().toLowerCase())).reduce((sum: number, i: any) => sum + toBaseCurrency(i), 0);
    const clientTotalSales = sales - saleReturns;

    const purchases = invoices.filter((i: any) => i.type?.trim().toLowerCase() === 'purchase').reduce((sum: number, i: any) => sum + toBaseCurrency(i), 0);
    const purchaseReturns = invoices.filter((i: any) => ['return_purchase', 'purchase_return'].includes(i.type?.trim().toLowerCase())).reduce((sum: number, i: any) => sum + toBaseCurrency(i), 0);
    const clientTotalPurchases = purchases - purchaseReturns;

    const clientTotalExpenses = expenses.reduce((sum: number, e: any) => sum + toBaseCurrency(e), 0);

    // Server-side totals (RPC) used for debts/suppliers as they are not subject to the 30-day limit
    const serverTotals = (rawDataQuery.data.serverTotals || {}) as any;
    const serverTotalSales = Number(serverTotals.total_sales) || 0;
    const serverTotalPurchases = Number(serverTotals.total_purchases) || 0;
    const serverTotalExpenses = Number(serverTotals.total_expenses) || 0;
    const serverTotalDebts = Number(serverTotals.total_debts) || 0;
    const totalSupplierDebts = Number(serverTotals.total_supplier_debts) || 0;

    // Client-side totals (Aggregated with toBaseCurrency) are the primary source for high-level cards
    // This ensures correct currency normalization. We use server RPC as a safety check.
    const totalSales = clientTotalSales > 0 ? clientTotalSales : serverTotalSales;
    const totalPurchases = clientTotalPurchases > 0 ? clientTotalPurchases : serverTotalPurchases;
    const totalExpenses = clientTotalExpenses > 0 ? clientTotalExpenses : serverTotalExpenses;
    const totalDebts = Math.max(serverTotalDebts, 0);

    // Process Trial Balance for accurate Net Profit/Loss
    const trialBalanceRows = rawDataQuery.data.trialBalanceRows || [];
    const revenues = trialBalanceRows.filter((a: any) => a.account_code?.startsWith('4'));
    const expensesAcc = trialBalanceRows.filter((a: any) => a.account_code?.startsWith('5'));

    const totalRevenues = revenues.reduce((s: number, a: any) => s + Math.abs(a.balance || 0), 0);
    const totalExpensesAcc = expensesAcc.reduce((s: number, a: any) => s + Math.abs(a.balance || 0), 0);

    // Net Profit based on accounting accounts (Revenues - Expenses)
    const netProfit = totalRevenues - totalExpensesAcc;
    const netCashPosition = isFinite(receiptBonds - paymentBonds) ? (receiptBonds - paymentBonds) : 0;

    const overdueInvoices = invoices.filter((i: any) => {
      const issueDate = new Date(i.issue_date);
      const daysDiff = Math.floor((Date.now() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
      return i.status === 'posted' && daysDiff > 7;
    });

    const lowStockProducts = rawDataQuery.data.productsWithStock.filter((p: any) => {
      const totalStock = (p.product_stock || []).reduce((sum: number, s: any) => sum + Number(s.quantity || 0), 0);
      return totalStock <= (p.min_stock_level || 5);
    }).map((p: any) => ({
      ...p,
      name: p.name_ar,
      quantity: (p.product_stock || []).reduce((sum: number, s: any) => sum + Number(s.quantity || 0), 0),
      min_quantity: p.min_stock_level || 5
    }));


    return {
      receiptBonds, paymentBonds,
      totalSales, totalPurchases, totalExpenses,
      totalDebts, totalSupplierDebts,
      netProfit, netCashPosition,
      overdueInvoices, lowStockProducts,
    };
  }, [rawDataQuery.data]);


  // 3. Compute Complex Classifications and Insights using useMemo
  const processedData = useMemo<DashboardDataPayload | null>(() => {
    if (!rawDataQuery.data || !baseMetrics) return null;

    const { invoices, expenses, invoiceItems } = rawDataQuery.data;

    // Call external service transformers
    const statsResult = calculateDashboardStats({
      ...baseMetrics,
      invoicesData: invoices,
      expensesData: expenses,
      invoiceItemsData: invoiceItems
    });

    const insightsResult = calculateDashboardInsights({
      ...baseMetrics,
      invoicesData: invoices,
      expensesData: expenses,
    });

    // Assemble final payload
    return {
      stats: {
        sales: formatCurrency(baseMetrics.totalSales),
        purchases: formatCurrency(baseMetrics.totalPurchases),
        expenses: formatCurrency(baseMetrics.totalExpenses),
        debts: formatCurrency(baseMetrics.totalDebts),
        invoices: invoices.length.toString(),
        profit: formatCurrency(baseMetrics.netProfit),
        netCash: formatCurrency(baseMetrics.netCashPosition),
        salesTrend: Math.round(insightsResult.salesTrend * 10) / 10,
        purchasesTrend: Math.round(insightsResult.purchasesTrend * 10) / 10,
        expensesTrend: Math.round(insightsResult.expensesTrend * 10) / 10,
        profitTrend: Math.round(((insightsResult.newerSales - insightsResult.newerPurchases - insightsResult.newerExpenses) - (insightsResult.olderSales - insightsResult.olderPurchases - insightsResult.olderExpenses)) / Math.max(Math.abs(insightsResult.olderSales - insightsResult.olderPurchases - insightsResult.olderExpenses), 1) * 1000) / 10
      },
      salesData: statsResult.salesData.length ? statsResult.salesData : [{ name: 'اليوم', value: 0 }],
      categoryData: statsResult.categoryData.length ? statsResult.categoryData : [{ name: 'لا توجد بيانات', value: 0, color: '#94a3b8' }],
      recentActivities: statsResult.recentActivities as any,
      customers: statsResult.topCustomers as any,
      topProducts: statsResult.topProducts as any,
      topCustomers: statsResult.topCustomers as any,
      targets: insightsResult.targets,
      cashFlow: {
        inflow: baseMetrics.receiptBonds,
        outflow: baseMetrics.paymentBonds,
        net: baseMetrics.receiptBonds - baseMetrics.paymentBonds
      },
      alerts: insightsResult.alerts as any,
      insights: insightsResult.insights as any,
      lowStockProducts: baseMetrics.lowStockProducts as any
    };

  }, [rawDataQuery.data, baseMetrics]);

  // Provide fallback empty data if still loading or errored
  const fallbackData: DashboardDataPayload = {
    stats: { sales: '0', purchases: '0', expenses: '0', debts: '0', invoices: '0', profit: '0', netCash: '0', salesTrend: 0, purchasesTrend: 0, expensesTrend: 0, profitTrend: 0 },
    salesData: [], categoryData: [], recentActivities: [], customers: [], topProducts: [], topCustomers: [],
    targets: { salesProgress: 0, collectionRate: 0 }, cashFlow: { inflow: 0, outflow: 0, net: 0 },
    alerts: [], insights: [], lowStockProducts: []
  };

  return {
    ...rawDataQuery,
    data: processedData, // Replace raw data with processed data in return
    ... (processedData || fallbackData) // Spread attributes for ease of access
  };
};

export const useDashboardStats = () => {
  const { stats, isLoading, error } = useDashboardData();
  return { stats, isLoading, error };
};
export default useDashboardData;
