
import { supabase } from '../../../lib/supabaseClient';
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
        )
      `)
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('entry_date', { ascending: false })
      .range(from, to);
  },

  // TODO: Migrate to a single Supabase RPC for true atomic transactions.
  // Current approach inserts header + lines in two steps with manual rollback.
  postJournalEntryRPC: async (companyId: string, userId: string, data: { date: string; description: string; reference_type?: string; currency_code?: string; exchange_rate?: number; lines: Array<{ debit?: number | string; credit?: number | string; account_id: string; description?: string }> }) => {
    // Validate: total debits must equal total credits
    const totalDebit = data.lines.reduce((sum: number, l) => sum + (Number(l.debit) || 0), 0);
    const totalCredit = data.lines.reduce((sum: number, l) => sum + (Number(l.credit) || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`القيد غير متوازن: مدين ${totalDebit.toFixed(2)} ≠ دائن ${totalCredit.toFixed(2)}`);
    }

    // 1. إنشاء رأس القيد
    const insertPayload = {
      company_id: companyId,
      entry_date: data.date,
      description: data.description,
      status: 'posted',
      created_by: userId,
      reference_type: data.reference_type || 'manual'
    } as Record<string, unknown>;

    const response1 = await supabase.from('journal_entries').insert(insertPayload as never).select().single();
    const journalData = response1.data as { id: string } | null;
    const jErrorData = response1.error;

    if (jErrorData || !journalData) {
      console.error('Error creating journal header:', jErrorData);
      throw jErrorData || new Error('Failed to create journal header');
    }

    // 2. إعداد الأسطر
    try {
      const exchangeRate = Number(data.exchange_rate) || 1;
      const currencyCode = data.currency_code || 'SAR';

      const lines = data.lines.map((l) => {
        const foreignDebit = Number(l.debit) || 0;
        const foreignCredit = Number(l.credit) || 0;
        const baseDebit = foreignDebit * exchangeRate;
        const baseCredit = foreignCredit * exchangeRate;

        return {
          journal_entry_id: journalData.id,
          account_id: l.account_id,
          debit_amount: baseDebit,
          credit_amount: baseCredit,
          foreign_amount: foreignDebit > 0 ? foreignDebit : (foreignCredit > 0 ? foreignCredit : 0),
          currency_code: currencyCode,
          exchange_rate: exchangeRate,
          description: l.description || data.description
        };
      });

      // 3. إدراج الأسطر
      const { error: lError } = await supabase.from('journal_entry_lines').insert(lines as never[]);

      if (lError) {
        console.error('Error creating journal lines:', lError);
        // Rollback بسيط: حذف القيد إذا فشل إدخال الأسطر
        await supabase.from('journal_entries').delete().eq('id', journalData.id);
        throw lError;
      }
    } catch (e) {
      console.error('Exception in journal lines creation:', e);
      // Attempt rollback
      await supabase.from('journal_entries').delete().eq('id', journalData.id);
      throw e;
    }

    return { data: journalData.id, error: null };
  }
};
