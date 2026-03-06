import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../service';
import { useAuthStore } from '../../auth/store';
import { useFeedbackStore } from '../../feedback/store';
import { ProductFormData } from '../types';
import { useMemo, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { logger } from '../../../core/utils/logger';
import { syncStore } from '../../../core/lib/sync-store';

export const useProducts = (searchTerm: string = '') => {
    const { user } = useAuthStore();
    const companyId = user?.company_id;

    const query = useQuery({
        queryKey: ['products', companyId],
        queryFn: () => companyId ? inventoryService.getProducts(companyId) : Promise.resolve([]),
        enabled: !!companyId,
    });

    // Realtime channel for product and stock updates
    useEffect(() => {
        if (!companyId) return;

        const channel = supabase
            .channel(`products_realtime_${companyId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'products',
                    filter: `company_id=eq.${companyId}`
                },
                (payload) => {
                    logger.debug('Products', 'Inventory updated via realtime', JSON.stringify(payload));
                    query.refetch(); // Invalidate directly via refetch
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [companyId, query.refetch]);

    const filteredProducts = useMemo(() => {
        const data = query.data || [];
        if (!searchTerm) return data;
        const lowerTerm = searchTerm.toLowerCase();
        return data.filter(p =>
            p.name.toLowerCase().includes(lowerTerm) ||
            p.sku.toLowerCase().includes(lowerTerm) ||
            p.brand?.toLowerCase().includes(lowerTerm)
        );
    }, [query.data, searchTerm]);

    const stats = useMemo(() => ({
        count: filteredProducts.length,
        totalValue: filteredProducts.reduce((acc, p) => acc + (p.cost_price * p.stock_quantity), 0),
        lowStockCount: filteredProducts.filter(p => p.stock_quantity <= p.min_stock_level).length
    }), [filteredProducts]);

    return { ...query, products: filteredProducts, stats };
};

export const useMinimalProducts = () => {
    const { user } = useAuthStore();
    return useQuery({
        queryKey: ['products_minimal', user?.company_id],
        // Fix: Call getMinimalProducts which will be added to inventoryService
        queryFn: () => user?.company_id ? inventoryService.getMinimalProducts(user.company_id) : Promise.resolve([]),
        enabled: !!user?.company_id
    });
};

export const useItemMovement = (productId: string | null) => {
    return useQuery({
        queryKey: ['item_movement', productId],
        // Fix: Call getItemMovement which will be added to inventoryService
        queryFn: () => productId ? inventoryService.getItemMovement(productId) : Promise.resolve([]),
        enabled: !!productId
    });
};

export const useProductMutations = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const { showToast } = useFeedbackStore();
    // const { enqueue } = useOfflineQueueStore(); // LEGACY - REMOVING

    const saveProduct = useMutation({
        mutationFn: async ({ data, id }: { data: ProductFormData, id?: string }) => {
            if (!user?.company_id || !user.id) throw new Error("جلسة العمل منتهية");
            if (id) {
                return inventoryService.updateProduct(id, data, user.company_id);
            }
            return inventoryService.createProduct(data, user.company_id, user.id);
        },
        // Optimistic Update: show changes instantly before server confirms
        onMutate: async ({ data, id }) => {
            // Cancel outgoing refetches so they don't overwrite our optimistic update
            await queryClient.cancelQueries({ queryKey: ['products'] });

            // Snapshot the previous value
            const previousProducts = queryClient.getQueryData(['products', user?.company_id]);

            // Optimistically update the cache
            if (id && previousProducts) {
                queryClient.setQueryData(['products', user?.company_id], (old: any[]) =>
                    old?.map(p => p.id === id ? { ...p, ...data } : p) ?? []
                );
            }

            return { previousProducts };
        },
        onError: (error: any, variables, context) => {
            // Rollback to snapshot on failure
            if (context?.previousProducts) {
                queryClient.setQueryData(['products', user?.company_id], context.previousProducts);
            }

            // If it's a network error, enqueue for offline processing via new global syncStore
            if (!navigator.onLine || error.message?.includes('Failed to fetch') || error.status === 0) {
                const originalProduct = (context?.previousProducts as any[])?.find(p => p.id === variables.id);

                syncStore.enqueue({
                    mutationKey: ['products', 'save'], // Key for identification
                    variables: { ...variables.data, id: variables.id, company_id: user?.company_id, user_id: user?.id },
                    metadata: {
                        last_updated_at: originalProduct?.updated_at
                    }
                });
                showToast("تم الحفظ محلياً (وضع عدم الاتصال). سيتم المزامنة تلقائياً عند عودة الإنترنت.", 'info');
                return;
            }

            showToast("فشل الحفظ: " + error.message, 'error');
        },
        onSuccess: () => {
            showToast("تم حفظ بيانات المنتج بنجاح", 'success');
        },
        onSettled: () => {
            // Always refetch after mutation to ensure consistency
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });

    const deleteProduct = useMutation({
        // Fix: Call deleteProduct which will be added to inventoryService
        mutationFn: (id: string) => inventoryService.deleteProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            showToast("تم حذف المنتج من المستودع", 'info');
        }
    });

    const bulkDeleteProducts = useMutation({
        mutationFn: (ids: string[]) => inventoryService.bulkDeleteProducts(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            showToast("تم حذف المنتجات المحددة بنجاح", 'info');
        }
    });

    return {
        // Fix: Changed to `mutateAsync` to allow chaining callbacks for component-specific logic like closing a modal.
        saveProduct: saveProduct.mutateAsync,
        deleteProduct: deleteProduct.mutate,
        bulkDeleteProducts: bulkDeleteProducts.mutateAsync,
        isSaving: saveProduct.isPending,
        isDeleting: deleteProduct.isPending || bulkDeleteProducts.isPending
    };
};