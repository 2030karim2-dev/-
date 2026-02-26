import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { purchasesService } from './service';
import { useAuthStore } from '../auth/store';
import { useFeedbackStore } from '../feedback/store';
import { CreatePurchaseDTO, CreatePaymentDTO } from './types';
import { purchasesApi } from './api';
import { usePartySearch } from '../parties/hooks';

// Fix: Added missing usePurchases hook to fetch purchase history
export const usePurchases = () => {
  const { user } = useAuthStore();
  const companyId = user?.company_id;
  return useQuery({
    queryKey: ['purchases', companyId],
    queryFn: () => companyId ? purchasesService.getPurchases(companyId) : Promise.resolve([]),
    enabled: !!companyId,
  });
};

// Fix: Added missing usePurchaseStats hook for dashboard summary
export const usePurchaseStats = () => {
  const { user } = useAuthStore();
  const companyId = user?.company_id;
  return useQuery({
    queryKey: ['purchase_stats', companyId],
    queryFn: () => companyId ? purchasesService.getStats(companyId) : Promise.resolve(null),
    enabled: !!companyId,
  });
};

// Fix: Added missing usePurchaseDetails hook for viewing a single invoice
export const usePurchaseDetails = (purchaseId: string | null) => {
  return useQuery({
    queryKey: ['purchase_details', purchaseId],
    queryFn: async () => {
      if (!purchaseId) return null;
      const { data, error } = await purchasesApi.getPurchaseDetails(purchaseId);
      if (error) throw error;
      return data as any; // Cast to any to avoid strict type checks on joined tables
    },
    enabled: !!purchaseId,
  });
};

export const useCreatePurchase = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useFeedbackStore();

  return useMutation({
    mutationFn: async (data: CreatePurchaseDTO) => {
      if (!user?.company_id || !user?.id) throw new Error("Authentication failed");

      // نرسل الفاتورة بحالة 'posted' لتفعيل الـ Trigger المخزني والمحاسبي في SQL
      return purchasesService.processPurchase(data, user.company_id, user.id);
    },
    onSuccess: (invoice) => {
      showToast(`تم توريد الفاتورة بنجاح وتحديث الأرصدة المخزنية والمالية`, 'success');
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchase_stats'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (err: Error) => {
      showToast(err.message || "فشل توريد الفاتورة", 'error');
    }
  });
};

// Fix: Added missing useCreatePayment hook for supplier payments
export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useFeedbackStore();

  return useMutation({
    mutationFn: async (data: CreatePaymentDTO) => {
      if (!user?.company_id || !user?.id) throw new Error("Authentication failed");
      return purchasesApi.createSupplierPayment(data, user.company_id, user.id);
    },
    onSuccess: () => {
      showToast('تم تسجيل سند الصرف بنجاح', 'success');
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchase_stats'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (err: Error) => showToast(err.message || "فشل تسجيل السند", 'error')
  });
};

// Fix: Added missing usePurchasesAnalytics hook for charting
export const usePurchasesAnalytics = () => {
  const { user } = useAuthStore();
  const companyId = user?.company_id;
  return useQuery({
    queryKey: ['purchases_analytics', companyId],
    queryFn: () => companyId ? purchasesService.getAnalytics(companyId) : Promise.resolve(null),
    enabled: !!companyId,
  });
};

// Fix: Added missing useSupplierSearch hook for purchase forms
export const useSupplierSearch = (query: string) => {
  return usePartySearch('supplier', query);
};
