
import React from 'react';
import { Brain, Sparkles } from 'lucide-react';
import BusinessHealthGauge from './components/BusinessHealthGauge';
import AnomalyDetection from './components/AnomalyDetection';
import MarketInsights from './components/MarketInsights';
import SmartDailySummary from '../dashboard/components/SmartDailySummary';
import SalesForecastCard from '../reports/components/SalesForecastCard';
import StockDepletionAlert from '../reports/components/StockDepletionAlert';
import CustomerSegmentation from '../customers/components/CustomerSegmentation';
import SupplierRatingCard from '../suppliers/components/SupplierRatingCard';
import MicroHeader from '../../ui/base/MicroHeader';
import { useProfitAndLoss, useDebtReport, useCashFlow } from '../reports/hooks';
import { useProducts } from '../inventory/hooks';

const AICommandCenter: React.FC = () => {
    const { data: pl } = useProfitAndLoss();
    const { data: debt } = useDebtReport();
    const { data: cashFlow } = useCashFlow();
    const { stats } = useProducts('');

    const healthData = {
        revenue: pl?.totalRevenues || 0,
        expenses: pl?.totalExpenses || 0,
        netProfit: pl?.netProfit || 0,
        receivables: debt?.summary?.receivables || 0,
        payables: debt?.summary?.payables || 0,
        liquidity: cashFlow?.currentLiquidity || 0,
        lowStockCount: stats?.lowStockCount || 0,
        totalProducts: stats?.count || 0,
    };

    const marketData = {
        topProducts: ['فلاتر', 'زيوت', 'بطاريات', 'فرامل'],
        avgMargin: pl && pl.totalRevenues > 0 ? ((pl.totalRevenues - pl.totalExpenses) / pl.totalRevenues) * 100 : 0,
        monthlyRevenue: pl?.totalRevenues || 0,
    };

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950">
            <MicroHeader
                title="مركز الذكاء الاصطناعي"
                icon={Brain}
                iconColor="text-violet-500"
                actions={
                    <div className="flex items-center gap-2 text-[9px] font-black text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400 px-3 py-1.5 rounded-full">
                        <Sparkles size={10} />
                        AI Command Center
                    </div>
                }
            />

            <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Main Area */}
                    <div className="lg:col-span-8 space-y-4">
                        {/* Business Health */}
                        <BusinessHealthGauge data={healthData} />

                        {/* Anomaly Detection */}
                        <AnomalyDetection transactions={[]} />

                        {/* Market Insights */}
                        <MarketInsights data={marketData} />

                        {/* Customer Segmentation */}
                        <CustomerSegmentation customers={[]} />
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-4">
                        {/* Daily Summary */}
                        <SmartDailySummary />

                        {/* Sales Forecast */}
                        <SalesForecastCard monthlySales={[]} />

                        {/* Stock Depletion */}
                        <StockDepletionAlert products={[]} />

                        {/* Supplier Rating */}
                        <SupplierRatingCard suppliers={[]} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AICommandCenter;
