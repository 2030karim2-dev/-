
import { supabase } from '../../lib/supabaseClient';
import { ExpenseFormData } from './types';

export const expensesApi = {
  getExpenseCategories: async (companyId: string) => {
    const { data } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('company_id', companyId);
    return { data: data || [], error: null };
  },

  getExpensesRaw: async (companyId: string) => {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        expense_categories:category_id(name)
      `)
      .eq('company_id', companyId)
      .neq('status', 'void')
      .is('deleted_at', null)
      .order('expense_date', { ascending: false })
      .limit(1000);

    return { data, error };
  },

  // استخدام RPC الموحد v2 الذي يدعم الربط المباشر بالحسابات وتحسين الأداء
  createExpenseRPC: async (companyId: string, userId: string, data: ExpenseFormData) => {
    return await (supabase.rpc as any)('commit_expense_v2', {
      p_company_id: companyId,
      p_user_id: userId,
      p_category_id: data.category_id,
      p_amount: data.amount,
      p_description: data.description,
      p_date: data.expense_date,
      p_payment_method: data.payment_method,
      p_voucher_number: data.voucher_number,
      p_currency: data.currency_code || 'SAR',
      p_exchange_rate: data.exchange_rate || 1
    });
  },

  createExpenseCategory: async (categoryData: any) => {
    return await (supabase.from('expense_categories') as any)
      .insert(categoryData)
      .select()
      .single();
  },

  deleteExpenseRecord: async (id: string) => {
    // Try RPC that both voids the expense and creates a reversal journal entry
    const { error: rpcError } = await (supabase.rpc as any)('void_expense', {
      p_expense_id: id
    });

    if (rpcError) {
      // Fallback: if RPC doesn't exist yet, do a soft delete (status = void)
      // WARNING: this does NOT reverse the journal entry
      console.warn('void_expense RPC not available, falling back to soft delete:', rpcError.message);
      const { error } = await (supabase.from('expenses') as any)
        .update({ status: 'void' })
        .eq('id', id);
      if (error) throw error;
      return;
    }
  }
};
