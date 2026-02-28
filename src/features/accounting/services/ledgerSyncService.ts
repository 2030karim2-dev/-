
import { accountingService } from './index';
import { Database } from '../../../core/database.types';

type Party = Database['public']['Tables']['parties']['Row'];

export const ledgerSyncService = {
  /**
   * مزامنة رصيد جهة محددة مع حسابها المقابل في شجرة الحسابات
   * يتم استدعاؤه عند إصدار فاتورة أو سند
   */
  syncPartyToGL: async (companyId: string, userId: string, party: Party, amount: number, type: 'debit' | 'credit') => {
    // تحديد حساب النظام المقابل (1100 للعملاء، 2010 للموردين)
    const accountCode = party.type === 'customer' ? '1100' : '2010';
    const mainAccount = await accountingService.findAccountByCode(companyId, accountCode);

    if (!mainAccount) return;

    // تسجيل قيد تلقائي لضمان المطابقة
    /**
     * Fix: Changed party.name_ar to party.name to match the parties table schema
     */
    await accountingService.createJournal({
      date: new Date().toISOString().split('T')[0],
      description: `مزامنة آلية: حركة ${party.type === 'customer' ? 'عميل' : 'مورد'} - ${party.name}`,
      reference_type: 'sub_ledger_sync',
      lines: [
        {
          account_id: (mainAccount as any).id,
          description: `تأثير حركة ${party.name}`,
          debit_amount: type === 'debit' ? amount : 0,
          credit_amount: type === 'credit' ? amount : 0,
        },
        // الطرف الآخر يتم تحديده برمجياً بناءً على نوع العملية (صندوق/مبيعات)
      ]
    }, companyId, userId);
  }
};
