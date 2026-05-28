/**
 * Reports API - Backward compatibility re-export
 * 
 * This file now re-exports from the centralized core API layer.
 * All new code should import directly from '@/core/database/api'.
 */

import { supabase } from '@/core/database/api';

export const reportsApi = {
  getJournalLines: async (companyId: string, fromDate?: string, toDate?: string) => {
    let query = supabase.from('journal_entry_lines')
      .select(`
        *,
        journal:journal_entries!inner (
          id,
          entry_date,
          entry_number,
          description,
          status,
          company_id
        ),
        account:accounts (
          id,
          code,
          name_ar,
          type,
          currency_code
        )
      `)
      .eq('journal.company_id', companyId)
      .eq('journal.status', 'posted')
      .is('deleted_at', null);

    if (fromDate) {
      query = query.gte('journal.entry_date', fromDate);
    }
    if (toDate) {
      query = query.lte('journal.entry_date', toDate);
    }

    return await query;
  },

  getAuditJournals: async (companyId: string) => {
    return await supabase.from('journal_entries')
      .select(`
        id,
        entry_date,
        description,
        status,
        journal_entry_lines (
          debit_amount,
          credit_amount
        )
      `)
      .eq('company_id', companyId)
      .neq('status', 'void')
      .is('deleted_at', null)
      .order('entry_date', { ascending: false });
  }
};