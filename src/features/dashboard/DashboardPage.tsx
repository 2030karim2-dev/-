
import React, { useState, Suspense, lazy, useMemo } from 'react';
import { useDashboardData } from './hooks';
import { useTranslation } from '../../lib/hooks/useTranslation';

import StatsGrid from '../../ui/dashboard/StatsGrid';
import ChartBox from '../../ui/dashboard/ChartBox';
import CashFlowWidget from './components/CashFlowWidget';
import TopPerformers from './components/TopPerformers';
import AlertsPanel from './components/AlertsPanel';
import SalesFlowChart from './components/SalesFlowChart';
import RevenueExpensesChart from './components/RevenueExpensesChart';
import SmartTargets from './components/SmartTargets';
import PerformanceGauge from './components/PerformanceGauge';
import SmartPurchaseAlert from './components/SmartPurchaseAlert';
import CustomerSegmentation from '../customers/components/CustomerSegmentation';
import AISmartNotifications from './components/AISmartNotifications';
import FinancialHealthScore from './components/FinancialHealthScore';
import WarehouseTransferSuggestions from './components/WarehouseTransferSuggestions';
import InventoryOverview from './components/InventoryOverview';
import QuickActions from './components/QuickActions';
import { RefreshCw, TrendingUp, Activity } from 'lucide-react';
import MicroHeader from '../../ui/base/MicroHeader';
import ChartSkeleton from '../../ui/base/ChartSkeleton';

const CategoriesChart = lazy(() => import('../../ui/dashboard/CategoriesChart'));

const DashboardPage: React.FC = () => {
    const { t } = useTranslation();
    const {
        stats,
        salesData,
        categoryData,
        customers,
        topProducts,
        topCustomers,
        recentActivities,
        targets,
        cashFlow,
        alerts,
        insights,
        lowStockProducts,
        isLoading,
        refetch,
        isRefetching
    } = useDashboardData();

    const [timeRange, setTimeRange] = useState('month');

    const extractNumericValue = (formatted: string) => {
        if (!formatted) return 0;
        const numeric = formatted.replace(/[^0-9.-]/g, '');
        return parseFloat(numeric) || 0;
    };

    const revenueExpensesData = useMemo(() => {
        const salesValue = extractNumericValue(stats?.sales || '0');
        const expensesValue = extractNumericValue(stats?.expenses || '0');
        // حالياً سنعرض المبيعات مقابل المصروفات التشغيلية فقط في هذا الشارت ليعكس الربحية الحقيقية
        return [
            { name: 'الأداء المالي', revenue: salesValue, expenses: expensesValue }
        ];
    }, [stats]);

    const currentSales = salesData && salesData.length > 0 ? salesData[salesData.length - 1].value : 0;
    const avgSales = (salesData?.reduce((a: number, b: any) => a + b.value, 0) || 0) / (salesData?.length || 1);
    const growthRate = avgSales > 0 ? ((currentSales - avgSales) / avgSales) * 100 : 0;
    const salesValue = extractNumericValue(stats?.sales || '0');

    if (isLoading) {
        return <div className="p-10 text-center animate-pulse font-black text-gray-400">{t('loading_financial_data')}</div>;
    }

    return (
        <div className="flex flex-col h-full bg-[var(--app-bg)] font-cairo relative">
            {/* Cinematic Grain Texture */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-50" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat'
            }} />

            <MicroHeader
                title={t('smart_performance_summary')}
                icon={Activity}
                iconColor="text-emerald-500"
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => refetch()}
                            className="p-2 text-[var(--app-text-secondary)] hover:text-[var(--accent)] active:scale-90 transition-all rounded-lg hover:bg-[var(--app-surface-hover)]"
                        >
                            <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
                        </button>
                    </div>
                }
            />

            <div className="flex-1 overflow-y-auto px-1.5 md:px-3 py-3 custom-scrollbar pb-24 relative z-10">

                {/* 🏆 Hero Row: Financial Health Score + Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FinancialHealthScore
                        stats={stats || { sales: '0', purchases: '0', expenses: '0', debts: '0' }}
                        cashFlow={cashFlow}
                        targets={targets}
                    />
                    <QuickActions />
                </div>

                {/* Stats Cards with Sparklines */}
                <div className="mt-3">
                    <StatsGrid stats={stats || { sales: '0', purchases: '0', expenses: '0', debts: '0' }} />
                </div>

                {/* AI Smart Notifications */}
                <div className="mt-3">
                    <AISmartNotifications stats={stats} lowStockProducts={lowStockProducts} alerts={alerts} />
                </div>

                {/* === Command Center 2-Column Grid === */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">

                    {/* 📈 Sales Flow Chart */}
                    <div className="bg-[var(--app-surface)]/80 backdrop-blur-xl border border-[var(--app-border)] p-4 rounded-2xl relative overflow-hidden group hover:border-[var(--accent)]/30 transition-all duration-500">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-[60px] group-hover:bg-emerald-400/20 transition-all duration-700 pointer-events-none"></div>
                        <div className="flex justify-between items-center mb-3 relative z-10">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-xl shadow-lg shadow-emerald-500/30">
                                    <TrendingUp size={16} />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-[var(--app-text)]">
                                        {t('sales_flow_analysis')} <span className="text-emerald-400 text-[9px]">(قطع الغيار)</span>
                                    </h3>
                                    <p className="text-[9px] font-bold text-[var(--app-text-secondary)]">تدفق المبيعات اليومية</p>
                                </div>
                            </div>
                            <div className="text-left bg-black/20 px-2 py-1 rounded-lg border border-white/5">
                                <span className={`text-sm font-black font-mono tracking-tighter ${growthRate >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <div className="relative z-10">
                            <SalesFlowChart data={salesData || []} showPeriodSelector={true} />
                        </div>
                    </div>

                    {/* 📊 Revenue vs Expenses */}
                    <RevenueExpensesChart data={revenueExpensesData} />

                    {/* 🎯 Performance Gauge */}
                    <PerformanceGauge
                        value={salesValue}
                        target={100000}
                        title="هدف المبيعات الشهري"
                    />

                    {/* 💰 Cash Flow */}
                    <CashFlowWidget data={cashFlow} />

                    {/* 📦 Inventory Overview */}
                    <InventoryOverview lowStockProducts={lowStockProducts} />

                    {/* 📊 Categories */}
                    <ChartBox title="التصنيفات الأكثر حركة" className="bg-[var(--app-surface)]/80 backdrop-blur-xl border border-[var(--app-border)] rounded-2xl">
                        <div className="flex flex-col h-full items-center p-2">
                            <Suspense fallback={<ChartSkeleton />}>
                                <CategoriesChart data={categoryData || []} />
                            </Suspense>
                        </div>
                    </ChartBox>

                    {/* 🏅 Top Performers */}
                    <TopPerformers
                        products={topProducts}
                        customers={topCustomers}
                    />

                    {/* 🔄 Warehouse Transfer Suggestions */}
                    <WarehouseTransferSuggestions />

                    {/* 👥 Customer Segmentation */}
                    <CustomerSegmentation customers={[]} />

                    {/* 🔔 Alerts */}
                    <AlertsPanel alerts={alerts} />

                    {/* ⚠️ Smart Purchase Alert */}
                    <SmartPurchaseAlert lowStockItems={lowStockProducts || []} />

                    {/* 🎯 Smart Targets */}
                    <SmartTargets targets={targets} />
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
