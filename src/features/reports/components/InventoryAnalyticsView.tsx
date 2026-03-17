import React, { useState } from 'react';
import { useInventoryAnalytics, useInventorySmartInsights } from '../../inventory/hooks/index';
import { Download, Activity, Target, BrainCircuit, PackageX } from 'lucide-react';

// UI Helpers
import { formatCurrency } from '../../../core/utils';
import { cn } from '../../../core/utils';

// Subcomponents
import { ABCAnalysisChart } from './ABCAnalysisChart';
import { TopProductsTable } from './TopProductsTable';
import { StockAlertsTable } from './StockAlertsTable';
import { StagnantProductsTable } from './StagnantProductsTable';
import AIInsightCard from './AIInsightCard';
import { Activity as ActivityIcon, Calculator } from 'lucide-react';
import { useTranslation } from '../../../lib/hooks/useTranslation';

const InventoryAnalyticsView: React.FC = () => {
    const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
        from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });

    const { data: analyticsData, isLoading: analyticsLoading } = useInventoryAnalytics(dateRange.from, dateRange.to);
    const { data: insights } = useInventorySmartInsights(dateRange.from, dateRange.to);
    const { t } = useTranslation();

    const handleExport = () => {
        if (!analyticsData) return;

        const csvContent = [
            ['Product', 'SKU', 'Category', 'Sales Qty', 'Revenue', 'ABC Class', 'Daily Velocity', 'Days Remaining'].join(','),
            ...[...(analyticsData.abcAnalysis?.A || []), ...(analyticsData.abcAnalysis?.B || []), ...(analyticsData.abcAnalysis?.C || [])].map((p: any) => [
                `"${p.name}"`,
                p.sku,
                p.abcCategory,
                p.qtySold,
                p.revenue?.toFixed(2),
                p.abcCategory,
                (p.dailyVelocity || 0).toFixed(2),
                p.daysRemaining || '---'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `inventory_analytics_${dateRange.from}_${dateRange.to}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (analyticsLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-20 space-y-4">
                <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin shadow-xl shadow-blue-500/20" />
                <p className="text-slate-400 font-bold animate-pulse tracking-widest uppercase text-[10px]">جاري هندسة بيانات المخزون...</p>
            </div>
        );
    }

    const abcData = [
        { name: 'A', value: analyticsData?.abcAnalysis?.A?.length || 0, color: '#10b981' },
        { name: 'B', value: analyticsData?.abcAnalysis?.B?.length || 0, color: '#f59e0b' },
        { name: 'C', value: analyticsData?.abcAnalysis?.C?.length || 0, color: '#64748b' },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20 max-w-[1400px] mx-auto px-4">

            {/* Premium Command Center Header - Micro Version */}
            <div className="glass-panel bento-item p-4 bg-slate-900 dark:bg-slate-950 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between border-none shadow-xl shrink-0">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none" />

                <div className="relative z-10 flex items-center gap-4">
                    <div className="p-2 bg-blue-500 text-white rounded-xl shadow-lg rotate-2">
                        <BrainCircuit size={18} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                            تحليل المخزون الاستراتيجي
                        </h2>
                        <p className="text-[8px] text-blue-400/80 font-bold uppercase tracking-widest leading-none mt-0.5">مركز التحكم في تدفقات الأصناف والربحية</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-4 sm:mt-0 relative z-10">
                    <div className="flex items-center glass-card bg-white/5 border border-white/10 rounded-xl p-1.5 backdrop-blur-xl">
                        <div className="flex items-center gap-2 px-2">
                            <input
                                type="date"
                                value={dateRange.from}
                                onChange={(e) => { setDateRange((prev: any) => ({ ...prev, from: e.target.value })); }}
                                className="text-[9px] bg-transparent text-white border-none p-0.5 outline-none font-bold cursor-pointer"
                            />
                            <span className="text-white/20 text-[9px]">—</span>
                            <input
                                type="date"
                                value={dateRange.to}
                                onChange={(e) => { setDateRange((prev: any) => ({ ...prev, to: e.target.value })); }}
                                className="text-[9px] bg-transparent text-white border-none p-0.5 outline-none font-bold cursor-pointer"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleExport}
                        className="group flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                    >
                        <Download size={14} />
                        تصدير
                    </button>
                </div>
            </div>

            {/* AI Smart Insights Section - Micro Header */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl shadow-md">
                            <ActivityIcon size={14} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold tracking-tight">رادار الرؤى الذكية</h3>
                            <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">توصيات مدعومة بتحليل أنماط التوريد والطلب</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-[8px] font-black bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm uppercase tracking-tighter">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        AI Active
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {insights && insights.length > 0 ? (
                        insights.map((insight: any) => (
                            <AIInsightCard key={insight.id} insight={insight} />
                        ))
                    ) : (
                        <div className="col-span-full glass-panel p-12 flex flex-col items-center justify-center space-y-4 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800">
                            <Calculator size={40} className="text-slate-400 opacity-20" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('no_data_available')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* High Impact Core Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    {
                        label: 'القيمة التقديرية للمخزون', val: formatCurrency([
                            ...(analyticsData?.abcAnalysis?.A || []),
                            ...(analyticsData?.abcAnalysis?.B || []),
                            ...(analyticsData?.abcAnalysis?.C || [])
                        ].reduce((sum: number, item: any) => sum + ((item.cost_price || 0) * (item.stock_quantity || 0)), 0)), icon: Activity, color: 'blue'
                    },
                    { label: 'أصناف النخبة النوع A', val: `${analyticsData?.abcAnalysis?.A?.length || 0} صنف`, icon: Target, color: 'emerald' },
                    { label: 'تنبيهات العجز الحرج', val: `${analyticsData?.stockAlerts?.length || 0} صنف`, icon: Target, color: 'rose' },
                    { label: 'أصناف قيد الركود', val: `${analyticsData?.stagnant?.length || 0} صنف`, icon: PackageX, color: 'amber' }
                ].map((stat, i) => (
                    <div key={i} className="glass-card bento-item p-6 flex flex-col justify-between min-h-[140px] shadow-lg border-none hover:-translate-y-1 transition-transform group">
                        <div className="flex justify-between items-start">
                            <div className={cn("p-3 rounded-2xl transition-all duration-500 group-hover:rotate-12",
                                stat.color === 'blue' ? "bg-blue-500 text-white shadow-xl shadow-blue-500/20" :
                                    stat.color === 'emerald' ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20" :
                                        stat.color === 'rose' ? "bg-rose-500 text-white shadow-xl shadow-rose-500/20" :
                                            "bg-amber-500 text-white shadow-xl shadow-amber-500/20"
                            )}>
                                <stat.icon size={20} />
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                        </div>
                        <div className="mt-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{stat.label}</span>
                            <h4 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tighter">{stat.val}</h4>
                        </div>
                    </div>
                ))}
            </div>

            {/* Deep Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 glass-panel bento-item p-8 bg-white dark:bg-slate-900 border-none shadow-2xl flex flex-col">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-1 h-6 bg-blue-500 rounded-full" />
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">تحور تصنيف ABC</h3>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <ABCAnalysisChart data={abcData} />
                    </div>
                </div>

                <div className="lg:col-span-8 glass-panel bento-item p-8 bg-white dark:bg-slate-900 border-none shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">الأصناف الأكثر حركة وربحية</h3>
                        </div>
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full uppercase tracking-widest">Active Inventory</span>
                    </div>
                    <TopProductsTable data={analyticsData?.mostActive?.slice(0, 5) || []} />
                </div>
            </div>

            {/* Risk Management Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
                <div className="glass-panel bento-item p-8 bg-white dark:bg-slate-900 border-none shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-6 bg-rose-500 rounded-full" />
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">قائمة النواقص الحرجة</h3>
                    </div>
                    <StockAlertsTable data={(analyticsData?.stockAlerts || []).slice(0, 6)} />
                </div>

                <div className="glass-panel bento-item p-8 bg-white dark:bg-slate-900 border-none shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-6 bg-amber-500 rounded-full" />
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">تحليل الراكد (Dead Stock)</h3>
                    </div>
                    <StagnantProductsTable data={(analyticsData?.stagnant || []).slice(0, 6)} />
                </div>
            </div>

        </div>
    );
};

export default InventoryAnalyticsView;
