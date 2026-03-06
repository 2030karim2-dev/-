import React from 'react';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, ClipboardCheck, User, FileText, Info } from 'lucide-react';
import { useItemMovement } from '../../hooks';
import { formatNumberDisplay } from '../../../../core/utils';
import { cn } from '../../../../core/utils';

interface Props {
    productId: string;
}

const HistorySection: React.FC<Props> = ({ productId }) => {
    const { data: movements, isLoading } = useItemMovement(productId);

    return (
        <div className="col-span-1 lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                    <HistoryIcon size={16} className="text-blue-500" />
                    سجل الحركة (Movement Log)
                </h4>
                <div className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-2 py-1 rounded-lg font-bold">
                    آخر {movements?.length || 0} حركة
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2 space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                        <p className="text-xs text-gray-400 font-bold">جاري تحميل السجل...</p>
                    </div>
                ) : !movements || movements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50 dark:bg-slate-800/50 rounded-3xl border border-dashed dark:border-slate-700">
                        <Info size={32} className="mb-2 opacity-20" />
                        <p className="text-xs font-bold">لا يوجد حركات مسجلة لهذا الصنف</p>
                    </div>
                ) : (
                    <div className="relative border-r-2 border-slate-100 dark:border-slate-800 mr-4 pr-6 space-y-6">
                        {movements.map((mov: any) => (
                            <div key={mov.id} className="relative group">
                                {/* Timeline Dot */}
                                <div className={cn(
                                    "absolute -right-[33px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 z-10 transition-transform group-hover:scale-125 shadow-sm",
                                    getTransactionColor(mov.transaction_type, mov.reference_type)
                                )} />

                                <div className="bg-gray-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30 transition-all">
                                    <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            {getTransactionIcon(mov.transaction_type, mov.reference_type)}
                                            <div>
                                                <p className="text-xs font-bold text-gray-900 dark:text-slate-100">
                                                    {mov.document_number}
                                                </p>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                                    {mov.source_name}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-mono text-gray-400">
                                                {new Date(mov.date).toLocaleDateString('ar-EG', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                            <p className="text-[9px] font-mono text-gray-400 mt-0.5">
                                                {new Date(mov.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t dark:border-slate-800 mt-2">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <span className="text-[9px] text-gray-500 block mb-0.5">الكمية</span>
                                                <span className={cn(
                                                    "text-sm font-black font-mono",
                                                    mov.transaction_type === 'in' ? 'text-emerald-500' : 'text-rose-500'
                                                )}>
                                                    {mov.transaction_type === 'in' ? '+' : '-'}{formatNumberDisplay(mov.quantity)}
                                                </span>
                                            </div>
                                            <div className="border-r dark:border-slate-800 h-6 mx-1" />
                                            <div>
                                                <span className="text-[9px] text-gray-500 block mb-0.5">الرصيد بعد</span>
                                                <span className="text-sm font-black font-mono text-gray-900 dark:text-slate-100">
                                                    {formatNumberDisplay(mov.balance_after)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-60">
                                            <User size={10} className="text-gray-400" />
                                            <span className="text-[9px] font-bold text-gray-400">{mov.source_user?.split('@')[0]}</span>
                                        </div>
                                    </div>

                                    {mov.notes && (
                                        <div className="mt-2 text-[10px] text-gray-500 bg-white/50 dark:bg-slate-900/50 p-2 rounded-lg border dark:border-slate-800 italic">
                                            "{mov.notes}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Helpers
const HistoryIcon = ({ size, className }: { size: number, className?: string }) => (
    <div className={cn("p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg", className)}>
        <FileText size={size} />
    </div>
);

const getTransactionIcon = (type: string, ref: string) => {
    if (ref === 'transfer') return <RefreshCw size={14} className="text-blue-500" />;
    if (ref === 'audit') return <ClipboardCheck size={14} className="text-indigo-500" />;
    return type === 'in'
        ? <ArrowDownLeft size={16} className="text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 p-0.5 rounded" />
        : <ArrowUpRight size={16} className="text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-0.5 rounded" />;
};

const getTransactionColor = (type: string, ref: string) => {
    if (ref === 'transfer') return 'bg-blue-500';
    if (ref === 'audit') return 'bg-indigo-500';
    return type === 'in' ? 'bg-emerald-500' : 'bg-rose-500';
};

export default HistorySection;
