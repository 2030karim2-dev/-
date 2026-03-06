import React, { useState } from 'react';
import { useInventoryAnalytics, useInventorySmartInsights } from '../../inventory/hooks';
import { Download, AlertTriangle, Activity, Target, AlertCircle, Lightbulb, Zap, BrainCircuit, PackageX } from 'lucide-react';

// UI Helpers
import { formatCurrency } from '../../../core/utils';
import { cn } from '../../../core/utils';

// Subcomponents
import { ABCAnalysisChart } from './ABCAnalysisChart';
import { TopProductsTable } from './TopProductsTable';
import { StockAlertsTable } from './StockAlertsTable';
import { StagnantProductsTable } from './StagnantProductsTable';

const InventoryAnalyticsView: React.FC = () => {
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

            {/* Premium Command Center Header */}
            <div className="glass-panel bento-item p-8 bg-slate-900 dark:bg-slate-950 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between border-none shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] -mr-40 -mt-40 transition-all duration-1000" />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="p-4 bg-blue-500 text-white rounded-[2rem] shadow-2xl shadow-blue-500/30 rotate-3 hover:rotate-0 transition-transform cursor-pointer">
                        <BrainCircuit size={32} />
                    </div>
                    <div className="text-center md:text-right">
                        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                            تحليل المخزون الاستراتيجي
                        </h2>
                        <p className="text-xs text-blue-400/80 font-bold uppercase tracking-[0.3em] mt-1">مركز التحكم في تدفقات الأصناف والربحية</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 lg:mt-0 relative z-10">
                    <div className="flex items-center glass-card bg-white/5 border border-white/10 rounded-2xl p-2 backdrop-blur-xl">
                        <div className="flex items-center gap-2 px-3">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">النطاق</span>
                            <input
                                type="date"
                                value={dateRange.from}
                                onChange={(e) => setDateRange((prev: any) => ({ ...prev, from: e.target.value }))}
                                className="text-[10px] bg-white/10 text-white border-none rounded-lg p-1.5 outline-none font-bold"
                            />
                            <span className="text-white/20">—</span>
                            <input
                                type="date"
                                value={dateRange.to}
                                onChange={(e) => setDateRange((prev: any) => ({ ...prev, to: e.target.value }))}
                                className="text-[10px] bg-white/10 text-white border-none rounded-lg p-1.5 outline-none font-bold"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleExport}
                        className="group flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                    >
                        <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
                        تصدير البيانات
                    </button>
                </div>
            </div>

            {/* AI Smart Insights Section */}
            {aiLoading ? (
                <div className="glass-panel bento-item p-12 flex flex-col items-center justify-center space-y-6 bg-blue-500/5 border-none shadow-sm">
                    <div className="w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.4em] animate-pulse">جاري معالجة الرؤى التنبؤية بالذكاء الاصطناعي...</p>
                </div>
            ) : aiInsights ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Health Score Card - Bento Left */}
                    <div className="lg:col-span-4 glass-panel bento-item p-10 bg-white dark:bg-slate-900 border-none shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-slate-800 rounded-full blur-2xl -mr-12 -mt-12 transition-all duration-700 group-hover:scale-150" />

                        <div className="relative z-10">
                            <h3 className="text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase mb-8 flex items-center gap-2">
                                <Target size={16} className="text-blue-500" />
                                كشف صحة المستودعات
                            </h3>

                            <div className="flex flex-col items-center justify-center space-y-6">
                                <div className="relative w-44 h-44 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="88" cy="88" r="74" className="text-slate-50 dark:text-slate-800" strokeWidth="12" stroke="currentColor" fill="transparent" />
                                        <circle
                                            cx="88" cy="88" r="74"
                                            className={`${aiInsights.health_score >= 80 ? 'text-emerald-500' : aiInsights.health_score >= 50 ? 'text-amber-500' : 'text-rose-500'} transition-all duration-1000 ease-out drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]`}
                                            strokeWidth="12"
                                            strokeDasharray={464.95}
                                            strokeDashoffset={464.95 - (464.95 * aiInsights.health_score) / 100}
                                            strokeLinecap="round"
                                            stroke="currentColor"
                                            fill="transparent"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-5xl font-bold text-slate-900 dark:text-white tracking-tighter">{aiInsights.health_score}</span>
                                        <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Index Score</span>
                                    </div>
                                </div>

                                <div className="text-center space-y-2">
                                    <h4 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{aiInsights.title}</h4>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium leading-relaxed px-4">
                                        {aiInsights.summary}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Opportunities & Risks - Bento Right */}
                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Risks Card */}
                        <div className="glass-panel bento-item p-8 bg-rose-50/10 dark:bg-rose-950/5 border-none shadow-xl flex flex-col">
                            <h3 className="text-[10px] font-bold text-rose-500 tracking-[0.3em] uppercase mb-6 flex items-center gap-3">
                                <AlertTriangle size={18} />
                                تحليل المخاطر التشغيلية
                            </h3>
                            <div className="space-y-4 flex-1">
                                {aiInsights.risk_analysis.length > 0 ? aiInsights.risk_analysis.map((risk: any, i: number) => (
                                    <div key={i} className="flex gap-4 items-start glass-card p-4 bg-white/50 dark:bg-slate-800/40 rounded-[1.5rem] border-none shadow-sm transition-transform hover:-translate-y-1">
                                        <div className={cn("p-2 rounded-xl shrink-0 mt-0.5", risk.severity === 'critical' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400')}>
                                            <AlertCircle size={16} />
                                        </div>
                                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-bold italic">{risk.risk}</p>
                                    </div>
                                )) : (
                                    <div className="p-6 text-center text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-dashed border-emerald-500/30">تحليل آمن - لا توجد مخاطر مؤكدة</div>
                                )}
                            </div>
                        </div>

                        {/* Suggestions Card */}
                        <div className="glass-panel bento-item p-8 bg-emerald-50/10 dark:bg-emerald-950/5 border-none shadow-xl flex flex-col">
                            <h3 className="text-[10px] font-bold text-emerald-500 tracking-[0.3em] uppercase mb-6 flex items-center gap-3">
                                <Lightbulb size={18} />
                                مقترحات التميز التجاري
                            </h3>
                            <div className="space-y-4 flex-1">
                                {aiInsights.recommendations.map((rec: string, i: number) => (
                                    <div key={i} className="flex gap-4 items-start glass-card p-4 bg-white/50 dark:bg-slate-800/40 rounded-[1.5rem] border-none shadow-sm transition-transform hover:-translate-y-1">
                                        <div className="p-2 bg-emerald-500 text-white rounded-xl shrink-0 mt-0.5 shadow-lg shadow-emerald-500/30 rotate-12">
                                            <Zap size={16} />
                                        </div>
                                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-bold italic">{rec}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

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
                    { label: 'تنبيهات العجز الحرج', val: `${analyticsData?.stockAlerts?.length || 0} صنف`, icon: AlertTriangle, color: 'rose' },
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
