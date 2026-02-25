
import React, { useState } from 'react';
import { Lightbulb, Loader2, Target, Database } from 'lucide-react';
import { generateAIContent } from '../aiProvider';
import { STRICT_DATA_RULES, STRICT_SYSTEM_ROLE, buildRealDataContext } from '../strictPrompts';

interface Props {
    data: any;
}

const StrategicAdvisor: React.FC<Props> = ({ data }) => {
    const [advice, setAdvice] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [timestamp, setTimestamp] = useState('');

    const getAdvice = async () => {
        setIsLoading(true);
        try {
            const realData = buildRealDataContext(data);

            const result = await generateAIContent(
                `${realData}\n\n${STRICT_DATA_RULES}\n\nبناءً على البيانات الحقيقية أعلاه فقط:\n1. قدم 5 توصيات استراتيجية مبنية حصرياً على الأرقام المقدمة\n2. لكل توصية: إيموجي + العنوان + شرح مختصر مع ذكر الأرقام الحقيقية\n3. إذا كانت أي بيانات ناقصة أو صفرية، لا تتجاهلها — اذكر أنها غير متوفرة\n4. كن صريحاً — إذا الوضع سيء قلها بوضوح`,
                STRICT_SYSTEM_ROLE,
                { temperature: 0.2 }
            );
            setAdvice(result.split('\n').filter((l: string) => l.trim().length > 5));
            setTimestamp(new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }));
        } catch {
            setAdvice(['⚠️ تعذر الحصول على التوصيات — حاول مجدداً']);
        }
        setIsLoading(false);
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Lightbulb size={16} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-gray-800 dark:text-white">المستشار الاستراتيجي</h3>
                        <p className="text-[8px] text-gray-400 font-bold">تحليل مبني على بيانات النظام الحقيقية</p>
                    </div>
                </div>
                <button onClick={getAdvice} disabled={isLoading}
                    className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-[10px] font-black hover:opacity-90 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-1"
                >
                    {isLoading ? <Loader2 size={12} className="animate-spin" /> : <><Target size={11} /> تحليل</>}
                </button>
            </div>

            <div className="p-4">
                {advice.length > 0 ? (
                    <>
                        {/* Data source badge */}
                        <div className="flex items-center gap-1.5 mb-3 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg w-fit">
                            <Database size={9} className="text-emerald-500" />
                            <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400">مصدر: بيانات النظام الحية</span>
                            {timestamp && <span className="text-[7px] text-emerald-400">• {timestamp}</span>}
                        </div>
                        <div className="space-y-2">
                            {advice.map((tip, i) => (
                                <div key={i} className="flex items-start gap-2 p-2.5 bg-amber-50/50 dark:bg-amber-950/10 rounded-xl border border-amber-100/30 dark:border-amber-900/10">
                                    <span className="text-[10px] font-black text-amber-500 bg-amber-100 dark:bg-amber-900/30 w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                                    <p className="text-[11px] font-medium text-gray-700 dark:text-slate-300 leading-relaxed">{tip}</p>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-6">
                        <Lightbulb size={28} className="mx-auto mb-2 text-gray-200 dark:text-slate-700" />
                        <p className="text-[10px] font-bold text-gray-400">اضغط "تحليل" — النتائج مبنية على بيانات نظامك الحقيقية فقط</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StrategicAdvisor;
