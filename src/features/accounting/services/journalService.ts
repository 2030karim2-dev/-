
import { journalsApi } from '../api/journalsApi';
import { JournalEntry, JournalEntryFormData } from '../types/models';
import { PostTransactionUsecase } from '../../../core/usecases/accounting/PostTransactionUsecase';

// Typed raw shapes from Supabase join query
interface RawJournalLine {
  debit_amount: number | null;
  credit_amount: number | null;
  account_id?: string;
  description?: string | null;
  account?: { name_ar?: string; code?: string } | null;
}

interface RawInvoiceParty {
  name?: string;
}

interface RawInvoice {
  party?: RawInvoiceParty | RawInvoiceParty[] | null;
}

interface RawJournal {
  id: string;
  company_id: string;
  entry_number: number;
  entry_date: string;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  status: string;
  created_at: string;
  created_by: string | null;
  journal_entry_lines?: RawJournalLine[] | null;
  invoice?: RawInvoice | RawInvoice[] | null;
  created_by_profile?: { full_name?: string } | null;
}

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

    const journals = (rawData || []) as RawJournal[];

    return journals.map((j) => {
      // Extract party name from polymorphic reference (invoices for now)
      let partyName: string | null = null;
      const inv = j.invoice;
      if (inv && !Array.isArray(inv)) {
        if (inv.party && !Array.isArray(inv.party)) {
          partyName = inv.party.name || null;
        }
      }

      const lines = j.journal_entry_lines || [];

      return {
        id: j.id,
        company_id: j.company_id,
        entry_number: j.entry_number,
        entry_date: j.entry_date,
        description: j.description,
        reference_type: j.reference_type,
        reference_id: j.reference_id,
        status: j.status,
        created_at: j.created_at,
        created_by: j.created_by,
        journal_entry_lines: lines.map((l) => ({
          debit_amount: l.debit_amount,
          credit_amount: l.credit_amount,
          description: l.description || '',
          account_name: l.account?.name_ar,
          account_id: l.account_id || '',
          account_code: l.account?.code
        })),
        total_amount: (() => {
          // Calculate a smart total amount for the UI
          // Prioritize lines hitting Cash, Bank, Receivable, or Payable accounts
          // These typically represent the "face value" of the transaction (Invoice total, Payment total)
          const transactionLines = lines.filter(l => {
            const code = l.account?.code || '';
            return code.startsWith('101') || // Cash
              code.startsWith('102') || // Bank
              code.startsWith('110') || // Receivables
              code.startsWith('210');   // Payables
          });

          if (transactionLines.length > 0) {
            // Sum the first matching group of lines (either all debits or all credits)
            return Math.max(
              transactionLines.reduce((sum, l) => sum + (l.debit_amount || 0), 0),
              transactionLines.reduce((sum, l) => sum + (l.credit_amount || 0), 0)
            );
          }

          // Fallback: Just return the max debit or credit of all lines
          return Math.max(
            lines.reduce((sum, l) => sum + (l.debit_amount || 0), 0),
            lines.reduce((sum, l) => sum + (l.credit_amount || 0), 0)
          );
        })(),
        created_by_profile: j.created_by_profile || null,
        party_name: partyName
      };
    }) as JournalEntry[];
  }
};
