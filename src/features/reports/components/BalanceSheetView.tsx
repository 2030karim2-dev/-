import React from 'react';
import { useBalanceSheet } from '../hooks';
import { formatCurrency } from '../../../core/utils';
import { Landmark, Scale, ShieldCheck, ArrowRightLeft, Wallet, Layers } from 'lucide-react';
import ExcelTable from '../../../ui/common/ExcelTable';
import { cn } from '../../../core/utils';
import ShareButton from '../../../ui/common/ShareButton';

interface ReportSectionProps {
    title: string;
    items: any[];
    total: number;
    icon: any;
    color: 'blue' | 'rose' | 'emerald';
}

const ReportSection: React.FC<ReportSectionProps> = ({ title, items, total, icon: Icon, color }) => {
    const theme = {
        blue: { header: 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400', total: 'bg-blue-600 text-white' },
        rose: { header: 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400', total: 'bg-rose-600 text-white' },
        emerald: { header: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400', total: 'bg-emerald-600 text-white' }
    };
    const currentTheme = theme[color];

    return (
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col rounded-none">
            <div className={`p-3 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2 ${currentTheme.header}`}>
                <Icon size={14} />
                <h3 className="text-[10px] font-black uppercase tracking-widest">{title}</h3>
            </div>
            <div className="flex-1 divide-y divide-gray-50 dark:divide-slate-800/50">
                {items.map((item) => (
                    <div key={item.code} className="flex justify-between items-center p-2 hover:bg-gray-50/50 dark:hover:bg-slate-800/20">
                        <span className="text-[10px] font-bold text-gray-700 dark:text-slate-200">{item.name}</span>
                        <span dir="ltr" className="font-mono text-[10px] font-bold text-gray-800 dark:text-slate-100">{formatCurrency(Math.abs(item.netBalance))}</span>
                    </div>
                ))}
            </div>
            <div className={`p-3 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center ${currentTheme.total}`}>
                <span className="text-[10px] font-black uppercase tracking-widest">الإجمالي</span>
                <span dir="ltr" className="font-mono text-xl font-bold">{formatCurrency(total)}</span>
            </div>
        </div>
    );
};

const BalanceSheetView: React.FC = () => {
    const { data, isLoading } = useBalanceSheet();

    if (isLoading) return <div className="p-20 text-center animate-pulse">جاري إعداد الميزانية العمومية...</div>;

    // Fix: Add check for data and destructure properties for use in component
    if (!data) return <div className="p-8 text-center text-gray-500">لا توجد بيانات مالية متاحة</div>;

    const { assets, liabilities, equity, totalAssets, totalLiabEquity } = data;
    const isBalanced = Math.abs(totalAssets - totalLiabEquity) < 1;


    return (
        <div className="max-w-7xl mx-auto space-y-4 pb-12 print-area animate-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-4 rounded-none text-center shadow-sm flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black text-gray-800 dark:text-slate-100 uppercase tracking-tight">المركز المالي</h2>
                    <p className="text-xs text-gray-400">كما في تاريخ <b dir="ltr" className="text-gray-600">{new Date().toLocaleDateString()}</b></p>
                </div>
                <div className="flex items-center gap-3">
                    <ShareButton
                        size="sm"
                        showLabel
                        eventType="balance_sheet"
                        title="مشاركة الميزانية العمومية"
                        message={`🏦 الميزانية العمومية (المركز المالي)\n━━━━━━━━━━━━━━\n💼 إجمالي الأصول: ${formatCurrency(totalAssets)}\n📋 إجمالي الخصوم: ${formatCurrency(Math.abs(liabilities.reduce((s: number, a: any) => s + a.netBalance, 0)))}\n🏛️ حقوق الملكية: ${formatCurrency(Math.abs(equity.reduce((s: number, a: any) => s + a.netBalance, 0)))}\n${isBalanced ? '✅ الميزانية متزنة' : `❌ غير متزنة - الفرق: ${formatCurrency(Math.abs(totalAssets - totalLiabEquity))}`}\n📅 التاريخ: ${new Date().toLocaleDateString('ar-SA')}`}
                    />
                    <div className="p-3 bg-slate-900 text-white"><Landmark size={24} /></div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4 items-start">
                {/* Left Column: Assets */}
                <ReportSection title="الأصول" icon={Wallet} items={assets} total={totalAssets} color="blue" />

                {/* Right Column: Liabilities & Equity */}
                <div className="space-y-4">
                    <ReportSection title="الخصوم" icon={Scale} items={liabilities} total={Math.abs(liabilities.reduce((s: number, a: any) => s + a.netBalance, 0))} color="rose" />
                    <ReportSection
                        title="حقوق الملكية"
                        icon={Layers}
                        items={equity}
                        total={Math.abs(equity.reduce((s: number, a: any) => s + a.netBalance, 0))}
                        color="emerald"
                    />
                </div>
            </div>

            {/* Verification Footer */}
            <div className={cn(
                "mt-4 p-4 rounded-none flex items-center justify-center gap-3 border-2 font-black",
                isBalanced
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
            )}>
                <ShieldCheck size={20} />
                <span className="text-sm uppercase tracking-widest">
                    {isBalanced ? 'الميزانية متزنة (Balanced)' : `غير متزنة - الفرق ${formatCurrency(Math.abs(totalAssets - totalLiabEquity))}`}
                </span>
            </div>
        </div>
    );
};

export default BalanceSheetView;