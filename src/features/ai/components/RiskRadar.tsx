
import React, { useState, useMemo } from 'react';
import { Radar, Loader2, Eye, Database } from 'lucide-react';
import { generateAIContent } from '../aiProvider';
import { STRICT_DATA_RULES, STRICT_SYSTEM_ROLE, buildRealDataContext } from '../strictPrompts';

interface Props {
    data: any;
}

const RiskRadar: React.FC<Props> = ({ data }) => {
    const [analysis, setAnalysis] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [timestamp, setTimestamp] = useState('');

    const scanRisks = async () => {
        setIsLoading(true);
        try {
            const realData = buildRealDataContext(data);

            const result = await generateAIContent(
                `${realData}\n\n${STRICT_DATA_RULES}\n\nبناءً على البيانات الحقيقية أعلاه حصرياً:\nأجرِ مسحاً للمخاطر. لكل مخاطرة:\n🔴 = خطر حرج (يتطلب إجراء فوري)\n🟡 = خطر متوسط\n🟢 = نقطة قوة\n\nكل نقطة في سطر واحد يبدأ بالإيموجي المناسب.\nاذكر الأرقام الحقيقية. إذا بيانات ناقصة أو صفرية قل ذلك.`,
                STRICT_SYSTEM_ROLE + '\nأنت خبير مخاطر مالية. لا تخفف ولا تبالغ — كن دقيقاً وصادقاً.',
                { temperature: 0.15 }
            );
            setAnalysis(result.split('\n').filter((l: string) => l.trim().length > 5));
            setTimestamp(new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }));
        } catch {
            setAnalysis(['⚠️ تعذر المسح']);
        }
        setIsLoading(false);
    };

    const quickRisks: { label: string; level: 'high' | 'medium' | 'low'; reason: string }[] = useMemo(() => [
        {
            label: 'السيولة',
            level: data.payables > 0 && data.liquidity < data.payables ? 'high' : data.payables > 0 && data.liquidity < data.payables * 1.5 ? 'medium' : 'low',
            reason: data.payables > 0 ? `التداول: ${(data.liquidity / data.payables).toFixed(2)}` : 'لا التزامات',
        },
        {
            label: 'التحصيل',
            level: data.revenue > 0 && data.receivables > data.revenue * 0.3 ? 'high' : data.receivables > 0 ? 'medium' : 'low',
            reason: data.revenue > 0 ? `${((data.receivables / data.revenue) * 100).toFixed(0)}% من الإيراد` : 'لا بيانات',
        },
        {
            label: 'المخزون',
            level: data.lowStockCount > 5 ? 'high' : data.lowStockCount > 0 ? 'medium' : 'low',
            reason: `${data.lowStockCount} منتج منخفض`,
        },
        {
            label: 'الربحية',
            level: data.netProfit < 0 ? 'high' : data.margin < 10 && data.margin > 0 ? 'medium' : 'low',
            reason: data.revenue > 0 ? `هامش: ${data.margin.toFixed(1)}%` : 'لا إيرادات',
        },
    ], [data]);

    const levelConfig = {
        high: { color: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/20', label: 'مرتفع' },
        medium: { color: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20', label: 'متوسط' },
        low: { color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20', label: 'منخفض' },
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-400 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
                        <Radar size={16} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-gray-800 dark:text-white">رادار المخاطر</h3>
                        <p className="text-[8px] text-gray-400 font-bold">مؤشرات محسوبة من بيانات حقيقية</p>
                    </div>
                </div>
                <button onClick={scanRisks} disabled={isLoading}
                    className="px-3 py-1.5 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl text-[10px] font-bold hover:opacity-90 transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50"
                >
                    {isLoading ? <Loader2 size={12} className="animate-spin" /> : '🛡️ مسح'}
                </button>
            </div>

            {/* Quick Risk Meters — CALCULATED FROM REAL DATA */}
            <div className="grid grid-cols-4 border-b dark:border-slate-800">
                {quickRisks.map((risk, i) => {
                    const cfg = levelConfig[risk.level];
                    return (
                        <div key={i} className={`p-3 text-center border-l dark:border-slate-800 first:border-l-0 ${cfg.bg}`}>
                            <p className="text-[8px] font-bold text-gray-400 mb-1">{risk.label}</p>
                            <div className="flex items-center justify-center gap-1 mb-0.5">
                                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                                <span className={`text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
                            </div>
                            <p className="text-[7px] text-gray-400 font-bold">{risk.reason}</p>
                        </div>
                    );
                })}
            </div>

            {/* AI Risk Scan */}
            <div className="p-4">
                {analysis.length > 0 ? (
                    <>
                        <div className="flex items-center gap-1.5 mb-2">
                            <Database size={9} className="text-emerald-500" />
                            <span className="text-[8px] font-bold text-emerald-600">تحليل مبني على بيانات النظام الحية</span>
                            {timestamp && <span className="text-[7px] text-emerald-400">• {timestamp}</span>}
                        </div>
                        <div className="space-y-1.5">
                            {analysis.map((line, i) => (
                                <p key={i} className="text-[11px] text-gray-700 dark:text-slate-300 font-medium bg-rose-50/50 dark:bg-rose-950/10 rounded-xl px-3 py-2">{line}</p>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <Eye size={24} className="mx-auto mb-1 text-gray-200 dark:text-slate-700" />
                        <p className="text-[10px] font-bold text-gray-400">اضغط "مسح" — تحليل مبني على أرقامك الحقيقية</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RiskRadar;
