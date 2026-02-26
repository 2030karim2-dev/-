
import { supabase } from '../../../lib/supabaseClient';
import { accountsService } from '../../accounting/services/accountsService';
import { journalService } from '../../accounting/services/journalService';
import { bondsService } from '../../bonds/service';
import { CreatePurchaseDTO } from '../types';

export const purchaseAccountingService = {
    /**
     * Handle accounting side-effects for a new purchase.
     * 
     * IMPORTANT: The `commit_purchase_invoice` RPC already creates:
     *   Dr Purchases (5201) / Cr Supplier (2201)
     * 
     * So we do NOT create that entry again. We only need to handle cash purchases:
     * - Cash: Create a transfer entry Dr Supplier / Cr Cash (to move amount from payable to cash)
     * - Credit: Do nothing (RPC already handled it correctly)
     */
    handleNewPurchase: async (
        invoiceId: string,
        data: CreatePurchaseDTO,
        companyId: string,
        userId: string,
        totalAmount: number
    ) => {
        try {
            console.info('📦 Purchase accounting for:', invoiceId, 'Method:', data.paymentMethod);

            // Credit purchases: RPC already created Dr Purchases / Cr Supplier — nothing to do
            if (data.paymentMethod !== 'cash') {
                console.info('📋 Credit purchase — RPC already handled accounting. No client-side action needed.');
                return;
            }

            // ===== CASH PURCHASE: Transfer from Supplier to Cash =====
            // The RPC credited the Supplier account. We need to reverse that and credit Cash instead.
            // Entry: Dr Supplier (2201) / Cr Cash (1010)
            console.info('💵 Cash purchase — creating transfer entry (Dr Supplier / Cr Cash)');

            const accounts = await accountsService.getAccounts(companyId);

            // Find Supplier Account (liability)
            const supplierAccount = accounts.find(a => a.code === '2201') ||
                accounts.find(a => a.name.includes('موردين')) ||
                accounts.find(a => a.type === 'liability');

            if (!supplierAccount) {
                console.error('❌ Cannot find Supplier account (2201)');
                return;
            }

            // Find Cash Account
            let cashAccount;
            if (data.cashAccountId) {
                const selectedAccount = accounts.find(a => a.id === data.cashAccountId);
                if (selectedAccount) {
                    // --- Smart Routing for Exchange Companies ---
                    // Check if this selected account has children (i.e., it's a parent wrapper like 'Al-Kuraimi')
                    const childAccounts = accounts.filter(a => a.parent_id === selectedAccount.id);
                    if (childAccounts.length > 0 && data.currency) {
                        const matchedChild = childAccounts.find(a => (a.currency_code || 'SAR') === data.currency);
                        if (matchedChild) {
                            console.info(`Smart Routing (Purchase): Redirected payment from parent ${selectedAccount.id} to child ${matchedChild.id} matching currency ${data.currency}`);
                            cashAccount = matchedChild;
                        } else {
                            cashAccount = selectedAccount; // Fallback to parent if no exact match
                        }
                    } else {
                        cashAccount = selectedAccount; // Not a parent account
                    }
                }
            }

            if (!cashAccount) {
                cashAccount = accounts.find(a => a.code === '1010') ||
                    accounts.find(a => a.type === 'asset' && a.name.includes('صندوق'));
            }

            if (!cashAccount) {
                console.error('❌ Cannot find Cash account for cash purchase.');
                return;
            }

            // Fetch Supplier Name for description
            let supplierName = 'مورد غير محدد';
            if (data.supplierId) {
                const { data: supplier } = await supabase
                    .from('parties')
                    .select('name')
                    .eq('id', data.supplierId)
                    .single();
                if (supplier) supplierName = (supplier as any).name;
            }

            // Create transfer entry: Dr Supplier / Cr Cash
            // تحويل المبلغ للعملة الأساسية إذا كانت العملة مختلفة عن SAR
            let baseAmount = totalAmount;
            if (data.currency && data.currency !== 'SAR') {
                // جلب أحدث سعر صرف
                const { data: rateData } = await (supabase
                    .from('exchange_rates') as any)
                    .select('rate_to_base')
                    .eq('company_id', companyId)
                    .eq('currency_code', data.currency)
                    .order('effective_date', { ascending: false })
                    .limit(1);
                const rate = (rateData as any[])?.[0]?.rate_to_base || 1;
                baseAmount = totalAmount * Number(rate);
                console.info(`Currency conversion: ${totalAmount} ${data.currency} × ${rate} = ${baseAmount} SAR`);
            }

            const journalPayload = {
                date: data.issueDate,
                description: `سداد نقدي فاتورة #${data.invoiceNumber} - ${supplierName}`,
                lines: [
                    {
                        account_id: supplierAccount.id,
                        debit: baseAmount,
                        credit: 0,
                        description: `سداد ذمة مورد: ${supplierName} - فاتورة #${data.invoiceNumber}`
                    },
                    {
                        account_id: cashAccount.id,
                        debit: 0,
                        credit: baseAmount,
                        description: `سداد نقدي فاتورة #${data.invoiceNumber} - ${supplierName}`
                    }
                ]
            };

            console.info('💵 Cash Transfer Payload:', JSON.stringify(journalPayload, null, 2));
            await journalService.createJournal(journalPayload, companyId, userId);
            console.info('✅ Cash payment entry created (Dr Supplier / Cr Cash) — supplier balance zeroed out');

        } catch (error: unknown) {
            const err = error as Error;
            console.error('❌ Error processing purchase accounting:', error);
            // Throw so the UI can notify the user — invoice saved but accounting failed
            throw new Error(`تم حفظ الفاتورة لكن فشل إنشاء القيد المحاسبي: ${err.message || 'خطأ غير معروف'}. يرجى مراجعة القيود يدوياً.`);
        }
    }
};

