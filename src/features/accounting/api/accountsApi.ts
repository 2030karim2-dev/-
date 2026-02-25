import { supabase } from '../../../lib/supabaseClient';
import { Database } from '../../../core/database.types';

type AccountInsert = Database['public']['Tables']['accounts']['Insert'];

export const accountsApi = {
  getAccounts: async (companyId: string) => {
    return await supabase.from('accounts')
      .select('*')
      .eq('company_id', companyId)
      .limit(5000)
      .order('code', { ascending: true });
  },

  createAccount: async (account: AccountInsert) => {
    return await (supabase.from('accounts') as any)
      .insert(account)
      .select()
      .single();
  },

  insertAccounts: async (accounts: AccountInsert[]) => {
    return await (supabase.from('accounts') as any)
      .insert(accounts)
      .select();
  },

  deleteAccount: async (id: string) => {
    // Safety check: prevent deleting accounts with existing journal entries
    const { count, error: checkError } = await supabase.from('journal_entry_lines')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', id);

    if (checkError) throw checkError;
    if (count && count > 0) {
      throw new Error('لا يمكن حذف حساب له قيود محاسبية مرتبطة. قم بتصفير الرصيد أولاً.');
    }

    return await supabase.from('accounts')
      .delete()
      .eq('id', id);
  }
};
