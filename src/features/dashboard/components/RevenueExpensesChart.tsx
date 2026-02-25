import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, ReferenceLine
} from 'recharts';
import { useThemeStore } from '../../../lib/themeStore';
import { TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { cn } from '../../../core/utils';

interface RevenueExpensesChartProps {
    data: { name: string; revenue: number; expenses: number }[];
    className?: string;
}

const formatNumber = (value: number) => {
    const num = Number(value) || 0;
    if (Math.abs(num) >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const CustomTooltip = ({ active, payload, label }: any) => {
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';

    if (active && payload && payload.length) {
        const revenue = payload.find((p: any) => p.dataKey === 'revenue')?.value || 0;
        const expenses = payload.find((p: any) => p.dataKey === 'expenses')?.value || 0;
        const net = revenue - expenses;

        return (
            <div className={cn(
                "p-4 rounded-2xl border shadow-xl backdrop-blur-xl transition-all duration-200",
                "bg-[var(--app-surface)]/80 border-[var(--app-border)] shadow-black/50"
            )}>
                <p className="text-xs font-black text-[var(--app-text-secondary)] mb-3 border-b border-[var(--app-border)] pb-2">
                    {label}
                </p>
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-xs text-[var(--app-text)] font-bold">الإيرادات</span>
                        </div>
                        <span className="text-sm font-black text-slate-700 dark:text-slate-100 font-mono tracking-tight">
                            {formatNumber(revenue)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                            <span className="text-xs text-[var(--app-text)] font-bold">المصروفات</span>
                        </div>
                        <span className="text-sm font-black text-slate-700 dark:text-slate-100 font-mono tracking-tight">
                            {formatNumber(expenses)}
                        </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center justify-between gap-6">
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-black">الصافي</span>
                            <span className={cn(
                                "text-sm font-black tracking-tight",
                                net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                            )}>
                                {net >= 0 ? '+' : ''}{formatNumber(net)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const RevenueExpensesChart: React.FC<RevenueExpensesChartProps> = ({
    data,
    className
}) => {
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';

    // Calculate totals
    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    const totalExpenses = data.reduce((sum, d) => sum + d.expenses, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // If no data, show empty state
    if (!data || data.length === 0) {
        return (
            <div className={cn(
                "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-center h-64",
                className
            )}>
                <div className="text-center">
                    <Scale size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-400">لا توجد بيانات</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl",
            className
        )}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
                        <Scale size={16} className="text-violet-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-[var(--app-text)]">
                            الإيرادات vs المصروفات
                        </h3>
                        <p className="text-[9px] text-slate-400">مقارنة شهرية</p>
                    </div>
                </div>

                {/* Summary */}
                <div className="flex items-center gap-3">
                    <div className="text-center">
                        <p className="text-[8px] font-black text-emerald-500 uppercase">الإيرادات</p>
                        <p className="text-sm font-black text-emerald-600 font-mono">{formatNumber(totalRevenue)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[8px] font-black text-rose-500 uppercase">المصروفات</p>
                        <p className="text-sm font-black text-rose-600 font-mono">{formatNumber(totalExpenses)}</p>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-48 relative group" style={{ minHeight: '192px' }}>
                <ResponsiveContainer width="100%" height={192} minWidth={0} minHeight={192}>
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="barRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                            </linearGradient>
                            <linearGradient id="barExpenses" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                                <stop offset="100%" stopColor="#e11d48" stopOpacity={0.8} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} opacity={0.4} />
                        <XAxis
                            dataKey="name"
                            tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 'bold' }}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                        />
                        <YAxis
                            tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 'bold' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatNumber}
                            dx={-10}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
                        <ReferenceLine y={0} stroke={isDark ? '#475569' : '#cbd5e1'} strokeDasharray="3 3" />
                        <Bar
                            dataKey="revenue"
                            name="الإيرادات"
                            fill="url(#barRevenue)"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={40}
                        />
                        <Bar
                            dataKey="expenses"
                            name="المصروفات"
                            fill="url(#barExpenses)"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={40}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>


            {/* Net Profit Footer */}
            <div className={cn(
                "mt-4 p-3 rounded-xl flex items-center justify-between",
                netProfit >= 0
                    ? "bg-emerald-50 dark:bg-emerald-900/20"
                    : "bg-rose-50 dark:bg-rose-900/20"
            )}>
                <div className="flex items-center gap-2">
                    {netProfit >= 0 ? (
                        <TrendingUp size={16} className="text-emerald-500" />
                    ) : (
                        <TrendingDown size={16} className="text-rose-500" />
                    )}
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        صافي الربح
                    </span>
                </div>
                <div className="text-right">
                    <p className={cn(
                        "text-lg font-black font-mono",
                        netProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                    )}>
                        {netProfit >= 0 ? '+' : ''}{formatNumber(netProfit)}
                    </p>
                    <p className={cn(
                        "text-[9px] font-bold",
                        netProfit >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                        هامش ربح {Math.max(-100, Math.min(100, profitMargin)).toFixed(1)}%
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RevenueExpensesChart;
