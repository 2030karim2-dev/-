// ============================================
// useFilter - Hook للبحث والفلترة
// Al-Zahra Smart ERP
// ============================================

import { useState, useCallback, useMemo, useEffect } from 'react';

/**
 * Hook للبحث والفلترة مع دعم Debounce
 * 
 * @example
 * const {
 *   searchTerm,
 *   setSearchTerm,
 *   filters,
 *   setFilter,
 *   clearFilters,
 *   filteredData
 * } = useFilter(data, {
 *   searchKeys: ['name', 'sku'],
 *   debounceMs: 300
 * });
 */
export const useFilter = <T>(
    data: T[],
    options?: {
        searchKeys?: (keyof T)[];
        debounceMs?: number;
        initialFilters?: Record<string, unknown>;
    }
) => {
    const { searchKeys = [], debounceMs = 300, initialFilters = {} } = options || {};

    // Search term state
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Filters state
    const [filters, setFilters] = useState<Record<string, unknown>>(initialFilters);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [searchTerm, debounceMs]);

    // Set filter helper
    const setFilter = useCallback((key: string, value: unknown) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    }, []);

    // Remove filter helper
    const removeFilter = useCallback((key: string) => {
        setFilters(prev => {
            const newFilters = { ...prev };
            delete newFilters[key];
            return newFilters;
        });
    }, []);

    // Clear all filters
    const clearFilters = useCallback(() => {
        setFilters({});
        setSearchTerm('');
        setDebouncedSearch('');
    }, []);

    // Clear search only
    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setDebouncedSearch('');
    }, []);

    // Filter data
    const filteredData = useMemo(() => {
        if (!data) return [];

        return data.filter(item => {
            // Search filter
            if (debouncedSearch && searchKeys.length > 0) {
                const searchLower = debouncedSearch.toLowerCase();
                const matchesSearch = searchKeys.some(key => {
                    const value = item[key];
                    if (typeof value === 'string') {
                        return value.toLowerCase().includes(searchLower);
                    }
                    if (typeof value === 'number') {
                        return value.toString().includes(searchLower);
                    }
                    return false;
                });
                if (!matchesSearch) return false;
            }

            // Custom filters
            for (const [key, value] of Object.entries(filters)) {
                if (value === undefined || value === null || value === '') continue;

                const itemValue = item[key as keyof T];

                if (Array.isArray(value)) {
                    if (!value.includes(itemValue)) return false;
                } else if (typeof value === 'string') {
                    if (String(itemValue).toLowerCase().includes(value.toLowerCase()) === false) {
                        return false;
                    }
                } else if (value !== itemValue) {
                    return false;
                }
            }

            return true;
        });
    }, [data, debouncedSearch, searchKeys, filters]);

    // Active filter count
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (debouncedSearch) count++;
        count += Object.values(filters).filter(v => v !== undefined && v !== null && v !== '').length;
        return count;
    }, [debouncedSearch, filters]);

    return {
        // Search
        searchTerm,
        setSearchTerm,
        clearSearch,
        debouncedSearch,

        // Filters
        filters,
        setFilter,
        removeFilter,
        clearFilters,
        activeFilterCount,

        // Data
        filteredData,
        totalCount: data.length,
        filteredCount: filteredData.length,
    };
};

/**
 * Hook للفلترة من السيرفر
 * يُستخدم مع APIs التي تدعم الفلترة من الجهة الأخرى
 * 
 * @example
 * const {
 *   filters,
 *   setFilter,
 *   removeFilter,
 *   clearFilters,
 *   isFilterActive
 * } = useServerFilters();
 */
export const useServerFilters = <T extends Record<string, unknown>>(
    initialFilters?: Partial<T>
) => {
    const [filters, setFilters] = useState<Partial<T>>(initialFilters || {});

    const setFilter = useCallback((key: keyof T, value: unknown) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    }, []);

    const removeFilter = useCallback((key: keyof T) => {
        setFilters(prev => {
            const newFilters = { ...prev };
            delete newFilters[key];
            return newFilters;
        });
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({});
    }, []);

    const isFilterActive = useMemo(() => {
        return Object.values(filters).some(v => v !== undefined && v !== null && v !== '');
    }, [filters]);

    const queryString = useMemo(() => {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, String(value));
            }
        }
        return params.toString();
    }, [filters]);

    return {
        filters,
        setFilter,
        removeFilter,
        clearFilters,
        isFilterActive,
        queryString,
    };
};
