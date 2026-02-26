
import { generateAIContent } from './aiProvider';
import { supabase } from '../../lib/supabaseClient';
import { partiesService } from '../parties/service';
import { inventoryService } from '../inventory/service';

// Types for AI-executable actions
export interface AIAction {
    action: string;
    params: Record<string, any>;
    confirmation: string;
}

// Execute an action returned by AI
export async function executeAIAction(action: AIAction, companyId: string, userId: string): Promise<string> {
    try {
        switch (action.action) {
            case 'add_customer':
                await partiesService.saveParty(companyId, {
                    name: action.params.name,
                    type: 'customer',
                    phone: action.params.phone || '',
                    address: action.params.address || '',
                    status: 'active',
                    category: action.params.category || 'عام',
                });
                return `✅ تم إضافة العميل "${action.params.name}" بنجاح`;

            case 'add_supplier':
                await partiesService.saveParty(companyId, {
                    name: action.params.name,
                    type: 'supplier',
                    phone: action.params.phone || '',
                    address: action.params.address || '',
                    status: 'active',
                    category: action.params.category || 'عام',
                });
                return `✅ تم إضافة المورد "${action.params.name}" بنجاح`;

            case 'add_product':
                await inventoryService.createProduct({
                    name: action.params.name,
                    sku: action.params.sku || '',
                    barcode: action.params.barcode || '',
                    category: action.params.category || 'عام',
                    purchase_price: action.params.purchase_price || 0,
                    selling_price: action.params.selling_price || 0,
                    min_stock: action.params.min_stock || 5,
                } as any, companyId, userId);
                return `✅ تم إضافة المنتج "${action.params.name}" بنجاح`;

            case 'add_currency': {
                const { error } = await (supabase.from('currencies') as any).insert({
                    company_id: companyId,
                    code: action.params.code,
                    name: action.params.name,
                    symbol: action.params.symbol || action.params.code,
                });
                if (error) throw error;
                return `✅ تم إضافة العملة "${action.params.name}" (${action.params.code}) بنجاح`;
            }

            case 'update_exchange_rate': {
                const { error } = await (supabase.from('exchange_rates') as any).insert({
                    company_id: companyId,
                    currency_code: action.params.currency_code,
                    rate: action.params.rate,
                    effective_date: new Date().toISOString().split('T')[0],
                });
                if (error) throw error;
                return `✅ تم تحديث سعر صرف ${action.params.currency_code} إلى ${action.params.rate}`;
            }

            case 'add_account': {
                const { error } = await (supabase.from('accounts') as any).insert({
                    company_id: companyId,
                    code: action.params.code,
                    name: action.params.name,
                    type: action.params.type || 'asset',
                    parent_id: action.params.parent_id || null,
                });
                if (error) throw error;
                return `✅ تم إضافة الحساب "${action.params.name}" (${action.params.code}) بنجاح`;
            }

            case 'add_cash_box': {
                const { error } = await (supabase.from('accounts') as any).insert({
                    company_id: companyId,
                    code: action.params.code || `CB-${Date.now()}`,
                    name: action.params.name,
                    type: 'asset',
                    account_group: 'cash',
                });
                if (error) throw error;
                return `✅ تم إضافة الصندوق "${action.params.name}" بنجاح`;
            }

            case 'add_exchange_company': {
                const { error } = await (supabase.from('accounts') as any).insert({
                    company_id: companyId,
                    code: action.params.code || `EX-${Date.now()}`,
                    name: action.params.name,
                    type: 'asset',
                    account_group: 'exchange',
                });
                if (error) throw error;
                return `✅ تم إضافة الصرافة "${action.params.name}" بنجاح`;
            }

            case 'toggle_theme': {
                const root = document.documentElement;
                const isDark = root.classList.contains('dark');
                if (isDark) {
                    root.classList.remove('dark');
                    localStorage.setItem('theme', 'light');
                } else {
                    root.classList.add('dark');
                    localStorage.setItem('theme', 'dark');
                }
                return `✅ تم تغيير الثيم إلى ${isDark ? 'الوضع الفاتح ☀️' : 'الوضع الداكن 🌙'}`;
            }

            default:
                return `⚠️ الإجراء "${action.action}" غير مدعوم حالياً`;
        }
    } catch (error: unknown) {
        const err = error as Error;
        return `❌ فشل تنفيذ الإجراء: ${err.message || 'خطأ غير معروف'}`;
    }
}

// Parse AI response for action blocks
export function parseActions(aiResponse: string): { text: string; actions: AIAction[] } {
    const actionRegex = /\[ACTION\]([\s\S]*?)\[\/ACTION\]/g;
    const actions: AIAction[] = [];
    let text = aiResponse;

    let match;
    while ((match = actionRegex.exec(aiResponse)) !== null) {
        try {
            const parsed = JSON.parse(match[1].trim());
            actions.push(parsed);
            text = text.replace(match[0], '');
        } catch {
            // Ignore malformed action blocks
        }
    }

    return { text: text.trim(), actions };
}
