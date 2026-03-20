import { useQuery } from '@tanstack/react-query';
import { salesApi } from '@/features/sales/api';

export const useInvoiceDetails = (invoiceId: string | null) => {
  return useQuery({
    queryKey: ['invoice_details', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      const { data, error } = await salesApi.getInvoiceDetails(invoiceId);
      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId,
  });
};
