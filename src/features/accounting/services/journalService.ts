
import { supabase } from '../../../lib/supabaseClient';
import { journalsApi } from '../api/journalsApi';
import { JournalEntry, JournalEntryFormData } from '../types/models';
import { PostTransactionUsecase } from '../../../core/usecases/accounting/PostTransactionUsecase';

export const journalService = {
  /**
   * إنشاء قيد محاسبي جديد باستخدام المحرك المركزي
   */
  createJournal: async (formData: JournalEntryFormData, companyId: string, userId: string) => {
    // نفوض الأمر للـ Usecase الذي يستخدم الـ RPC
    return await PostTransactionUsecase.execute(formData, companyId, userId);
  },

  /**
   * تنسيق البيانات القادمة من الـ API لتناسب العرض
   */
  formatJournalsForUI: async (companyId: string, pageParam: number = 0): Promise<JournalEntry[]> => {
    const { data: rawData, error } = await journalsApi.fetchJournals(companyId, pageParam);
    if (error) throw error;

    const journals = (rawData || []) as any[];

    return journals.map((j) => {
      // Extract party name from polymorphic reference (invoices for now)
      let partyName = null;
      if (j.invoice && !Array.isArray(j.invoice)) {
        const inv = j.invoice as any;
        if (inv.party && !Array.isArray(inv.party)) {
          partyName = inv.party.name;
        }
      }

      return {
        ...j,
        total_amount: (j.journal_entry_lines || []).reduce((sum: number, l: any) => sum + (l.debit_amount || 0), 0),
        created_by_profile: j.profile || null,
        party_name: partyName
      };
    }) as JournalEntry[];
  }
};
