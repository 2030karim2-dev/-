
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from './service';
import { useAuthStore } from '../auth/store';
import { useFeedbackStore } from '../feedback/store';
import { Product, ProductFormData } from './types';

export const useInventoryView = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeView, setActiveView] = useState('products');
    const [displayMode, setDisplayMode] = useState<'table' | 'grid'>('table');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    return {
        searchTerm,
        setSearchTerm,
        activeView,
        setActiveView,
        displayMode,
        setDisplayMode,
        selectedProduct,
        setSelectedProduct,
        editingProduct,
        isModalOpen,
        setIsModalOpen,
        handleEdit,
        handleAdd,
        handleCloseModal
    };
};

export const useInventoryCategories = () => {
    const { user } = useAuthStore();
    return useQuery({
        queryKey: ['inventory_categories', user?.company_id],
        queryFn: () => user?.company_id ? inventoryService.getInventoryCategories(user.company_id) : Promise.resolve([]),
        enabled: !!user?.company_id,
        select: (data) => Array.isArray(data) ? data : [],
        staleTime: 60000 // 1 minute
    });
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

export const useProducts = (searchTerm: string = '', options: { enabled?: boolean } = {}) => {
    const { user } = useAuthStore();
    const companyId = user?.company_id;

    const query = useQuery({
        queryKey: ['products', companyId],
        queryFn: () => companyId ? inventoryService.getProducts(companyId) : Promise.resolve([]),
        enabled: (options.enabled !== false) && !!companyId,
        staleTime: 60000 // 1 minute
    });

    const filteredProducts = useMemo(() => {
        const data = query.data || [];
        if (!searchTerm) return data;
        const lowerTerm = searchTerm.toLowerCase();

        // تصفية وترتيب ذكي: الاسم > رقم القطعة > SKU
        return data.filter(p => {
            const nameMatch = p.name.toLowerCase().includes(lowerTerm);
            const partMatch = p.part_number && p.part_number.toLowerCase().includes(lowerTerm);
            const altMatch = p.alternative_numbers && p.alternative_numbers.toLowerCase().includes(lowerTerm); // Check alternatives
            const skuMatch = p.sku.toLowerCase().includes(lowerTerm);
            const brandMatch = p.brand?.toLowerCase().includes(lowerTerm);
            return nameMatch || partMatch || altMatch || skuMatch || brandMatch;
        }).sort((a, b) => {
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            const aPart = (a.part_number || '').toLowerCase();
            const bPart = (b.part_number || '').toLowerCase();

            // 1. أولوية تطابق الاسم الكامل
            if (aName === lowerTerm && bName !== lowerTerm) return -1;
            if (bName === lowerTerm && aName !== lowerTerm) return 1;

            // 2. أولوية بداية الاسم
            if (aName.startsWith(lowerTerm) && !bName.startsWith(lowerTerm)) return -1;
            if (bName.startsWith(lowerTerm) && !aName.startsWith(lowerTerm)) return 1;

            // 3. أولوية احتواء الاسم
            if (aName.includes(lowerTerm) && !bName.includes(lowerTerm)) return -1;
            if (bName.includes(lowerTerm) && !aName.includes(lowerTerm)) return 1;

            // 4. أولوية تطابق رقم القطعة (OEM)
            if (aPart === lowerTerm && bPart !== lowerTerm) return -1;
            if (bPart === lowerTerm && aPart !== lowerTerm) return 1;

            // 5. أولوية بداية رقم القطعة
            if (aPart.startsWith(lowerTerm) && !bPart.startsWith(lowerTerm)) return -1;
            if (bPart.startsWith(lowerTerm) && !aPart.startsWith(lowerTerm)) return 1;

            // 6. أولوية احتواء رقم القطعة
            if (aPart.includes(lowerTerm) && !bPart.includes(lowerTerm)) return -1;
            if (bPart.includes(lowerTerm) && !aPart.includes(lowerTerm)) return 1;

            return 0; // SKU والماركة تأتي في الأخير
        });
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
        queryFn: () => user?.company_id ? inventoryService.getMinimalProducts(user.company_id) : Promise.resolve([]),
        enabled: !!user?.company_id
    });
};

export const useItemMovement = (productId: string | null, from?: string, to?: string) => {
    return useQuery({
        queryKey: ['item_movement', productId, from, to],
        queryFn: () => productId ? inventoryService.getItemMovement(productId, from, to) : Promise.resolve([]),
        enabled: !!productId
    });
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
        enabled: !!user?.company_id
    });
};

import { aiService } from '../ai/service';
import { InventoryDataSnapshot } from '../ai/types';

export const useInventorySmartInsights = (from?: string, to?: string) => {
    const { user } = useAuthStore();

    // First, fetch the raw analytics data
    const { data: analyticsData, isSuccess: analyticsLoaded } = useInventoryAnalytics(from, to);

    // Then, use that data to get AI insights
    return useQuery({
        queryKey: ['inventory_smart_insights', user?.company_id, from, to],
        queryFn: async () => {
            if (!user?.company_id || !analyticsData) return null;

            const totalValuation = [
                ...(analyticsData.abcAnalysis?.A || []),
                ...(analyticsData.abcAnalysis?.B || []),
                ...(analyticsData.abcAnalysis?.C || [])
            ].reduce((sum: number, item: any) => sum + ((item.cost_price || 0) * (item.stock_quantity || 0)), 0);

            const totalItems = [
                ...(analyticsData.abcAnalysis?.A || []),
                ...(analyticsData.abcAnalysis?.B || []),
                ...(analyticsData.abcAnalysis?.C || [])
            ].reduce((sum: number, item: any) => sum + (item.stock_quantity || 0), 0);

            const totalUnique = (analyticsData.abcAnalysis?.A?.length || 0) + (analyticsData.abcAnalysis?.B?.length || 0) + (analyticsData.abcAnalysis?.C?.length || 0);

            const outOfStock = [
                ...(analyticsData.abcAnalysis?.A || []),
                ...(analyticsData.abcAnalysis?.B || []),
                ...(analyticsData.abcAnalysis?.C || [])
            ].filter((item: any) => item.stock_quantity <= 0).length;

            const snapshot: InventoryDataSnapshot = {
                total_valuation: totalValuation,
                total_products: totalUnique,
                total_qty: totalItems,
                low_stock_count: analyticsData.stockAlerts?.length || 0,
                out_of_stock_count: outOfStock,
                abc_summary: {
                    a_items: analyticsData.abcAnalysis?.A?.length || 0,
                    b_items: analyticsData.abcAnalysis?.B?.length || 0,
                    c_items: analyticsData.abcAnalysis?.C?.length || 0,
                },
                top_moving: (analyticsData.mostActive || []).slice(0, 5).map((p: any) => ({
                    name: p.name,
                    qtySold: p.qtySold,
                    revenue: p.revenue
                })),
                stagnant_items: (analyticsData.stagnant || []).slice(0, 10).map((p: any) => ({
                    name: p.name,
                    days_stagnant: p.daysStagnant || 90,
                    stock: p.stock_quantity || 0
                })),
                critical_alerts: (analyticsData.stockAlerts || []).slice(0, 5).map((p: any) => ({
                    name: p.name,
                    stock: p.stock_quantity,
                    velocity: p.dailyVelocity || 0,
                    days_remaining: p.daysRemaining || 0
                }))
            };

            return aiService.generateInventoryAnalysis(snapshot);
        },
        enabled: !!user?.company_id && analyticsLoaded,
        staleTime: 1000 * 60 * 60, // 1 hour
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
                return inventoryService.updateProduct(id, data, user.company_id);
            }
            return inventoryService.createProduct(data, user.company_id, user.id);
        },
        onSuccess: (savedProduct, variables) => {
            // Update cache optimally without invalidating and refetching the entire list
            if (savedProduct) {
                queryClient.setQueryData(['products', user?.company_id], (oldData: any) => {
                    const products = Array.isArray(oldData) ? oldData : [];
                    if (variables.id) {
                        // Update
                        return products.map(p => p.id === variables.id ? { ...p, ...savedProduct } : p);
                    } else {
                        // Create - Prepend to list
                        return [savedProduct, ...products];
                    }
                });
            } else {
                queryClient.invalidateQueries({ queryKey: ['products'] });
            }

            showToast("تم حفظ بيانات المنتج بنجاح", 'success');
        },
        onError: (error: any) => showToast("فشل الحفظ: " + error.message, 'error')
    });

    const deleteProduct = useMutation({
        mutationFn: (id: string) => inventoryService.deleteProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            showToast("تم حذف المنتج من المستودع", 'info');
        },
        onError: (error: any) => showToast(error.message || "فشل حذف المنتج", 'error')
    });

    const bulkDeleteProducts = useMutation({
        mutationFn: (ids: string[]) => inventoryService.bulkDeleteProducts(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            showToast("تم حذف المنتجات المحددة بنجاح", 'info');
        },
        onError: (error: any) => showToast(error.message || "فشل حذف المنتجات", 'error')
    });

    return {
        saveProduct: saveProduct.mutateAsync,
        deleteProduct: deleteProduct.mutate,
        bulkDeleteProducts: bulkDeleteProducts.mutateAsync,
        isSaving: saveProduct.isPending,
        isDeleting: deleteProduct.isPending || bulkDeleteProducts.isPending
    };
};

export const useWarehouses = () => {
    const { user } = useAuthStore();
    return useQuery({
        queryKey: ['warehouses', user?.company_id],
        queryFn: () => user?.company_id ? inventoryService.getWarehouses(user.company_id) : Promise.resolve([]),
        enabled: !!user?.company_id,
        staleTime: 60000 // 1 minute
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
            showToast("تمت المناقلة بنجاح", 'success');
        }
    });

    const audit = useMutation({
        mutationFn: (data: any) => {
            if (!user?.company_id || !user.id) throw new Error("Auth error");
            return inventoryService.startAudit(data, user.company_id, user.id);
        },
        onSuccess: () => {
            showToast("تم بدء جلسة الجرد", 'success');
        }
    });

    return {
        createTransfer: transfer.mutate,
        isTransferring: transfer.isPending,
        startAudit: audit.mutate,
        isStartingAudit: audit.isPending
    };
};

export * from './hooks/useAutoParts';
