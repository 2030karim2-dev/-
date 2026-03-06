
import { partiesApi } from './api';
import { supabase } from '../../lib/supabaseClient';
import { Party, PartyStats, PartyFormData, PartyType, PartyCategory } from './types';

interface StatementMovement {
  id: string;
  date: string;
  ref: string;
  desc: string;
  type: string;
  debit: number;
  credit: number;
  currency: string;
}

export const partiesService = {
  getParties: async (companyId: string, type: PartyType): Promise<Party[]> => {
    const { data, error } = await partiesApi.getParties(companyId, type);
    if (error) throw error;
    return (data || []).map((p: Record<string, unknown>) => ({
      ...p,
      category_id: p.category_id,
      category: (p.party_categories as Record<string, unknown>)?.name || 'عام',
      status: p.status || 'active'
    })) as Party[];
  },

  getStatement: async (partyId: string, type: PartyType) => {
    const { invoices, payments, journalLines } = await partiesApi.getTransactionDetails(partyId);

    const movements: StatementMovement[] = [];

    // Process Invoices
    invoices.forEach((inv: Record<string, unknown>) => {
      const isCustomer = type === 'customer';
      const baseAmount = Number(inv.total_amount) * (Number(inv.exchange_rate) || 1);

      let description = '';
      if (inv.type === 'sale') description = 'فاتورة مبيعات';
      else if (inv.type === 'purchase') description = 'فاتورة مشتريات';
      else if (inv.type === 'sales_return') description = 'مرتجع مبيعات';
      else if (inv.type === 'purchase_return') description = 'مرتجع مشتريات';
      else description = 'فاتورة';

      movements.push({
        id: inv.id as string,
        date: inv.issue_date as string,
        ref: inv.invoice_number as string,
        desc: description,
        type: inv.type as string,
        debit: isCustomer ? (inv.type === 'sale' ? baseAmount : 0) : (inv.type === 'purchase_return' ? baseAmount : 0),
        credit: isCustomer ? (inv.type === 'sales_return' ? baseAmount : 0) : (inv.type === 'purchase' ? baseAmount : 0),
        currency: inv.currency_code as string
      });

      // If it's a cash invoice, it balances out immediately
      if (inv.payment_method === 'cash') {
        movements.push({
          id: `${inv.id}-payment`,
          date: inv.issue_date as string,
          ref: inv.invoice_number as string,
          desc: 'سداد نقدي (فوري)',
          type: 'payment',
          debit: isCustomer ? 0 : baseAmount,
          credit: isCustomer ? baseAmount : 0,
          currency: inv.currency_code as string
        });
      }
    });

    // Process Payments (Bonds)
    payments.forEach((pay: Record<string, unknown>) => {
      const baseAmount = Number(pay.amount) * (Number(pay.exchange_rate) || 1);

      movements.push({
        id: pay.id as string,
        date: pay.payment_date as string,
        ref: pay.payment_number as string,
        desc: (pay.notes as string) || (pay.type === 'receipt' ? 'سند قبض' : 'سند صرف'),
        type: pay.type as string,
        debit: pay.type === 'payment' ? baseAmount : 0,
        credit: pay.type === 'receipt' ? baseAmount : 0,
        currency: pay.currency_code as string
      });
    });

    // Process Ledger (Journal Entries)
    (journalLines || []).forEach((line: any) => {
      const entry = line.journal_entries;
      if (!entry) return;

      // CRITICAL FILTER: Skip journal entries that are linked to documents we already processed
      const systemTypes = ['sale', 'purchase', 'receipt', 'payment', 'return', 'sales_return', 'purchase_return'];
      if (entry.reference_type && systemTypes.includes(entry.reference_type)) {
        return;
      }

      movements.push({
        id: line.id,
        date: entry.entry_date,
        ref: entry.entry_number ? `JV-${entry.entry_number}` : 'JV',
        desc: line.description || entry.description || 'تعديل/قيد محاسبي',
        type: 'journal',
        debit: Number(line.debit_amount) || 0,
        credit: Number(line.credit_amount) || 0,
        currency: line.currency_code
      });
    });

    // Sort by date then by id to ensure stable sort
    movements.sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.id.localeCompare(b.id);
    });

    // Calculate running balance
    let runningBalance = 0;
    return movements.map(m => {
      runningBalance += (m.debit - m.credit);
      return { ...m, balance: runningBalance };
    });
  },

  getCategoriesWithStats: async (companyId: string, type: PartyType): Promise<PartyCategory[]> => {
    const { data: categories, error: catError } = await supabase.from('party_categories')
      .select('*')
      .eq('company_id', companyId)
      .eq('type', type)
      .order('name', { ascending: true });

    if (catError) throw catError;

    const { data: parties } = await partiesApi.getParties(companyId, type);
    // partiesApi.getParties returns {data, error} but we use it here
    const partyList = Array.isArray(parties) ? parties : [];

    const result = (Array.isArray(categories) ? categories : []).map((cat: Record<string, unknown>) => ({
      id: cat.id as string,
      name: cat.name as string,
      type: cat.type as PartyType,
      count: partyList.filter((p: Record<string, unknown>) => p.category_id === cat.id).length
    }));

    return result;
  },

  calculateStats: (parties: Party[]): PartyStats => ({
    totalCount: parties.length,
    totalBalance: parties.reduce((sum, p) => sum + (Number(p.balance) || 0), 0),
    activeCount: parties.length,
    blockedCount: 0,
  }),

  saveParty: async (companyId: string, data: PartyFormData, id?: string) => {
    if (!data.name) throw new Error("الاسم مطلوب");
    const { error } = await partiesApi.saveParty(companyId, data, id);
    if (error) throw error;
  },

  deleteParty: async (id: string) => {
    const { error } = await partiesApi.deleteParty(id);
    if (error) throw error;
  },

  saveCategory: async (companyId: string, data: { name: string, type: PartyType }, id?: string) => {
    if (id) {
      const { data: result, error } = await supabase.from('party_categories')
        .update({ name: data.name } as never)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    }
    const { data: result, error } = await supabase.from('party_categories')
      .insert({ company_id: companyId, name: data.name, type: data.type } as never)
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  deleteCategory: async (id: string) => {
    const { error } = await supabase.from('party_categories').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  search: async (companyId: string, type: PartyType, query: string) => {
    const { data, error } = await partiesApi.search(companyId, type, query);
    if (error) throw error;
    return (data || []) as unknown as Party[];
  },

  getOrCreateGeneralParty: async (companyId: string, type: PartyType): Promise<Party> => {
    const name = type === 'customer' ? 'الزبون العام' : 'المورد العام';
    const { data: searchResults, error: searchError } = await partiesApi.search(companyId, type, name);
    if (searchError) throw searchError;

    const existing = (searchResults || []).find((p: Record<string, unknown>) => p.name === name);
    if (existing) return existing as unknown as Party;

    const { data: created, error: createError } = await partiesApi.saveParty(companyId, {
      name,
      type,
      status: 'active',
      balance: 0
    });

    if (createError) throw createError;
    return (created as unknown) as Party;
  }
};
