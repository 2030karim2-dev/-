
import { suppliersApi } from './api';
import { partiesService } from '../parties/service';
import { Supplier, SupplierStats, SupplierFormData } from './types';

export const suppliersService = {
  getSuppliers: async (companyId: string): Promise<Supplier[]> => {
    const { data, error } = await suppliersApi.getParties(companyId);
    if (error) throw error;
    return data || [];
  },

  getStatement: async (partyId: string) => {
    return await partiesService.getStatement(partyId, 'supplier');
  },

  getCategoriesWithStats: async (companyId: string) => {
    return await partiesService.getCategoriesWithStats(companyId, 'supplier');
  },

  calculateStats: (suppliers: Supplier[]): SupplierStats => {
    return {
      totalCount: suppliers.length,
      totalBalance: suppliers.reduce((sum, p) => sum + (Number(p.balance) || 0), 0),
      activeCount: suppliers.filter(p => (p as any).status !== 'blocked').length,
      blockedCount: suppliers.filter(p => (p as any).status === 'blocked').length,
    };
  },

  saveSupplier: async (companyId: string, data: SupplierFormData, id?: string) => {
    if (!data.name) throw new Error("الاسم مطلوب");
    if (id) {
      const { error } = await suppliersApi.updateParty(id, data);
      if (error) throw error;
    } else {
      const { error } = await suppliersApi.createParty(companyId, data);
      if (error) throw error;
    }
  },

  deleteSupplier: async (id: string) => {
    const { error } = await suppliersApi.deleteParty(id);
    if (error) throw error;
  },

  search: async (companyId: string, query: string) => {
    const { data, error } = await suppliersApi.search(companyId, query);
    if (error) throw error;
    return data || [];
  }
};
