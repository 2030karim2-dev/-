
import React, { useMemo } from 'react';
import { Shield, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { formatCurrency } from '../../../core/utils';

interface Props {
    data: any;
}

interface Alert {
    type: 'danger' | 'warning' | 'success';
    title: string;
    desc: string;
    metric: string;
}

const LiveMonitor: React.FC<Props> = ({ data }) => {
    const alerts = useMemo(() => {
        const list: Alert[] = [];

        if (data.netProfit > 0) {
            list.push({ type: 'success', title: 'ربحية إيجابية', desc: `صافي ربح ${formatCurrency(data.netProfit)} — هامش ${data.margin.toFixed(1)}%`, metric: '✅' });
        } else if (data.revenue > 0) {
            list.push({ type: 'danger', title: 'خسارة صافية!', desc: `خسارة ${formatCurrency(Math.abs(data.netProfit))}`, metric: '🚨' });
        }

        if (data.margin > 0 && data.margin < 10) {
            list.push({ type: 'warning', title: 'هامش ربح ضعيف', desc: `${data.margin.toFixed(1)}% — المعيار > 15%`, metric: '⚠️' });
        } else if (data.margin >= 20) {
            list.push({ type: 'success', title: 'هامش ممتاز', desc: `${data.margin.toFixed(1)}%`, metric: '🎯' });
        }

        if (data.receivables > data.revenue * 0.3 && data.revenue > 0) {
            list.push({ type: 'danger', title: 'ديون مرتفعة', desc: `${formatCurrency(data.receivables)} = ${((data.receivables / data.revenue) * 100).toFixed(0)}% من الإيراد`, metric: '💸' });
        } else if (data.receivables > 0) {
            list.push({ type: 'warning', title: 'ديون قائمة', desc: formatCurrency(data.receivables), metric: '💰' });
        }

        if (data.liquidity > 0 && data.payables > 0) {
            const ratio = data.liquidity / data.payables;
            if (ratio < 1) list.push({ type: 'danger', title: 'نقص سيولة', desc: `نسبة التداول: ${ratio.toFixed(2)}`, metric: '🔴' });
            else if (ratio < 1.5) list.push({ type: 'warning', title: 'سيولة محدودة', desc: `نسبة التداول: ${ratio.toFixed(2)}`, metric: '🟡' });
            else list.push({ type: 'success', title: 'سيولة كافية', desc: `نسبة التداول: ${ratio.toFixed(2)}`, metric: '🟢' });
        }

        if (data.lowStockCount > 5) list.push({ type: 'danger', title: `${data.lowStockCount} منتج منخفض`, desc: 'بضاعة تحتاج طلب فوري', metric: '📦' });
        else if (data.lowStockCount > 0) list.push({ type: 'warning', title: `${data.lowStockCount} منتج يحتاج تزويد`, desc: 'مخزون ينخفض', metric: '📦' });
        else list.push({ type: 'success', title: 'المخزون كافٍ', desc: `${data.totalProducts} منتج`, metric: '✅' });

        if (data.payables > data.receivables * 1.5 && data.payables > 0) {
            list.push({ type: 'warning', title: 'التزامات مرتفعة', desc: `${formatCurrency(data.payables)}`, metric: '📋' });
        }

        return list;
    }, [data]);

    const styles = {
        danger: { bg: 'bg-rose-50 dark:bg-rose-950/20', border: 'border-rose-200/40 dark:border-rose-800/20', icon: AlertTriangle, iconColor: 'text-rose-500', titleColor: 'text-rose-700 dark:text-rose-400' },
        warning: { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200/40 dark:border-amber-800/20', icon: Clock, iconColor: 'text-amber-500', titleColor: 'text-amber-700 dark:text-amber-400' },
        success: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200/40 dark:border-emerald-800/20', icon: CheckCircle2, iconColor: 'text-emerald-500', titleColor: 'text-emerald-700 dark:text-emerald-400' },
    };

    const dangerCount = alerts.filter(a => a.type === 'danger').length;
    const warningCount = alerts.filter(a => a.type === 'warning').length;
    const successCount = alerts.filter(a => a.type === 'success').length;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                        <Shield size={16} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-gray-800 dark:text-white">المراقب المباشر</h3>
                        <p className="text-[8px] text-gray-400 font-bold">رقابة حية على مؤشرات الأعمال</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    {dangerCount > 0 && <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full text-[8px] font-black">{dangerCount} خطر</span>}
                    {warningCount > 0 && <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full text-[8px] font-black">{warningCount} تحذير</span>}
                    {successCount > 0 && <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full text-[8px] font-black">{successCount} جيد</span>}
                </div>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {alerts.map((alert, i) => {
                    const s = styles[alert.type];
                    const Icon = s.icon;
                    return (
                        <div key={i} className={`${s.bg} border ${s.border} rounded-xl p-3 flex items-start gap-2.5`}>
                            <div className="mt-0.5 flex-shrink-0">
                                <Icon size={14} className={s.iconColor} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <p className={`text-[11px] font-black ${s.titleColor}`}>{alert.title}</p>
                                    <span className="text-xs">{alert.metric}</span>
                                </div>
                                <p className="text-[9px] text-gray-500 dark:text-slate-400 mt-0.5">{alert.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LiveMonitor;
