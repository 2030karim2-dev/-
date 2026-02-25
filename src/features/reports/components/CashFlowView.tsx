
import React from 'react';
import { useCashFlow } from '../hooks';
import { formatCurrency } from '../../../core/utils';
import { Wallet, ArrowDownRight, ArrowUpRight, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ExcelTable from '../../../ui/common/ExcelTable';
import ShareButton from '../../../ui/common/ShareButton';

const CashFlowView: React.FC = () => {
    const { data, isLoading } = useCashFlow();

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-slate-500 font-black tracking-widest animate-pulse">جاري تحليل حركات السيولة...</p>
        </div>
    );

    const columns = [
        { header: 'الحساب النقدي / البنكي', accessor: (row: any) => <span className="font-bold">{row.name}</span> },
        { header: 'الرصيد المتاح حالياً', accessor: (row: any) => <span dir="ltr" className="font-black font-mono text-blue-600">{formatCurrency(row.netBalance)}</span>, className: 'text-left' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-600 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Stats */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] -mr-32 -mt-32 transition-all duration-700 group-hover:bg-blue-600/30" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-[10px] font-black uppercase opacity-50 tracking-[0.2em]">إجمالي النقد المتاح</p>
                                <ShareButton
                                    size="sm"
                                    eventType="cash_flow"
                                    title="مشاركة تقرير السيولة"
                                    className="text-white/50 hover:text-white hover:bg-white/10"
                                    message={`💰 تقرير السيولة النقدية\n━━━━━━━━━━━━━━\n🏦 إجمالي النقد المتاح: ${formatCurrency(data?.currentLiquidity || 0)}\n\n📊 تفاصيل الحسابات:\n${(data?.accounts || []).map((a: any) => `  • ${a.name}: ${formatCurrency(a.netBalance)}`).join('\n')}\n📅 التاريخ: ${new Date().toLocaleDateString('ar-SA')}`}
                                />
                            </div>
                            <h2 dir="ltr" className="text-4xl font-black font-mono tracking-tighter mb-8 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                {formatCurrency(data?.currentLiquidity || 0)}
                            </h2>
                            <div className="flex gap-4">
                                <div className="flex-1 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-sm transition-transform duration-300 hover:scale-[1.02]">
                                    <div className="p-2 bg-emerald-500/20 rounded-xl w-fit mb-2">
                                        <ArrowUpRight size={16} className="text-emerald-400" />
                                    </div>
                                    <span className="text-[9px] font-black opacity-40 block uppercase tracking-wider">وارد الشهر</span>
                                    <span dir="ltr" className="text-sm font-black font-mono text-emerald-400">48,200</span>
                                </div>
                                <div className="flex-1 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-sm transition-transform duration-300 hover:scale-[1.02]">
                                    <div className="p-2 bg-rose-500/20 rounded-xl w-fit mb-2">
                                        <ArrowDownRight size={16} className="text-rose-400" />
                                    </div>
                                    <span className="text-[9px] font-black opacity-40 block uppercase tracking-wider">صادر الشهر</span>
                                    <span dir="ltr" className="text-sm font-black font-mono text-rose-400">32,150</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border dark:border-slate-800 overflow-hidden shadow-sm">
                        <ExcelTable columns={columns} data={data?.accounts || []} colorTheme="blue" />
                    </div>
                </div>

                {/* Chart Area */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm flex flex-col relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
                                <div className="p-2.5 bg-blue-500/10 rounded-2xl">
                                    <BarChart3 size={20} className="text-blue-500" />
                                </div>
                                تحليل التدفقات النقدية
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">مقارنة المقبوضات والمدفوعات لآخر 3 أشهر</p>
                        </div>
                        <div className="flex gap-4 text-[10px] font-black bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> تدفق وارد</span>
                            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span> تدفق صادر</span>
                        </div>
                    </div>

                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                            <AreaChart data={data?.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="flowIn" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                    </linearGradient>
                                    <linearGradient id="flowOut" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} opacity={0.2} stroke="#94a3b8" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} dy={10} />
                                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                                <Tooltip
                                    content={({ active, payload, label }: any) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl">
                                                    <p className="text-[10px] font-black text-slate-400 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2 uppercase tracking-tight">{label}</p>
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between gap-6">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">وارد</span>
                                                            </div>
                                                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                                                                {formatCurrency(payload[0].value)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-6">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-rose-500" />
                                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">صادر</span>
                                                            </div>
                                                            <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
                                                                {formatCurrency(payload[1].value)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="in"
                                    stroke="#10b981"
                                    fillOpacity={1}
                                    fill="url(#flowIn)"
                                    strokeWidth={4}
                                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2, fill: '#10b981' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="out"
                                    stroke="#f43f5e"
                                    fillOpacity={1}
                                    fill="url(#flowOut)"
                                    strokeWidth={3}
                                    strokeDasharray="6 6"
                                    dot={{ r: 3, fill: '#f43f5e', strokeWidth: 1, stroke: '#fff' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CashFlowView;
