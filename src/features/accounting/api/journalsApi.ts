
import { supabase } from '../../../lib/supabaseClient';
import { parseError } from '../../../core/utils/errorUtils';
import type { CreateJournalEntryDTO } from '../types';

export const journalsApi = {
  fetchJournals: async (companyId: string, pageParam: number = 0) => {
    const limit = 50;
    const from = pageParam * limit;
    const to = from + limit - 1;

    return await supabase
      .from('journal_entries')
      .select(`
        *,
        journal_entry_lines (
          debit_amount,
          credit_amount,
          account:account_id(name_ar, code)
        ),
        profile:created_by(id, full_name),
        invoice:reference_id (
          id,
          party:party_id(name)
        )
      `)
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('entry_date', { ascending: false })
      .range(from, to);
  },

  postJournalEntryRPC: async (companyId: string, userId: string, data: {
    date: string;
    description: string;
    reference_type?: string;
    currency_code?: string;
    exchange_rate?: number;
    lines: Array<{
      debit?: number | string;
      credit?: number | string;
      account_id: string;
      party_id?: string;
      description?: string
    }>
  }) => {
    // 1. Calculate and validate balance
    const totalDebit = data.lines.reduce((sum: number, l) => sum + (Number(l.debit) || 0), 0);
    const totalCredit = data.lines.reduce((sum: number, l) => sum + (Number(l.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw parseError(`القيد غير متوازن: مدين ${totalDebit.toFixed(2)} ≠ دائن ${totalCredit.toFixed(2)}`);
    }

    // 2. Call the Atomic RPC
    const { data: journalId, error } = await supabase.rpc('post_manual_journal', {
      p_company_id: companyId,
      p_user_id: userId,
      p_date: data.date,
      p_description: data.description,
      p_reference_type: data.reference_type || 'manual',
      p_currency_code: data.currency_code || 'SAR',
      p_exchange_rate: Number(data.exchange_rate) || 1,
      p_lines: data.lines.map(l => ({
        account_id: l.account_id,
        party_id: l.party_id || null,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        description: l.description || null
      }))
    });

    if (error) {
      console.error('Error in post_manual_journal RPC:', error);
      throw parseError(error);
    }

    return { data: journalId, error: null };
  }
};
