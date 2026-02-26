
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { salesApi } from './api';
import { salesService } from './service';
import { useAuthStore } from '../auth/store';
import { useFeedbackStore } from '../feedback/store';
import { CreateInvoicePayload } from './types';
import { supabase } from '../../lib/supabaseClient';

export const useInvoices = () => {
  const { user } = useAuthStore();
  const companyId = user?.company_id;
  return useQuery({
    queryKey: ['invoices', companyId],
    queryFn: () => companyId ? salesService.fetchSalesLog(companyId) : Promise.resolve([]),
    enabled: !!companyId,
  });
};

// Add missing useSalesStats hook to fix import error in SalesStats.tsx
export const useSalesStats = () => {
  const { user } = useAuthStore();
  const companyId = user?.company_id;
  return useQuery({
    queryKey: ['sales_stats', companyId],
    queryFn: () => companyId ? salesService.getStats(companyId) : Promise.resolve(null),
    enabled: !!companyId,
  });
};

// Add missing useInvoiceDetails hook to fix import error in InvoiceDetailsModal.tsx
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

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useFeedbackStore();

  return useMutation({
    mutationFn: async (data: any) => {
      if (!user?.company_id || !user?.id) throw new Error("Missing auth context");
      return await salesService.processNewSale(user.company_id, user.id, data);
    },
    onSuccess: (invoice) => {
      showToast(`تم اعتماد الفاتورة بنجاح`, 'success');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_data'] });
    },
    onError: (error: Error) => {
      showToast(error.message || 'فشل في إصدار الفاتورة', 'error');
    }
  });
};

export const useNextInvoiceNumber = () => {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['next_invoice_number', user?.company_id],
    queryFn: async () => {
      if (!user?.company_id) return '---';
      const { data, error } = await supabase.rpc('get_next_sequence', {
        p_company_id: user.company_id,
        p_type: 'sale'
      } as any);
      if (error) return '---';
      return data;
    },
    enabled: !!user?.company_id,
    staleTime: 0, // نريد دائماً أحدث رقم
  });
};
