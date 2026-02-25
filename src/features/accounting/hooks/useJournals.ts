
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { journalService } from '../services/journalService';
import { useAuthStore } from '../../auth/store';
import { useFeedbackStore } from '../../feedback/store';
import { JournalEntryFormData } from '../types/models';
import { PostTransactionUsecase } from '../../../core/usecases/accounting/PostTransactionUsecase';
import { AuthorizeActionUsecase } from '../../../core/usecases/auth/AuthorizeActionUsecase';

export const useJournals = () => {
  const { user } = useAuthStore();
  const companyId = user?.company_id;

  return useInfiniteQuery({
    queryKey: ['journals', companyId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!companyId) return [];
      try {
        const result = await journalService.formatJournalsForUI(companyId, pageParam);
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || !Array.isArray(lastPage) || lastPage.length < 50) {
        return undefined;
      }
      return allPages?.length ?? 1;
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useJournalMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useFeedbackStore();

  const mutation = useMutation({
    mutationFn: async (data: JournalEntryFormData) => {
      if (!user?.company_id || !user?.id) throw new Error("جلسة العمل منتهية");

      // 1. فحص الصلاحية
      AuthorizeActionUsecase.validateAction(user as any, 'post_journal_entry');

      // 2. التنفيذ عبر Usecase لضمان صحة السنة المالية والتوازن
      return PostTransactionUsecase.execute(data, user.company_id, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['financials'] });
      showToast('تم ترحيل القيد المحاسبي بنجاح وتحديث أرصدة الأستاذ العام', 'success');
    },
    onError: (error: any) => {
      showToast(error.message, 'error', error);
    }
  });

  return {
    createJournal: mutation.mutate,
    isCreating: mutation.isPending
  };
};