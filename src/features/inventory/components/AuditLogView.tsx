
import React from 'react';
import { useItemMovement, useMinimalProducts } from '../hooks';
import { formatNumberDisplay } from '../../../core/utils';
import { History, ArrowUpRight, ArrowDownRight, User, Package, Clock } from 'lucide-react';
import { cn } from '../../../core/utils';

const AuditLogView: React.FC = () => {
    const [selectedId, setSelectedId] = React.useState<string>('');
    const { data: products } = useMinimalProducts();
    const { data: log, isLoading } = useItemMovement(selectedId || null);

    return (
        <div className="flex flex-col gap-3 animate-in fade-in duration-500">
            {/* Product Picker Selection */}
            <div className="bg-white dark:bg-slate-900 p-2 rounded-none border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-2">
                <div className="p-2 bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                    <History size={16} />
                </div>
                <select
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="flex-1 bg-transparent text-[11px] font-black outline-none dark:text-white"
                >
                    <option value="">-- اختر صنفاً لعرض تاريخ العمليات --</option>
                    {products?.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
            </div>

            <div className="flex flex-col gap-1.5 relative">
                {selectedId && log && log.length > 0 ? (
                    <div className="relative pr-4 border-r-2 border-gray-100 dark:border-slate-800 space-y-4 py-2">
                        {log.map((entry: any, i: number) => {
                            const isIncoming = ['purchase', 'return_sale', 'transfer_in', 'adj_in', 'initial'].includes(entry.transaction_type);
                            return (
                                <div key={i} className="relative group">
                                    {/* Timeline Dot */}
                                    <div className={cn(
                                        "absolute -right-[23px] top-1 w-4 h-4 rounded-full border-4 border-white dark:border-slate-950 z-10 transition-transform group-hover:scale-125",
                                        isIncoming ? "bg-emerald-500" : "bg-rose-500"
                                    )}></div>

                                    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-3 flex flex-col gap-2 group-hover:border-blue-500/30 transition-all">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "text-[8px] font-black px-1.5 py-0.5 uppercase tracking-tighter",
                                                    isIncoming ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                                                )}>
                                                    {isIncoming ? 'وارد' : 'صادر'}
                                                </span>
                                                <h4 className="text-[10px] font-black text-gray-800 dark:text-slate-100">{entry.reference_type}</h4>
                                            </div>
                                            <div className="flex items-center gap-1 text-[8px] font-bold text-gray-400 font-mono">
                                                <Clock size={10} />
                                                <span>{new Date(entry.date).toLocaleString('ar-SA')}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-950 p-2 border dark:border-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[7px] font-black text-gray-400 uppercase">الكمية</span>
                                                    <span dir="ltr" className={cn("text-xs font-black font-mono", entry.quantity > 0 ? "text-emerald-600" : "text-rose-600")}>
                                                        {entry.quantity > 0 ? '+' : ''}{formatNumberDisplay(entry.quantity)}
                                                    </span>
                                                </div>
                                                <div className="w-px h-6 bg-gray-200 dark:bg-slate-800"></div>
                                                <div className="flex flex-col">
                                                    <span className="text-[7px] font-black text-gray-400 uppercase">الرصيد بعدها</span>
                                                    <span dir="ltr" className="text-xs font-black font-mono text-blue-600">{formatNumberDisplay(entry.balance_after)}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 opacity-60">
                                                <User size={10} className="text-gray-400" />
                                                <span className="text-[8px] font-bold text-gray-500">{entry.created_by_name}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-20 text-center flex flex-col items-center gap-3 opacity-30">
                        <History size={48} strokeWidth={1} />
                        <p className="text-[10px] font-black uppercase tracking-widest">بانتظار تحديد صنف للتدقيق</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogView;
