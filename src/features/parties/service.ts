
import { partiesApi } from './api';
import { supabase } from '../../lib/supabaseClient';
import { Party, PartyStats, PartyFormData, PartyType, PartyCategory } from './types';

export const partiesService = {
  getParties: async (companyId: string, type: PartyType): Promise<Party[]> => {
    const { data, error } = await partiesApi.getParties(companyId, type);
    if (error) throw error;
    return (data || []).map((p: any) => ({
      ...p,
      category_id: p.category_id,
      category: p.party_categories?.name || 'عام',
      status: p.status || 'active'
    })) as Party[];
  },

  getStatement: async (partyId: string, type: PartyType) => {
    const { invoices, payments } = await partiesApi.getTransactionDetails(partyId);

    const movements: any[] = [];

    // Process Invoices
    invoices.forEach((inv: any) => {
      const isCustomer = type === 'customer';
      const baseAmount = Number(inv.total_amount) * (Number(inv.exchange_rate) || 1);

      movements.push({
        id: inv.id,
        date: inv.issue_date,
        ref: inv.invoice_number,
        desc: inv.type === 'sale' ? 'فاتورة مبيعات' : 'فاتورة مشتريات',
        type: inv.type,
        debit: isCustomer ? baseAmount : 0,
        credit: isCustomer ? 0 : baseAmount,
        currency: inv.currency_code
      });

      // If it's a cash invoice, we add a pseudo-payment to balance it out in the statement
      if (inv.payment_method === 'cash') {
        movements.push({
          id: `${inv.id}-payment`,
          date: inv.issue_date,
          ref: inv.invoice_number,
          desc: 'سداد نقدي (فوري)',
          type: 'payment',
          debit: isCustomer ? 0 : baseAmount,
          credit: isCustomer ? baseAmount : 0,
          currency: inv.currency_code
        });
      }
    });

    // Process Payments (Bonds)
    payments.forEach((pay: any) => {
      const isCustomer = type === 'customer';
      const baseAmount = Number(pay.amount) * (Number(pay.exchange_rate) || 1);

      movements.push({
        id: pay.id,
        date: pay.payment_date,
        ref: pay.payment_number,
        desc: pay.notes || (pay.type === 'receipt' ? 'سند قبض' : 'سند صرف'),
        type: pay.type,
        debit: pay.type === 'payment' ? baseAmount : 0,
        credit: pay.type === 'receipt' ? baseAmount : 0,
        currency: pay.currency_code
      });
    });

    // Sort by date
    movements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let runningBalance = 0;
    return movements.map(m => {
      runningBalance += (m.debit - m.credit);
      return { ...m, balance: runningBalance };
    });
  },

  getCategoriesWithStats: async (companyId: string, type: PartyType): Promise<PartyCategory[]> => {
    const { data: categories, error: catError } = await (supabase.from('party_categories') as any)
      .select('*')
      .eq('company_id', companyId)
      .eq('type', type)
      .order('name', { ascending: true });

    if (catError) throw catError;

    const { data: parties, error: partyError } = await partiesApi.getParties(companyId, type);
    // partiesApi.getParties returns {data, error} but we use it here
    const partyList = Array.isArray(parties) ? parties : (parties as any)?.data || [];

    const result = (Array.isArray(categories) ? categories : []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      count: partyList.filter((p: any) => p.category === cat.name).length
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
      const { data: result, error } = await (supabase.from('party_categories') as any)
        .update({ name: data.name })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    }
    const { data: result, error } = await (supabase.from('party_categories') as any)
      .insert({ company_id: companyId, name: data.name, type: data.type })
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  deleteCategory: async (id: string) => {
    const { error } = await (supabase.from('party_categories') as any).delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  search: async (companyId: string, type: PartyType, query: string) => {
    const { data, error } = await partiesApi.search(companyId, type, query);
    if (error) throw error;
    return (data || []) as unknown as Party[];
  }
};
