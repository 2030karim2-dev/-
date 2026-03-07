
import React from 'react';
import { useFinancialHealth } from '../../ai/hooks';
import {
    Sparkles, BrainCircuit, AlertCircle, Lightbulb,
    Terminal, Zap, TrendingUp, AlertTriangle
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
                    <p className="text-sm font-bold text-white uppercase tracking-[0.5em]">جاري تشغيل نظام التحليل...</p>
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
                        <h2 className="text-base font-bold text-white uppercase tracking-[0.2em] leading-none mb-1.5">
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
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/5 px-3 py-1 rounded-full border border-emerald-400/20 uppercase tracking-[0.1em]">
                            تمت مزامنة التحليل
                        </span>
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                    </div>
                    <p className="text-[9px] text-slate-500 font-mono uppercase font-bold tracking-tight">
                        {new Date(aiAnalysis.last_updated).toLocaleString('ar-SA')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT COLUMN: Health Score & Key Metrics */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Health Score Card */}
                    <div className="glass-card bento-item p-8 relative overflow-hidden group h-[340px] flex flex-col justify-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-6 relative">مؤشر الصحة المالية</h3>
                        <div className="h-48 w-full relative z-10 flex flex-col items-center justify-center">
                            <ResponsiveContainer width="100%" height={192}>
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
                                        minPointSize={1}
                                    />
                                </RadialBarChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pb-4">
                                <span className={cn(
                                    "text-6xl font-bold tracking-tighter drop-shadow-xl",
                                    aiAnalysis.health_score > 70 ? "text-emerald-500" : aiAnalysis.health_score > 40 ? "text-amber-500" : "text-red-500"
                                )}>
                                    {aiAnalysis.health_score}
                                </span>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full animate-pulse shadow-lg",
                                        aiAnalysis.health_score > 70 ? "bg-emerald-500 shadow-emerald-500/50" : aiAnalysis.health_score > 40 ? "bg-amber-500 shadow-amber-500/50" : "bg-red-500 shadow-red-500/50"
                                    )} />
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
                                        / 100 نتيجة النظام
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Key Metrics Summary */}
                    <div className="glass-card bento-item p-6 shadow-xl">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">المؤشرات المفتاحية</h3>
                        <div className="space-y-5">
                            <div className="flex justify-between items-center border-b border-dashed border-slate-200 dark:border-slate-800 pb-3">
                                <span className="text-xs font-medium text-slate-500">هامش الربح الإجمالي</span>
                                <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100">{financialData?.grossMargin.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-dashed border-slate-200 dark:border-slate-800 pb-3">
                                <span className="text-xs font-medium text-slate-500">هامش الربح الصافي</span>
                                <span className={cn("text-sm font-bold font-mono", (financialData?.netMargin || 0) > 0 ? "text-emerald-600" : "text-red-600")}>
                                    {financialData?.netMargin.toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center pb-1">
                                <span className="text-xs font-medium text-slate-500">السيولة المتوقعة</span>
                                <span className="text-sm font-bold font-mono text-blue-600">
                                    {financialData?.debt_metrics.cash_on_hand.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Analysis & Insights */}
                <div className="lg:col-span-8 flex flex-col gap-6">

                    {/* Executive Summary */}
                    <div className="glass-card bento-item overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-1 h-full bg-blue-500" />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="p-8 relative z-10">
                            <div className="flex items-center gap-4 mb-5">
                                <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                    <Sparkles size={20} className="text-blue-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{aiAnalysis.title}</h3>
                            </div>
                            <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                                {aiAnalysis.summary}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* RISK ANALYSIS */}
                        <div className="glass-card bento-item flex flex-col">
                            <div className="bg-red-50/50 dark:bg-red-900/10 p-4 border-b border-red-100 dark:border-red-900/20 flex items-center justify-between">
                                <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                                    <AlertCircle size={18} />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">المخاطر المكتشفة</span>
                                </div>
                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
                                    {aiAnalysis.risk_analysis.length}
                                </span>
                            </div>
                            <div className="p-6 space-y-4 flex-1">
                                {aiAnalysis.risk_analysis.map((item, i) => (
                                    <div key={i} className="flex gap-4 items-start group text-right">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full mt-1.5 shrink-0 shadow-sm",
                                            item.severity === 'critical' ? "bg-red-600 animate-pulse shadow-red-600/50" :
                                                item.severity === 'high' ? "bg-red-500 shadow-red-500/30" : "bg-amber-400 shadow-amber-400/30"
                                        )}></div>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                            {item.risk}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* OPPORTUNITIES */}
                        <div className="glass-card bento-item flex flex-col">
                            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 border-b border-emerald-100 dark:border-emerald-900/20 flex items-center justify-between">
                                <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                                    <TrendingUp size={18} />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">الفرص المتاحة</span>
                                </div>
                                <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
                                    {aiAnalysis.opportunities.length}
                                </span>
                            </div>
                            <div className="p-6 space-y-4 flex-1">
                                {aiAnalysis.opportunities.map((item, i) => (
                                    <div key={i} className="flex gap-4 items-start group text-right">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full mt-1.5 shrink-0 shadow-sm",
                                            item.impact === 'high' ? "bg-emerald-500 shadow-emerald-500/30" : "bg-blue-400 shadow-blue-400/30"
                                        )}></div>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                            {item.opportunity}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div className="glass-card bento-item p-8 bg-slate-900/90 dark:bg-slate-900/40 relative overflow-hidden border-none shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/10" />
                        <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.4em] mb-8 z-10 relative flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30">
                                <Lightbulb size={18} className="text-blue-400" />
                            </div>
                            التوصيات الاستراتيجية للمنشأة
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                            {aiAnalysis.recommendations.map((rec, i) => (
                                <div key={i} className="bg-white/10 p-6 rounded-[1.5rem] border border-white/10 backdrop-blur-md hover:border-blue-500/50 hover:bg-white/15 transition-all duration-500 group text-right">
                                    <div className="flex items-center justify-between mb-5">
                                        <span className="category-badge bg-blue-500/20 text-blue-300 border border-blue-500/30">توصية_{i + 1}</span>
                                        <Zap size={14} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
                                    </div>
                                    <p className="text-[11px] leading-relaxed text-slate-100 font-bold">
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