import { supabase } from '../../../lib/supabaseClient';

export const migrateCashboxBalances = async (companyId: string) => {
    // 1. Get Main Cashbox
    const { data: mainCashbox, error: err1 } = await supabase
        .from('accounts')
        .select('*')
        .eq('company_id', companyId)
        .eq('code', '1010')
        .single() as { data: any, error: any };

    if (err1 || !mainCashbox) throw new Error("لم يتم العثور على الصندوق الرئيسي");

    // 2. Get SAR Sub-Cashbox
    const { data: sarCashbox, error: err2 } = await supabase
        .from('accounts')
        .select('*')
        .eq('company_id', companyId)
        .eq('parent_id', mainCashbox.id)
        .eq('currency_code', 'SAR')
        .single() as { data: any, error: any };

    if (err2 || !sarCashbox) throw new Error("لم يتم العثور على صندوق الكاش السعودي. قم بتقسيم الصندوق أولاً.");

    if (mainCashbox.balance === 0 || mainCashbox.balance === null) {
        return { message: "لا يوجد رصيد لنقله في الصندوق الرئيسي." };
    }

    // 3. Move all Journal Entry Lines from Main Cashbox -> SAR Cashbox
    const { error: updateErr } = await (supabase
        .from('journal_entry_lines') as any)
        .update({ account_id: sarCashbox.id })
        .eq('account_id', mainCashbox.id);

    if (updateErr) throw new Error("فشل في تحويل القيود المحاسبية للصندوق الجديد");

    // 4. Zero out the parent and transfer its numeric balance (just for UI display correctness if not trigger-based)
    const { error: balanceUpdateErr } = await (supabase
        .from('accounts') as any)
        .update({ balance: mainCashbox.balance })
        .eq('id', sarCashbox.id);

    const { error: resetParentErr } = await (supabase
        .from('accounts') as any)
        .update({ balance: 0 })
        .eq('id', mainCashbox.id);

    if (balanceUpdateErr || resetParentErr) throw new Error("فشل في تحديث الأرصدة الرقمية");

    return { message: "تم نقل الأرصدة السابقة إلى صندوق الكاش السعودي بنجاح." };
};
