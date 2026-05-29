/**
 * Accounts API Layer
 * 
 * Centralized API for chart of accounts operations.
 * Migrated from: src/features/accounting/api/accountsApi.ts
 */

import { supabase, parseError, unwrapSingle, unwrapList, checkRelatedRecords } from './baseApi';
import type { TableInsert, TableUpdate } from '@/core/types/supabase-helpers';

export const accountsApi = {
    /**
     * Fetch all active accounts for a company
     */
    getAccounts: async (companyId: string) => {
        const response = await supabase
            .from('active_accounts')
            .select('id, code, name_ar, name_en, account_type, parent_id, level, is_active, balance, currency_code, company_id, created_at, deleted_at')
            .eq('company_id', companyId)
            .is('deleted_at', null)
            .limit(5000)
            .order('code', { ascending: true });

        return unwrapList(response);
    },

    /**
     * Create a single account
     */
    createAccount: async (account: TableInsert<'accounts'>) => {
        const response = await supabase
            .from('accounts')
            .insert(account)
            .select()
            .single();

        return unwrapSingle(response);
    },

    /**
     * Bulk insert accounts
     */
    insertAccounts: async (accounts: Array<TableInsert<'accounts'>>) => {
        const response = await supabase
            .from('accounts')
            .insert(accounts)
            .select();

        return unwrapList(response);
    },

    /**
     * Soft-delete an account with safety checks
     */
    deleteAccount: async (id: string) => {
        await checkRelatedRecords(
            'journal_entry_lines',
            'account_id',
            id,
            'لا يمكن حذف حساب له قيود محاسبية مرتبطة. قم بتصفير الرصيد أولاً.'
        );

        const response = await supabase
            .from('accounts')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (response.error) throw parseError(response.error);
    },

    /**
     * Update an account
     */
    updateAccount: async (id: string, updates: TableUpdate<'accounts'>) => {
        const response = await supabase
            .from('accounts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        return unwrapSingle(response);
    },

    /**
     * Get a single account by ID
     */
    getAccountById: async (id: string) => {
        const response = await supabase
            .from('accounts')
            .select('*')
            .eq('id', id)
            .single();

        return unwrapSingle(response);
    }
};
