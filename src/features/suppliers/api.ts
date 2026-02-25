
import { supabase } from '../../lib/supabaseClient';
import { SupplierFormData } from './types';

export const suppliersApi = {
  getParties: async (companyId: string) => {
    let query = supabase
      .from('parties')
      .select('*')
      .eq('company_id', companyId)
      .eq('type', 'supplier')
      .is('deleted_at', null);

    return await query.order('name', { ascending: true });
  },

  getPartyTransactions: async (partyId: string) => {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, invoice_number, issue_date, total_amount, type, status')
      .eq('party_id', partyId)
      .order('issue_date', { ascending: true });

    const { data: journals } = await (supabase
      .from('journal_entries') as any)
      .select(`id, entry_number, entry_date, description, reference_type, journal_entry_lines (debit_amount, credit_amount)`)
      .eq('reference_id', partyId)
      .order('entry_date', { ascending: true });

    return { invoices, journals };
  },

  createParty: async (companyId: string, data: SupplierFormData) => {
    const payload = {
      company_id: companyId,
      type: 'supplier' as const,
      name: data.name,
      phone: data.phone,
      email: data.email,
      tax_number: data.tax_number,
      address: data.address,
      category_id: data.category || null,
      status: data.status || 'active',
      balance: data.balance || 0
    };
    return await (supabase.from('parties') as any)
      .insert(payload)
      .select()
      .single();
  },

  updateParty: async (id: string, data: Partial<SupplierFormData>) => {
    const payload: Record<string, any> = {
      name: data.name,
      phone: data.phone,
      email: data.email,
      tax_number: data.tax_number,
      address: data.address,
      category_id: data.category || undefined,
      status: data.status,
      balance: data.balance
    };
    // Remove undefined values
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    return await (supabase.from('parties') as any)
      .update(payload)
      .eq('id', id)
      .select()
      .single();
  },

  deleteParty: async (id: string) => {
    return await (supabase.from('parties') as any).delete().eq('id', id);
  },

  getCategories: async (companyId: string) => {
    const { data, error } = await (supabase.from('party_categories') as any)
      .select('*')
      .eq('company_id', companyId)
      .eq('type', 'supplier')
      .order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  createCategory: async (companyId: string, name: string) => {
    return await (supabase.from('party_categories') as any)
      .insert({ company_id: companyId, name, type: 'supplier' })
      .select()
      .single();
  },

  deleteCategory: async (id: string) => {
    return await (supabase.from('party_categories') as any).delete().eq('id', id);
  },

  search: async (companyId: string, query: string) => {
    const sanitized = query.replace(/[%_\\*()]/g, '');
    if (!sanitized.trim()) return { data: [], error: null };
    return await supabase
      .from('parties' as any)
      .select('*')
      .eq('company_id', companyId)
      .eq('type', 'supplier')
      .is('deleted_at', null)
      .ilike('name', `%${sanitized}%`)
      .limit(10);
  }
};
