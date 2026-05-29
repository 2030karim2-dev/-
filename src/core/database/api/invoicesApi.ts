/**
 * Invoices API Layer
 * 
 * Centralized API for invoice operations (sales, purchases, returns).
 * Migrated from: src/features/sales/api/index.ts, src/features/purchases/api.ts
 */

import { supabase, parseError } from './baseApi';

// ============================================
// Types
// ============================================

export interface CreateInvoiceItem {
    productId: string;
    quantity: number;
    unitPrice: number;
}

export interface CreateInvoicePayload {
    partyId: string;
    items: CreateInvoiceItem[];
    paymentMethod?: string;
    notes?: string;
    treasuryAccountId?: string;
    currency?: string;
    exchangeRate?: number;
    discount?: number;
    referenceInvoiceId?: string;
    returnReason?: string;
}

export interface InvoiceResponse {
    id: string;
    invoice_number: string;
    [key: string]: unknown;
}

export interface CreatePurchaseItem {
    productId: string;
    quantity: number;
    costPrice: number;
}

export interface CreatePurchaseDTO {
    supplierId?: string;
    invoiceNumber?: string;
    issueDate: string;
    items: CreatePurchaseItem[];
    notes?: string;
    currency?: string;
    exchangeRate?: number;
    paymentMethod?: string;
    cashAccountId?: string;
    bankAccountId?: string;
}

export interface SupplierPaymentData {
    amount: number;
    date: string;
    supplierId?: string;
    notes?: string;
    currencyCode?: string;
    exchangeRate?: number;
    foreignAmount?: number;
}

// ============================================
// Sales Invoices API
// ============================================

export const salesInvoicesApi = {
    /**
     * Fetch paginated sales invoices
     */
    getInvoices: async (companyId: string, page = 0, limit = 50) => {
        const from = page * limit;
        const to = from + limit - 1;

        const { data, error } = await supabase
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
        invoice_items(id),
        reference_invoice_id
      `)
            .eq('company_id', companyId)
            .in('type', ['sale', 'return_sale'])
            .neq('status', 'void')
            .is('deleted_at', null)
            .order('issue_date', { ascending: false })
            .range(from, to);

        if (error) throw parseError(error);
        return data || [];
    },

    /**
     * Commit a sales invoice via RPC
     */
    commitInvoiceRPC: async (companyId: string, userId: string, payload: CreateInvoicePayload): Promise<InvoiceResponse> => {
        if (!payload.partyId) {
            throw new Error('يجب اختيار العميل قبل إنشاء الفاتورة');
        }

        const rpcParams = {
            p_company_id: companyId,
            p_user_id: userId,
            p_party_id: payload.partyId,
            p_items: payload.items.map(i => ({ product_id: i.productId, quantity: i.quantity, unit_price: i.unitPrice })),
            ...(payload.paymentMethod ? { p_payment_method: payload.paymentMethod } : {}),
            ...(payload.notes ? { p_notes: payload.notes } : {}),
            ...(payload.treasuryAccountId ? { p_treasury_account_id: payload.treasuryAccountId } : {}),
            ...(payload.currency ? { p_currency: payload.currency } : {}),
            ...(payload.exchangeRate ? { p_exchange_rate: payload.exchangeRate } : {}),
            p_discount_amount: payload.discount || 0
        };

        const { data: result, error } = await supabase.rpc('commit_sales_invoice', rpcParams);
        if (error) throw parseError(error);
        return result as unknown as InvoiceResponse;
    },

    /**
     * Commit a sales return via RPC
     */
    commitReturnRPC: async (companyId: string, userId: string, payload: CreateInvoicePayload): Promise<InvoiceResponse> => {
        if (!payload.partyId) {
            throw new Error('يجب اختيار العميل قبل إنشاء مرتجع المبيعات');
        }

        const rpcParams = {
            p_company_id: companyId,
            p_user_id: userId,
            p_party_id: payload.partyId,
            p_items: payload.items.map(i => ({ product_id: i.productId, quantity: i.quantity, unit_price: i.unitPrice })),
            ...(payload.notes ? { p_notes: payload.notes } : {}),
            ...(payload.currency ? { p_currency: payload.currency } : {}),
            ...(payload.exchangeRate ? { p_exchange_rate: Number(payload.exchangeRate) } : {}),
            ...(payload.referenceInvoiceId ? { p_reference_invoice_id: payload.referenceInvoiceId } : {}),
            ...(payload.returnReason ? { p_return_reason: payload.returnReason } : {})
        };

        const { data: result, error } = await supabase.rpc('commit_sale_return', rpcParams);
        if (error) throw parseError(error);
        return result as unknown as InvoiceResponse;
    },

    /**
     * Get invoice details with relations
     */
    getInvoiceDetails: async (invoiceId: string) => {
        const { data, error } = await supabase
            .from('invoices')
            .select(`
        *,
        parties:party_id(*),
        payment_allocations:invoice_payments(
          payments:payment_id(amount, created_at, payment_method)
        ),
        invoice_items:invoice_items(
          *,
          product:product_id(name_ar, sku, cost_price, part_number, brand)
        )
      `)
            .eq('id', invoiceId)
            .single();

        if (error) throw parseError(error);
        return data;
    },

    /**
     * Get next invoice number
     */
    getNextInvoiceNumber: async (companyId: string) => {
        const { data, error } = await supabase.rpc('get_next_invoice_number', {
            p_company_id: companyId,
            p_prefix: 'INV'
        });

        if (error) return { data: null, error };
        return { data: data as string | null, error: null };
    },

    /**
     * Get next sequence number
     */
    getNextSequence: async (companyId: string, type: string) => {
        const { data, error } = await supabase.rpc('get_next_sequence', {
            p_company_id: companyId,
            p_type: type
        });
        if (error) return { data: null, error };
        return { data, error: null };
    },

    /**
     * Get sales analytics
     */
    getSalesAnalytics: async (params: { company_id: string; start_date?: string; end_date?: string }) => {
        const rpcParams = {
            p_company_id: params.company_id,
            ...(params.start_date ? { p_start_date: params.start_date } : {}),
            ...(params.end_date ? { p_end_date: params.end_date } : {})
        };
        const { data, error } = await supabase.rpc('get_sales_analytics', rpcParams);

        if (error) {
            return { data: null, error };
        }

        return { data, error: null };
    },

    /**
     * Void/delete an invoice via RPC with fallback
     */
    deleteInvoice: async (id: string) => {
        const { error } = await supabase.rpc('void_invoice', { p_invoice_id: id });
        if (error) {
            // Direct update fallback (for envs lacking void_invoice)
            return await supabase
                .from('invoices')
                .update({ deleted_at: new Date().toISOString(), status: 'void' })
                .eq('id', id);
        }
        return { error: null };
    }
};

// ============================================
// Purchase Invoices API
// ============================================

export const purchaseInvoicesApi = {
    /**
     * Fetch purchase invoices
     */
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
            .order('issue_date', { ascending: false });

        return result;
    },

    /**
     * Get purchase details
     */
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

    /**
     * Create a purchase invoice via RPC
     */
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
            ...(data.paymentMethod === 'cash' && data.cashAccountId
                ? { p_payment_account_id: data.cashAccountId }
                : data.bankAccountId
                    ? { p_payment_account_id: data.bankAccountId }
                    : {})
        };

        const { data: result, error } = await supabase.rpc('commit_purchase_invoice', rpcParams);
        if (error) throw parseError(error);
        return result;
    },

    /**
     * Create a purchase return via RPC
     */
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

    /**
     * Create a supplier payment
     */
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

    /**
     * Get purchase invoices available for return
     */
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

        return await query.order('issue_date', { ascending: false });
    },

    /**
     * Delete a purchase invoice
     */
    deletePurchase: async (id: string) => {
        return await supabase
            .from('invoices')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);
    }
};
