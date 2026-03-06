
import { salesApi } from './api';
import { CreateInvoiceDTO, InvoiceResponse } from './types';
import { messagingService } from '../notifications/messagingService';
import { toBaseCurrency } from '../../core/utils/currencyUtils';
import { validateSalePayload, assertValid } from '../../core/utils/validationUtils';
import { routeToChildByCurrency } from '../../core/utils/accountRouting';
import { logger } from '../../core/utils/logger';

// Type for raw invoice data from Supabase
interface RawInvoice {
  id: string;
  invoice_number: string | null;
  party: { name?: string } | null;
  issue_date: string;
  total_amount: number | null;
  status: string;
  type: string;
  payment_method: string | null;
  currency_code: string | null;
  exchange_rate: number | null;
  invoice_items: unknown[] | null;
  reference_invoice_id: string | null;
}

export const salesService = {
  fetchSalesLog: async (companyId: string) => {
    const { data, error } = await salesApi.getInvoices(companyId);
    if (error) {
      logger.error('SalesService', 'Failed to fetch sales log', { companyId, error });
      throw error;
    }

    return (data || []).map((inv: RawInvoice) => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      customerName: inv.party?.name || 'عميل نقدي',
      date: new Date(inv.issue_date).toLocaleDateString('ar-SA'),
      total: Number(inv.total_amount) || 0,
      baseTotal: toBaseCurrency({
        amount: Number(inv.total_amount) || 0,
        currency_code: inv.currency_code || 'SAR',
        exchange_rate: Number(inv.exchange_rate) || 1
      }),
      status: inv.status,
      type: inv.type,
      paymentMethod: inv.payment_method,
      currencyCode: inv.currency_code || 'SAR',
      exchangeRate: Number(inv.exchange_rate) || 1,
      itemCount: Array.isArray(inv.invoice_items) ? inv.invoice_items.length : 0,
      referenceInvoiceId: inv.reference_invoice_id
    }));
  },

  processNewSale: async (companyId: string, userId: string, payload: CreateInvoiceDTO) => {
    // H6: Validate items before sending to RPC
    assertValid(validateSalePayload({
      items: payload.items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
      paymentMethod: payload.paymentMethod
    }));

    if (payload.type === 'return_sale') {
      return await salesApi.commitReturnRPC(companyId, userId, payload);
    }

    let finalTreasuryAccountId = payload.treasuryAccountId;

    // M1: Use shared smart routing utility
    if (finalTreasuryAccountId && payload.currency) {
      const { accountsService } = await import('../accounting/services/accountsService');
      const accounts = await accountsService.getAccounts(companyId);
      const routed = routeToChildByCurrency(accounts as any[], finalTreasuryAccountId, payload.currency);
      if (routed) {
        finalTreasuryAccountId = routed.id;
      }
    }

    const { treasuryAccountId, ...restPayload } = payload;
    const enhancedPayload = {
      ...restPayload,
      ...(finalTreasuryAccountId ? { treasuryAccountId: finalTreasuryAccountId } : {})
    };
    const result = await salesApi.commitInvoiceRPC(companyId, userId, enhancedPayload);

    // 🔔 Fire-and-forget notification
    if (result) {
      const itemsTotal = payload.items.reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);
      const typedResult = result as InvoiceResponse;
      messagingService.notify(companyId, 'sale', {
        invoiceNumber: typedResult.invoice_number || '',
        customerName: 'عميل نقدي', // Customer name comes from party, not payload
        amount: itemsTotal,
        currency: payload.currency || 'SAR',
        date: new Date().toLocaleDateString('ar-SA'),
        paymentMethod: payload.paymentMethod || 'cash',
        itemCount: payload.items?.length || 0,
      }, typedResult.id);
    }

    return result;
  },

  getStats: async (companyId: string) => {
    const { data, error } = await salesApi.getInvoices(companyId);

    if (error) {
      logger.error('SalesService', 'Failed to fetch sales stats', { companyId, error });
      throw error;
    }

    const salesOnly = (data || []).filter((i: RawInvoice) => i.type === 'sale');
    const total = salesOnly.reduce((sum: number, s: RawInvoice) => sum + toBaseCurrency({
      amount: Number(s.total_amount) || 0,
      currency_code: s.currency_code || 'SAR',
      exchange_rate: Number(s.exchange_rate) || 1
    }), 0);

    return {
      totalSales: total,
      invoiceCount: salesOnly.length,
      avgSale: salesOnly.length > 0 ? total / salesOnly.length : 0
    };
  }
};
