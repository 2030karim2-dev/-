
import { salesApi } from './api';
import { CreateInvoiceDTO } from './types';
import { messagingService } from '../notifications/messagingService';
import { toBaseCurrency } from '../../core/utils/currencyUtils';
import { validateSalePayload, assertValid } from '../../core/utils/validationUtils';
import { routeToChildByCurrency } from '../../core/utils/accountRouting';

export const salesService = {
  fetchSalesLog: async (companyId: string) => {
    const { data, error } = await salesApi.getInvoices(companyId);
    if (error) throw error;

    return (data || []).map((inv: Record<string, unknown>) => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      customerName: (inv.party as { name?: string })?.name || 'عميل نقدي',
      date: new Date(inv.issue_date as string).toLocaleDateString('ar-SA'),
      total: Number(inv.total_amount) || 0,
      baseTotal: toBaseCurrency(inv as any),
      status: inv.status,
      type: inv.type,
      paymentMethod: inv.payment_method,
      currencyCode: (inv.currency_code as string) || 'SAR',
      exchangeRate: Number(inv.exchange_rate) || 1,
      itemCount: Array.isArray(inv.invoice_items) ? inv.invoice_items.length : 0
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
      const routed = routeToChildByCurrency(accounts, finalTreasuryAccountId, payload.currency);
      if (routed) {
        finalTreasuryAccountId = routed.id;
      }
    }

    // Pass the treasuryAccountId if present (for Cash/Exchange payments)
    const enhancedPayload = {
      ...payload,
      treasuryAccountId: finalTreasuryAccountId
    };
    const result = await salesApi.commitInvoiceRPC(companyId, userId, enhancedPayload);

    // 🔔 Fire-and-forget notification
    if (result) {
      const itemsTotal = payload.items.reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);
      messagingService.notify(companyId, 'sale', {
        invoiceNumber: (result as any)?.invoice_number || '',
        customerName: (payload as any).customerName || 'عميل نقدي',
        amount: itemsTotal,
        currency: payload.currency || 'SAR',
        date: new Date().toLocaleDateString('ar-SA'),
        paymentMethod: payload.paymentMethod || 'cash',
        itemCount: payload.items?.length || 0,
      }, (result as any)?.id);
    }

    return result;
  },

  getStats: async (companyId: string) => {
    const { data } = await salesApi.getInvoices(companyId);

    const salesOnly = (data as Record<string, unknown>[])?.filter(i => i.type === 'sale') || [];
    const total = salesOnly.reduce((sum, s) => sum + toBaseCurrency(s as any), 0);
    return {
      totalSales: total,
      invoiceCount: salesOnly.length,
      avgSale: salesOnly.length > 0 ? total / salesOnly.length : 0
    };
  }
};
