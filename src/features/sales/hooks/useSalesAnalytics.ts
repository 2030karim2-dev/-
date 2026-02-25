// ============================================
// Sales Analytics Hook
// Hook for fetching sales analytics
// ============================================

import { useQuery } from '@tanstack/react-query';
import { salesApi } from '../api';

interface SalesAnalyticsParams {
    companyId: string;
    startDate?: string;
    endDate?: string;
    period?: 'today' | 'week' | 'month' | 'quarter' | 'year';
}

interface SalesAnalytics {
    totalSales: number;
    totalReturns: number;
    netSales: number;
    invoiceCount: number;
    averageInvoiceValue: number;
    topProducts: {
        productId: string;
        productName: string;
        quantity: number;
        revenue: number;
    }[];
    topCustomers: {
        customerId: string;
        customerName: string;
        totalAmount: number;
        invoiceCount: number;
    }[];
    salesByDay: {
        date: string;
        sales: number;
        returns: number;
    }[];
    salesByPaymentMethod: {
        method: string;
        amount: number;
    }[];
}

export const useSalesAnalytics = (params: SalesAnalyticsParams) => {
    const { companyId, startDate, endDate, period = 'month' } = params;

    const queryKey = [
        'sales_analytics',
        companyId,
        { startDate, endDate, period }
    ] as const;

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
        isFetching
    } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!companyId) {
                return null;
            }

            const { data: analytics, error } = await salesApi.getSalesAnalytics({
                company_id: companyId,
                start_date: startDate,
                end_date: endDate,
                period,
            });

            if (error) {
                throw new Error(error.message || 'Failed to fetch sales analytics');
            }

            return analytics as SalesAnalytics;
        },
        enabled: !!companyId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: false,
    });

    return {
        analytics: data,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
        // Convenience getters
        totalSales: data?.totalSales ?? 0,
        totalReturns: data?.totalReturns ?? 0,
        netSales: data?.netSales ?? 0,
        invoiceCount: data?.invoiceCount ?? 0,
        averageInvoiceValue: data?.averageInvoiceValue ?? 0,
        topProducts: data?.topProducts ?? [],
        topCustomers: data?.topCustomers ?? [],
        salesByDay: data?.salesByDay ?? [],
        salesByPaymentMethod: data?.salesByPaymentMethod ?? [],
    };
};

export default useSalesAnalytics;
