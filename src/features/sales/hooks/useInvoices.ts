
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService } from '../service';
import { useAuthStore } from '../../auth/store';
import { useFeedbackStore } from '../../feedback/store';
import { CreateInvoiceDTO } from '../types';

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useFeedbackStore();

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
    onError: (error: Error) => {
      showToast(error.message || 'فشل في إصدار الفاتورة', 'error');
    }
  });
};
