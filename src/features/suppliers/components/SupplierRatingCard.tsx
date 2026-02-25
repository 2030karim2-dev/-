
import React, { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { aiService } from '../../ai/service';

interface Props {
    suppliers: { name: string; totalPurchases: number; avgDeliveryDays: number; returnRate: number; balance: number }[];
}

const SupplierRatingCard: React.FC<Props> = ({ suppliers }) => {
    const [result, setResult] = useState<{ ratings: { name: string; score: number; strengths: string; weaknesses: string }[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const analyze = async () => {
        if (suppliers.length === 0) return;
        setIsLoading(true);
        try {
            const data = await aiService.rateSuppliers(suppliers);
            setResult(data);
        } catch { /* ignore */ }
        setIsLoading(false);
    };

    const scoreColor = (s: number) => s >= 8 ? 'text-emerald-600' : s >= 5 ? 'text-amber-600' : 'text-rose-600';
    const scoreBg = (s: number) => s >= 8 ? 'bg-emerald-100 dark:bg-emerald-900/30' : s >= 5 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-rose-100 dark:bg-rose-900/30';

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                        <Star size={16} className="text-yellow-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-800 dark:text-white">تقييم الموردين</h3>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">AI Supplier Rating</p>
                    </div>
                </div>
                <button
                    onClick={analyze}
                    disabled={isLoading || suppliers.length === 0}
                    className="px-3 py-1.5 text-[10px] font-black bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-300 text-white rounded-xl transition-all"
                >
                    {isLoading ? <Loader2 size={12} className="animate-spin" /> : '⭐ تقييم'}
                </button>
            </div>

            {result && result.ratings.length > 0 ? (
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {result.ratings.sort((a, b) => b.score - a.score).map((r, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3 text-xs">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="font-bold text-gray-800 dark:text-white flex-1">{r.name}</span>
                                <span className={`px-2.5 py-1 rounded-lg font-black font-mono ${scoreBg(r.score)} ${scoreColor(r.score)}`}>
                                    {r.score}/10
                                </span>
                            </div>
                            <div className="flex gap-3 text-[10px]">
                                <span className="text-emerald-600">✅ {r.strengths}</span>
                                {r.weaknesses && <span className="text-rose-500">⚠️ {r.weaknesses}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-gray-400 text-center py-3">اضغط "تقييم" لتحليل أداء الموردين</p>
            )}
        </div>
    );
};

export default SupplierRatingCard;
