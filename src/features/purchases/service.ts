
// import { supabase } from '../../lib/supabaseClient';
import { purchasesApi } from './api';
import { CreatePurchaseDTO, PurchaseInvoiceResponse } from './types';
import { purchaseAccountingService } from './services/purchaseAccounting';
import { messagingService } from '../notifications/messagingService';
import { toBaseCurrency } from '../../core/utils/currencyUtils';
import { validatePurchasePayload, assertValid } from '../../core/utils/validationUtils';
import { logger } from '../../core/utils/logger';

// Type for raw purchase data from Supabase
interface RawPurchase {
  id: string;
  type: string;
  invoice_number: string | null;
  party_id: string | null;
  party: { name?: string } | null;
  total_amount: number | null;
  payment_method: string | null;
  currency_code: string | null;
  exchange_rate: number | null;
  issue_date: string;
}

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

  getStats: async (companyId: string) => {
    const { data, error } = await purchasesApi.getPurchases(companyId);
    if (error) {
      logger.error('PurchaseService', 'Error fetching purchase stats', { companyId, error });
      throw error;
    }
    const purchases = (data || []).filter((p: RawPurchase) => p.type === 'purchase');

    const totalPurchases = purchases.reduce((sum: number, p: RawPurchase) => sum + toBaseCurrency({
      amount: Number(p.total_amount) || 0,
      currency_code: p.currency_code || 'YER',
      exchange_rate: Number(p.exchange_rate) || 1
    }), 0);
    const creditPurchases = purchases.filter((p: RawPurchase) => p.payment_method === 'credit');
    return {
      invoiceCount: purchases.length,
      totalPurchases,
      pendingPaymentCount: creditPurchases.length,
      totalDebt: creditPurchases.reduce((sum: number, p: RawPurchase) => sum + toBaseCurrency({
        amount: Number(p.total_amount) || 0,
        currency_code: p.currency_code || 'YER',
        exchange_rate: Number(p.exchange_rate) || 1
      }), 0)
    };
  },

  getAnalytics: async (companyId: string) => {
    const { data, error } = await purchasesApi.getPurchases(companyId);
    if (error) {
      logger.error('PurchaseService', 'Error fetching purchase analytics', { companyId, error });
      return { topSuppliers: [], chartData: [] };
    }

    const purchases = (data || []).filter((p: RawPurchase) => p.type === 'purchase');

    // Top Suppliers — aggregate by party (supplier)
    const supplierMap: Record<string, { name: string; total: number; count: number }> = {};
    purchases.forEach((p: RawPurchase) => {
      const name = p.party?.name || 'مورد غير معروف';
      const id = p.party_id || 'unknown';
      if (!supplierMap[id]) supplierMap[id] = { name, total: 0, count: 0 };
      supplierMap[id].total += Number(p.total_amount) || 0;
      supplierMap[id].count += 1;
    });
    // Daily Chart Data — group by date
    const dateMap: Record<string, number> = {};
    purchases.forEach((p: RawPurchase) => {
      const date = p.issue_date;
      if (date) {
        dateMap[date] = (dateMap[date] || 0) + (Number(p.total_amount) || 0);
      }
    });

    // Fill gaps for the last 30 days
    const chartData = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      chartData.push({
        date: dateStr,
        amount: dateMap[dateStr] || 0
      });
    }

    // Top Suppliers with 'value' key for the chart
    const topSuppliers = Object.values(supplierMap)
      .map(s => ({ name: s.name, value: s.total }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return { topSuppliers, chartData };
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
