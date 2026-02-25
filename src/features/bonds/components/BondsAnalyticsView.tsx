import React, { useState } from 'react';
import {
    ArrowDownCircle, ArrowUpCircle,
    Wallet, Activity, BarChart3
} from 'lucide-react';
import {
    AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Sector
} from 'recharts';
import { useThemeStore } from '@/lib/themeStore';
import { cn } from '@/core/utils';
import MicroHeader from '../../../ui/base/MicroHeader';
import Button from '../../../ui/base/Button';
import { formatCurrency } from '../../../core/utils';

type PeriodType = 'today' | 'week' | 'month' | 'quarter' | 'year';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6'];

const periodLabels: Record<PeriodType, string> = {
    today: 'اليوم',
    week: 'الأسبوع',
    month: 'الشهر',
    quarter: 'الربع',
    year: 'السنة'
};

interface Analytics {
    totalAmount: number;
    count: number;
    avgAmount: number;
    chartData: { date: string; amount: number; count: number }[];
    accountData: { name: string; amount: number; count: number }[];
}

interface Totals {
    receiptCount: number;
    receiptAmount: number;
    paymentCount: number;
    paymentAmount: number;
    netAmount: number;
}

interface Props {
    analytics: Analytics;
    totals: Totals;
    onSwitchToList: () => void;
}

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
    return (
        <g>
            <text x={cx} y={cy} dy={-10} textAnchor="middle" fill={fill} fontSize={12} fontWeight="black" className="uppercase tracking-[0.2em] opacity-40">
                ACCOUNT
            </text>
            <text x={cx} y={cy} dy={15} textAnchor="middle" fill={fill} fontSize={16} fontWeight="black">
                {payload.name}
            </text>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
            <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 10} outerRadius={outerRadius + 14} fill={fill} />
        </g>
    );
};

const BondsAnalyticsView: React.FC<Props> = ({ analytics, totals, onSwitchToList }) => {
    const [period, setPeriod] = useState<PeriodType>('month');
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 font-cairo animate-in fade-in duration-700">
            <MicroHeader
                title="تحليلات السندات"
                icon={BarChart3}
                iconColor="text-blue-600"
                actions={
                    <div className="flex items-center gap-3">
                        <div className="flex bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-inner">
                            {(['today', 'week', 'month', 'quarter', 'year'] as PeriodType[]).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${period === p
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                        }`}
                                >
                                    {periodLabels[p]}
                                </button>
                            ))}
                        </div>
                        <Button
                            onClick={onSwitchToList}
                            variant="outline"
                            size="sm"
                            className="rounded-2xl border-slate-200 dark:border-slate-800 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            للقائمة
                        </Button>
                    </div>
                }
            />

            <div className="flex-1 overflow-y-auto p-8 pb-20 scrollbar-hide">
                <div className="max-w-7xl mx-auto space-y-10">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-500/30 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
                            <div className="absolute top-0 right-0 p-6 opacity-20 transform group-hover:rotate-12 transition-transform duration-500">
                                <ArrowDownCircle size={60} />
                            </div>
                            <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em] mb-3">إجمالي القبض</p>
                            <h2 dir="ltr" className="text-3xl font-black font-mono tracking-tighter mb-1">{formatCurrency(totals.receiptAmount)}</h2>
                            <div className="flex items-center gap-2 mt-4 text-[10px] font-bold">
                                <span className="bg-white/10 px-3 py-1 rounded-full">{totals.receiptCount} سند قبض</span>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-rose-600 to-pink-700 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-rose-500/30 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
                            <div className="absolute top-0 right-0 p-6 opacity-20 transform group-hover:rotate-12 transition-transform duration-500">
                                <ArrowUpCircle size={60} />
                            </div>
                            <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em] mb-3">إجمالي الصرف</p>
                            <h2 dir="ltr" className="text-3xl font-black font-mono tracking-tighter mb-1">{formatCurrency(totals.paymentAmount)}</h2>
                            <div className="flex items-center gap-2 mt-4 text-[10px] font-bold">
                                <span className="bg-white/10 px-3 py-1 rounded-full">{totals.paymentCount} سند صرف</span>
                            </div>
                        </div>

                        <div className={cn(
                            "p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500",
                            totals.netAmount >= 0
                                ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-blue-500/30'
                                : 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-orange-500/30'
                        )}>
                            <div className="absolute top-0 right-0 p-6 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
                                <Wallet size={60} />
                            </div>
                            <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em] mb-3">صافي التدفق</p>
                            <h2 dir="ltr" className="text-3xl font-black font-mono tracking-tighter mb-1">{formatCurrency(Math.abs(totals.netAmount))}</h2>
                            <div className="flex items-center gap-2 mt-4">
                                <span className="text-[10px] font-black uppercase bg-white/20 px-3 py-1 rounded-full">
                                    {totals.netAmount >= 0 ? 'فائض نقدي' : 'عجز نقدي'}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
                            <div className="absolute bottom-0 right-0 p-6 opacity-5 transform group-hover:-translate-y-2 transition-transform duration-500">
                                <Activity size={80} className="text-amber-500" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">متوسط قيمة السند</p>
                            <h2 dir="ltr" className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tighter mb-1">{formatCurrency(analytics.avgAmount)}</h2>
                            <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase">Calculated from {analytics.count} bonds</p>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Trend Chart */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 bg-blue-500/10 rounded-2xl">
                                    <Activity size={18} className="text-blue-500" />
                                </div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">تحليل التدفق الزمني</h4>
                            </div>
                            <div className="h-[280px]">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <AreaChart data={analytics.chartData}>
                                        <defs>
                                            <linearGradient id="colorBond" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                                            dy={10}
                                            tickFormatter={(value) => new Date(value).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 9, fill: '#94a3b8' }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={40}
                                            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                                        />
                                        <Tooltip
                                            cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '4 4' }}
                                            content={({ active, payload }: any) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className={cn(
                                                            "p-4 rounded-3xl border shadow-2xl backdrop-blur-xl transition-all duration-300",
                                                            isDark
                                                                ? "bg-slate-900/90 border-slate-700/50 shadow-black/50"
                                                                : "bg-white/95 border-slate-200/50 shadow-slate-200/50"
                                                        )}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                                    {new Date(payload[0].payload.date).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-baseline gap-1 py-1">
                                                                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tighter">
                                                                    {formatCurrency(payload[0].value)}
                                                                </p>
                                                            </div>
                                                            <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-tighter">
                                                                {payload[0].payload.count} عمليات مسجلة
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="#3b82f6"
                                            strokeWidth={4}
                                            fill="url(#colorBond)"
                                            animationDuration={2500}
                                            animationEasing="ease-in-out"
                                            activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Accounts Chart */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 bg-purple-500/10 rounded-2xl">
                                    <Wallet size={18} className="text-purple-500" />
                                </div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">توزيع النقدية حسب الحسابات</h4>
                            </div>
                            <div className="h-[200px] mb-8">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <PieChart>
                                        <Pie
                                            {...{
                                                activeIndex,
                                                activeShape: renderActiveShape,
                                                data: analytics.accountData,
                                                cx: "50%",
                                                cy: "50%",
                                                innerRadius: 60,
                                                outerRadius: 80,
                                                paddingAngle: 8,
                                                dataKey: "amount",
                                                nameKey: "name",
                                                onMouseEnter: (_: any, index: number) => setActiveIndex(index),
                                                onMouseLeave: () => setActiveIndex(undefined),
                                                animationDuration: 1500
                                            } as any}
                                        >
                                            {analytics.accountData.map((_entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="outline-none" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }: any) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className={cn(
                                                            "p-4 rounded-3xl border shadow-2xl backdrop-blur-xl",
                                                            isDark ? "bg-slate-900/80 border-slate-700/50" : "bg-white/90 border-slate-200/50"
                                                        )}>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{payload[0].name}</p>
                                                            <p className="text-lg font-black font-mono tracking-tighter" style={{ color: payload[0].payload.fill }}>{formatCurrency(payload[0].value)}</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {analytics.accountData.slice(0, 4).map((acc, index) => (
                                    <div key={acc.name} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-purple-500/30 transition-all duration-300">
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(167,139,250,0.5)]" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase truncate">{acc.name}</span>
                                        </div>
                                        <span className="font-black text-sm text-slate-800 dark:text-slate-100 font-mono tracking-tighter" dir="ltr">{formatCurrency(acc.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BondsAnalyticsView;
