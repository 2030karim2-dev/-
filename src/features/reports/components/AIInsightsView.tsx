
import React from 'react';
import { useFinancialHealth } from '../../ai/hooks';
import {
    Sparkles, BrainCircuit, ShieldCheck, AlertCircle, Lightbulb,
    Terminal, Activity, Zap, TrendingUp, TrendingDown, AlertTriangle
} from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { cn } from '../../../core/utils';

const AIInsightsView: React.FC = () => {
    const { financialData, aiAnalysis, isLoading, isError, refetch } = useFinancialHealth();

    if (isLoading) return (
        <div className="h-[600px] flex flex-col items-center justify-center gap-8 bg-slate-950 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent opacity-50" />
            <div className="relative">
                <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
                <div className="relative z-10 p-8 rounded-full bg-slate-900 border border-slate-700 shadow-inner">
                    <BrainCircuit size={80} className="text-blue-500 animate-[spin_10s_linear_infinite]" />
                </div>
                <div className="absolute top-0 right-0">
                    < Zap size={32} className="text-amber-400 animate-bounce" />
                </div>
            </div>
            <div className="space-y-4 text-center relative z-10">
                <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    <p className="text-sm font-black text-white uppercase tracking-[0.5em]">جاري تشغيل نظام التحليل...</p>
                </div>
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-bold text-slate-500 font-mono animate-pulse">
                        &gt; ربط المتجهات المالية...
                    </p>
                    <p className="text-xs font-bold text-slate-500 font-mono animate-pulse delay-75">
                        &gt; فحص زمن استجابة المخزون...
                    </p>
                </div>
            </div>
        </div>
    );

    if (isError || !aiAnalysis) return (
        <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <AlertTriangle size={48} className="text-amber-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">انقطع الاتصال بالوحدة العصبية</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-md">تعذر على المدقق الذكي إكمال التحليل. قد يكون ذلك بسبب استقرار الشبكة أو نقص في نقاط البيانات المالية.</p>
            <button
                onClick={() => refetch()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all"
            >
                إعادة محاولة التحليل
            </button>
        </div>
    );

    const healthScoreData = [{ name: 'Health', value: aiAnalysis.health_score, fill: aiAnalysis.health_score > 70 ? '#10b981' : aiAnalysis.health_score > 40 ? '#f59e0b' : '#ef4444' }];

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-1000 pb-20">
            {/* Technical Header Strip */}
            <div className="bg-slate-900 rounded-[2rem] p-5 flex flex-col md:flex-row justify-between items-center border border-slate-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                        <Terminal size={22} className="text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-white uppercase tracking-[0.2em] leading-none mb-1.5">
                            المدقق الذكي <span className="text-blue-500">v3.5 Platinum</span>
                        </h2>
                        <div className="flex items-center gap-3">
                            <p className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest">
                                الحالة: <span className="text-emerald-500">تم التحسين</span>
                            </p>
                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                            <p className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest">
                                النواة: <span className="text-blue-500">Gemini 1.5 Pro</span>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1 mt-4 md:mt-0 relative z-10">
                    <div className="flex gap-2 items-center">
                        <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/5 px-3 py-1 rounded-full border border-emerald-400/20 uppercase tracking-[0.1em]">
                            تمت مزامنة التحليل
                        </span>
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                    </div>
                    <p className="text-[9px] text-slate-500 font-mono uppercase font-bold tracking-tight">
                        {new Date(aiAnalysis.last_updated).toLocaleString('ar-SA')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* LEFT COLUMN: Health Score & Key Metrics */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Health Score Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl group h-[320px] flex flex-col justify-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 relative">مؤشر الصحة المالية</h3>
                        <div className="h-48 w-full relative z-10 flex flex-col items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <RadialBarChart
                                    cx="50%" cy="50%"
                                    innerRadius="75%" outerRadius="100%"
                                    barSize={24}
                                    data={healthScoreData}
                                    startAngle={210} endAngle={-30}
                                >
                                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                    <RadialBar
                                        background={{ fill: 'rgba(0,0,0,0.05)' }}
                                        dataKey="value"
                                        cornerRadius={12}
                                        animationDuration={2000}
                                        animationEasing="ease-out"
                                    />
                                </RadialBarChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pb-4">
                                <span className={cn(
                                    "text-6xl font-black tracking-tighter drop-shadow-sm",
                                    aiAnalysis.health_score > 70 ? "text-emerald-500" : aiAnalysis.health_score > 40 ? "text-amber-500" : "text-red-500"
                                )}>
                                    {aiAnalysis.health_score}
                                </span>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className={cn(
                                        "w-1.5 h-1.5 rounded-full animate-pulse",
                                        aiAnalysis.health_score > 70 ? "bg-emerald-500" : aiAnalysis.health_score > 40 ? "bg-amber-500" : "bg-red-500"
                                    )} />
                                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">
                                        / 100 نتيجة النظام
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Key Metrics Summary */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">المؤشرات الحية</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-slate-800 pb-2">
                                <span className="text-xs text-slate-500">هامش الربح الإجمالي</span>
                                <span className="text-sm font-bold font-mono">{financialData?.grossMargin.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-slate-800 pb-2">
                                <span className="text-xs text-slate-500">هامش الربح الصافي</span>
                                <span className={cn("text-sm font-bold font-mono", (financialData?.netMargin || 0) > 0 ? "text-emerald-600" : "text-red-600")}>
                                    {financialData?.netMargin.toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b border-dashed border-slate-100 dark:border-slate-800 pb-2">
                                <span className="text-xs text-slate-500">السيولة النقدية المتوقعة</span>
                                <span className="text-sm font-bold font-mono text-blue-600">
                                    {financialData?.debt_metrics.cash_on_hand.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Analysis & Insights */}
                <div className="lg:col-span-8 flex flex-col gap-4">

                    {/* Executive Summary */}
                    <div className="bg-white dark:bg-slate-900 border-r-4 border-blue-500 rounded-l-[1.5rem] p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-500/10 rounded-xl">
                                    <Sparkles size={18} className="text-blue-500" />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">{aiAnalysis.title}</h3>
                            </div>
                            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                                {aiAnalysis.summary}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* RISK ANALYSIS */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
                            <div className="bg-red-50 dark:bg-red-900/10 p-3 border-b border-red-100 dark:border-red-900/20 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                    <AlertCircle size={16} />
                                    <span className="text-xs font-black uppercase tracking-widest">المخاطر المكتشفة</span>
                                </div>
                                <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {aiAnalysis.risk_analysis.length}
                                </span>
                            </div>
                            <div className="p-4 space-y-3 flex-1">
                                {aiAnalysis.risk_analysis.map((item, i) => (
                                    <div key={i} className="flex gap-3 items-start group text-right">
                                        <div className={cn(
                                            "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                                            item.severity === 'critical' ? "bg-red-600 animate-pulse" :
                                                item.severity === 'high' ? "bg-red-500" : "bg-amber-400"
                                        )}></div>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                            {item.risk}
                                        </p>
                                    </div>
                                ))}
                                {aiAnalysis.risk_analysis.length === 0 && (
                                    <div className="text-center py-8 text-slate-400 text-xs italic">
                                        لم يتم رصد أي مخاطر جوهرية.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* OPPORTUNITIES */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-3 border-b border-emerald-100 dark:border-emerald-900/20 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                    <TrendingUp size={16} />
                                    <span className="text-xs font-black uppercase tracking-widest">الفرص المتاحة</span>
                                </div>
                                <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {aiAnalysis.opportunities.length}
                                </span>
                            </div>
                            <div className="p-4 space-y-3 flex-1">
                                {aiAnalysis.opportunities.map((item, i) => (
                                    <div key={i} className="flex gap-3 items-start group text-right">
                                        <div className={cn(
                                            "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                                            item.impact === 'high' ? "bg-emerald-500" : "bg-blue-400"
                                        )}></div>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                            {item.opportunity}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border border-slate-800">
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -mb-48 -mr-48" />
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-8 z-10 relative flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 rounded-xl">
                                <Lightbulb size={16} className="text-amber-400" />
                            </div>
                            التوصيات الاستراتيجية
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                            {aiAnalysis.recommendations.map((rec, i) => (
                                <div key={i} className="bg-white/5 p-5 rounded-3xl border border-white/10 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300 group text-right">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="block text-[10px] font-black text-blue-400 uppercase tracking-widest px-2 py-0.5 bg-blue-400/10 rounded-lg">توصية_{i + 1}</span>
                                        <Zap size={12} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                                    </div>
                                    <p className="text-xs leading-relaxed text-slate-300 font-bold">
                                        {rec}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AIInsightsView;