
import React, { useState } from 'react';
import { DollarSign, Loader2, TrendingUp, Coins, Database } from 'lucide-react';
import { generateAIContent } from '../aiProvider';
import { STRICT_DATA_RULES, STRICT_SYSTEM_ROLE, buildRealDataContext } from '../strictPrompts';

interface Props {
    data: any;
}

const ProfitOptimizer: React.FC<Props> = ({ data }) => {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [timestamp, setTimestamp] = useState('');

    const optimize = async () => {
        setIsLoading(true);
        try {
            const realData = buildRealDataContext(data);

            const result = await generateAIContent(
                `${realData}\n\n${STRICT_DATA_RULES}\n\nبناءً على البيانات الحقيقية أعلاه فقط:\n1. حلل الأرباح والمصروفات الحقيقية\n2. اقترح 5 طرق عملية لزيادة الأرباح مبنية حصرياً على الأرقام المقدمة\n3. لا تذكر أي نسبة أو رقم إلا إذا حسبته من البيانات المقدمة\n4. إذا كانت بيانات المصروفات قليلة أو غير متوفرة، اذكر ذلك بوضوح\n5. كن صادقاً — إذا لا توجد فرصة واضحة قل ذلك`,
                STRICT_SYSTEM_ROLE,
                { temperature: 0.2 }
            );
            setSuggestions(result.split('\n').filter((l: string) => l.trim().length > 5));
            setTimestamp(new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }));
        } catch {
            setSuggestions(['⚠️ تعذر التحليل — حاول مجدداً']);
        }
        setIsLoading(false);
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Coins size={16} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-gray-800 dark:text-white">محسّن الأرباح</h3>
                        <p className="text-[8px] text-gray-400 font-bold">تحليل حقيقي لفرص الربح</p>
                    </div>
                </div>
                <button onClick={optimize} disabled={isLoading}
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-[10px] font-black hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-1"
                >
                    {isLoading ? <Loader2 size={12} className="animate-spin" /> : <><DollarSign size={11} /> تحليل</>}
                </button>
            </div>

            <div className="p-4">
                {suggestions.length > 0 ? (
                    <>
                        <div className="flex items-center gap-1.5 mb-3 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg w-fit">
                            <Database size={9} className="text-emerald-500" />
                            <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400">مصدر: بيانات النظام الحية</span>
                            {timestamp && <span className="text-[7px] text-emerald-400">• {timestamp}</span>}
                        </div>
                        <div className="space-y-2">
                            {suggestions.map((tip, i) => (
                                <div key={i} className="flex items-start gap-2 p-2.5 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-xl border border-emerald-100/30 dark:border-emerald-900/10">
                                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                                    <p className="text-[11px] font-medium text-gray-700 dark:text-slate-300 leading-relaxed">{tip}</p>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-6">
                        <TrendingUp size={28} className="mx-auto mb-2 text-gray-200 dark:text-slate-700" />
                        <p className="text-[10px] font-bold text-gray-400">اضغط "تحليل" — مبني على أرقامك الحقيقية فقط</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfitOptimizer;
