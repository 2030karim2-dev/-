import { useState, useCallback } from 'react';
import { ChatMessage, sendChatMessage } from './chatService';

export const useAIChat = (_options: { enabled?: boolean } = {}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: text.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);
        setError(null);

        try {
            const response = await sendChatMessage(text.trim(), '', messages, '');

            const assistantMsg: ChatMessage = {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMsg]);
        } catch (e: unknown) {
            const error = e as Error;
            setError(error.message || 'حدث خطأ في الاتصال بالذكاء الاصطناعي');
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, messages]);

    const executePendingAction = useCallback(async (_messageId: string, _actionIndex: number) => {
        // Obsolete
    }, []);

    const cancelPendingAction = useCallback((_messageId: string, _actionIndex: number) => {
        // Obsolete
    }, []);

    const clearChat = useCallback(async () => {
        setMessages([]);
        setError(null);
    }, []);

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        clearChat,
        executePendingAction, // kept for interface compatibility with UI for now
        cancelPendingAction   // kept for interface compatibility with UI for now
    };
};
