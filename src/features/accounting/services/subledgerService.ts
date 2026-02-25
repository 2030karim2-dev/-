
import { accountingService } from './index';
import { Database } from '../../../core/database.types';

type Party = Database['public']['Tables']['parties']['Row'];

export const subledgerService = {
  /**
   * مزامنة آلية عند حدوث حركة مالية لجهة (عميل/مورد)
   * تضمن أن رصيد حساب "ذمم العملاء" في شجرة الحسابات يساوي دائماً مجموع أرصدة العملاء
   */
  syncTransaction: async (companyId: string, userId: string, party: Party, amount: number, direction: 'in' | 'out') => {
    const isCustomer = party.type === 'customer';
    const accountCode = isCustomer ? '1100' : '2010'; // 1100: ذمم عملاء، 2010: ذمم موردين

    const glAccount = await accountingService.findAccountByCode(companyId, accountCode);
    if (!glAccount) return;

    /**
     * Fix: Changed party.name_ar to party.name to match the parties table schema
     */
    await accountingService.createJournal({
      date: new Date().toISOString().split('T')[0],
      description: `مزامنة Sub-ledger: ${party.name}`,
      reference_type: 'automated_sync',
      lines: [
        {
          account_id: (glAccount as any).id,
          description: `تأثير حركة ${party.name}`,
          debit: direction === 'in' ? amount : 0,
          credit: direction === 'out' ? amount : 0
        }
      ]
    }, companyId, userId);
  }
};
