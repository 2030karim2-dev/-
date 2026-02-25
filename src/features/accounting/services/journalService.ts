
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

    const journals = (rawData || []) as unknown as JournalEntry[];

    // Define temporary types for raw data
    type ProfileType = { id: string; full_name: string };
    type InvoiceType = { id: string; party: { name: string } | { name: string }[] | null };

    // Manual Join for Profiles (to avoid FK issues)
    const userIds = Array.from(new Set(journals.map(j => j.created_by).filter(Boolean)));
    let profilesMap: Record<string, ProfileType> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profiles) {
        profilesMap = (profiles as ProfileType[]).reduce((acc: Record<string, ProfileType>, p) => {
          acc[p.id] = p;
          return acc;
        }, {});
      }
    }

    // Manual Join for Parties (Invoices & Bonds)
    const invoiceIds = journals
      .filter(j => ['invoice', 'sale', 'bill', 'purchase', 'return_sale', 'return_purchase'].includes(j.reference_type || '') && j.reference_id)
      .map(j => j.reference_id as string);

    let partiesMap: Record<string, string> = {};

    if (invoiceIds.length > 0) {
      // Fetch invoices with party names
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, party:party_id(name)')
        .in('id', invoiceIds);

      if (invoices) {
        partiesMap = (invoices as unknown as InvoiceType[]).reduce((acc: Record<string, string>, inv) => {
          if (inv.party && !Array.isArray(inv.party) && inv.party.name) {
            acc[inv.id] = inv.party.name;
          }
          return acc;
        }, {});
      }
    }

    return journals.map((j) => ({
      ...j,
      total_amount: (j.journal_entry_lines || []).reduce((sum: number, l: any) => sum + (l.debit || 0), 0),
      created_by_profile: j.created_by ? (profilesMap[j.created_by] || null) : null,
      party_name: j.reference_id ? (partiesMap[j.reference_id] || null) : null
    })) as JournalEntry[];
  }
};
