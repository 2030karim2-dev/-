
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from './service';
import { settingsApi } from './api';
import { useAuthStore } from '../auth/store';
import { useFeedbackStore } from '../feedback/store';
import { CompanyFormData, WarehouseFormData, FiscalYearFormData, ExchangeRateFormData } from './types';

export const useCompany = () => {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['company', user?.company_id],
    queryFn: () => user?.company_id ? settingsService.fetchCompany(user.company_id) : Promise.resolve(null),
    enabled: !!user?.company_id
  });
};

export const useCompanyMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useFeedbackStore();

  return useMutation({
    mutationFn: (data: CompanyFormData) => {
      if (!user?.company_id) throw new Error("No Company ID");
      return settingsService.updateCompanyProfile(user.company_id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      showToast("تم تحديث بيانات المنشأة بنجاح", 'success');
    }
  });
};

export const useWarehouses = () => {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['warehouses', user?.company_id],
    queryFn: () => user?.company_id ? settingsService.fetchWarehouses(user.company_id) : Promise.resolve([]),
    enabled: !!user?.company_id
  });
};

export const useWarehouseMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useFeedbackStore();

  const addWarehouse = useMutation({
    mutationFn: (data: WarehouseFormData) => {
      if (!user?.company_id) throw new Error("No Company ID");
      return settingsService.addWarehouse(user.company_id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      showToast("تمت إضافة المستودع الجديد", 'success');
    }
  });

  const deleteWarehouse = useMutation({
    mutationFn: (id: string) => settingsService.removeWarehouse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      showToast("تم حذف المستودع", 'info');
    }
  });

  const setPrimary = useMutation({
    mutationFn: (id: string) => {
      if (!user?.company_id) throw new Error("No Company ID");
      return settingsApi.setPrimaryWarehouse(user.company_id, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      showToast("تم تعيين المستودع الرئيسي بنجاح", 'success');
    }
  });

  return { addWarehouse: addWarehouse.mutate, deleteWarehouse: deleteWarehouse.mutate, setPrimary: setPrimary.mutate, isAdding: addWarehouse.isPending };
};

export const useFiscalYears = () => {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['fiscal_years', user?.company_id],
    queryFn: () => user?.company_id ? settingsService.fetchFiscalYears(user.company_id) : Promise.resolve([]),
    enabled: !!user?.company_id
  });
};

export const useFiscalYearMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useFeedbackStore();

  const addFiscalYear = useMutation({
    mutationFn: (data: FiscalYearFormData) => {
      if (!user?.company_id) throw new Error("No Company ID");
      return settingsService.addFiscalYear(user.company_id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal_years'] });
      showToast("تم إنشاء السنة المالية بنجاح", 'success');
    }
  });

  const closeFiscalYear = useMutation({
    mutationFn: (id: string) => settingsService.closeFiscalYear(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal_years'] });
      showToast("تم إغلاق السنة المالية بنجاح", 'warning');
    }
  });

  return { addFiscalYear: addFiscalYear.mutate, closeFiscalYear: closeFiscalYear.mutate, isAdding: addFiscalYear.isPending };
};

export const useCurrencies = () => {
  const { user } = useAuthStore();
  const currencies = useQuery({ queryKey: ['supported_currencies'], queryFn: settingsService.fetchCurrencies });
  const rates = useQuery({ queryKey: ['exchange_rates', user?.company_id], queryFn: () => user?.company_id ? settingsService.fetchExchangeRates(user.company_id) : Promise.resolve([]), enabled: !!user?.company_id });
  return { currencies, rates };
};

export const useCurrencyMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showToast } = useFeedbackStore();

  const setRate = useMutation({
    mutationFn: (data: ExchangeRateFormData) => {
      if (!user?.company_id || !user?.id) throw new Error("Missing Auth");
      return settingsService.setExchangeRate(user.company_id, data, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange_rates'] });
      showToast("تم تحديث سعر الصرف بنجاح", 'success');
    }
  });

  const addCurrency = useMutation({
    mutationFn: (data: { code: string, name_ar: string, symbol: string, exchange_operator: 'multiply' | 'divide' }) => settingsApi.createCurrency(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supported_currencies'] });
      showToast("تمت إضافة العملة الجديدة", 'success');
    }
  });

  const deleteCurrency = useMutation({
    mutationFn: (code: string) => settingsApi.deleteCurrency(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supported_currencies'] });
      showToast("تم حذف العملة من النظام", 'info');
    }
  });

  return {
    setRate: setRate.mutate,
    addCurrency: addCurrency.mutate,
    deleteCurrency: deleteCurrency.mutate,
    isSaving: setRate.isPending || addCurrency.isPending
  };
};

export const useBackupActions = () => {
  const { showToast } = useFeedbackStore();

  const exportData = async () => {
    try {
      showToast("جاري تجهيز النسخة الاحتياطية...", 'info');
      const data = await settingsService.exportSystemData();

      const fileName = `AlZahra_Backup_${new Date().toISOString().split('T')[0]}`;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.json`;
      link.click();
      URL.revokeObjectURL(url);

      showToast("تم تحميل النسخة الاحتياطية بنجاح", 'success');
      return data;
    } catch (err) {
      showToast("فشل تصدير البيانات", 'error');
      throw err;
    }
  };

  const importData = async (file: File) => {
    try {
      await settingsService.importSystemData(file);
      showToast("تم استيراد البيانات بنجاح، سيتم إعادة التحميل", 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return { exportData, importData };
};
