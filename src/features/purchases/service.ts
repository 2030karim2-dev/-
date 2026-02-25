
import { supabase } from '../../lib/supabaseClient';
import { purchasesApi } from './api';
import { CreatePurchaseDTO } from './types';
import { purchaseAccountingService } from './services/purchaseAccounting';
import { messagingService } from '../notifications/messagingService';

export const purchasesService = {
  getPurchases: async (companyId: string) => {
    const { data, error } = await purchasesApi.getPurchases(companyId);
    if (error) throw error;
    return data || [];
  },

  processPurchase: async (data: CreatePurchaseDTO, companyId: string, userId: string) => {
    // Defaulting to purchase RPC
    const result = await purchasesApi.createPurchaseRPC(companyId, userId, data);

    // Note: payment_method update after RPC is non-atomic.
    // TODO: move this into the RPC function for atomicity.
    if (result && (result as any).id) {
      try {
        await (supabase.from('invoices') as any)
          .update({ payment_method: data.paymentMethod || 'credit' })
          .eq('id', (result as any).id);
      } catch (updateError) {
        console.warn('[Purchases] Failed to update payment_method after RPC:', updateError);
      }

      // Trigger Accounting Side Effects (Ledger & Treasury)
      const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);

      await purchaseAccountingService.handleNewPurchase(
        (result as any).id,
        data,
        companyId,
        userId,
        totalAmount
      );

      // 🔔 Fire-and-forget notification
      messagingService.notify(companyId, 'purchase', {
        invoiceNumber: (result as any)?.invoice_number || '',
        supplierName: (data as any).supplierName || 'مورد',
        amount: totalAmount,
        currency: data.currency || 'YER',
        date: new Date().toLocaleDateString('ar-SA'),
        paymentMethod: data.paymentMethod || 'credit',
        itemCount: data.items?.length || 0,
      }, (result as any).id);
    }

    return result;
  },

  processPurchaseReturn: async (data: CreatePurchaseDTO, companyId: string, userId: string) => {
    return await purchasesApi.createPurchaseReturnRPC(companyId, userId, data);
  },

  getStats: async (companyId: string) => {
    const { data, error } = await purchasesApi.getPurchases(companyId);
    if (error) {
      console.error('[PurchaseStats] Error fetching purchases:', error);
      throw error;
    }
    const purchases = (data as any[])?.filter(p => p.type === 'purchase') || [];

    // تحويل المبلغ للعملة الأساسية
    const toBase = (inv: any): number => {
      const amount = Number(inv.total_amount) || 0;
      const rate = Number(inv.exchange_rate) || 1;
      if (!inv.currency_code || inv.currency_code === 'SAR') return amount;
      return amount * rate;
    };

    const totalPurchases = purchases.reduce((sum, p) => sum + toBase(p), 0);
    const creditPurchases = purchases.filter(p => p.payment_method === 'credit');
    return {
      invoiceCount: purchases.length,
      totalPurchases,
      pendingPaymentCount: creditPurchases.length,
      totalDebt: creditPurchases.reduce((sum, p) => sum + toBase(p), 0)
    };
  },

  getAnalytics: async (companyId: string) => {
    const { data, error } = await purchasesApi.getPurchases(companyId);
    if (error) {
      console.error('[PurchaseAnalytics] Error:', error);
      return { topSuppliers: [], chartData: [] };
    }

    const purchases = (data as any[])?.filter(p => p.type === 'purchase') || [];

    // Top Suppliers — aggregate by party (supplier)
    const supplierMap: Record<string, { name: string; total: number; count: number }> = {};
    purchases.forEach(p => {
      const name = p.party?.name || 'مورد غير معروف';
      const id = p.party_id || 'unknown';
      if (!supplierMap[id]) supplierMap[id] = { name, total: 0, count: 0 };
      supplierMap[id].total += Number(p.total_amount) || 0;
      supplierMap[id].count += 1;
    });
    // Daily Chart Data — group by date
    const dateMap: Record<string, number> = {};
    purchases.forEach(p => {
      const date = p.issue_date || (p.created_at || '').slice(0, 10);
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
  }
};
