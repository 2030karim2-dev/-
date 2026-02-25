// ============================================
// Product Search Hook
// Hook for searching products
// ============================================

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../../inventory/api';

interface UseProductSearchOptions {
    companyId: string;
    debounceMs?: number;
    enabled?: boolean;
}

interface ProductSearchResult {
    id: string;
    name_ar: string;
    sku: string;
    sale_price: number;
    purchase_price: number;
    quantity: number;
    category?: string;
    alternative_numbers?: string;
}

export const useProductSearch = (searchTerm: string, options?: UseProductSearchOptions) => {
    const { companyId, debounceMs = 300, enabled = true } = options ?? {};

    const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

    // Debounce the search term
    useState(() => {
        const timer = setTimeout(() => {
            setDebouncedTerm(searchTerm);
        }, debounceMs);

        return () => clearTimeout(timer);
    });

    const queryKey = useMemo(() =>
        ['product_search', companyId, debouncedTerm] as const,
        [companyId, debouncedTerm]
    );

    const {
        data: products = [],
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!companyId || !debouncedTerm || debouncedTerm.length < 2) {
                return [];
            }

            const { data, error } = await inventoryApi.searchProduct(companyId, debouncedTerm);

            if (error) {
                throw new Error(error.message || 'Failed to search products');
            }

            return (data as ProductSearchResult[]) || [];
        },
        enabled: enabled && !!companyId && debouncedTerm.length >= 2,
        staleTime: 30 * 1000, // 30 seconds
    });

    const search = useCallback((term: string) => {
        setDebouncedTerm(term);
    }, []);

    return {
        products,
        isLoading,
        isError,
        error,
        search,
        hasResults: products.length > 0,
        resultsCount: products.length,
    };
};

export default useProductSearch;
