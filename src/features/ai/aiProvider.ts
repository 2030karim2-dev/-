export async function generateAIContent(
    _prompt: string,
    _systemInstruction: string,
    _options?: { jsonMode?: boolean; temperature?: number }
): Promise<string> {
    return '';
}

export function getActiveProvider(): string {
    return 'openrouter';
}

export function getActiveModel(): string {
    return '';
}

export function setActiveModel(_modelId: string) {
    // No-op
}

export const AI_MODELS: any[] = [];
