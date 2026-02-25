
import { supabase } from '../../lib/supabaseClient';
import { CreateInvoicePayload, InvoiceResponse } from './types';
import { toBaseCurrency } from '../../core/utils/currencyUtils';

export const salesApi = {
  getInvoices: async (companyId: string) => {
    return await (supabase.from('invoices') as any)
      .select(`
        id,
        invoice_number,
        issue_date,
        total_amount,
        status,
        type,
        payment_method,
        currency_code,
        exchange_rate,
        party:party_id(name),
        invoice_items(id)
      `)
      .eq('company_id', companyId)
      .in('type', ['sale', 'return_sale'])
      .neq('status', 'void')
      .is('deleted_at', null)
      .order('issue_date', { ascending: false });
  },

  commitInvoiceRPC: async (companyId: string, userId: string, payload: CreateInvoicePayload): Promise<InvoiceResponse> => {
    const rpcParams = {
      p_company_id: companyId,
      p_user_id: userId,
      p_party_id: payload.partyId,
      p_items: payload.items.map(i => ({ product_id: i.productId, quantity: i.quantity, unit_price: i.unitPrice })),
      p_payment_method: payload.paymentMethod,
      p_notes: payload.notes,
      p_treasury_account_id: payload.treasuryAccountId || null,
      p_currency: payload.currency || 'SAR',
      p_exchange_rate: payload.exchangeRate || 1
    };

    const { data, error } = await supabase.rpc('commit_sales_invoice', rpcParams as never);

    if (error) throw error;

    return data as InvoiceResponse;
  },

  commitReturnRPC: async (companyId: string, userId: string, payload: CreateInvoicePayload): Promise<InvoiceResponse> => {
    const rpcParams = {
      p_company_id: companyId,
      p_user_id: userId,
      p_party_id: payload.partyId,
      p_items: payload.items.map(i => ({ product_id: i.productId, quantity: i.quantity, unit_price: i.unitPrice })),
      p_notes: payload.notes,
      p_currency: payload.currency || 'SAR',
      p_exchange_rate: payload.exchangeRate || 1
    };

    const { data, error } = await supabase.rpc('commit_sale_return', rpcParams as never);
    if (error) throw error;
    return data as InvoiceResponse;
  },

  getInvoiceDetails: async (invoiceId: string) => {
    return await (supabase.from('invoices') as any)
      .select(`
        *,
        parties:party_id(*),
        invoice_items(
          *,
          product:product_id(name_ar, sku)
        )
      `)
      .eq('id', invoiceId)
      .single();
  },

  getNextInvoiceNumber: async (companyId: string) => {
    const { count, error } = await (supabase.from('invoices') as any)
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('type', 'sale');

    if (error) return { data: null, error };

    const nextNum = (count || 0) + 1;
    return { data: `INV-${String(nextNum).padStart(5, '0')}`, error: null };
  },

  getSalesAnalytics: async (params: {
    company_id: string;
    start_date?: string;
    end_date?: string;
    period?: string;
  }) => {
    let query = (supabase.from('invoices') as any)
      .select(`
        id,
        total_amount,
        type,
        status,
        issue_date,
        payment_method,
        currency_code,
        exchange_rate,
        customer:party_id(name),
        items:invoice_items(
          quantity,
          total,
          product:product_id(name_ar, sku)
        )
      `)
      .eq('company_id', params.company_id)
      .in('type', ['sale', 'return_sale'])
      .neq('status', 'void');

    if (params.start_date) {
      query = query.gte('issue_date', params.start_date);
    }
    if (params.end_date) {
      query = query.lte('issue_date', params.end_date);
    }

    const { data, error } = await query;

    if (error) return { data: null, error };

    // Use centralized currency conversion

    // Calculate analytics
    const sales = (data as any[])?.filter((i) => i.type === 'sale' && i.status !== 'cancelled') || [];
    const returns = (data as any[])?.filter((i) => i.type === 'return_sale') || [];

    const totalSales = sales.reduce((sum: number, i) => sum + toBaseCurrency(i), 0);
    const totalReturns = returns.reduce((sum: number, i) => sum + toBaseCurrency(i), 0);

    // Group sales by day
    const salesByDayMap: Record<string, { date: string; sales: number; returns: number }> = {};

    // Top Items Aggregation
    const productMap: Record<string, { productId: string, productName: string, quantity: number, revenue: number }> = {};
    const customerMap: Record<string, { customerId: string, customerName: string, totalAmount: number, invoiceCount: number }> = {};

    sales.forEach((inv: any) => {
      const date = inv.issue_date;
      if (!salesByDayMap[date]) {
        salesByDayMap[date] = { date, sales: 0, returns: 0 };
      }
      const amount = toBaseCurrency(inv);
      salesByDayMap[date].sales += amount;

      // Aggregates for Top Lists
      const custName = inv.customer?.name || 'عميل نقدي';
      const custId = inv.party_id || 'cash';
      if (!customerMap[custName]) customerMap[custName] = { customerId: custId, customerName: custName, totalAmount: 0, invoiceCount: 0 };
      customerMap[custName].totalAmount += amount;
      customerMap[custName].invoiceCount += 1;

      inv.items?.forEach((item: any) => {
        const prodName = item.product?.name_ar || item.product?.name || 'صنف غير معروف';
        const prodId = item.product_id || 'unknown';
        if (!productMap[prodName]) productMap[prodName] = { productId: prodId, productName: prodName, quantity: 0, revenue: 0 };
        productMap[prodName].revenue += (Number(item.total || 0) * (Number(inv.exchange_rate) || 1));
        productMap[prodName].quantity += Number(item.quantity || 0);
      });
    });

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);

    returns.forEach((inv: any) => {
      const date = inv.issue_date;
      if (!salesByDayMap[date]) {
        salesByDayMap[date] = { date, sales: 0, returns: 0 };
      }
      salesByDayMap[date].returns += toBaseCurrency(inv);
    });

    const salesByDay = Object.values(salesByDayMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Group sales by payment method
    const paymentMethodsMap: Record<string, number> = {};
    sales.forEach((inv: any) => {
      const method = inv.payment_method || 'other';
      paymentMethodsMap[method] = (paymentMethodsMap[method] || 0) + toBaseCurrency(inv);
    });

    const salesByPaymentMethod = Object.entries(paymentMethodsMap).map(([method, amount]) => ({
      method,
      amount
    }));

    return {
      data: {
        totalSales,
        totalReturns,
        netSales: totalSales - totalReturns,
        invoiceCount: sales.length,
        averageInvoiceValue: sales.length > 0 ? totalSales / sales.length : 0,
        topProducts,
        topCustomers,
        salesByDay,
        salesByPaymentMethod,
      },
      error: null,
    };
  }
};
