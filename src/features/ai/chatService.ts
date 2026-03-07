
import { generateAIContent } from './aiProvider';
import { STRICT_DATA_RULES, STRICT_SYSTEM_ROLE } from './strictPrompts';
import { VEHICLE_KNOWLEDGE, VEHICLE_PROMPT_SECTION } from './vehicleKnowledge';
import { AIAction } from './aiActions';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isVoice?: boolean | undefined;
    pendingActions?: AIAction[] | undefined;
    actionResults?: string[] | undefined;
}

const SYSTEM_INSTRUCTION = `أنت "المساعد الذكي" لنظام الجعفري لقطع غيار السيارات — نظام ERP متكامل ومتقدم.
أنت زميل عمل ودود وخبير في ثلاثة مجالات.

${STRICT_SYSTEM_ROLE}
${STRICT_DATA_RULES}

${VEHICLE_PROMPT_SECTION}

## 💰 خبرة المحاسبة والمالية:
- الميزانية العمومية، قائمة الدخل، التدفق النقدي
- القيود المحاسبية (مدين/دائن)
- إدارة المخزون، المبيعات، والمشتريات
- تحليل الأرباح والخسائر، نقطة التعادل
- إدارة الديون والتحصيل

## 📊 خبرة إدارة الأعمال:
- تحليل المبيعات والاتجاهات
- إدارة المخزون وتوقع الطلب
- علاقات العملاء والموردين وتقييمهم
- استراتيجيات التسعير والمنافسة
- اقتراح حلول لتحسين الأداء

### الإجراءات المتاحة:
يمكنك تنفيذ إجراءات حقيقية في النظام. عندما يطلب المستخدم إجراءً، أضف كتلة [ACTION] بعد ردك. لا تنفذ معاملة إذا كان هناك معلومات مفقودة، بل اسأل عنها.

- **add_customer**: إضافة عميل. {name (مطلوب), phone, address, category}
- **add_supplier**: إضافة مورد. {name (مطلوب), phone, address, category}
- **add_product**: إضافة منتج جديد. {name, purchase_price, selling_price, min_stock}
- **search_product**: البحث عن منتج موجود والتأكد من مخزونه أو سعره. {query}
- **create_expense**: إنشاء سجل مصروف مالي. {amount, description, category_id?} - أمثلة: إيجار، رواتب، كهرباء
- **create_bond_payment**: إنشاء سند صرف مالي (دفع لمورد أو عميل). {amount, party_name, description}
- **create_bond_receipt**: إنشاء سند قبض مالي (استلام من عميل أو مورد). {amount, party_name, description}
- **navigate_to**: فتح صفحة معينة للمستخدم. {page: "inventory" | "sales" | "purchases" | "expenses" | "bonds" | "reports"}
- **add_currency**: إضافة عملة. {code, name, symbol}
- **toggle_theme**: تغيير مظهر التطبيق. بدون معاملات.

### التنسيق:
[ACTION]{"action": "اسم", "params": {...}, "confirmation": "رسالة"}[/ACTION]

### قواعد ذهبية:
- رد **بالعربية فقط** — مختصر (2-4 جمل)
- استخدم إيموجي **واحد** في بداية الرد
- افهم القصد: "كم سعر فلتر الزيت؟" ← بحث عن منتج. "صرف 500 ريال لكهرباء المحل" ← إنشاء مصروف.
- إذا طُلب شيء لا تعرفه: "لا تتوفر لدي هذه المعلومة حالياً"
- لا تنفذ إجراء إلا إذا طُلب صراحةً أو كان واضحاً من السياق، وإذا كانت البيانات ناقصة للمصروف أو السند، اطلبها.
- عند سؤال عن قطعة سيارة: استخدم قاعدة البيانات الخاصة بك لتقديم إجابة دقيقة.
- كن طبيعياً كأنك زميل خبير في المحل

${VEHICLE_KNOWLEDGE}
`;

export async function sendChatMessage(
    userMessage: string,
    context: string,
    history: ChatMessage[],
    memoryContext: string = ''
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

${memoryContext}

### المحادثة الأخيرة:
${recentHistory || 'بداية محادثة جديدة'}

### المستخدم يقول:
${userMessage}

رد بشكل طبيعي ومختصر. إذا طُلب إجراء أو كان القصد إجراءاً (مثال: بحث عن منتج أو إنشاء مصروف)، أضف [ACTION] بعد الرد:`;

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
