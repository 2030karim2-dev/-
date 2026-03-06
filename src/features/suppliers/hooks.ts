import { useQuery } from '@tanstack/react-query';
import { supplierApi } from './api';

export interface Supplier {
    id: string;
    name: string;
    balance: number;
    phone?: string;
    email?: string;
}

export const useSuppliers = (companyId: string) => {
    return useQuery<Supplier[]>({
        queryKey: ['suppliers', companyId],
        queryFn: async () => {
            const { data, error } = await supplierApi.getSuppliers(companyId);

            if (error) throw error;
            return (data || []) as Supplier[];
        },
        enabled: !!companyId,
    });
};

export const useSupplierSearch = (companyId: string, searchTerm: string) => {
    return useQuery<Supplier[]>({
        queryKey: ['supplier-search', companyId, searchTerm],
        queryFn: async () => {
            if (!searchTerm.trim()) return [];

            const { data, error } = await supplierApi.searchSuppliers(companyId, searchTerm);

            if (error) throw error;
            return (data || []) as Supplier[];
        },
        enabled: !!companyId && !!searchTerm.trim(),
    });
};

export const useSupplierStats = (companyId: string) => {
    return useQuery({
        queryKey: ['supplier-stats', companyId],
        queryFn: async () => {
            const { data, error } = await supplierApi.getSupplierStats(companyId);

            if (error) throw error;

            const suppliers = (data || []) as Array<{ balance?: number }>;
            const totalBalance = suppliers.reduce((sum, s) => sum + (s.balance || 0), 0);

            return {
                totalSuppliers: suppliers.length,
                totalBalance,
                activeSuppliers: suppliers.filter(s => s.balance && s.balance > 0).length,
            };
        },
        enabled: !!companyId,
    });
};
