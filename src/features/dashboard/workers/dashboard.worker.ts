import { calculateDashboardStats } from '../services/dashboardStats';
import { calculateDashboardInsights } from '../services/dashboardInsights';

export interface DashboardWorkerInput {
    invoicesData: any[];
    expensesData: any[];
    invoiceItemsData: any[];
    baseMetrics: any;
}

export interface DashboardWorkerOutput {
    stats: ReturnType<typeof calculateDashboardStats>;
    insights: ReturnType<typeof calculateDashboardInsights>;
}

self.onmessage = (event: MessageEvent<DashboardWorkerInput>) => {
    const { invoicesData, expensesData, invoiceItemsData, baseMetrics } = event.data;

    const stats = calculateDashboardStats({
        ...baseMetrics,
        invoicesData,
        expensesData,
        invoiceItemsData,
    });

    const insights = calculateDashboardInsights({
        ...baseMetrics,
        invoicesData,
        expensesData,
        lowStockProducts: baseMetrics.lowStockProducts,
        overdueInvoices: baseMetrics.overdueInvoices,
    });

    self.postMessage({ stats, insights } as DashboardWorkerOutput);
};
