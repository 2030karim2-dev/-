/**
 * AI Module - Provider (OpenRouter API client)
 * Handles communication with the AI model API.
 */
import { STRICT_SYSTEM_ROLE } from './prompts';
import { getActiveModel } from './config';
import { supabase } from '../../../lib/supabaseClient';

export async function generateAIContent(
    prompt: string,
    systemInstruction: string = STRICT_SYSTEM_ROLE,
    options?: { jsonMode?: boolean; temperature?: number; maxTokens?: number }
): Promise<string> {
    const isJson = options?.jsonMode ?? true;
    
    const finalSystemInstruction = isJson 
        ? `${systemInstruction}\n\nيجب أن يكون الرد بصيغة JSON صالحة وحصرية.`
        : systemInstruction;

    const { data, error } = await supabase.functions.invoke<{ choices: { message: { content: string } }[] }>('ai-proxy', {
        body: {
            prompt,
            model: getActiveModel(),
            systemInstruction: finalSystemInstruction,
            temperature: options?.temperature ?? 0.1,
            maxTokens: options?.maxTokens ?? 1500,
            jsonMode: isJson
        }
    });

    if (error) {
        console.error('AI Proxy Error:', error);
        const errorMessage = (error as { message?: string }).message ?? '';
        if (errorMessage.includes('402')) {
            throw new Error('رصيد OpenRouter غير كافٍ لإتمام هذه العملية. يرجى شحن الرصيد أو تقليل عدد النصوص المطلوبة.');
        }
        throw new Error(`تعذر الاتصال بالمساعد الذكي: ${errorMessage}`);
    }

    // Edge Function returns the full OpenRouter response
    return data?.choices?.[0]?.message?.content ?? '';
}
