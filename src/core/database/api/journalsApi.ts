/**
 * Journals API Layer
 * 
 * Centralized API for journal entry operations.
 * Migrated from: src/features/accounting/api/journalsApi.ts
 */

import Decimal from 'decimal.js';
import { safeDecimal, SOX_BALANCE_TOLERANCE } from '../../utils/decimalUtils';
import { supabase, parseError } from './baseApi';

export const journalsApi = {
    /**
     * Fetch paginated journal entries with lines and relations
     */
    fetchJournals: async (companyId: string, pageParam = 0) => {
        const limit = 50;
        const from = pageParam * limit;
        const to = from + limit - 1;

        const response = await supabase
            .from('journal_entries')
            .select(`
        id,
        entry_number,
        entry_date,
        description,
        reference_type,
        reference_id,
        currency_code,
        exchange_rate,
        company_id,
        created_by,
        created_at,
        deleted_at,
        journal_entry_lines (
          id,
          debit_amount,
          credit_amount,
          description,
          account_id,
          account:accounts (
            id,
            name_ar,
            code
          )
        ),
        created_by_profile:profiles(id, full_name)
      `)
            .eq('company_id', companyId)
            .is('deleted_at', null)
            .order('entry_date', { ascending: false })
            .order('entry_number', { ascending: false })
            .range(from, to);

        if (response.error) throw parseError(response.error);
        return response;
    },

    /**
     * Post a journal entry via RPC with validation
     */
    postJournalEntryRPC: async (
        companyId: string,
        userId: string,
        data: {
            date: string;
            description: string;
            reference_type?: string;
            currency_code?: string;
            exchange_rate?: number;
            lines: Array<{
                debit?: number | string;
                credit?: number | string;
                account_id: string;
                party_id?: string;
                description?: string;
            }>;
        }
    ) => {
        // 1. Calculate and validate balance using precise Decimal math
        const totalDebit = data.lines.reduce((sum, l) => sum.plus(safeDecimal(l.debit)), new Decimal(0));
        const totalCredit = data.lines.reduce((sum, l) => sum.plus(safeDecimal(l.credit)), new Decimal(0));

        const imbalance = totalDebit.minus(totalCredit).absoluteValue();
        if (imbalance.greaterThan(SOX_BALANCE_TOLERANCE)) {
            throw parseError(`القيد غير متوازن: مدين ${totalDebit.toFixed(2)} ≠ دائن ${totalCredit.toFixed(2)}`);
        }

        // 2. Call the Atomic RPC
        const { data: journalId, error } = await supabase.rpc('post_manual_journal', {
            p_company_id: companyId,
            p_user_id: userId,
            p_date: data.date,
            p_description: data.description,
            p_reference_type: data.reference_type || 'manual',
            p_currency_code: data.currency_code || 'SAR',
            p_exchange_rate: Number(data.exchange_rate) || 1,
            p_lines: data.lines.map(l => ({
                account_id: l.account_id,
                party_id: l.party_id || null,
                debit: Number(l.debit) || 0,
                credit: Number(l.credit) || 0,
                description: l.description || null
            }))
        });

        if (error) {
            console.error('Error in post_manual_journal RPC:', error);
            throw parseError(error);
        }

        return journalId;
    }
};
