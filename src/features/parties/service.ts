
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
  operation_type?: string;
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

  getStatement: async (partyId: string, _type: PartyType) => {
    const { journalLines } = await partiesApi.getTransactionDetails(partyId);

    const movements: StatementMovement[] = (journalLines || [])
      .filter((line: any) => {
        const code = line.account?.code;
        // Strict Filter: Only show lines that affect the actual Party debt/credit accounts
        // Typically Accounts Receivable (1100...) or Accounts Payable (2100...)
        // This excludes internal Inventory, Revenue, Cash, and COGS lines even if tagged with party_id
        return code?.startsWith('1100') || code?.startsWith('2100');
      })
      .map((line: any) => {
        const entry = line.journal_entries;
        if (!entry) return null;

        let description = line.description || entry.description || 'حركة محاسبية';
        let operationType = 'قيد محاسبي';
        let reference = entry.entry_number ? `JV-${entry.entry_number}` : 'JV';

        // Enhance reference and operation type based on context
        const refType = entry.reference_type;
        if (refType === 'sales_invoice' || refType === 'invoice') {
          reference = 'INV';
          operationType = 'فاتورة مبيعات';
        } else if (refType === 'purchase_invoice') {
          reference = 'PUR';
          operationType = 'فاتورة مشتريات';
        } else if (refType === 'payment' || refType === 'payment_bond') {
          reference = 'PAY';
          operationType = 'سند دفع';
        } else if (refType === 'receipt' || refType === 'receipt_bond') {
          reference = 'RCV';
          operationType = 'سند قبض';
        } else if (refType === 'sale_return' || refType === 'sales_return' || refType === 'return_sale') {
          reference = 'RET';
          operationType = 'مرتجع مبيعات';
        } else if (refType === 'purchase_return' || refType === 'return_purchase') {
          reference = 'PRET';
          operationType = 'مرتجع مشتريات';
        } else if (refType === 'expense') {
          reference = 'EXP';
          operationType = 'صرف مصروف';
        }

        return {
          id: line.id,
          date: entry.entry_date,
          ref: reference,
          operation_type: operationType,
          desc: description,
          type: entry.reference_type || 'journal',
          debit: Number(line.debit_amount) || 0,
          credit: Number(line.credit_amount) || 0,
          currency: line.currency_code
        };
      })
      .filter(m => m !== null) as StatementMovement[];

    // Sort by date then by ID for a stable, professional order
    movements.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.id.localeCompare(b.id);
    });

    // Calculate running balance (Net Position)
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
    try {
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
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error("عذراً، هذا الاسم موجود مسبقاً في قائمة الفئات");
      }
      throw error;
    }
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

  getCompanyDetails: async (companyId: string) => {
    const { data, error } = await supabase
      .from('companies')
      .select('name_ar, address, phone, tax_number, logo_url')
      .eq('id', companyId)
      .single();
    if (error) throw error;
    return data;
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
