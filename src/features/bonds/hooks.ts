
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bondsService } from './service';
import { useAuthStore } from '../auth/store';
import { useFeedbackStore } from '../feedback/store';
import { BondType, BondFormData } from './types';
import { AuthorizeActionUsecase } from '../../core/usecases/auth/AuthorizeActionUsecase';

export const useBonds = (type: BondType) => {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['bonds', user?.company_id, type],
    queryFn: () => user?.company_id ? bondsService.fetchBonds(user.company_id, type) : Promise.resolve([]),
    enabled: !!user?.company_id,
  });
};

export const useBondMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useFeedbackStore();

  return useMutation({
    mutationFn: async (data: BondFormData) => {
      if (!user?.company_id || !user?.id) throw new Error("جلسة العمل منتهية");

      // فحص الصلاحية لإصدار السندات
      AuthorizeActionUsecase.validateAction(user as any, 'create_bond');

      return bondsService.createBond(user.company_id, user.id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bonds', user?.company_id] });
      queryClient.invalidateQueries({ queryKey: ['payments', user?.company_id] });
      queryClient.invalidateQueries({ queryKey: ['financials'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      showToast(`تم إصدار سند ال${variables.type === 'receipt' ? 'قبض' : 'صرف'} وترحيله آلياً`, 'success');
    },
    onError: (error: any) => {
      showToast(error.message, 'error', error);
    }
  });
};