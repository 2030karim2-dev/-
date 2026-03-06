import { useQuery } from '@tanstack/react-query';
import { partiesApi } from '../parties/api';

export interface Customer {
    id: string;
    name: string;
    balance: number;
    phone?: string;
    email?: string;
}

export const useCustomers = (companyId: string) => {
    return useQuery<Customer[]>({
        queryKey: ['customers', companyId],
        queryFn: async () => {
            const { data, error } = await partiesApi.getParties(companyId, 'customer');

            if (error) throw error;
            return (data || []) as Customer[];
        },
        enabled: !!companyId,
    });
};

export const useCustomerSearch = (companyId: string, searchTerm: string) => {
    return useQuery<Customer[]>({
        queryKey: ['customer-search', companyId, searchTerm],
        queryFn: async () => {
            if (!searchTerm.trim()) return [];

            const { data, error } = await partiesApi.search(companyId, 'customer', searchTerm);

            if (error) throw error;
            return (data || []) as Customer[];
        },
        enabled: !!companyId && !!searchTerm.trim(),
    });
};

export const useCustomerStats = (companyId: string) => {
    return useQuery({
        queryKey: ['customer-stats', companyId],
        queryFn: async () => {
            const { data, error } = await partiesApi.getParties(companyId, 'customer');

            if (error) throw error;

            const customers = (data || []) as Array<{ balance?: number }>;
            const totalBalance = customers.reduce((sum, c) => sum + (c.balance || 0), 0);

            return {
                totalCustomers: customers.length,
                totalBalance,
                activeCustomers: customers.filter(c => c.balance && c.balance > 0).length,
            };
        },
        enabled: !!companyId,
    });
};
