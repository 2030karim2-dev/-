
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from './service';
import { useAuthStore } from '../auth/store';

// Re-export from sub-file for consistency
export {
  useDashboard,
  useDashboardStats,
  useSalesChart,
  useInventoryChart,
  useRecentActivity,
  useTopProducts,
  useTopCustomers,
  useDashboardAlerts
} from './hooks/useDashboard';

export const useDashboardData = () => {
  const { user } = useAuthStore();
  const companyId = user?.company_id;

  const queryResult = useQuery({
    queryKey: ['dashboard_data', companyId],
    queryFn: () => companyId ? dashboardService.getDashboardData(companyId) : Promise.reject('No company ID'),
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes - prevent refetch on every navigation
  });

  return {
    ...queryResult,
    stats: queryResult.data?.stats,
    salesData: queryResult.data?.salesData || [],
    categoryData: queryResult.data?.categoryData || [],
    customers: queryResult.data?.customers || [],
    topProducts: queryResult.data?.topProducts || [],
    topCustomers: queryResult.data?.topCustomers || [],
    recentActivities: queryResult.data?.recentActivities || [],
    targets: queryResult.data?.targets || { salesProgress: 0, collectionRate: 0 },
    cashFlow: queryResult.data?.cashFlow || { inflow: 0, outflow: 0, net: 0 },
    alerts: queryResult.data?.alerts || [],
    insights: queryResult.data?.insights || [],
    lowStockProducts: queryResult.data?.lowStockProducts || [],
  };
};
