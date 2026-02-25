
import { salesApi } from './api';
import { CreateInvoiceDTO } from './types';
import { messagingService } from '../notifications/messagingService';

export const salesService = {
  fetchSalesLog: async (companyId: string) => {
    const { data, error } = await salesApi.getInvoices(companyId);
    if (error) throw error;

    // تحويل المبلغ للعملة الأساسية (SAR)
    const toBase = (inv: Record<string, unknown>): number => {
      const amount = Number(inv.total_amount) || 0;
      const rate = Number(inv.exchange_rate) || 1;
      if (!inv.currency_code || inv.currency_code === 'SAR') return amount;
      return amount * rate;
    };

    return (data || []).map((inv: Record<string, unknown>) => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      customerName: (inv.party as { name?: string })?.name || 'عميل نقدي',
      date: new Date(inv.issue_date as string).toLocaleDateString('ar-SA'),
      total: Number(inv.total_amount) || 0,
      baseTotal: toBase(inv),
      status: inv.status,
      type: inv.type,
      paymentMethod: inv.payment_method,
      currencyCode: (inv.currency_code as string) || 'SAR',
      exchangeRate: Number(inv.exchange_rate) || 1,
      itemCount: Array.isArray(inv.invoice_items) ? inv.invoice_items.length : 0
    }));
  },

  processNewSale: async (companyId: string, userId: string, payload: CreateInvoiceDTO) => {
    if (payload.type === 'return_sale') {
      return await salesApi.commitReturnRPC(companyId, userId, payload);
    }

    let finalTreasuryAccountId = payload.treasuryAccountId;

    // --- Smart Routing for Exchange Companies / Parent Accounts ---
    if (finalTreasuryAccountId && payload.currency) {
      const { accountsService } = await import('../accounting/services/accountsService');
      const accounts = await accountsService.getAccounts(companyId);

      // Look for children of the selected account
      const childAccounts = accounts.filter(a => a.parent_id === finalTreasuryAccountId);

      if (childAccounts.length > 0) {
        // Find the child account that matches the requested currency
        const matchedChild = childAccounts.find(a =>
          (a.currency_code || 'SAR') === payload.currency
        );

        if (matchedChild) {
          console.info(`Smart Routing: Redirected sale payment from parent ${finalTreasuryAccountId} to child ${matchedChild.id} matching currency ${payload.currency}`);
          finalTreasuryAccountId = matchedChild.id;
        }
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

    // تحويل المبلغ للعملة الأساسية
    const toBase = (inv: Record<string, unknown>): number => {
      const amount = Number(inv.total_amount) || 0;
      const rate = Number(inv.exchange_rate) || 1;
      if (!inv.currency_code || inv.currency_code === 'SAR') return amount;
      return amount * rate;
    };

    const salesOnly = (data as Record<string, unknown>[])?.filter(i => i.type === 'sale') || [];
    const total = salesOnly.reduce((sum, s) => sum + toBase(s), 0);
    return {
      totalSales: total,
      invoiceCount: salesOnly.length,
      avgSale: salesOnly.length > 0 ? total / salesOnly.length : 0
    };
  }
};
