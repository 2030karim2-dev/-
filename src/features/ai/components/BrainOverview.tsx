
import React from 'react';
import { TrendingUp, TrendingDown, Zap, Activity, DollarSign, Wallet, Package, Users } from 'lucide-react';
import { formatCurrency } from '../../../core/utils';

interface Props {
    data: any;
    healthScore: number;
}

const BrainOverview: React.FC<Props> = ({ data, healthScore }) => {
    const kpis = [
        { label: 'الإيرادات', value: formatCurrency(data.revenue), icon: TrendingUp, bg: 'bg-emerald-50 dark:bg-emerald-950/20', iconBg: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
        { label: 'المصروفات', value: formatCurrency(data.expenses), icon: TrendingDown, bg: 'bg-rose-50 dark:bg-rose-950/20', iconBg: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400' },
        { label: 'صافي الربح', value: formatCurrency(data.netProfit), icon: Zap, bg: data.netProfit >= 0 ? 'bg-blue-50 dark:bg-blue-950/20' : 'bg-rose-50 dark:bg-rose-950/20', iconBg: data.netProfit >= 0 ? 'bg-blue-500' : 'bg-rose-500', text: data.netProfit >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-rose-700 dark:text-rose-400' },
        { label: 'هامش الربح', value: `${data.margin.toFixed(1)}%`, icon: Activity, bg: data.margin > 15 ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-amber-50 dark:bg-amber-950/20', iconBg: data.margin > 15 ? 'bg-emerald-500' : 'bg-amber-500', text: data.margin > 15 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400' },
        { label: 'ديون لك', value: formatCurrency(data.receivables), icon: Users, bg: 'bg-amber-50 dark:bg-amber-950/20', iconBg: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400' },
        { label: 'عليك', value: formatCurrency(data.payables), icon: Wallet, bg: 'bg-orange-50 dark:bg-orange-950/20', iconBg: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-400' },
        { label: 'السيولة', value: formatCurrency(data.liquidity), icon: DollarSign, bg: 'bg-cyan-50 dark:bg-cyan-950/20', iconBg: 'bg-cyan-500', text: 'text-cyan-700 dark:text-cyan-400' },
        { label: 'تنبيه مخزون', value: `${data.lowStockCount} منتج`, icon: Package, bg: data.lowStockCount > 0 ? 'bg-rose-50 dark:bg-rose-950/20' : 'bg-emerald-50 dark:bg-emerald-950/20', iconBg: data.lowStockCount > 0 ? 'bg-rose-500' : 'bg-emerald-500', text: data.lowStockCount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400' },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {kpis.map((kpi, i) => {
                const Icon = kpi.icon;
                return (
                    <div key={i} className={`${kpi.bg} rounded-2xl p-3.5 border border-transparent hover:shadow-sm transition-all group`}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-7 h-7 rounded-xl ${kpi.iconBg} flex items-center justify-center shadow-sm`}>
                                <Icon size={13} className="text-white" />
                            </div>
                            <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase">{kpi.label}</span>
                        </div>
                        <p className={`text-sm font-black font-mono ${kpi.text} group-hover:scale-105 transition-transform origin-right`}>{kpi.value}</p>
                    </div>
                );
            })}
        </div>
    );
};

export default BrainOverview;
