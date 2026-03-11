
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isVoice?: boolean | undefined;
}

export async function sendChatMessage(
    _userMessage: string,
    _context: string,
    _history: ChatMessage[],
    _memoryContext: string = ''
): Promise<string> {
    return "المساعد الذكي قيد البناء حالياً. يرجى الانتظار لحين الانتهاء من برمجته.";
}

export function speakText(_text: string): Promise<void> {
    return new Promise((resolve) => resolve());
}

export function stopSpeaking(): void {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
}
