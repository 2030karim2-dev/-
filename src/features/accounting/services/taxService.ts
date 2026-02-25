
import { accountingApi } from '../api/index';

export const taxService = {
  /**
   * تجميع بيانات الضريبة لفترة محددة
   * تفرز الضريبة من المبيعات (Output VAT) والمشتريات/المصاريف (Input VAT)
   */
  getVATReport: async (companyId: string, fromDate: string, toDate: string) => {
    const { data: journals } = await accountingApi.fetchJournals(companyId);
    if (!journals) return null;

    // فلترة الحركات ضمن الفترة المحددة والتي لها علاقة بحساب الضريبة (2020)
    const taxLines = (journals as any[])
      .filter(j => j.entry_date >= fromDate && j.entry_date <= toDate && j.status === 'posted') // Use entry_date not date
      .flatMap(j => j.journal_lines || []) // Ensure journal_lines exists
      .filter((l: any) => l.account?.code === '2020');

    const outputTax = taxLines.reduce((sum: number, l: any) => sum + (Number(l.credit_amount) || 0), 0);
    const inputTax = taxLines.reduce((sum: number, l: any) => sum + (Number(l.debit_amount) || 0), 0);

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
    return amount * rate;
  }
};
