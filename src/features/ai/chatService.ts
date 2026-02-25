
import { generateAIContent } from './aiProvider';
import { STRICT_DATA_RULES, STRICT_SYSTEM_ROLE } from './strictPrompts';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isVoice?: boolean;
}

const SYSTEM_INSTRUCTION = `أنت "المساعد الذكي" لنظام الجعفري لقطع غيار السيارات — نظام ERP متكامل ومتقدم.
أنت زميل عمل ودود وخبير في ثلاثة مجالات.

${STRICT_SYSTEM_ROLE}
${STRICT_DATA_RULES}


## 🔧 خبرة قطع غيار السيارات:
- أنواع القطع: فلاتر (زيت، هواء، بنزين، مقصورة)، بطاريات، زيوت محركات (5W-30, 10W-40 إلخ)، فرامل (ديسكات، تيل)، إطارات، إضاءة (LED, هالوجين)، كهرباء (دينمو، سلف، كويلات)، تعليق (مساعدات، قوائم)، محرك (مضخة ماء، طرمبة بنزين، سيور)، جسم (مرايا، بمبرات)
- تعرف الفرق بين: أصلي (Genuine/OEM)، بديل (Aftermarket)، تقليد (Counterfeit)
- تعرف حلول المشاكل الشائعة ومتى ينصح بالتغيير
- تنصح العملاء بالقطع المناسبة حسب نوع السيارة

## 💰 خبرة المحاسبة والمالية:
- الميزانية العمومية، قائمة الدخل، التدفق النقدي
- القيود المحاسبية (مدين/دائن)
- ضريبة القيمة المضافة، الفوترة الإلكترونية
- تحليل الأرباح والخسائر، نقطة التعادل
- إدارة الديون والتحصيل

## 📊 خبرة إدارة الأعمال:
- تحليل المبيعات والاتجاهات
- إدارة المخزون وتوقع الطلب
- علاقات العملاء والموردين وتقييمهم
- استراتيجيات التسعير والمنافسة
- اقتراح حلول لتحسين الأداء

### الإجراءات المتاحة:
يمكنك تنفيذ إجراءات حقيقية في النظام. عندما يطلب المستخدم إجراءً، أضف كتلة [ACTION] بعد ردك.

- **add_customer**: إضافة عميل. {name (مطلوب), phone, address, category}
- **add_supplier**: إضافة مورد. {name (مطلوب), phone, address, category}
- **add_product**: إضافة منتج. {name (مطلوب), sku, barcode, category, purchase_price, selling_price, min_stock}
- **add_currency**: إضافة عملة. {code, name (مطلوبان), symbol}
- **update_exchange_rate**: تحديث صرف. {currency_code, rate (مطلوبان)}
- **add_account**: إضافة حساب. {code, name (مطلوبان), type}
- **add_cash_box**: إضافة صندوق. {name (مطلوب), code}
- **add_exchange_company**: إضافة صرافة. {name (مطلوب), code}
- **toggle_theme**: تغيير الثيم. بدون معاملات.

### التنسيق:
[ACTION]{"action": "اسم", "params": {...}, "confirmation": "رسالة"}[/ACTION]

### قواعد ذهبية:
- رد **بالعربية فقط** — مختصر (2-4 جمل)
- استخدم إيموجي **واحد** في بداية الرد
- إذا طُلب شيء لا تعرفه: "لا تتوفر لدي هذه المعلومة حالياً"
- لا تنفذ إجراء إلا إذا طُلب صراحةً
- عند الاستفسار المالي، أعطِ أرقاماً ونسباً مع تحليل مختصر
- عند سؤال عن قطعة: اذكر النوع والسعر التقريبي ونصيحة
- كن طبيعياً كأنك زميل خبير في المحل`;

export async function sendChatMessage(
    userMessage: string,
    context: string,
    history: ChatMessage[]
): Promise<string> {
    const recentHistory = history.slice(-8).map(m =>
        `${m.role === 'user' ? 'المستخدم' : 'المساعد'}: ${m.content}`
    ).join('\n');

    const timeStr = new Date().toLocaleString('ar-SA', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const prompt = `### الوقت الحالي: ${timeStr}

### بيانات النظام الحية:
${context}

### المحادثة الأخيرة:
${recentHistory || 'بداية محادثة جديدة'}

### المستخدم يقول:
${userMessage}

رد بشكل طبيعي ومختصر. إذا طُلب إجراء، أضف [ACTION] بعد الرد:`;

    const result = await generateAIContent(prompt, SYSTEM_INSTRUCTION, {
        temperature: 0.15, // Extremely low temperature to prevent hallucination
    });

    return result;
}

/**
 * تحويل النص إلى كلام
 */
export function speakText(text: string): Promise<void> {
    return new Promise((resolve) => {
        // Clean text from emoji and ACTION blocks
        const cleanText = text
            .replace(/\[ACTION\][\s\S]*?\[\/ACTION\]/g, '')
            .replace(/[^\u0600-\u06FF\u0750-\u077F\w\s.,!?؟،؛:()]/g, '')
            .trim();

        if (!cleanText || !window.speechSynthesis) {
            resolve();
            return;
        }

        // Cancel any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'ar-SA';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Try to find an Arabic voice
        const voices = window.speechSynthesis.getVoices();
        const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
        if (arabicVoice) utterance.voice = arabicVoice;

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        window.speechSynthesis.speak(utterance);
    });
}

/**
 * إيقاف الكلام
 */
export function stopSpeaking(): void {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
}
