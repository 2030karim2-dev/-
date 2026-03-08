
import { supabase } from '../../lib/supabaseClient';
import { parseError } from '../../core/utils/errorUtils';
import { CreatePurchaseDTO, SupplierPaymentData } from './types';
import type { Invoice, Party } from '../../core/types/supabase-helpers';

type PurchaseInvoiceWithParty = Invoice & {
  party: Pick<Party, 'name'>;
  invoice_items: { id: string }[];
};

type PurchaseInvoiceForReturn = Invoice & {
  party: Pick<Party, 'id' | 'name'>;
  invoice_items: Array<{
    id: string;
    product_id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
};

export const purchasesApi = {
  getPurchases: async (companyId: string) => {
    const result = await supabase
      .from('invoices')
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
      .in('type', ['purchase', 'return_purchase'])
      .is('deleted_at', null)
      .order('issue_date', { ascending: false })
      .returns<PurchaseInvoiceWithParty[]>();

    return result;
  },

  getPurchaseDetails: async (purchaseId: string) => {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        party:party_id(*),
        invoice_items(
          *,
          product:product_id(name_ar, sku)
        )
      `)
      .eq('id', purchaseId)
      .single();

    return { data, error };
  },

  createPurchaseRPC: async (companyId: string, userId: string, data: CreatePurchaseDTO) => {
    const rate = data.exchangeRate || 1;
    const rpcParams = {
      p_company_id: companyId,
      p_user_id: userId,
      p_supplier_id: data.supplierId || '',
      p_invoice_number: data.invoiceNumber,
      p_issue_date: data.issueDate,
      p_items: data.items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        unit_cost: Number(item.costPrice)
      })),
      ...(data.notes ? { p_notes: data.notes } : {}),
      p_currency: data.currency || 'SAR',
      p_exchange_rate: rate,
      p_payment_method: data.paymentMethod || 'credit',
      ...(data.paymentMethod === 'cash' && data.cashAccountId ? { p_payment_account_id: data.cashAccountId } : data.bankAccountId ? { p_payment_account_id: data.bankAccountId } : {})
    };

    const { data: result, error } = await supabase.rpc('commit_purchase_invoice', rpcParams);
    if (error) throw parseError(error);
    return result;
  },

  createPurchaseReturnRPC: async (companyId: string, userId: string, data: CreatePurchaseDTO) => {
    const rate = data.exchangeRate || 1;
    const rpcParams = {
      p_company_id: companyId,
      p_user_id: userId,
      p_supplier_id: data.supplierId || '',
      p_items: data.items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        unit_cost: Number(item.costPrice)
      })),
      p_currency: data.currency || 'SAR',
      p_exchange_rate: rate,
      p_notes: data.notes || ''
    };

    const { data: result, error } = await supabase.rpc('commit_purchase_return', rpcParams);
    if (error) throw parseError(error);
    return result;
  },

  createSupplierPayment: async (paymentData: SupplierPaymentData, companyId: string, userId: string) => {
    const { data: cashAccount } = await supabase
      .from('accounts')
      .select('id')
      .eq('company_id', companyId)
      .eq('code', '1010')
      .single();

    return await supabase.rpc('create_financial_bond', {
      p_company_id: companyId,
      p_user_id: userId,
      p_bond_type: 'payment',
      p_amount: paymentData.amount,
      p_date: paymentData.date,
      p_cash_account_id: cashAccount?.id || '',
      p_counterparty_type: 'party',
      p_counterparty_id: paymentData.supplierId || '',
      p_description: paymentData.notes || 'سند صرف لمورد',
      p_currency_code: paymentData.currencyCode || 'SAR',
      p_exchange_rate: paymentData.exchangeRate || 1,
      ...((paymentData.foreignAmount || paymentData.amount) ? { p_foreign_amount: paymentData.foreignAmount || paymentData.amount } : {})
    });
  },

  // Get purchase invoices that can be used for returns
  getPurchaseInvoicesForReturn: async (companyId: string, supplierId: string | null) => {
    let query = supabase
      .from('invoices')
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
        party:party_id(id, name),
        invoice_items(id, product_id, description, quantity, unit_price, total)
      `)
      .eq('company_id', companyId)
      .eq('type', 'purchase')
      .eq('status', 'posted')
      .is('deleted_at', null);

    if (supplierId) {
      query = query.eq('party_id', supplierId);
    }

    return await query
      .order('issue_date', { ascending: false })
      .returns<PurchaseInvoiceForReturn[]>();
  },

  deletePurchase: async (id: string) => {
    return await supabase
      .from('invoices')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
  }
};
