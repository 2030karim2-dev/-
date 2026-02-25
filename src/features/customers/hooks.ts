
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersService } from './service';
import { partiesService } from '../parties/service';
import { useAuthStore } from '../auth/store';
import { useFeedbackStore } from '../feedback/store';
import { CustomerFormData, CustomerStats, Customer, CustomerView } from './types';
import { useMemo, useState } from 'react';
import { AuthorizeActionUsecase } from '../../core/usecases/auth/AuthorizeActionUsecase';

export const useCustomers = (searchTerm: string = '') => {
  const { user } = useAuthStore();
  const companyId = user?.company_id;

  const query = useQuery({
    queryKey: ['customers', companyId],
    queryFn: () => companyId ? customersService.getCustomers(companyId) : Promise.resolve([]),
    enabled: !!companyId,
    staleTime: 60000 // 1 minute
  });

  const filteredCustomers = useMemo(() => {
    const data = query.data || [];
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.phone?.includes(term) ||
      p.category?.toLowerCase().includes(term)
    );
  }, [query.data, searchTerm]);

  const stats = useMemo((): CustomerStats => {
    const data = query.data || [];
    return customersService.calculateStats(data);
  }, [query.data]);

  return { ...query, customers: filteredCustomers, stats };
};

export const useCustomerCategories = () => {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['customer_categories', user?.company_id],
    queryFn: () => user?.company_id ? customersService.getCategoriesWithStats(user.company_id) : Promise.resolve([]),
    enabled: !!user?.company_id,
    select: (data) => Array.isArray(data) ? data : [],
    staleTime: 60000 // 1 minute
  });
};

export const useCustomerCategoryMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useFeedbackStore();

  const save = useMutation({
    mutationFn: async ({ name, id }: { name: string, id?: string }) => {
      if (!user?.company_id) throw new Error("Auth error");
      return partiesService.saveCategory(user.company_id, { name, type: 'customer' }, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer_categories', user?.company_id] });
      showToast("تم حفظ فئة العميل", 'success');
    }
  });

  const remove = useMutation({
    mutationFn: (id: string) => partiesService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer_categories', user?.company_id] });
      showToast("تم حذف الفئة", 'info');
    }
  });

  return { save: save.mutate, remove: remove.mutate, isSaving: save.isPending };
};


export const useCustomerStatement = (partyId: string | null) => {
  return useQuery({
    queryKey: ['customer_statement', partyId],
    queryFn: () => partyId ? customersService.getStatement(partyId) : Promise.resolve([]),
    enabled: !!partyId
  });
};

export const useCustomerMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useFeedbackStore();

  const saveCustomer = useMutation({
    mutationFn: async ({ data, id }: { data: CustomerFormData, id?: string }) => {
      if (!user?.company_id) throw new Error("Authentication required");
      return customersService.saveCustomer(user.company_id, data, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer_categories'] });
      showToast('تم حفظ بيانات العميل وتحديث السجلات بنجاح', 'success');
    },
    onError: (err: any) => showToast("خطأ في حفظ البيانات: " + err.message, 'error', err)
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      AuthorizeActionUsecase.validateAction(user as any, 'delete_party');
      return customersService.deleteCustomer(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer_categories'] });
      showToast('تم حذف السجل نهائياً من قاعدة البيانات', 'success');
    },
    onError: (err: any) => showToast(err.message, 'error', err)
  });

  return { saveCustomer: saveCustomer.mutate, deleteCustomer: deleteCustomer.mutate, isSaving: saveCustomer.isPending };
};

export const useCustomerSearch = (query: string) => {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['customer_search', query, user?.company_id],
    queryFn: () => (user?.company_id && query.length > 1)
      ? customersService.search(user.company_id, query)
      : Promise.resolve([]),
    enabled: !!user?.company_id && query.length > 1,
    staleTime: 1000 * 60
  });
};

export const useCustomersView = () => {
  const [activeView, setActiveView] = useState<CustomerView>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingCustomer(null);
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
    editingCustomer,
    handleEdit,
    handleAddNew,
    handleCloseModal
  };
};
