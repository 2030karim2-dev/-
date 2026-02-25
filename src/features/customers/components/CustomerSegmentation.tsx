
import React, { useState } from 'react';
import { Users, Crown, AlertOctagon, UserPlus, User, Loader2, Sparkles } from 'lucide-react';
import { aiService } from '../../ai/service';

interface Props {
    customers: { name: string; totalPurchases: number; lastPurchaseDate: string; invoiceCount: number; balance: number }[];
}

const CustomerSegmentation: React.FC<Props> = ({ customers }) => {
    const [result, setResult] = useState<{ segments: { name: string; segment: string; recommendation: string }[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const analyze = async () => {
        if (customers.length === 0) return;
        setIsLoading(true);
        try {
            const data = await aiService.segmentCustomers(customers);
            setResult(data);
        } catch { /* ignore */ }
        setIsLoading(false);
    };

    const segmentConfig: Record<string, { icon: typeof Crown; color: string; bg: string }> = {
        'VIP': { icon: Crown, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
        'معرض للانسحاب': { icon: AlertOctagon, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30' },
        'جديد': { icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
        'عادي': { icon: User, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-slate-800' },
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                        <Users size={16} className="text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-800 dark:text-white">تصنيف العملاء الذكي</h3>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">AI Customer Segments</p>
                    </div>
                </div>
                <button
                    onClick={analyze}
                    disabled={isLoading || customers.length === 0}
                    className="px-3 py-1.5 text-[10px] font-black bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-300 text-white rounded-xl transition-all"
                >
                    {isLoading ? <Loader2 size={12} className="animate-spin" /> : <><Sparkles size={12} /> تصنيف</>}
                </button>
            </div>

            {result && result.segments.length > 0 ? (
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {result.segments.map((seg, i) => {
                        const config = segmentConfig[seg.segment] || segmentConfig['عادي'];
                        const Icon = config.icon;
                        return (
                            <div key={i} className="flex items-start gap-2 bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3 text-xs">
                                <div className={`p-1.5 rounded-lg ${config.bg} mt-0.5`}>
                                    <Icon size={12} className={config.color} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-bold text-gray-800 dark:text-white truncate">{seg.name}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${config.bg} ${config.color}`}>{seg.segment}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 dark:text-slate-400">{seg.recommendation}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-xs text-gray-400 text-center py-3">اضغط "تصنيف" لتحليل عملائك بالذكاء الاصطناعي</p>
            )}
        </div>
    );
};

export default CustomerSegmentation;
