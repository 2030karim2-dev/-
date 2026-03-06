
import { accountingApi } from '../api/index';

// Typed shapes for journal/tax line data from Supabase
interface TaxJournalEntry {
  entry_date: string;
  status: string;
  journal_entry_lines?: TaxJournalLine[];
}

interface TaxJournalLine {
  debit_amount: number | null;
  credit_amount: number | null;
  account?: { code?: string } | null;
}

export const taxService = {
  /**
   * تجميع بيانات الضريبة لفترة محددة
   * تفرز الضريبة من المبيعات (Output VAT) والمشتريات/المصاريف (Input VAT)
   */
  getVATReport: async (companyId: string, fromDate: string, toDate: string) => {
    const { data: journals } = await accountingApi.fetchJournals(companyId);
    if (!journals) return null;

    // فلترة الحركات ضمن الفترة المحددة والتي لها علاقة بحساب الضريبة (2020)
    const entries = (journals || []) as TaxJournalEntry[];
    const taxLines: TaxJournalLine[] = entries
      .filter(j => j.entry_date >= fromDate && j.entry_date <= toDate && j.status === 'posted')
      .flatMap(j => j.journal_entry_lines || [])
      .filter(l => l.account?.code === '2020');

    const outputTax = taxLines.reduce((sum, l) => sum + (Number(l.credit_amount) || 0), 0);
    const inputTax = taxLines.reduce((sum, l) => sum + (Number(l.debit_amount) || 0), 0);

    return {
      outputTax,
      inputTax,
      netTaxPayable: outputTax - inputTax,
      period: { from: fromDate, to: toDate }
    };
  },

  /**
   * حساب ضريبة القيمة المضافة التقديرية
   */
  calculateVAT: (amount: number, rate: number = 0.15): number => {
    // Round to 2 decimal places for currency precision (IEEE 754 safe)
    return Math.round((amount * rate + Number.EPSILON) * 100) / 100;
  }
};
