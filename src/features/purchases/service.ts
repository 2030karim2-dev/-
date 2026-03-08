
// import { supabase } from '../../lib/supabaseClient';
import { purchasesApi } from './api';
import { CreatePurchaseDTO, PurchaseInvoiceResponse } from './types';
import { purchaseAccountingService } from './services/purchaseAccounting';
import { messagingService } from '../notifications/messagingService';
import { toBaseCurrency } from '../../core/utils/currencyUtils';
import { validatePurchasePayload, assertValid } from '../../core/utils/validationUtils';
import { logger } from '../../core/utils/logger';

export { purchasesApi };

export const purchasesService = {
  getPurchases: async (companyId: string) => {
    const { data, error } = await purchasesApi.getPurchases(companyId);
    if (error) throw error;
    return data || [];
  },

  processPurchase: async (data: CreatePurchaseDTO, companyId: string, userId: string) => {
    // Validate before sending to RPC
    assertValid(validatePurchasePayload({
      items: data.items.map(i => ({ productId: i.productId, quantity: i.quantity, costPrice: i.costPrice })),
      issueDate: data.issueDate
    }));

    // Use RPC for atomic operation
    const result = await purchasesApi.createPurchaseRPC(companyId, userId, data);

    if (result) {
      const typedResult = result as unknown as PurchaseInvoiceResponse;

      // Trigger Accounting Side Effects (Ledger & Treasury)
      const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);

      try {
        await purchaseAccountingService.handleNewPurchase(
          typedResult.id,
          data,
          companyId,
          userId,
          totalAmount
        );
      } catch (accountingError) {
        logger.error('PurchaseService', 'Failed to create accounting entries for invoice', {
          invoiceId: typedResult.id,
          companyId,
          totalAmount,
          error: accountingError,
        });
        // ⚠️ Re-throw: an invoice without journal entries violates double-entry integrity.
        // The caller must handle this — either rollback the invoice or queue a retry.
        throw accountingError;
      }

      // 🔔 Fire-and-forget notification
      messagingService.notify(companyId, 'purchase', {
        invoiceNumber: typedResult.invoice_number || '',
        supplierName: 'مورد',
        amount: totalAmount,
        currency: data.currency || 'YER',
        date: new Date().toLocaleDateString('ar-SA'),
        paymentMethod: data.paymentMethod || 'credit',
        itemCount: data.items?.length || 0,
      }, typedResult.id);
    }

    return result;
  },

  processPurchaseReturn: async (data: CreatePurchaseDTO, companyId: string, userId: string) => {
    return await purchasesApi.createPurchaseReturnRPC(companyId, userId, data);
  },

  // ⚡ Server-side stats via RPC — no frontend aggregation
  getStats: async (companyId: string) => {
    const { supabase } = await import('../../lib/supabaseClient');
    const { data, error } = await supabase.rpc('get_purchase_stats', {
      p_company_id: companyId
    });
    if (error) {
      logger.error('PurchaseService', 'Error fetching purchase stats', { companyId, error });
      throw error;
    }
    const result = data as any;
    return {
      invoiceCount: result.invoiceCount || 0,
      totalPurchases: result.totalPurchases || 0,
      pendingPaymentCount: result.pendingPaymentCount || 0,
      totalDebt: result.totalDebt || 0
    };
  },

  // ⚡ Server-side analytics via RPC — no frontend aggregation
  getAnalytics: async (companyId: string) => {
    const { supabase } = await import('../../lib/supabaseClient');
    const { data, error } = await supabase.rpc('get_purchase_stats', {
      p_company_id: companyId
    });
    if (error) {
      logger.error('PurchaseService', 'Error fetching purchase analytics', { companyId, error });
      return { topSuppliers: [], chartData: [] };
    }
    const result = data as any;
    return {
      topSuppliers: result.topSuppliers || [],
      chartData: result.chartData || []
    };
  },

  // Get purchase returns for the returns view
  getPurchaseReturns: async (companyId: string) => {
    const { data, error } = await purchasesApi.getPurchases(companyId);
    if (error) throw error;
    const returns = data?.filter(p => p.type === 'return_purchase') || [];
    return returns;
  },

  // Get purchase returns statistics
  getPurchaseReturnsStats: async (companyId: string) => {
    const { data, error } = await purchasesApi.getPurchases(companyId);
    if (error) {
      logger.error('PurchaseService', 'Error in getPurchaseReturnsStats', { error });
      throw error;
    }
    const returns = data?.filter(p => p.type === 'return_purchase') || [];

    const totalReturns = returns.reduce((sum, r) => sum + toBaseCurrency({
      amount: r.total_amount || 0,
      currency_code: r.currency_code || 'SAR',
      exchange_rate: r.exchange_rate || 1
    }), 0);
    return {
      returnCount: returns.length,
      totalReturns
    };
  }
};
