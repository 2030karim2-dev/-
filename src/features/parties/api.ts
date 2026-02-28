
import { supabase } from '../../lib/supabaseClient';
import { PartyFormData, PartyType } from './types';

/**
 * واجهة التفاعل مع جدول العملاء والموردين
 * تتبع هيكلية قاعدة البيانات v2.0
 */
export const partiesApi = {
  getParties: async (companyId: string, type: PartyType) => {
    return await (supabase.from('parties') as any)
      .select('*, party_categories:category_id(id, name)')
      .eq('company_id', companyId)
      .eq('type', type)
      .is('deleted_at', null)
      .order('name', { ascending: true });
  },

  saveParty: async (companyId: string, data: PartyFormData, id?: string) => {
    const payload: any = {
      company_id: companyId,
      type: data.type,
      name: data.name,
      phone: data.phone || null,
      email: (data as any).email || null,
      tax_number: (data as any).tax_number || null,
      address: (data as any).address || null,
      status: (data as any).status || 'active',
      category_id: (data as any).category_id || null,
      balance: 0
    };

    if (id) {
      // Don't overwrite balance or company_id on updates
      delete payload.balance;
      delete payload.company_id;
      return await (supabase.from('parties') as any).update(payload).eq('id', id).select().single();
    }
    return await (supabase.from('parties') as any).insert(payload).select().single();
  },

  deleteParty: async (id: string) => {
    // Safety check: prevent deleting parties with existing invoices
    const { count, error: checkError } = await supabase.from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('party_id', id);
    if (checkError) throw checkError;
    if (count && count > 0) {
      throw new Error('لا يمكن حذف طرف له فواتير مرتبطة. قم بحظره بدلاً من حذفه.');
    }
    return await (supabase.from('parties') as any).update({ deleted_at: new Date().toISOString() }).eq('id', id);
  },

  search: async (companyId: string, type: PartyType, query: string) => {
    const sanitized = query.replace(/[%_\\*()]/g, '');
    if (!sanitized.trim()) return { data: [], error: null };
    return await (supabase.from('parties') as any)
      .select('*')
      .eq('company_id', companyId)
      .eq('type', type)
      .is('deleted_at', null)
      .or(`name.ilike.%${sanitized}%,phone.ilike.%${sanitized}%`)
      .limit(10);
  },

  getTransactionDetails: async (partyId: string) => {
    const { data: invoices, error: invError } = await supabase
      .from('invoices')
      .select('id, invoice_number, issue_date, total_amount, type, status, payment_method, currency_code, exchange_rate')
      .eq('party_id', partyId)
      .order('issue_date', { ascending: true });

    if (invError) throw invError;

    const { data: payments, error: payError } = await (supabase.from('payments') as any)
      .select('id, payment_number, payment_date, amount, type, notes, currency_code, exchange_rate')
      .eq('party_id', partyId)
      .order('payment_date', { ascending: true });

    if (payError) throw payError;

    return { invoices, payments };
  }
};
