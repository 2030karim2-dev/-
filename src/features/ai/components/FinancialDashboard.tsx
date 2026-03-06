
import React, { useState } from 'react';
import { Calculator, Loader2, TrendingUp, TrendingDown, Database } from 'lucide-react';
import { generateAIContent } from '../aiProvider';
import { formatCurrency } from '../../../core/utils';
import { STRICT_DATA_RULES, STRICT_SYSTEM_ROLE, buildRealDataContext } from '../strictPrompts';

interface Props {
    data: any;
}

const FinancialDashboard: React.FC<Props> = ({ data }) => {
    const [analysis, setAnalysis] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [timestamp, setTimestamp] = useState('');

    const analyze = async () => {
        setIsLoading(true);
        try {
            const realData = buildRealDataContext(data);
            const result = await generateAIContent(
                `${realData}\n\n${STRICT_DATA_RULES}\n\nأنت محاسب قانوني. بناءً على البيانات الحقيقية أعلاه حصرياً:\n1. حلل الربحية مع الأرقام الدقيقة المقدمة\n2. حلل التدفق النقدي والسيولة\n3. قيّم نسبة التداول\n4. حدد المخاطر المالية الحقيقية\n5. قدم توصيات محاسبية عملية\n\nكل نقطة في سطر واحد يبدأ بإيموجي. اذكر الأرقام الحقيقية من البيانات المقدمة.`,
                STRICT_SYSTEM_ROLE + '\nأنت محاسب قانوني متخصص. تحليلاتك مبنية فقط على الأرقام المقدمة.',
                { temperature: 0.15 }
            );
            setAnalysis(result.split('\n').filter((l: string) => l.trim().length > 5));
            setTimestamp(new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }));
        } catch {
            setAnalysis(['⚠️ تعذر التحليل']);
        }
        setIsLoading(false);
    };

    const profitMargin = data.revenue > 0 ? ((data.netProfit / data.revenue) * 100).toFixed(1) : '0';
    const currentRatio = data.payables > 0 ? (data.liquidity / data.payables).toFixed(2) : '∞';

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Calculator size={16} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-gray-800 dark:text-white">التحليل المالي</h3>
                        <p className="text-[8px] text-gray-400 font-bold">بيانات حقيقية من قاعدة البيانات</p>
                    </div>
                </div>
                <button onClick={analyze} disabled={isLoading}
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-[10px] font-bold hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                    {isLoading ? <Loader2 size={12} className="animate-spin" /> : '🧮 تحليل'}
                </button>
            </div>

            {/* Financial Metrics — REAL DATA, no AI needed */}
            <div className="grid grid-cols-4 border-b dark:border-slate-800">
                {[
                    { label: 'صافي الربح', value: formatCurrency(data.netProfit), sub: data.netProfit >= 0 ? '✅ ربح' : '❌ خسارة', color: data.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600' },
                    { label: 'هامش الربح', value: `${profitMargin}%`, sub: Number(profitMargin) > 15 ? 'جيد' : 'ضعيف', color: Number(profitMargin) > 15 ? 'text-emerald-600' : 'text-amber-500' },
                    { label: 'نسبة التداول', value: currentRatio, sub: Number(currentRatio) > 1 ? 'آمن' : 'خطر', color: Number(currentRatio) > 1 ? 'text-emerald-600' : 'text-rose-500' },
                    { label: 'السيولة', value: formatCurrency(data.liquidity), sub: 'من قاعدة البيانات', color: 'text-blue-600' },
                ].map((m, i) => (
                    <div key={i} className="p-3 text-center border-l dark:border-slate-800 first:border-l-0">
                        <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">{m.label}</p>
                        <p className={`text-sm font-bold font-mono ${m.color}`}>{m.value}</p>
                        <p className="text-[7px] font-bold text-gray-400 mt-0.5">{m.sub}</p>
                    </div>
                ))}
            </div>

            {/* P&L Breakdown — REAL DATA */}
            <div className="grid grid-cols-2 border-b dark:border-slate-800">
                <div className="p-3 border-l dark:border-slate-800">
                    <p className="text-[8px] font-bold text-emerald-500 uppercase mb-2 flex items-center gap-1"><TrendingUp size={9} /> إيرادات حقيقية</p>
                    {data.revenues.length > 0 ? data.revenues.slice(0, 4).map((r: any, i: number) => (
                        <div key={i} className="flex justify-between text-[10px] py-0.5">
                            <span className="text-gray-500 dark:text-slate-400 truncate ml-2">{r.name}</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">{formatCurrency(r.netBalance)}</span>
                        </div>
                    )) : <p className="text-[10px] text-gray-300 italic">لا توجد إيرادات مسجلة</p>}
                </div>
                <div className="p-3">
                    <p className="text-[8px] font-bold text-rose-500 uppercase mb-2 flex items-center gap-1"><TrendingDown size={9} /> مصروفات حقيقية</p>
                    {data.expenses_list.length > 0 ? data.expenses_list.slice(0, 4).map((e: any, i: number) => (
                        <div key={i} className="flex justify-between text-[10px] py-0.5">
                            <span className="text-gray-500 dark:text-slate-400 truncate ml-2">{e.name}</span>
                            <span className="font-mono font-bold text-rose-600 dark:text-rose-400 flex-shrink-0">{formatCurrency(e.netBalance)}</span>
                        </div>
                    )) : <p className="text-[10px] text-gray-300 italic">لا توجد مصروفات مسجلة</p>}
                </div>
            </div>

            {/* AI Analysis — only interpretation, not data */}
            {analysis.length > 0 && (
                <div className="p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Database size={9} className="text-emerald-500" />
                        <span className="text-[8px] font-bold text-emerald-600">تحليل مبني على بيانات النظام الحية</span>
                        {timestamp && <span className="text-[7px] text-emerald-400">• {timestamp}</span>}
                    </div>
                    <div className="space-y-1.5">
                        {analysis.map((line, i) => (
                            <p key={i} className="text-[11px] text-gray-700 dark:text-slate-300 font-medium bg-violet-50/50 dark:bg-violet-950/10 rounded-xl px-3 py-2">{line}</p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialDashboard;
