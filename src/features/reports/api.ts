
import { supabase } from '../../lib/supabaseClient';

export const reportsApi = {
  /**
   * Fix: Added missing getAccountingData method required by reportsService
   */
  getAccountingData: async (companyId: string) => {
    return await (supabase.from('accounts') as any)
      .select(`
        id, code, name_ar, type, balance,
        journal_entry_lines (
          debit_amount, credit_amount,
          journal_entries!inner ( entry_date, status )
        )
      `)
      .eq('company_id', companyId)
      .eq('journal_entry_lines.journal_entries.status', 'posted');
  },

  // استخدام دالة SQL المحسنة لجلب ميزان المراجعة
  getTrialBalanceRPC: async (companyId: string, fromDate: string, toDate: string) => {
    return await supabase.rpc('report_trial_balance', {
      p_company_id: companyId,
      p_from: fromDate,
      p_to: toDate
    } as any);
  },

  // جلب كشف حساب لجهة معينة (عميل أو مورد)
  getPartyLedger: async (partyId: string) => {
    const { data: invoices } = await (supabase.from('invoices') as any)
      .select('invoice_number, issue_date, total_amount, type, status')
      .eq('party_id', partyId)
      .neq('status', 'void')
      .order('issue_date', { ascending: true });

    const { data: journals } = await (supabase.from('journal_entries') as any)
      .select(`
        entry_number, entry_date, description,
        journal_entry_lines (debit_amount, credit_amount)
      `)
      .eq('reference_id', partyId)
      .eq('status', 'posted')
      .order('entry_date', { ascending: true });

    return { invoices, journals };
  },

  // جلب البيانات الخام للتقارير المخصصة الأخرى عند الحاجة
  getJournalLinesRaw: async (companyId: string, fromDate?: string, toDate?: string) => {
    let query = (supabase.from('journal_entry_lines') as any)
      .select(`
        id, debit_amount, credit_amount, description, account_id,
        account:accounts!inner(id, code, name_ar, type),
        journal:journal_entries!inner(id, entry_date, entry_number, status, company_id)
      `)
      .eq('journal.company_id', companyId)
      .eq('journal.status', 'posted');

    if (fromDate) query = query.gte('journal.entry_date', fromDate);
    if (toDate) query = query.lte('journal.entry_date', toDate);

    return await query;
  },

  getPartiesWithBalances: async (companyId: string) => {
    return await (supabase.from('parties') as any)
      .select('id, name, type, balance')
      .eq('company_id', companyId);
  },

  getCompanyCurrency: async (companyId: string) => {
    return await (supabase.from('companies') as any)
      .select('base_currency')
      .eq('id', companyId)
      .single();
  }
};
