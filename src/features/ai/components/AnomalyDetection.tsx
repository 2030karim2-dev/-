
import React, { useState } from 'react';
import { AlertTriangle, Loader2, Eye } from 'lucide-react';
import { aiService } from '../service';
import { formatCurrency } from '../../../core/utils';

interface Props {
    transactions: { type: string; amount: number; date: string; description: string }[];
}

const AnomalyDetection: React.FC<Props> = ({ transactions }) => {
    const [result, setResult] = useState<{ anomalies: { description: string; amount: number; reason: string; severity: string }[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const detect = async () => {
        if (transactions.length === 0) return;
        setIsLoading(true);
        try {
            const data = await aiService.detectAnomalies(transactions);
            setResult(data);
        } catch { /* ignore */ }
        setIsLoading(false);
    };

    const sevColors: Record<string, string> = {
        'عالي': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
        'متوسط': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        'منخفض': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
                        <Eye size={16} className="text-rose-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-800 dark:text-white">كشف الشذوذ</h3>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Anomaly Detection</p>
                    </div>
                </div>
                <button
                    onClick={detect}
                    disabled={isLoading || transactions.length === 0}
                    className="px-3 py-1.5 text-[10px] font-black bg-rose-600 hover:bg-rose-500 disabled:bg-gray-300 text-white rounded-xl transition-all"
                >
                    {isLoading ? <Loader2 size={12} className="animate-spin" /> : '🔍 فحص'}
                </button>
            </div>

            {result ? (
                result.anomalies.length > 0 ? (
                    <div className="space-y-2">
                        {result.anomalies.map((a, i) => (
                            <div key={i} className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3 text-xs space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-800 dark:text-white">{a.description}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${sevColors[a.severity] || sevColors['منخفض']}`}>{a.severity}</span>
                                </div>
                                <p className="text-gray-500 dark:text-slate-400">{a.reason}</p>
                                <p className="font-mono font-bold text-gray-700 dark:text-slate-300">{formatCurrency(a.amount)}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4 text-xs text-emerald-600 font-bold">✅ لم يتم اكتشاف أي شذوذ — كل المعاملات طبيعية</div>
                )
            ) : (
                <p className="text-xs text-gray-400 text-center py-4">اضغط "فحص" لتحليل المعاملات الأخيرة</p>
            )}
        </div>
    );
};

export default AnomalyDetection;
