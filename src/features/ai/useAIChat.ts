
import { useState, useCallback } from 'react';
import { ChatMessage, sendChatMessage } from './chatService';
import { parseActions, executeAIAction } from './aiActions';
import { useProfitAndLoss, useDebtReport, useCashFlow } from '../reports/hooks';
import { useProducts } from '../inventory/hooks';
import { useAuthStore } from '../auth/store';
import { formatCurrency } from '../../core/utils';

export const useAIChat = (options: { enabled?: boolean } = {}) => {
    const isEnabled = options.enabled !== false;
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { user } = useAuthStore();
    const { data: pl } = useProfitAndLoss({ enabled: isEnabled });
    const { data: debt } = useDebtReport({ enabled: isEnabled });
    const { data: cashFlow } = useCashFlow({ enabled: isEnabled });
    const { stats } = useProducts('', { enabled: isEnabled });

    const buildContext = useCallback(() => {
        const parts: string[] = [];

        if (pl) {
            parts.push(`الإيرادات: ${formatCurrency(pl.totalRevenues || 0)}`);
            parts.push(`المصروفات: ${formatCurrency(pl.totalExpenses || 0)}`);
            parts.push(`صافي الربح: ${formatCurrency(pl.netProfit || 0)}`);
        }

        if (debt?.summary) {
            parts.push(`مستحقات العملاء: ${formatCurrency(debt.summary.receivables || 0)}`);
            parts.push(`التزامات الموردين: ${formatCurrency(debt.summary.payables || 0)}`);
        }

        if (cashFlow) {
            parts.push(`السيولة النقدية: ${formatCurrency(cashFlow.currentLiquidity || 0)}`);
        }

        if (stats) {
            parts.push(`عدد المنتجات: ${stats.count || 0}`);
            parts.push(`قيمة المخزون: ${formatCurrency(stats.totalValue || 0)}`);
            parts.push(`منتجات منخفضة المخزون: ${stats.lowStockCount || 0}`);
        }

        parts.push(`التاريخ: ${new Date().toLocaleDateString('ar-SA')}`);
        parts.push(`المستخدم: ${user?.full_name || user?.email || 'غير محدد'}`);

        return parts.join('\n');
    }, [pl, debt, cashFlow, stats, user]);

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
            const context = buildContext();
            const response = await sendChatMessage(text.trim(), context, messages);

            // Parse response for actions
            const { text: cleanText, actions } = parseActions(response);

            // Execute any actions
            const actionResults: string[] = [];
            for (const action of actions) {
                if (user?.company_id) {
                    const result = await executeAIAction(action, user.company_id, user.id || '');
                    actionResults.push(result);
                }
            }

            const finalContent = actionResults.length > 0
                ? `${cleanText}\n\n${actionResults.join('\n')}`
                : cleanText;

            const assistantMsg: ChatMessage = {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: finalContent,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMsg]);
        } catch (e: any) {
            setError(e.message || 'حدث خطأ في الاتصال بالذكاء الاصطناعي');
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, buildContext, messages, user]);

    const clearChat = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    return { messages, isLoading, error, sendMessage, clearChat };
};
