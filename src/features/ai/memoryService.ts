/**
 * خدمة ذاكرة المساعد الذكي
 * تحفظ وتسترجع ذكريات المساعد من Supabase
 */

import { supabase } from '../../lib/supabaseClient';
import { generateAIContent } from './aiProvider';

export interface MemoryEntry {
    id?: string;
    key: string;
    content: string;
    updated_at?: string;
}

export const memoryService = {
    /**
     * حفظ أو تحديث ذاكرة
     */
    saveMemory: async (_companyId: string, _userId: string, _key: string, _content: string): Promise<void> => {
        // Table doesn't exist yet, silently return to avoid 404 console errors
        return;
        /*
        try {
            const { error } = await (supabase.from('ai_chat_memory') as any)
                .upsert(
                    {
                        company_id: companyId,
                        user_id: userId,
                        key,
                        content,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'company_id,user_id,key' }
                );
            if (error) {
                console.warn('[MemoryService] Failed to save memory:', error.message);
            }
        } catch (e) {
            console.warn('[MemoryService] saveMemory error:', e);
        }
        */
    },

    /**
     * جلب جميع الذكريات
     */
    getMemories: async (_companyId: string, _userId: string): Promise<MemoryEntry[]> => {
        // Table doesn't exist yet, silently return empty array to avoid 404 console errors
        return [];
        /*
        try {
            const { data, error } = await (supabase.from('ai_chat_memory') as any)
                .select('key, content, updated_at')
                .eq('company_id', companyId)
                .eq('user_id', userId)
                .order('updated_at', { ascending: false })
                .limit(20);

            if (error) {
                console.warn('[MemoryService] Failed to get memories:', error.message);
                return [];
            }
            return (data || []) as MemoryEntry[];
        } catch (e) {
            console.warn('[MemoryService] getMemories error:', e);
            return [];
        }
        */
    },

    /**
     * تلخيص محادثة وحفظها كذاكرة
     */
    summarizeAndStore: async (
        companyId: string,
        userId: string,
        messages: { role: string; content: string }[]
    ): Promise<void> => {
        if (messages.length < 4) return; // لا تحفظ محادثات قصيرة جداً

        try {
            const conversation = messages
                .map(m => `${m.role === 'user' ? 'المستخدم' : 'المساعد'}: ${m.content}`)
                .join('\n');

            const prompt = `لخص هذه المحادثة في 2-3 جمل مختصرة جداً. ركز على:
- ما طلبه المستخدم
- أي تفضيلات أو معلومات مهمة ذُكرت
- أي إجراءات تم تنفيذها

المحادثة:
${conversation}

اكتب الملخص فقط بدون مقدمة.`;

            const summary = await generateAIContent(prompt, 'أنت مساعد تلخيص. لخص بإيجاز شديد.', {
                temperature: 0.1,
            });

            if (summary && summary.trim().length > 10) {
                const timestamp = new Date().toLocaleDateString('ar-SA');
                const key = `conversation_${Date.now()}`;
                await memoryService.saveMemory(companyId, userId, key, `[${timestamp}] ${summary.trim()}`);
            }
        } catch (e) {
            console.warn('[MemoryService] summarizeAndStore error:', e);
        }
    },

    /**
     * حفظ تفضيل مستخدم (يُستدعى عند اكتشاف تفضيل في المحادثة)
     */
    savePreference: async (companyId: string, userId: string, preference: string): Promise<void> => {
        try {
            // جلب التفضيلات الحالية
            const { data } = await supabase.from('ai_chat_memory' as any)
                .select('content')
                .eq('company_id', companyId)
                .eq('user_id', userId)
                .eq('key', 'user_preferences')
                .single() as any;

            const existingPrefs = data?.content || '';
            const newContent = existingPrefs
                ? `${existingPrefs}\n- ${preference}`
                : `- ${preference}`;

            await memoryService.saveMemory(companyId, userId, 'user_preferences', newContent);
        } catch (e) {
            console.warn('[MemoryService] savePreference error:', e);
        }
    },

    /**
     * حذف ذاكرة محددة
     */
    deleteMemory: async (companyId: string, userId: string, key: string): Promise<void> => {
        try {
            await supabase.from('ai_chat_memory' as any)
                .delete()
                .eq('company_id', companyId)
                .eq('user_id', userId)
                .eq('key', key);
        } catch (e) {
            console.warn('[MemoryService] deleteMemory error:', e);
        }
    },

    /**
     * بناء سياق الذاكرة لإرفاقه مع المحادثة
     */
    buildMemoryContext: (memories: MemoryEntry[]): string => {
        if (!memories || memories.length === 0) return '';

        const parts: string[] = ['### 🧠 ذاكرة المساعد (من محادثات سابقة):'];

        // تفضيلات المستخدم أولاً
        const prefs = memories.find(m => m.key === 'user_preferences');
        if (prefs) {
            parts.push(`تفضيلات المستخدم:\n${prefs.content}`);
        }

        // آخر 5 ملخصات محادثات
        const conversations = memories
            .filter(m => m.key.startsWith('conversation_'))
            .slice(0, 5);

        if (conversations.length > 0) {
            parts.push('ملخصات محادثات سابقة:');
            conversations.forEach(c => {
                parts.push(`  • ${c.content}`);
            });
        }

        return parts.join('\n');
    },
};
