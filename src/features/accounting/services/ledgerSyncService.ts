
import { accountingService } from './index';
import { Database } from '../../../core/database.types';

type Party = Database['public']['Tables']['parties']['Row'];

export const ledgerSyncService = {
  /**
   * مزامنة رصيد جهة محددة مع حسابها المقابل في شجرة الحسابات
   * يتم استدعاؤه عند إصدار فاتورة أو سند
   *
   * ⚠️ IMPORTANT: Double-entry integrity requires BOTH sides of the journal.
   * The contra account must be provided by the caller based on the transaction type:
   *   - Cash sale:    Dr Cash (1010) / Cr Revenue (4100)
   *   - Credit sale:  Dr Receivable (1100) / Cr Revenue (4100)
   *   - Cash purchase: Dr Expense (5201) / Cr Cash (1010)
   */
  syncPartyToGL: async (
    companyId: string,
    userId: string,
    party: Party,
    amount: number,
    type: 'debit' | 'credit',
    contraAccountId?: string
  ) => {
    // تحديد حساب النظام المقابل (1100 للعملاء، 2010 للموردين)
    const accountCode = party.type === 'customer' ? '1100' : '2010';
    const mainAccount = await accountingService.findAccountByCode(companyId, accountCode);

    if (!mainAccount) return;

    // ⚠️ Double-entry guard: if no contra account is provided, we cannot
    // create a balanced journal entry. Log and skip to prevent imbalance.
    if (!contraAccountId) {
      console.warn(
        `[ledgerSyncService] Skipping GL sync for party ${party.id}: no contra account provided. ` +
        `This would create a single-sided journal entry violating double-entry integrity.`
      );
      return;
    }

    await accountingService.createJournal({
      date: new Date().toISOString().split('T')[0],
      description: `مزامنة آلية: حركة ${party.type === 'customer' ? 'عميل' : 'مورد'} - ${party.name}`,
      reference_type: 'sub_ledger_sync',
      lines: [
        {
          account_id: mainAccount.id,
          description: `تأثير حركة ${party.name}`,
          debit_amount: type === 'debit' ? amount : 0,
          credit_amount: type === 'credit' ? amount : 0,
        },
        {
          account_id: contraAccountId,
          description: `الطرف المقابل - ${party.name}`,
          debit_amount: type === 'credit' ? amount : 0,
          credit_amount: type === 'debit' ? amount : 0,
        },
      ]
    }, companyId, userId);
  }
};

