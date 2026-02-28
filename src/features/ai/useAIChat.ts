
import { useState, useCallback, useEffect } from 'react';
import { ChatMessage, sendChatMessage } from './chatService';
import { parseActions, executeAIAction } from './aiActions';
import { useProfitAndLoss, useDebtReport, useCashFlow } from '../reports/hooks';
import { useProducts } from '../inventory/hooks';
import { partiesService } from '../parties/service';
import { useAuthStore } from '../auth/store';
import { formatCurrency } from '../../core/utils';
import { memoryService, MemoryEntry } from './memoryService';

export const useAIChat = (options: { enabled?: boolean } = {}) => {
    const isEnabled = options.enabled !== false;
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [memories, setMemories] = useState<MemoryEntry[]>([]);
    const [partiesContext, setPartiesContext] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { user } = useAuthStore();
    const { data: pl } = useProfitAndLoss({ enabled: isEnabled });
    const { data: debt } = useDebtReport({ enabled: isEnabled });
    const { data: cashFlow } = useCashFlow({ enabled: isEnabled });
    const { stats } = useProducts('', { enabled: isEnabled });

    // Load memories and parties on mount
    useEffect(() => {
        if (user?.company_id && user?.id) {
            memoryService.getMemories(user.company_id, user.id).then(m => setMemories(m));

            // Fetch basic party stats for context
            Promise.all([
                partiesService.getParties(user.company_id, 'customer'),
                partiesService.getParties(user.company_id, 'supplier')
            ]).then(([customers, suppliers]) => {
                const topC = customers.slice(0, 3).map(c => c.name).join(', ');
                const topS = suppliers.slice(0, 3).map(s => s.name).join(', ');
                setPartiesContext(`إجمالي العملاء: ${customers.length} (أبرزهم: ${topC || 'لا يوجد'})\nإجمالي الموردين: ${suppliers.length} (أبرزهم: ${topS || 'لا يوجد'})`);
            }).catch(e => console.error("Failed to load parties context", e));
        }
    }, [user?.company_id, user?.id]);

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

        if (partiesContext) {
            parts.push(partiesContext);
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
            const memoryCtx = memoryService.buildMemoryContext(memories);
            const response = await sendChatMessage(text.trim(), context, messages, memoryCtx);

            // Parse response for actions
            const { text: cleanText, actions } = parseActions(response);

            // Check if response indicates a user preference (simple heuristic)
            if (user?.company_id && user?.id && cleanText.includes('تم حفظ هذا التفضيل')) {
                await memoryService.savePreference(user.company_id, user.id, text.trim());
                // Refresh memories
                const updatedMemories = await memoryService.getMemories(user.company_id, user.id);
                setMemories(updatedMemories);
            }

            // Execute auto-actions immediately, keep transactional ones pending
            const actionResults: string[] = [];
            const pendingActions = [];
            const AUTO_EXECUTE = ['search_product', 'navigate_to', 'toggle_theme'];

            for (const action of actions) {
                if (AUTO_EXECUTE.includes(action.action)) {
                    if (user?.company_id) {
                        const result = await executeAIAction(action, user.company_id, user.id || '');
                        actionResults.push(result);
                    }
                } else {
                    pendingActions.push(action);
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
                pendingActions: pendingActions.length > 0 ? pendingActions : undefined,
            };

            setMessages(prev => [...prev, assistantMsg]);
        } catch (e: unknown) {
            const error = e as Error;
            setError(error.message || 'حدث خطأ في الاتصال بالذكاء الاصطناعي');
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, buildContext, messages, user, memories]);

    const executePendingAction = useCallback(async (messageId: string, actionIndex: number) => {
        const msg = messages.find(m => m.id === messageId);
        if (!msg || !msg.pendingActions || !msg.pendingActions[actionIndex] || isLoading || !user?.company_id) return;

        const actionToRun = msg.pendingActions[actionIndex];
        setIsLoading(true);
        setError(null);

        try {
            const result = await executeAIAction(actionToRun, user.company_id, user.id || '');

            setMessages(prev => prev.map(m => {
                if (m.id === messageId) {
                    const newPending = [...(m.pendingActions || [])];
                    newPending.splice(actionIndex, 1);
                    return {
                        ...m,
                        pendingActions: newPending.length > 0 ? newPending : undefined,
                        content: m.content + '\n\n' + result
                    };
                }
                return m;
            }));
        } catch (e: unknown) {
            const err = e as Error;
            setError(err.message || 'فشل تنفيذ الإجراء');
        } finally {
            setIsLoading(false);
        }
    }, [messages, user, isLoading]);

    const cancelPendingAction = useCallback((messageId: string, actionIndex: number) => {
        setMessages(prev => prev.map(m => {
            if (m.id === messageId) {
                const newPending = [...(m.pendingActions || [])];
                const canceledAction = newPending.splice(actionIndex, 1)[0];
                return {
                    ...m,
                    pendingActions: newPending.length > 0 ? newPending : undefined,
                    content: m.content + `\n\n❌ تم إلغاء: ${canceledAction.confirmation || canceledAction.action}`
                };
            }
            return m;
        }));
    }, []);

    const clearChat = useCallback(async () => {
        if (messages.length > 0 && user?.company_id && user?.id) {
            // Background summarize and store before clearing
            memoryService.summarizeAndStore(user.company_id, user.id, messages).then(() => {
                memoryService.getMemories(user!.company_id!, user!.id!).then(m => setMemories(m));
            });
        }
        setMessages([]);
        setError(null);
    }, [messages, user]);

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        clearChat,
        executePendingAction,
        cancelPendingAction
    };
};
