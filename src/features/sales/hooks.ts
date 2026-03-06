
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { salesApi } from './api';
import { salesService } from './service';
import { useAuthStore } from '../auth/store';
import { useFeedbackStore } from '../feedback/store';
import { CreateInvoiceDTO } from './types';
import { invalidateByPreset } from '../../lib/invalidation';
import { useOfflineQueueStore } from '../../core/services/offlineQueueStore';

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
  const { enqueue } = useOfflineQueueStore();

  return useMutation({
    mutationFn: async (data: CreateInvoiceDTO) => {
      if (!user?.company_id || !user?.id) throw new Error("Missing auth context");
      return await salesService.processNewSale(user.company_id, user.id, data);
    },
    onSuccess: () => {
      showToast(`تم اعتماد الفاتورة بنجاح`, 'success');
      invalidateByPreset(queryClient, 'sale');
    },
    onError: (error: any, variables) => {
      // If it's a network error, enqueue for offline processing
      if (!navigator.onLine || error.message?.includes('Failed to fetch') || error.status === 0) {
        enqueue('CREATE_INVOICE', { ...variables, company_id: user?.company_id, user_id: user?.id });
        showToast("تم حفظ الفاتورة محلياً. سيتم مزامنتها عند عودة الاتصال.", 'info');
        return;
      }
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
      const { data, error } = await salesApi.getNextSequence(user.company_id, 'sale');
      if (error) return '---';
      return data;
    },
    enabled: !!user?.company_id,
    staleTime: 0, // نريد دائماً أحدث رقم
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();
  const { showToast } = useFeedbackStore();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await salesApi.deleteInvoice(id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      showToast('تم حذف الفاتورة بنجاح', 'success');
      invalidateByPreset(queryClient, 'sale');
    },
    onError: (error: any) => {
      showToast(error.message || 'فشل في حذف الفاتورة', 'error');
    }
  });
};
