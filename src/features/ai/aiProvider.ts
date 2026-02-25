/**
 * مزود الذكاء الاصطناعي الموحد
 * يدعم: OpenRouter (DeepSeek, Claude, GPT, Gemini) + Google Gemini المباشر
 * 
 * OpenRouter يتيح الوصول لجميع النماذج من واجهة واحدة:
 *   - deepseek/deepseek-chat (مجاني/رخيص)
 *   - google/gemini-2.0-flash-001
 *   - anthropic/claude-3.5-sonnet
 *   - openai/gpt-4o-mini
 */

export type AIProvider = 'openrouter' | 'gemini';

export interface AIModel {
    id: string;
    name: string;
    provider: AIProvider;
    description: string;
}

// النماذج المتاحة
export const AI_MODELS: AIModel[] = [
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', provider: 'openrouter', description: 'سريع وذكي — مجاني/رخيص جداً' },
    { id: 'deepseek/deepseek-reasoner', name: 'DeepSeek R1', provider: 'openrouter', description: 'تحليل عميق مع تفكير متسلسل' },
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', provider: 'openrouter', description: 'سريع ودقيق من Google' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'openrouter', description: 'ممتاز للتحليل المالي' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openrouter', description: 'نموذج OpenAI السريع' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (مباشر)', provider: 'gemini', description: 'Google Gemini بدون OpenRouter' },
];

// النموذج الافتراضي
const DEFAULT_MODEL = 'deepseek/deepseek-chat';

/**
 * الحصول على المزود الحالي
 */
export function getActiveProvider(): AIProvider {
    return (import.meta.env.VITE_AI_PROVIDER as AIProvider) || 'openrouter';
}

/**
 * الحصول على النموذج المحفوظ أو الافتراضي
 */
export function getActiveModel(): string {
    const stored = localStorage.getItem('alz_ai_model');
    if (stored) return stored;
    const provider = getActiveProvider();
    return provider === 'openrouter' ? DEFAULT_MODEL : 'gemini-1.5-flash';
}

/**
 * حفظ النموذج المفضل
 */
export function setActiveModel(modelId: string) {
    localStorage.setItem('alz_ai_model', modelId);
}

/**
 * استدعاء OpenRouter API
 * متوافق مع OpenAI Chat Completions API
 */
async function callOpenRouter(
    prompt: string,
    systemInstruction: string,
    options?: { jsonMode?: boolean; temperature?: number }
): Promise<string> {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('VITE_OPENROUTER_API_KEY مفقود. أضف المفتاح في ملف .env');

    const model = getActiveModel();

    const body: any = {
        model,
        messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt },
        ],
        temperature: options?.temperature ?? 0.1,
        max_tokens: 4096,
    };

    if (options?.jsonMode) {
        body.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Al-Zahra Smart ERP',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `OpenRouter Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

/**
 * استدعاء Gemini المباشر (النسخة الأصلية)
 */
async function callGemini(
    prompt: string,
    systemInstruction: string,
    options?: { jsonMode?: boolean; temperature?: number }
): Promise<string> {
    const { GoogleGenAI } = await import('@google/genai');
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error('VITE_GEMINI_API_KEY مفقود');

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: {
            systemInstruction,
            ...(options?.jsonMode ? { responseMimeType: 'application/json' } : {}),
            temperature: options?.temperature ?? 0.1,
        }
    });

    return response.text || '';
}

/**
 * الدالة الرئيسية — توجه الطلب للمزود النشط
 */
export async function generateAIContent(
    prompt: string,
    systemInstruction: string,
    options?: { jsonMode?: boolean; temperature?: number }
): Promise<string> {
    const provider = getActiveProvider();
    const model = getActiveModel();

    // إذا المزود openrouter أو النموذج المختار من openrouter
    if (provider === 'openrouter' || AI_MODELS.find(m => m.id === model)?.provider === 'openrouter') {
        return callOpenRouter(prompt, systemInstruction, options);
    }

    return callGemini(prompt, systemInstruction, options);
}
