import React, { useState } from 'react';
import { useTranslation } from '../../../lib/hooks/useTranslation';
import { useInventoryAnalytics, useInventorySmartInsights } from '../../inventory/hooks';
import { Download, AlertTriangle, Activity, Target, CheckCircle2, AlertCircle, Lightbulb, Zap, Loader2, BrainCircuit, PackageX } from 'lucide-react';

// UI Helpers
import { formatCurrency } from '../../../core/utils';

// Subcomponents
import { ABCAnalysisChart } from './ABCAnalysisChart';
import { TopProductsTable } from './TopProductsTable';
import { StockAlertsTable } from './StockAlertsTable';
import { StagnantProductsTable } from './StagnantProductsTable';

const InventoryAnalyticsView: React.FC = () => {
    const { t } = useTranslation();
    const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
        from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });

    const { data: analyticsData, isLoading: analyticsLoading } = useInventoryAnalytics(dateRange.from, dateRange.to);
    const { data: aiInsights, isLoading: aiLoading } = useInventorySmartInsights(dateRange.from, dateRange.to);

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
                <Loader2 size={48} className="animate-spin text-blue-500" />
                <p className="text-slate-500 font-bold animate-pulse">جاري تجميع وتحليل المخزون...</p>
            </div>
        );
    }

    const abcData = [
        { name: 'A', value: analyticsData?.abcAnalysis?.A?.length || 0, color: '#10b981' }, // Emerald
        { name: 'B', value: analyticsData?.abcAnalysis?.B?.length || 0, color: '#f59e0b' }, // Amber
        { name: 'C', value: analyticsData?.abcAnalysis?.C?.length || 0, color: '#64748b' }, // Slate
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">

            {/* Command Center Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 shadow-xl border border-slate-700/50">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-20 pointer-events-none">
                    <Activity size={200} className="text-blue-500" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-3 tracking-wide">
                            <BrainCircuit className="text-blue-400" size={28} />
                            لوحة القيادة الذكية للمخزون
                        </h2>
                        <p className="text-sm text-slate-300 font-medium">
                            رؤى متقدمة مدعومة بالذكاء الاصطناعي لتحليل أداء وربحية ومخاطر المخزون في الوقت الفعلي.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center bg-slate-800/80 backdrop-blur-md rounded-xl p-1.5 border border-slate-700/50 shadow-inner w-full sm:w-auto">
                            <span className="text-[10px] text-slate-400 font-bold px-3">من</span>
                            <input
                                type="date"
                                value={dateRange.from}
                                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                                className="text-xs bg-slate-900 text-white border-0 rounded-lg p-2 outline-none focus:ring-1 ring-blue-500"
                            />
                            <span className="text-[10px] text-slate-400 font-bold px-3">إلى</span>
                            <input
                                type="date"
                                value={dateRange.to}
                                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                                className="text-xs bg-slate-900 text-white border-0 rounded-lg p-2 outline-none focus:ring-1 ring-blue-500"
                            />
                        </div>

                        <button
                            onClick={handleExport}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-l from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg hover:shadow-emerald-500/25 active:scale-95 border border-emerald-400/20"
                        >
                            <Download size={16} />
                            تصدير التقرير
                        </button>
                    </div>
                </div>
            </div>

            {/* AI Insights Section */}
            {aiLoading ? (
                <div className="bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-blue-100 dark:border-blue-900/30 p-8 flex flex-col items-center justify-center space-y-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
                        <BrainCircuit size={40} className="text-blue-500 relative z-10 animate-bounce" />
                    </div>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">جاري قراءة المعطيات وتوليد الرؤى الذكية لتقييم المخزون...</p>
                </div>
            ) : aiInsights ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Health Score Card */}
                    <div className="lg:col-span-4 bg-gradient-to-b from-blue-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 shadow-sm border border-blue-100 dark:border-slate-700 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                        <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-6 flex items-center gap-2">
                            <Target size={18} className="text-blue-500" />
                            مؤشر صحة المخزون
                        </h3>

                        <div className="flex flex-col items-center justify-center space-y-4 mb-4">
                            <div className="relative w-32 h-32 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="64" cy="64" r="56" className="text-slate-100 dark:text-slate-800" strokeWidth="12" stroke="currentColor" fill="transparent" />
                                    <circle
                                        cx="64" cy="64" r="56"
                                        className={`${aiInsights.health_score >= 80 ? 'text-emerald-500' : aiInsights.health_score >= 50 ? 'text-amber-500' : 'text-rose-500'} transition-all duration-1000 ease-out`}
                                        strokeWidth="12"
                                        strokeDasharray={351.858}
                                        strokeDashoffset={351.858 - (351.858 * aiInsights.health_score) / 100}
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="transparent"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-black text-slate-800 dark:text-white">{aiInsights.health_score}</span>
                                    <span className="text-[10px] font-bold text-slate-400">/ 100</span>
                                </div>
                            </div>
                            <h4 className="text-md font-black text-slate-800 dark:text-white text-center">{aiInsights.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                                {aiInsights.summary}
                            </p>
                        </div>
                    </div>

                    {/* AI Opportunities & Risks */}
                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Risks */}
                        <div className="bg-rose-50/50 dark:bg-rose-900/10 rounded-2xl p-6 shadow-sm border border-rose-100 dark:border-rose-900/30">
                            <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 mb-4 flex items-center gap-2">
                                <AlertTriangle size={18} />
                                المخاطر والتهديدات
                            </h3>
                            <div className="space-y-3">
                                {aiInsights.risk_analysis.length > 0 ? aiInsights.risk_analysis.map((risk: any, i: number) => (
                                    <div key={i} className="flex gap-3 items-start bg-white dark:bg-slate-800/50 p-3 rounded-xl border border-rose-100/50 dark:border-rose-900/20">
                                        <AlertCircle size={16} className={`mt-0.5 ${risk.severity === 'critical' ? 'text-rose-600' : risk.severity === 'high' ? 'text-rose-500' : 'text-amber-500'}`} />
                                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{risk.risk}</p>
                                    </div>
                                )) : (
                                    <div className="p-4 text-center text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">لا توجد مخاطر واضحة حالياً.</div>
                                )}
                            </div>
                        </div>

                        {/* Opportunities & Recommendations */}
                        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl p-6 shadow-sm border border-emerald-100 dark:border-emerald-900/30 flex flex-col">
                            <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-4 flex items-center gap-2">
                                <Lightbulb size={18} />
                                الفرص والتوصيات
                            </h3>
                            <div className="space-y-3 flex-1">
                                {aiInsights.recommendations.map((rec: string, i: number) => (
                                    <div key={i} className="flex gap-3 items-start bg-white dark:bg-slate-800/50 p-3 rounded-xl border border-emerald-100/50 dark:border-emerald-900/20 shadow-sm">
                                        <Zap size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{rec}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <Activity className="text-blue-600 dark:text-blue-400" size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي قيمة المخزون</p>
                        <h4 className="text-lg font-black text-slate-800 dark:text-white mt-1">
                            {formatCurrency([
                                ...(analyticsData?.abcAnalysis?.A || []),
                                ...(analyticsData?.abcAnalysis?.B || []),
                                ...(analyticsData?.abcAnalysis?.C || [])
                            ].reduce((sum: number, item: any) => sum + ((item.cost_price || 0) * (item.stock_quantity || 0)), 0))}
                        </h4>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">الأصناف عالية الأداء (Class A)</p>
                        <h4 className="text-lg font-black text-slate-800 dark:text-white mt-1">
                            {analyticsData?.abcAnalysis?.A?.length || 0} صنف
                        </h4>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                        <AlertTriangle className="text-rose-600 dark:text-rose-400" size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">تنبيهات انخفاض المخزون</p>
                        <h4 className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1">
                            {analyticsData?.stockAlerts?.length || 0} صنف حرج
                        </h4>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                        <PackageX className="text-amber-600 dark:text-amber-400" size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">الأصناف الراكدة</p>
                        <h4 className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1">
                            {analyticsData?.stagnant?.length || 0} صنف
                        </h4>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ABCAnalysisChart data={abcData} />
                <TopProductsTable data={analyticsData?.mostActive?.slice(0, 5) || []} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <StockAlertsTable data={(analyticsData?.stockAlerts || []).slice(0, 6)} />
                <StagnantProductsTable data={(analyticsData?.stagnant || []).slice(0, 6)} />
            </div>

        </div>
    );
};

export default InventoryAnalyticsView;
