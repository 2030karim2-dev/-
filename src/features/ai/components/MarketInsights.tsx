
import React, { useState } from 'react';
import { Globe, Loader2, Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';
import { aiService } from '../service';

interface Props {
    data: {
        topProducts: string[];
        avgMargin: number;
        monthlyRevenue: number;
    };
}

const MarketInsights: React.FC<Props> = ({ data }) => {
    const [result, setResult] = useState<{ insights: string[]; opportunities: string[]; threats: string[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const analyze = async () => {
        setIsLoading(true);
        try {
            const r = await aiService.analyzeMarketPosition(data);
            setResult(r);
        } catch { /* ignore */ }
        setIsLoading(false);
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl">
                        <Globe size={16} className="text-cyan-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 dark:text-white">تحليل السوق</h3>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Market Analysis</p>
                    </div>
                </div>
                <button
                    onClick={analyze}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-[10px] font-bold bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-300 text-white rounded-xl transition-all"
                >
                    {isLoading ? <Loader2 size={12} className="animate-spin" /> : '🌍 تحليل'}
                </button>
            </div>

            {result ? (
                <div className="space-y-3">
                    {result.insights.length > 0 && (
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase mb-1.5">📊 الملاحظات</p>
                            {result.insights.map((item, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-slate-400 mb-1">
                                    <Lightbulb size={10} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                    <span className="font-medium">{item}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {result.opportunities.length > 0 && (
                        <div>
                            <p className="text-[9px] font-bold text-emerald-600 uppercase mb-1.5">🚀 الفرص</p>
                            {result.opportunities.map((item, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-emerald-600 dark:text-emerald-400 mb-1">
                                    <TrendingUp size={10} className="mt-0.5 flex-shrink-0" />
                                    <span className="font-medium">{item}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {result.threats.length > 0 && (
                        <div>
                            <p className="text-[9px] font-bold text-rose-600 uppercase mb-1.5">⚠️ التهديدات</p>
                            {result.threats.map((item, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400 mb-1">
                                    <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />
                                    <span className="font-medium">{item}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-xs text-gray-400 text-center py-4">اضغط "تحليل" لفهم وضعك في سوق قطع الغيار</p>
            )}
        </div>
    );
};

export default MarketInsights;
