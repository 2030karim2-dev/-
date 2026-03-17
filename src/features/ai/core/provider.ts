/**
 * AI Module - Provider (OpenRouter API client)
 * Handles communication with the AI model API.
 */
import { STRICT_SYSTEM_ROLE } from './prompts';
import { getActiveModel, getApiKey } from './config';

export async function generateAIContent(
    prompt: string,
    systemInstruction: string = STRICT_SYSTEM_ROLE,
    options?: { jsonMode?: boolean; temperature?: number }
): Promise<string> {
    const apiKey = getApiKey();

    if (!apiKey) {
        throw new Error('يرجى إضافة مفتاح واجهة المبرمجين لـ OpenRouter في الإعدادات (VITE_OPENROUTER_API_KEY) لتشغيل المساعد الذكي.');
    }

    const isJson = options?.jsonMode ?? true;
    
    const finalSystemInstruction = isJson 
        ? `${systemInstruction}\n\nيجب أن يكون الرد بصيغة JSON صالحة ومحاطة بعلامات \`\`\`json ... \`\`\`.`
        : systemInstruction;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'ERP Assistant'
        },
        body: JSON.stringify({
            model: getActiveModel(),
            messages: [
                { role: 'system', content: finalSystemInstruction },
                { role: 'user', content: prompt }
            ],
            temperature: options?.temperature ?? 0.1,
            max_tokens: 1500
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Failed to generate AI content: ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}
