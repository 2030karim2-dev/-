
import React, { useState, useEffect } from 'react';
import { Sparkles, X, Lightbulb } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface PageTip {
    tip: string;
    action?: string;
}

const PAGE_TIPS: Record<string, PageTip[]> = {
    '/': [
        { tip: '💡 اضغط على "ملخص اليوم الذكي" للحصول على تحليل AI يومي لأدائك', action: 'جرب الآن' },
        { tip: '🎙️ استخدم المساعد الصوتي — اضغط الزر الأزرق في الأسفل وتكلم!' },
        { tip: '📊 توقع المبيعات بالذكاء الاصطناعي متاح في الشريط الجانبي' },
    ],
    '/sales': [
        { tip: '🔍 يمكنك فحص أي فاتورة بالذكاء الاصطناعي من زر "فحص AI" في تفاصيلها' },
        { tip: '🎙️ جرب إنشاء فاتورة بالصوت: "فاتورة لأحمد: 3 فلتر بـ 25 ريال"' },
        { tip: '💰 اقتراح التسعير الذكي يساعدك في تحديد السعر الأمثل' },
    ],
    '/inventory': [
        { tip: '📦 التنبؤ بنفاد المخزون يحسب الأيام المتبقية تلقائياً' },
        { tip: '🔧 المساعد الذكي يعرف كل أنواع قطع الغيار — اسأله!' },
    ],
    '/accounting': [
        { tip: '📝 اقتراح القيد المحاسبي بالذكاء الاصطناعي متاح عند إضافة مصروف' },
        { tip: '🧮 المساعد يفهم المحاسبة — اسأله عن أي قيد أو ميزانية' },
    ],
    '/purchases': [
        { tip: '⭐ تقييم الموردين بالذكاء الاصطناعي يساعدك في اختيار الأفضل' },
        { tip: '🛒 اقتراحات الشراء الذكية تظهر تلقائياً عند انخفاض المخزون' },
    ],
    '/ai-center': [
        { tip: '🧠 هذه صفحة مركز الذكاء الاصطناعي — كل أدوات AI في مكان واحد!' },
        { tip: '💊 ابدأ بفحص "صحة الأعمال" لمعرفة وضعك العام' },
    ],
};

const AIPageTips: React.FC = () => {
    const location = useLocation();
    const [dismissed, setDismissed] = useState<string[]>([]);
    const [tipIndex, setTipIndex] = useState(0);

    const path = location.pathname;
    const tips = PAGE_TIPS[path] || [];
    const visibleTips = tips.filter((_, i) => !dismissed.includes(`${path}-${i}`));

    // Reset tip index when page changes
    useEffect(() => {
        setTipIndex(0);
    }, [path]);

    if (visibleTips.length === 0) return null;

    const currentTip = visibleTips[tipIndex % visibleTips.length];

    return (
        <div className="fixed bottom-24 left-6 z-[9990] max-w-[320px] animate-in slide-in-from-bottom-2 duration-500">
            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-2xl p-3.5 shadow-2xl shadow-violet-600/20 border border-violet-500/30">
                <div className="flex items-start gap-2.5">
                    <div className="p-1.5 bg-white/20 rounded-xl flex-shrink-0 mt-0.5">
                        <Lightbulb size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold leading-relaxed">{currentTip.tip}</p>
                    </div>
                    <button
                        onClick={() => {
                            const realIndex = tips.indexOf(currentTip);
                            setDismissed(prev => [...prev, `${path}-${realIndex}`]);
                            setTipIndex(i => i + 1);
                        }}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                    >
                        <X size={12} />
                    </button>
                </div>
                {visibleTips.length > 1 && (
                    <div className="flex justify-center gap-1 mt-2">
                        {visibleTips.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setTipIndex(i)}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${i === tipIndex % visibleTips.length ? 'bg-white w-4' : 'bg-white/30'}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIPageTips;
