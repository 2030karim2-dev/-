
import { customersApi } from './api';
import { partiesService } from '../parties/service';
import { Customer, CustomerStats, CustomerFormData } from './types';

export const customersService = {
  getCustomers: async (companyId: string): Promise<Customer[]> => {
    const { data, error } = await customersApi.getParties(companyId);
    if (error) throw error;
    return (data || []).map((p: any) => ({
      ...p,
      category_id: p.category_id,
      category: p.party_categories?.name || 'عام',
      status: p.status || 'active'
    })) as Customer[];
  },

  getStatement: async (partyId: string) => {
    return await partiesService.getStatement(partyId, 'customer');
  },

  getCategoriesWithStats: async (companyId: string) => {
    return await partiesService.getCategoriesWithStats(companyId, 'customer');
  },

  calculateStats: (customers: Customer[]): CustomerStats => {
    return {
      totalCount: customers.length,
      totalBalance: customers.reduce((sum, p) => sum + (Number(p.balance) || 0), 0),
      activeCount: customers.filter(p => (p as any).status !== 'blocked').length,
      blockedCount: customers.filter(p => (p as any).status === 'blocked').length,
    };
  },

  saveCustomer: async (companyId: string, data: CustomerFormData, id?: string) => {
    if (!data.name) throw new Error("الاسم مطلوب");
    if (id) {
      const { error } = await customersApi.updateParty(id, data);
      if (error) throw error;
    } else {
      const { error } = await customersApi.createParty(companyId, data);
      if (error) throw error;
    }
  },

  deleteCustomer: async (id: string) => {
    const { error } = await customersApi.deleteParty(id);
    if (error) throw error;
  },

  search: async (companyId: string, query: string) => {
    const { data, error } = await customersApi.search(companyId, query);
    if (error) throw error;
    return data || [];
  }
};
