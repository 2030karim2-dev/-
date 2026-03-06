
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService } from '../service';
import { useAuthStore } from '../../auth/store';
import { useFeedbackStore } from '../../feedback/store';
import { CreateInvoiceDTO } from '../types';
import { syncStore } from '../../../core/lib/sync-store';
import { useNetworkStatus } from '../../../lib/hooks/useNetworkStatus';
import { RefreshCw } from 'lucide-react';

const HeaderActions: React.FC = () => {
  // Assuming this component will have some JSX and logic here.
  // For now, it's an empty functional component as per the provided snippet.
  return null;
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useFeedbackStore();
  const { isOnline } = useNetworkStatus();

  return useMutation({
    mutationFn: async (data: CreateInvoiceDTO) => {
      if (!user?.company_id || !user?.id) throw new Error("Missing auth context");
      // يتم الآن معالجة المخزون والقيود آلياً في قاعدة البيانات بمجرد إرسال الحالة 'posted'
      return await salesService.processNewSale(user.company_id, user.id, data);
    },
    onSuccess: (invoice) => {
      showToast(`تم إصدار الفاتورة #${invoice.invoice_number} بنجاح وترحيلها للنظام المحاسبي والمخزني`, 'success');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_data'] });
    },
    onError: (error: Error, variables) => {
      // Offline handling for Sales
      if (!isOnline || error.message?.includes('Failed to fetch')) {
        syncStore.enqueue({
          mutationKey: ['sales', 'create'],
          variables: { ...variables, company_id: user?.company_id, user_id: user?.id }
        });
        showToast("تم حفظ الفاتورة محلياً (وضع عدم الاتصال). سيتم المزامنة والترحيل تلقائياً عند عودة الإنترنت.", 'info');
        return;
      }
      showToast(error.message || 'فشل في إصدار الفاتورة', 'error');
    }
  });
};
