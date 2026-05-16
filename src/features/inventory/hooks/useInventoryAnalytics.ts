// ============================================
// useInventoryAnalytics — تحليلات المخزون والرؤى الذكية
// ============================================
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { inventoryService } from '../service';
import { useAuthStore } from '../../auth/store';

/** جلب تحليلات المخزون (ABC، الأكثر نشاطاً، الراكد، تنبيهات المخزون) */
export const useInventoryAnalytics = (from?: string, to?: string) => {
    const { user } = useAuthStore();
    return useQuery({
        queryKey: ['inventory_analytics', user?.company_id, from, to],
        queryFn: () => user?.company_id ? inventoryService.getInventoryAnalytics(user.company_id, from, to) : Promise.resolve({
            mostActive: [] as any[],
            mostProfitable: [] as any[],
            stagnant: [] as any[],
            abcAnalysis: { A: [] as any[], B: [] as any[], C: [] as any[] },
            stockAlerts: [] as any[]
        }),
        enabled: !!user?.company_id,
    });
};

/** رؤى ذكية مشتقة من تحليلات المخزون */
export const useInventorySmartInsights = (from?: string, to?: string) => {
    const { data: analytics } = useInventoryAnalytics(from, to);

    return useMemo(() => {
        if (!analytics) return { data: [], isLoading: true };

        const insights = [];

        if (analytics.stockAlerts?.length > 0) {
            const topCritical = analytics.stockAlerts[0];
            insights.push({
                id: 'critical_reorder',
                type: 'critical',
                title: 'إعادة طلب عاجلة',
                message: `الصنف "${topCritical.name}" يستهلك بسرعة وسينفد خلال ${topCritical.daysRemaining} أيام.`,
                action: 'تجهيز طلب شراء',
                impact: 'high'
            });
        }

        const deadStockValue = analytics.stagnant?.reduce((sum: number, p: any) => sum + (p.cost_price * p.stock_quantity), 0) || 0;
        if (deadStockValue > 0) {
            insights.push({
                id: 'stagnant_capital',
                type: 'warning',
                title: 'رأس مال مجمد',
                message: `لديك أصناف راكدة بقيمة تقديرية ${Math.round(deadStockValue).toLocaleString()} ريال لم تتحرك منذ 90 يوماً.`,
                action: 'عمل تصفية أو عروض',
                impact: 'medium'
            });
        }

        const classA = analytics.abcAnalysis?.A || [];
        if (classA.length > 0) {
            const mostProfitable = [...classA].sort((a, b) => b.profit - a.profit)[0];
            if (mostProfitable) {
                insights.push({
                    id: 'profit_opportunity',
                    type: 'success',
                    title: 'فرصة نمو الربحية',
                    message: `الصنف "${mostProfitable.name}" يمثل أعلى هامش ربح في الفئة A. تأكد من توفره الدائم.`,
                    action: 'تحليل الموردين',
                    impact: 'high'
                });
            }
        }

        const totalItems = (analytics.abcAnalysis?.A?.length || 0) + (analytics.abcAnalysis?.B?.length || 0) + (analytics.abcAnalysis?.C?.length || 0);
        const aCount = analytics.abcAnalysis?.A?.length || 0;
        if (totalItems > 0 && (aCount / totalItems) < 0.1) {
            insights.push({
                id: 'strategic_imbalance',
                type: 'info',
                title: 'توازن المخزون',
                message: 'فئة النخبة (A) تشكل أقل من 10% من أصنافك. قد تكون هناك فرصة لتوسيع الأصناف الأكثر مبيعاً.',
                action: 'مراجعة الكتالوج',
                impact: 'low'
            });
        }

        return { data: insights, isLoading: false };
    }, [analytics]);
};
