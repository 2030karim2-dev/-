
import React, { useState } from 'react';
import { Activity, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { aiService } from '../service';
import { formatCurrency } from '../../../core/utils';

interface Props {
    data: {
        revenue: number;
        expenses: number;
        netProfit: number;
        receivables: number;
        payables: number;
        liquidity: number;
        lowStockCount: number;
        totalProducts: number;
    };
}

const BusinessHealthGauge: React.FC<Props> = ({ data }) => {
    const [result, setResult] = useState<{ score: number; grade: string; factors: { name: string; impact: string; score: number }[]; advice: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const analyze = async () => {
        setIsLoading(true);
        try {
            const r = await aiService.calculateBusinessHealth(data);
            setResult(r);
        } catch { /* ignore */ }
        setIsLoading(false);
    };

    const scoreColor = (s: number) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : s >= 40 ? '#f97316' : '#ef4444';
    const circumference = 2 * Math.PI * 54;
    const offset = result ? circumference - (result.score / 100) * circumference : circumference;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                        <Activity size={16} className="text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-800 dark:text-white">مؤشر صحة الأعمال</h3>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">AI Business Health</p>
                    </div>
                </div>
                <button
                    onClick={analyze}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-[10px] font-black bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-300 text-white rounded-xl transition-all"
                >
                    {isLoading ? <Loader2 size={12} className="animate-spin" /> : '💊 فحص'}
                </button>
            </div>

            {result ? (
                <div className="space-y-4">
                    {/* Gauge */}
                    <div className="flex items-center justify-center">
                        <div className="relative w-32 h-32">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" className="text-gray-100 dark:text-slate-800" strokeWidth="8" />
                                <circle cx="60" cy="60" r="54" fill="none" stroke={scoreColor(result.score)} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black font-mono" style={{ color: scoreColor(result.score) }}>{result.score}</span>
                                <span className="text-[9px] font-black text-gray-400">{result.grade}</span>
                            </div>
                        </div>
                    </div>

                    {/* Factors */}
                    <div className="space-y-1.5">
                        {result.factors.map((f, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                                {f.impact === 'إيجابي' ? <TrendingUp size={10} className="text-emerald-500" /> : <TrendingDown size={10} className="text-rose-500" />}
                                <span className="font-medium text-gray-700 dark:text-slate-300 flex-1">{f.name}</span>
                                <span className="font-black font-mono text-gray-500">{f.score}/100</span>
                            </div>
                        ))}
                    </div>

                    {/* Advice */}
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-400 font-medium">
                        💡 {result.advice}
                    </div>
                </div>
            ) : (
                <p className="text-xs text-gray-400 text-center py-6">اضغط "فحص" لتقييم صحة أعمالك الآن</p>
            )}
        </div>
    );
};

export default BusinessHealthGauge;
