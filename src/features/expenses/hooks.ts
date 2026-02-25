import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesService } from './service';
import { useAuthStore } from '../auth/store';
import { useFeedbackStore } from '../feedback/store';
import { ExpenseFormData } from './types';
import { useMemo } from 'react';
import { AuthorizeActionUsecase } from '../../core/usecases/auth/AuthorizeActionUsecase';
import { supabase } from '../../lib/supabaseClient';

export const useNextExpenseNumber = () => {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['next_expense_number', user?.company_id],
    queryFn: async () => {
      if (!user?.company_id) return '---';
      const { data, error } = await supabase.rpc('get_next_sequence', {
        p_company_id: user.company_id,
        p_type: 'expense'
      } as any);

      if (error) {
        console.warn('Failed to fetch sequence:', error);
        return '';
      }
      return data;
    },
    enabled: !!user?.company_id,
    staleTime: 0,
  });
};

export const useExpenseCategories = () => {
  const { user } = useAuthStore();
  const companyId = user?.company_id;

  return useQuery({
    queryKey: ['expense_categories', companyId],
    queryFn: () => companyId ? expensesService.getExpenseCategories(companyId) : Promise.resolve([]),
    enabled: !!companyId,
    select: (data) => Array.isArray(data) ? data : [],
    staleTime: 60000 // 1 minute
  });
};

export const useExpenseCategoryMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useFeedbackStore();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!user?.company_id) throw new Error("Authentication required");
      return expensesService.createCategory(user.company_id, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense_categories'] });
      showToast('تمت إضافة التصنيف بنجاح', 'success');
    }
  });
};

export const useExpensesData = (searchTerm: string = '') => {
  const { user } = useAuthStore();
  const companyId = user?.company_id;

  const query = useQuery({
    queryKey: ['expenses', companyId],
    queryFn: () => companyId ? expensesService.getExpensesList(companyId) : Promise.resolve([]),
    enabled: !!companyId,
    staleTime: 60000 // 1 minute
  });

  const filteredExpenses = useMemo(() => {
    if (!query.data) return [];
    if (!searchTerm) return query.data;
    const term = searchTerm.toLowerCase();
    return query.data.filter(e => e.description.toLowerCase().includes(term));
  }, [query.data, searchTerm]);

  const stats = useMemo(() => {
    return expensesService.calculateStats(query.data || []);
  }, [query.data]);

  return { ...query, expenses: filteredExpenses, stats };
};

export const useExpenseActions = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useFeedbackStore();

  const create = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      if (!user?.company_id || !user?.id) throw new Error("جلسة العمل منتهية");
      AuthorizeActionUsecase.validateAction(user as any, 'create_expense');
      return expensesService.processNewExpense(data, user.company_id, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['financials'] });
      showToast('تم تسجيل المصروف وترحيله بنجاح', 'success');
    },
    onError: (error: any) => {
      showToast(error.message, 'error', error);
    }
  });

  const remove = useMutation({
    mutationFn: (id: string) => expensesService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['journal_entries'] });
      queryClient.invalidateQueries({ queryKey: ['financials'] });
      showToast('تم إلغاء المصروف بنجاح', 'success');
    },
    onError: (error: any) => showToast(error.message, 'error')
  });

  return {
    createExpense: create.mutate,
    isCreating: create.isPending,
    error: create.error,
    deleteExpense: remove.mutate,
    isDeleting: remove.isPending,
  };
};