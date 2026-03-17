import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../service';
import { useAuthStore } from '../../auth/store';
import { useFeedbackStore } from '../../feedback/store';
import { inventoryApi } from '../api';
import { useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { logger } from '../../../core/utils/logger';
import { syncStore } from '../../../core/lib/sync-store';

export const useWarehouses = () => {
    const { user } = useAuthStore();
    return useQuery({
        queryKey: ['warehouses', user?.company_id],
        queryFn: () => user?.company_id ? inventoryService.getWarehouses(user.company_id) : Promise.resolve([]),
        enabled: !!user?.company_id
    });
};

export const useWarehouseProducts = (warehouseId: string | null) => {
    const { user } = useAuthStore();
    return useQuery({
        queryKey: ['warehouse_products', warehouseId],
        queryFn: () => (user?.company_id && warehouseId)
            ? inventoryService.getProductsForWarehouse(user.company_id, warehouseId)
            : Promise.resolve([]),
        enabled: !!user?.company_id && !!warehouseId,
    });
};

export const useWarehouseMutations = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const { showToast } = useFeedbackStore();

    const save = useMutation({
        mutationFn: async (data: { id?: string, name_ar: string, location: string }) => {
            if (!user?.company_id) throw new Error("Auth error");
            return await inventoryApi.saveWarehouse(user.company_id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warehouses'] });
            showToast("تم حفظ بيانات المستودع بنجاح", 'success');
        }
    });

    const remove = useMutation({
        mutationFn: async ({ id }: { id: string }) => {
            return await inventoryApi.deleteWarehouse(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warehouses'] });
            showToast("تم حذف المستودع", 'info');
        },
        onError: (err: Error) => showToast(err.message, 'error')
    });

    return {
        saveWarehouse: save.mutate,
        deleteWarehouse: remove.mutate,
        isSaving: save.isPending
    };
};

export const useTransfers = () => {
    const { user } = useAuthStore();
    return useQuery({
        queryKey: ['transfers', user?.company_id],
        queryFn: () => user?.company_id ? inventoryService.getTransfers(user.company_id) : Promise.resolve([]),
        enabled: !!user?.company_id
    });
};

export const useAuditSessions = () => {
    const { user } = useAuthStore();
    return useQuery({
        queryKey: ['audit_sessions', user?.company_id],
        queryFn: () => user?.company_id ? inventoryService.getAuditSessions(user.company_id) : Promise.resolve([]),
        enabled: !!user?.company_id
    });
};

export const useAuditSession = (sessionId: string | undefined) => {
    const query = useQuery({
        queryKey: ['audit_session', sessionId],
        queryFn: () => sessionId ? inventoryService.getAuditSessionDetails(sessionId) : Promise.reject('No session ID'),
        enabled: !!sessionId
    });

    useEffect(() => {
        if (!sessionId) return;

        const channel = supabase
            .channel(`audit_session_${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'audit_items',
                    filter: `session_id=eq.${sessionId}`
                },
                (payload: any) => {
                    logger.debug('Audit item changed:', payload);
                    query.refetch();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId, query.refetch]);

    return query;
};

export const useInventoryCategories = () => {
    const { user } = useAuthStore();
    return useQuery({
        queryKey: ['inventory_categories', user?.company_id],
        queryFn: () => user?.company_id ? inventoryService.getInventoryCategories(user.company_id) : Promise.resolve([]),
        enabled: !!user?.company_id
    });
};

export const useInventoryMutations = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const { showToast } = useFeedbackStore();

    const transfer = useMutation({
        mutationFn: (data: any) => {
            if (!user?.company_id || !user.id) throw new Error("Auth error");
            return inventoryService.createTransfer({ ...data, company_id: user.company_id, user_id: user.id });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['transfers'] });
            showToast("تمت المناقلة بنجاح", 'success');
        },
        onError: (err: any, variables) => {
            if (!navigator.onLine || err.message?.includes('Failed to fetch') || err.status === 0) {
                syncStore.enqueue({
                    mutationKey: ['inventory', 'transfer'],
                    variables: { ...variables, company_id: user?.company_id, user_id: user?.id }
                });
                showToast("تمت المناقلة محلياً (وضع عدم الاتصال).", 'info');
                return;
            }
            showToast("فشل المناقلة: " + err.message, 'error');
        }
    });

    const audit = useMutation({
        mutationFn: (data: any) => {
            if (!user?.company_id || !user.id) throw new Error("Auth error");
            return inventoryService.startAudit(data, user.company_id, user.id);
        },
        onSuccess: (newSession: any) => {
            queryClient.invalidateQueries({ queryKey: ['audit_sessions'] });
            showToast("تم بدء جلسة الجرد", 'success');
            return newSession;
        },
        onError: (err: any, variables) => {
            if (!navigator.onLine || err.message?.includes('Failed to fetch') || err.status === 0) {
                syncStore.enqueue({
                    mutationKey: ['inventory', 'start_audit'],
                    variables: { ...variables, company_id: user?.company_id, user_id: user?.id }
                });
                showToast("بدء الجرد محلياً (وضع عدم الاتصال).", 'info');
                return;
            }
            showToast("فشل بدء الجرد: " + err.message, 'error');
        }
    });

    const finalize = useMutation({
        mutationFn: ({ sessionId, items }: { sessionId: string, items: any[] }) => {
            if (!user?.company_id || !user.id) throw new Error("Auth error");
            return inventoryService.finalizeAudit(sessionId, items, user.company_id, user.id);
        },
        onSuccess: (_, { sessionId }) => {
            queryClient.invalidateQueries({ queryKey: ['audit_sessions'] });
            queryClient.invalidateQueries({ queryKey: ['audit_session', sessionId] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            showToast("تم إغلاق الجرد وترحيل الفروقات", 'success');
        }
    });

    const saveProgress = useMutation({
        mutationFn: (items: any[]) => inventoryService.saveAuditProgress(items),
        onSuccess: () => {
            showToast("تم حفظ التقدم", 'info', { hideAfter: 2000 });
        },
        onError: (err: any, items) => {
            if (!navigator.onLine || err.message?.includes('Failed to fetch') || err.status === 0) {
                syncStore.enqueue({
                    mutationKey: ['inventory', 'save_audit_progress'],
                    variables: { items }
                });
                return;
            }
        }
    });

    return {
        createTransfer: transfer.mutate,
        isTransferring: transfer.isPending,
        startAudit: audit.mutate,
        isStartingAudit: audit.isPending,
        finalizeAudit: finalize.mutate,
        isFinalizing: finalize.isPending,
        saveAuditProgress: saveProgress.mutate,
        isSavingProgress: saveProgress.isPending,
    };
};

export const useInventoryCategoryMutations = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const { showToast } = useFeedbackStore();

    const create = useMutation({
        mutationFn: (name: string) => {
            if (!user?.company_id) throw new Error("جلسة العمل منتهية");
            return inventoryService.createCategory(user.company_id, name);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory_categories'] });
            showToast("تمت إضافة تصنيف الصنف بنجاح", 'success');
        }
    });

    const remove = useMutation({
        mutationFn: (id: string) => inventoryService.deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory_categories'] });
            showToast("تم حذف التصنيف", 'info');
        }
    });

    return { createCategory: create.mutate, deleteCategory: remove.mutate, isCreating: create.isPending };
};

export const useInventoryAnalytics = (from?: string, to?: string) => {
    const { user } = useAuthStore();
    return useQuery({
        queryKey: ['inventory_analytics', user?.company_id, from, to],
        queryFn: () => user?.company_id ? inventoryService.getInventoryAnalytics(user.company_id, from, to) : Promise.resolve({
            mostActive: [],
            mostProfitable: [],
            stagnant: [],
            abcAnalysis: { A: [], B: [], C: [] },
            stockAlerts: []
        }),
        enabled: !!user?.company_id,
    });
};

export const useInventorySmartInsights = (from?: string, to?: string) => {
    const { data: analytics } = useInventoryAnalytics(from, to);

    return useMemo(() => {
        if (!analytics) return { data: [], isLoading: true };

        const insights = [];

        if (analytics.stockAlerts?.length > 0) {
            const topCritical = analytics.stockAlerts[0];
            insights.push({
                id: 'critical_reorder',
                type: 'critical',
                title: 'إعادة طلب عاجلة',
                message: `الصنف "${topCritical.name}" يستهلك بسرعة وسينفد خلال ${topCritical.daysRemaining} أيام.`,
                action: 'تجهيز طلب شراء',
                impact: 'high'
            });
        }

        const deadStockValue = analytics.stagnant?.reduce((sum: number, p: any) => sum + (p.cost_price * p.stock_quantity), 0) || 0;
        if (deadStockValue > 0) {
            insights.push({
                id: 'stagnant_capital',
                type: 'warning',
                title: 'رأس مال مجمد',
                message: `لديك أصناف راكدة بقيمة تقديرية ${Math.round(deadStockValue).toLocaleString()} ريال لم تتحرك منذ 90 يوماً.`,
                action: 'عمل تصفية أو عروض',
                impact: 'medium'
            });
        }

        const classA = analytics.abcAnalysis?.A || [];
        if (classA.length > 0) {
            const mostProfitable = [...classA].sort((a, b) => b.profit - a.profit)[0];
            if (mostProfitable) {
                insights.push({
                    id: 'profit_opportunity',
                    type: 'success',
                    title: 'فرصة نمو الربحية',
                    message: `الصنف "${mostProfitable.name}" يمثل أعلى هامش ربح في الفئة A. تأكد من توفره الدائم.`,
                    action: 'تحليل الموردين',
                    impact: 'high'
                });
            }
        }

        const totalItems = (analytics.abcAnalysis?.A?.length || 0) + (analytics.abcAnalysis?.B?.length || 0) + (analytics.abcAnalysis?.C?.length || 0);
        const aCount = analytics.abcAnalysis?.A?.length || 0;
        if (totalItems > 0 && (aCount / totalItems) < 0.1) {
            insights.push({
                id: 'strategic_imbalance',
                type: 'info',
                title: 'توازن المخزون',
                message: 'فئة النخبة (A) تشكل أقل من 10% من أصنافك. قد تكون هناك فرصة لتوسيع الأصناف الأكثر مبيعاً.',
                action: 'مراجعة الكتالوج',
                impact: 'low'
            });
        }

        return { data: insights, isLoading: false };
    }, [analytics]);
};