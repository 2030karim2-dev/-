import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../service';
import { useAuthStore } from '../../auth/store';
import { useFeedbackStore } from '../../feedback/store';
import { ProductFormData } from '../types';
import { useMemo } from 'react';
import { syncStore } from '../../../core/lib/sync-store';
import { queryKeys } from '../../../core/lib/react-query';
import { normalizeArabic } from '../../../core/utils/textUtils.ts';

export const useProducts = (searchTerm: string = '', options: { limitNum?: number, enabled?: boolean } = {}) => {
    const { user } = useAuthStore();
    const companyId = user?.company_id;
    const limit = options.limitNum || 200;

    const query = useQuery({
        queryKey: ['products', companyId, limit, searchTerm ? `search:${normalizeArabic(searchTerm)}` : 'all'],
        queryFn: () => {
            if (!companyId) return Promise.resolve([]);
            if (searchTerm && searchTerm.length > 1) {
                return inventoryService.searchProducts(companyId, searchTerm, limit);
            }
            return inventoryService.getProducts(companyId, 1, limit);
        },
        enabled: (options.enabled !== undefined ? options.enabled : true) && !!companyId,
        staleTime: 1000 * 60,
    });

    // NOTE: Realtime invalidation for products is now handled centrally by
    // useRealtimeSync() (global-sync channel). This avoids duplicate WebSocket
    // connections and redundant query invalidations.
    // See: src/lib/hooks/useRealtimeSync.ts

    // Stats computed directly from server data (no client-side filtering)
    const stats = useMemo(() => {
        const products = query.data || [];
        return {
            count: products.length,
            totalValue: products.reduce((acc, p) => acc + ((p.cost_price || 0) * (p.stock_quantity || 0)), 0),
            lowStockCount: products.filter(p => (p.stock_quantity || 0) <= (p.min_stock_level || 0)).length
        };
    }, [query.data]);

    return { ...query, products: query.data || [], stats };
};

export const useMinimalProducts = () => {
    const { user } = useAuthStore();
    return useQuery({
        queryKey: ['products_minimal', user?.company_id],
        queryFn: () => user?.company_id ? inventoryService.getMinimalProducts(user.company_id) : Promise.resolve([]),
        enabled: !!user?.company_id,
    });
};

export const useItemMovement = (productId: string | null) => {
    const { user } = useAuthStore();
    return useQuery({
        queryKey: ['item_movement', productId, user?.company_id],
        queryFn: () => (productId && user?.company_id) ? inventoryService.getItemMovement(productId, user.company_id) : Promise.resolve([]),
        enabled: !!productId && !!user?.company_id,
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
        onSettled: (_data, _error, variables) => {
            // Always refetch after mutation to ensure consistency
            queryClient.invalidateQueries({ queryKey: queryKeys.inventory.products() });
            if (variables.id) {
                queryClient.invalidateQueries({ queryKey: queryKeys.inventory.product(variables.id) });
            }
        },
    });

    const deleteProduct = useMutation({
        // Fix: Call deleteProduct which will be added to inventoryService
        mutationFn: (id: string) => inventoryService.deleteProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.inventory.products() });
            showToast("تم حذف المنتج من المستودع", 'info');
        }
    });

    const bulkDeleteProducts = useMutation({
        mutationFn: (ids: string[]) => inventoryService.bulkDeleteProducts(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.inventory.products() });
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

export const useSearchProducts = (searchTerm: string) => {
    const { user } = useAuthStore();
    const companyId = user?.company_id;

    return useQuery({
        queryKey: ['products_search', companyId, searchTerm],
        queryFn: () => (companyId && searchTerm.length > 1)
            ? inventoryService.searchProducts(companyId, searchTerm)
            : Promise.resolve([]),
        enabled: !!companyId && searchTerm.length > 1,
    });
};