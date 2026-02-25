
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partiesService } from './service';
import { useAuthStore } from '../auth/store';
import { useFeedbackStore } from '../feedback/store';
import { PartyFormData, PartyType, Party, PartyView } from './types';
import { useMemo, useState } from 'react';
import { AuthorizeActionUsecase } from '../../core/usecases/auth/AuthorizeActionUsecase';

export const useParties = (type: PartyType, searchTerm: string = '') => {
  const { user } = useAuthStore();
  const companyId = user?.company_id;

  const query = useQuery({
    queryKey: ['parties', companyId, type],
    queryFn: () => companyId ? partiesService.getParties(companyId, type) : Promise.resolve([]),
    enabled: !!companyId,
    staleTime: 60000 // 1 minute
  });

  const filteredData = useMemo(() => {
    const data = query.data || [];
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.phone?.includes(term) ||
      p.category?.toLowerCase().includes(term)
    );
  }, [query.data, searchTerm]);

  const stats = useMemo(() => {
    return partiesService.calculateStats(query.data || []);
  }, [query.data]);

  return { ...query, data: filteredData, stats };
};

export const useCategories = (type: PartyType) => {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['party_categories', user?.company_id, type],
    queryFn: () => user?.company_id ? partiesService.getCategoriesWithStats(user.company_id, type) : Promise.resolve([]),
    enabled: !!user?.company_id,
    select: (data) => Array.isArray(data) ? data : [],
    staleTime: 60000 // 1 minute
  });
};

export const useStatement = (partyId: string | null, type: PartyType) => {
  return useQuery({
    queryKey: ['party_statement', partyId],
    queryFn: () => partyId ? partiesService.getStatement(partyId, type) : Promise.resolve([]),
    enabled: !!partyId
  });
};

export const usePartyMutations = (type: PartyType) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useFeedbackStore();

  const saveParty = useMutation({
    mutationFn: async ({ data, id }: { data: PartyFormData, id?: string }) => {
      if (!user?.company_id) throw new Error("Authentication required");
      return partiesService.saveParty(user.company_id, data, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties', user?.company_id, type] });
      showToast('تم حفظ البيانات بنجاح', 'success');
    },
    onError: (err: any) => showToast("خطأ في حفظ البيانات", 'error', err)
  });

  const deleteParty = useMutation({
    mutationFn: async (id: string) => {
      AuthorizeActionUsecase.validateAction(user as any, 'delete_party');
      return partiesService.deleteParty(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties', user?.company_id, type] });
      showToast('تم حذف السجل نهائياً', 'success');
    },
    onError: (err: any) => showToast(err.message, 'error', err)
  });

  return { saveParty: saveParty.mutate, deleteParty: deleteParty.mutate, isSaving: saveParty.isPending };
};

export const useCategoryMutations = (type: PartyType) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useFeedbackStore();

  const save = useMutation({
    mutationFn: async ({ name, id }: { name: string, id?: string }) => {
      if (!user?.company_id) throw new Error("Auth error");
      return partiesService.saveCategory(user.company_id, { name, type }, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['party_categories', user?.company_id, type] });
      showToast("تم حفظ الفئة", 'success');
    }
  });

  const remove = useMutation({
    mutationFn: (id: string) => partiesService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['party_categories', user?.company_id, type] });
      showToast("تم حذف الفئة", 'info');
    }
  });

  return { save: save.mutate, remove: remove.mutate, isSaving: save.isPending };
};

export const usePartySearch = (type: PartyType, query: string) => {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['party_search', type, query, user?.company_id],
    queryFn: () => (user?.company_id && query.length > 1)
      ? partiesService.search(user.company_id, type, query)
      : Promise.resolve([]),
    enabled: !!user?.company_id && query.length > 1,
    staleTime: 1000 * 60
  });
};

export const usePartiesView = () => {
  const [activeView, setActiveView] = useState<PartyView>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);

  const handleEdit = (party: Party) => {
    setEditingParty(party);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingParty(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return {
    activeView,
    setActiveView,
    searchTerm,
    setSearchTerm,
    isModalOpen,
    editingParty,
    handleEdit,
    handleAddNew,
    handleCloseModal
  };
};
