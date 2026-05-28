/**
 * Parties API Layer
 * 
 * Centralized API for party (customer/supplier) operations.
 * Migrated from: src/features/parties/api.ts, src/features/parties/api/enhanced/customerApi.ts
 */

import { supabase, parseError, unwrapSingle } from './baseApi';

// ============================================
// Types
// ============================================

export type PartyType = 'customer' | 'supplier';

export interface PartyFormData {
    type: PartyType;
    name: string;
    phone?: string;
    email?: string;
    tax_number?: string;
    address?: string;
    status?: string;
    category_id?: string;
    [key: string]: unknown;
}

// ============================================
// Parties API
// ============================================

export const partiesApi = {
    /**
     * Fetch parties by company and type
     */
    getParties: async (companyId: string, type: PartyType) => {
        const response = await supabase
            .from('active_parties')
            .select('*, party_categories(id, name)')
            .eq('company_id', companyId)
            .eq('type', type)
            .order('name', { ascending: true });

        return response;
    },

    /**
     * Create a new party
     */
    createParty: async (data: PartyFormData, companyId: string) => {
        const insertPayload = {
            company_id: companyId,
            type: data.type,
            name: data.name,
            phone: data.phone || null,
            email: data.email || null,
            tax_number: data.tax_number || null,
            address: data.address || null,
            status: data.status || 'active',
            category_id: data.category_id || null
        };

        const response = await supabase
            .from('parties')
            .insert(insertPayload as any)
            .select()
            .single();

        return unwrapSingle(response);
    },

    /**
     * Update an existing party
     */
    updateParty: async (id: string, data: PartyFormData) => {
        const updatePayload = {
            type: data.type,
            name: data.name,
            phone: data.phone || null,
            email: data.email || null,
            tax_number: data.tax_number || null,
            address: data.address || null,
            status: data.status || 'active',
            category_id: data.category_id || null
        };

        const response = await supabase
            .from('parties')
            .update(updatePayload as any)
            .eq('id', id)
            .select()
            .single();

        return unwrapSingle(response);
    },

    /**
     * Soft-delete a party with safety checks
     */
    deleteParty: async (id: string) => {
        // Safety check: prevent deleting parties with existing invoices
        const { count, error: checkError } = await supabase
            .from('invoices')
            .select('id', { count: 'exact', head: true })
            .eq('party_id', id);

        if (checkError) throw parseError(checkError);
        if (count && count > 0) {
            throw new Error('لا يمكن حذف طرف له فواتير مرتبطة. قم بحظره بدلاً من حذفه.');
        }

        const response = await supabase
            .from('parties')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (response.error) throw parseError(response.error);
    },

    /**
     * Search parties by text query
     */
    search: async (companyId: string, type: PartyType, query: string) => {
        const sanitized = query.replace(/[%_\\*()]/g, '');
        if (!sanitized.trim()) return { data: [], error: null };

        return await supabase
            .from('parties')
            .select('*')
            .eq('company_id', companyId)
            .eq('type', type)
            .is('deleted_at', null)
            .textSearch('search_vector', query, {
                config: 'simple',
                type: 'plain'
            })
            .limit(10);
    },

    /**
     * Get transaction details for a party (invoices, payments, journal lines)
     */
    getTransactionDetails: async (partyId: string) => {
        const { data: invoices, error: invError } = await supabase
            .from('invoices')
            .select('id, invoice_number, issue_date, total_amount, type, status, payment_method, currency_code, exchange_rate')
            .eq('party_id', partyId)
            .order('issue_date', { ascending: true });

        if (invError) throw parseError(invError);

        const { data: payments, error: payError } = await supabase
            .from('payments')
            .select('id, payment_number, payment_date, amount, type, notes, currency_code, exchange_rate')
            .eq('party_id', partyId)
            .neq('status', 'void')
            .is('deleted_at', null)
            .order('payment_date', { ascending: true });

        if (payError) throw parseError(payError);

        const { data: journalLines, error: journalError } = await supabase
            .from('journal_entry_lines')
            .select(`
        id, description, debit_amount, credit_amount, currency_code, exchange_rate,
        journal_entries(id, entry_date, entry_number, reference_type, reference_id),
        account:accounts(id, code, type)
      `)
            .eq('party_id', partyId)
            .is('deleted_at', null);

        if (journalError) throw parseError(journalError);

        return { invoices, payments, journalLines };
    },

    /**
     * Get party categories
     */
    getCategories: async (companyId: string, type: PartyType) => {
        const { data, error } = await supabase
            .from('party_categories')
            .select('*')
            .eq('company_id', companyId)
            .eq('type', type)
            .order('name', { ascending: true });

        if (error) throw parseError(error);
        return data || [];
    },

    /**
     * Create a party category
     */
    createCategory: async (companyId: string, data: { name: string; type: PartyType }) => {
        const { data: result, error } = await supabase
            .from('party_categories')
            .insert({ company_id: companyId, name: data.name, type: data.type })
            .select()
            .single();

        if (error) {
            if ((error as any).code === '23505') {
                throw new Error('عذراً، هذا الاسم موجود مسبقاً في قائمة الفئات');
            }
            throw parseError(error);
        }
        return result;
    },

    /**
     * Update a party category
     */
    updateCategory: async (id: string, data: { name: string }) => {
        const { data: result, error } = await supabase
            .from('party_categories')
            .update({ name: data.name })
            .eq('id', id)
            .select()
            .single();

        if (error) throw parseError(error);
        return result;
    },

    /**
     * Delete a party category
     */
    deleteCategory: async (id: string) => {
        const { error } = await supabase
            .from('party_categories')
            .delete()
            .eq('id', id);

        if (error) throw parseError(error);
    },

    /**
     * Get company details
     */
    getCompanyDetails: async (companyId: string) => {
        const { data, error } = await supabase
            .from('companies')
            .select('name_ar, address, phone, tax_number, logo_url')
            .eq('id', companyId)
            .single();

        if (error) throw parseError(error);
        return data;
    }
};
