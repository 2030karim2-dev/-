
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersService } from './service';
import { partiesService } from '../parties/service';
import { useAuthStore } from '../auth/store';
import { useFeedbackStore } from '../feedback/store';
import { SupplierFormData, SupplierStats, Supplier, SupplierView } from './types';
import { useMemo, useState } from 'react';
import { AuthorizeActionUsecase } from '../../core/usecases/auth/AuthorizeActionUsecase';
import { usePartySearch } from '../parties/hooks';

export const useSuppliers = (searchTerm: string = '') => {
  const { user } = useAuthStore();
  const companyId = user?.company_id;

  const query = useQuery({
    queryKey: ['suppliers', companyId],
    queryFn: () => companyId ? suppliersService.getSuppliers(companyId) : Promise.resolve([]),
    enabled: !!companyId,
  });

  const filteredSuppliers = useMemo(() => {
    const data = query.data || [];
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.phone?.includes(term) ||
      p.category?.toLowerCase().includes(term)
    );
  }, [query.data, searchTerm]);

  const stats = useMemo((): SupplierStats => {
    const data = query.data || [];
    return suppliersService.calculateStats(data);
  }, [query.data]);

  return { ...query, suppliers: filteredSuppliers, stats };
};

export const useSupplierCategories = () => {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['supplier_categories', user?.company_id],
    queryFn: () => user?.company_id ? suppliersService.getCategoriesWithStats(user.company_id) : Promise.resolve([]),
    enabled: !!user?.company_id,
    select: (data) => Array.isArray(data) ? data : []
  });
};

export const useSupplierCategoryMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useFeedbackStore();

  const save = useMutation({
    mutationFn: async ({ name, id }: { name: string, id?: string }) => {
      if (!user?.company_id) throw new Error("Auth error");
      return partiesService.saveCategory(user.company_id, { name, type: 'supplier' }, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier_categories', user?.company_id] });
      showToast("تم حفظ فئة المورد", 'success');
    }
  });

  const remove = useMutation({
    mutationFn: (id: string) => partiesService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier_categories', user?.company_id] });
      showToast("تم حذف الفئة", 'info');
    }
  });

  return { save: save.mutate, remove: remove.mutate, isSaving: save.isPending };
};

export const useSupplierStatement = (partyId: string | null) => {
  return useQuery({
    queryKey: ['supplier_statement', partyId],
    queryFn: () => partyId ? suppliersService.getStatement(partyId) : Promise.resolve([]),
    enabled: !!partyId
  });
};

export const useSupplierMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useFeedbackStore();

  const saveSupplier = useMutation({
    mutationFn: async ({ data, id }: { data: SupplierFormData, id?: string }) => {
      if (!user?.company_id) throw new Error("Authentication required");
      return suppliersService.saveSupplier(user.company_id, data, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier_categories'] });
      showToast('تم حفظ بيانات المورد وتحديث السجلات بنجاح', 'success');
    },
    onError: (err: any) => showToast("خطأ في حفظ البيانات", 'error', err)
  });

  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      AuthorizeActionUsecase.validateAction(user as any, 'delete_party');
      return suppliersService.deleteSupplier(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier_categories'] });
      showToast('تم حذف السجل نهائياً من قاعدة البيانات', 'success');
    },
    onError: (err: any) => showToast(err.message, 'error', err)
  });

  return { saveSupplier: saveSupplier.mutate, deleteSupplier: deleteSupplier.mutate, isSaving: saveSupplier.isPending };
};

export const useSupplierSearch = (query: string) => {
  return usePartySearch('supplier', query);
};

export const useSuppliersView = () => {
  const [activeView, setActiveView] = useState<SupplierView>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingSupplier(null);
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
    editingSupplier,
    handleEdit,
    handleAddNew,
    handleCloseModal
  };
};
