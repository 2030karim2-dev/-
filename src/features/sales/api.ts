
import { supabase } from '../../lib/supabaseClient';
import { parseError } from '../../core/utils/errorUtils';
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
      .order('issue_date', { ascending: false })
      .limit(1000);
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

    const { data: result, error } = await supabase.rpc('commit_sales_invoice', rpcParams as any);
    if (error) throw parseError(error);
    return result as InvoiceResponse;
  },

  commitReturnRPC: async (companyId: string, userId: string, payload: CreateInvoicePayload): Promise<InvoiceResponse> => {
    const rpcParams = {
      p_company_id: companyId,
      p_user_id: userId,
      p_party_id: payload.partyId,
      p_items: payload.items.map(i => ({ product_id: i.productId, quantity: i.quantity, unit_price: i.unitPrice })),
      p_notes: payload.notes,
      p_currency: payload.currency || 'SAR',
      p_exchange_rate: payload.exchangeRate || 1,
      p_reference_invoice_id: payload.referenceInvoiceId || null,
      p_return_reason: payload.returnReason || null
    };

    const { data: result, error } = await supabase.rpc('commit_sales_return', rpcParams as any);
    if (error) throw parseError(error);
    return result as InvoiceResponse;
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
    // H4: Use atomic RPC with advisory lock instead of COUNT(*)
    const { data, error } = await (supabase.rpc as any)('get_next_invoice_number', {
      p_company_id: companyId,
      p_prefix: 'INV'
    });

    if (error) return { data: null, error };
    return { data: data as string, error: null };
  },

  getSalesAnalytics: async (params: { company_id: string; start_date?: string; end_date?: string }) => {
    const { data, error } = await supabase.rpc('get_sales_analytics', {
      p_company_id: params.company_id,
      p_start_date: params.start_date || null,
      p_end_date: params.end_date || null
    } as any);

    if (error) {
      console.error('Error fetching sales analytics:', error);
      return { data: null, error };
    }

    return { data, error: null };
  }
};
