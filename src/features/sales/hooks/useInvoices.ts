import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { salesService } from '../service';
import { useAuthStore } from '@/features/auth/store';
import { useFeedbackStore } from '@/features/feedback/store';
import { invalidateByPreset } from '@/lib/invalidation';
import { useOfflineQueueStore } from '@/core/services/offlineQueueStore';
import { CreateInvoiceDTO } from '../types';

export const useInvoices = () => {
  const { user } = useAuthStore();
  const companyId = user?.company_id;
  return useQuery({
    queryKey: ['invoices', companyId],
    queryFn: () => companyId ? salesService.fetchSalesLog(companyId) : Promise.resolve([]),
    enabled: !!companyId,
  });
};

export const useSalesStats = () => {
  const { user } = useAuthStore();
  const companyId = user?.company_id;
  return useQuery({
    queryKey: ['sales_stats', companyId],
    queryFn: () => companyId ? salesService.getStats(companyId) : Promise.resolve(null),
    enabled: !!companyId,
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
      if (!navigator.onLine || error.message?.includes('Failed to fetch') || error.status === 0) {
        enqueue('CREATE_INVOICE', { ...variables, company_id: user?.company_id, user_id: user?.id });
        showToast("تم حفظ الفاتورة محلياً. سيتم مزامنتها عند عودة الاتصال.", 'info');
        return;
      }
      showToast(error.message || 'فشل في إصدار الفاتورة', 'error');
    }
  });
};
