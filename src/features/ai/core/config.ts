/**
 * AI Module - Configuration
 * Model selection, provider settings, and API key management.
 */

export const AI_MODELS = [
    { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro (عالي الجودة)' },
    { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash (سريع)' },
    { id: 'openai/gpt-4o', name: 'GPT-4o' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' }
] as const;

export function getActiveProvider(): string {
    return 'openrouter';
}

export function getActiveModel(): string {
    return localStorage.getItem('ai_model') || 'google/gemini-2.5-flash';
}

export function setActiveModel(modelId: string) {
    localStorage.setItem('ai_model', modelId);
}

export function getApiKey(): string | null {
    return import.meta.env.VITE_OPENROUTER_API_KEY || localStorage.getItem('openrouter_key') || null;
}
