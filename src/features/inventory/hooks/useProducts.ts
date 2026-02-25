import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../service';
import { useAuthStore } from '../../auth/store';
import { useFeedbackStore } from '../../feedback/store';
import { ProductFormData } from '../types';
import { useMemo } from 'react';

export const useProducts = (searchTerm: string = '') => {
    const { user } = useAuthStore();
    const companyId = user?.company_id;

    const query = useQuery({
        queryKey: ['products', companyId],
        queryFn: () => companyId ? inventoryService.getProducts(companyId) : Promise.resolve([]),
        enabled: !!companyId,
    });

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

    const saveProduct = useMutation({
        mutationFn: async ({ data, id }: { data: ProductFormData, id?: string }) => {
            if (!user?.company_id || !user.id) throw new Error("جلسة العمل منتهية");
            if (id) {
                // Fix: inventoryService.updateProduct now expects 3 arguments
                return inventoryService.updateProduct(id, data, user.company_id);
            }
            return inventoryService.createProduct(data, user.company_id, user.id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            showToast("تم حفظ بيانات المنتج بنجاح", 'success');
        },
        onError: (error: any) => showToast("فشل الحفظ: " + error.message, 'error')
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