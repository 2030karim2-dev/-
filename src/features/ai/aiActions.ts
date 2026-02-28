
import { generateAIContent } from './aiProvider';
import { supabase } from '../../lib/supabaseClient';
import { partiesService } from '../parties/service';
import { inventoryService } from '../inventory/service';
import { expensesService } from '../expenses/service';
import { bondsService } from '../bonds/service';
import { salesService } from '../sales/service';

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
            // ==========================================
            // الأساسيات (Parties)
            // ==========================================
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
                const prodTitle = action.params.name;
                const price = action.params.selling_price || 0;
                await inventoryService.createProduct({
                    name: prodTitle,
                    sku: action.params.sku || '',
                    barcode: action.params.barcode || '',
                    category_id: null,
                    purchase_price: action.params.purchase_price || 0,
                    selling_price: price,
                    min_stock: action.params.min_stock || 1,
                    can_be_sold: true,
                    can_be_purchased: true,
                    type: 'product',
                    unit: 'حبة'
                } as any, companyId, userId);
                return `✅ تم إضافة المنتج "${prodTitle}"${price > 0 ? ` بسعر ${price} ريال` : ''} بنجاح`;

            case 'search_product':
                const q = action.params.query || action.params.name;
                const prods = await inventoryService.searchProducts(companyId, q);
                if (!prods || prods.length === 0) return `❌ لم أجد منتجات تطابق "${q}"`;
                const topP = prods.slice(0, 3).map((p: any) => `- ${p.name}: متوفر ${p.total_stock} (سعر البيع: ${p.selling_price})`).join('\n');
                return `🔍 نتائج البحث (أفضل 3):\n${topP}`;

            // ==========================================
            // المحاسبة والمالية (Financial)
            // ==========================================
            case 'create_expense':
                if (!action.params.amount || !action.params.description) throw new Error("المبلغ والوصف مطلوبان للمصروف");
                await expensesService.processNewExpense({
                    category_id: action.params.category_id || '', // AI might not know ID, fallback to general
                    description: action.params.description,
                    amount: action.params.amount,
                    currency_code: action.params.currency_code || 'YER',
                    exchange_rate: action.params.exchange_rate || 1,
                    expense_date: new Date().toISOString(),
                    status: 'posted',
                    payment_method: 'cash',
                    is_recurring: false
                } as any, companyId, userId);
                return `💸 تم قيد المصروف "${action.params.description}" بمبلغ ${action.params.amount}`;

            case 'create_bond_payment':
                if (!action.params.amount || !action.params.party_name) throw new Error("المبلغ واسم المستفيد مطلوبان لسند الصرف");

                // البحث عن المستفيد
                const payParties = await partiesService.search(companyId, 'supplier', action.params.party_name);
                let payPartyId = payParties[0]?.id;

                if (!payPartyId) {
                    const custParties = await partiesService.search(companyId, 'customer', action.params.party_name);
                    payPartyId = custParties[0]?.id;
                }

                if (!payPartyId) return `❌ لم أتمكن من العثور على عميل أو مورد باسم "${action.params.party_name}"`;

                await bondsService.createBond(companyId, userId, {
                    type: 'payment',
                    amount: action.params.amount,
                    currency_code: action.params.currency_code || 'YER',
                    exchange_rate: action.params.exchange_rate || 1,
                    date: new Date().toISOString(),
                    payment_method: 'cash',
                    cash_account_id: '', // سيتم تعيينه تلقائياً بالخلفية
                    counterparty_type: 'party',
                    counterparty_id: payPartyId,
                    description: action.params.description || `سداد بالذكاء الاصطناعي ${action.params.party_name}`
                } as any);
                return `📝 تم إنشاء سند صرف بمبلغ ${action.params.amount} للمستفيد ${action.params.party_name}`;

            case 'create_bond_receipt':
                if (!action.params.amount || !action.params.party_name) throw new Error("المبلغ واسم الدافع مطلوبان لسند القبض");

                // البحث عن الدافع
                const recParties = await partiesService.search(companyId, 'customer', action.params.party_name);
                let recPartyId = recParties[0]?.id;

                if (!recPartyId) {
                    const supParties = await partiesService.search(companyId, 'supplier', action.params.party_name);
                    recPartyId = supParties[0]?.id;
                }

                if (!recPartyId) return `❌ لم أتمكن من العثور على عميل أو مورد باسم "${action.params.party_name}"`;

                await bondsService.createBond(companyId, userId, {
                    type: 'receipt',
                    amount: action.params.amount,
                    currency_code: action.params.currency_code || 'YER',
                    exchange_rate: action.params.exchange_rate || 1,
                    date: new Date().toISOString(),
                    payment_method: 'cash',
                    cash_account_id: '',
                    counterparty_type: 'party',
                    counterparty_id: recPartyId,
                    description: action.params.description || `قبض بالذكاء الاصطناعي من ${action.params.party_name}`
                } as any);
                return `📝 تم إنشاء سند قبض بمبلغ ${action.params.amount} من ${action.params.party_name}`;

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

            // ==========================================
            // واجهة المستخدم وإجراءات أخرى
            // ==========================================
            case 'navigate_to':
                const path = action.params.page;
                if (path) {
                    window.location.hash = `#/${path}`;
                    // Toggle Sidebar off if on mobile
                    return `🔗 جاري الانتقال إلى صفحة ${path}...`;
                }
                return `❌ لم يتم تحديد الصفحة`;

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
