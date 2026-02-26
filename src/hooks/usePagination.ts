/**
 * Custom Pagination Hook
 * Provides reusable pagination logic for lists throughout the application
 */

import { useState, useCallback, useMemo } from 'react';

export interface PaginationState {
    page: number;
    limit: number;
    total: number;
}

export interface UsePaginationOptions {
    initialPage?: number;
    initialLimit?: number;
    total?: number;
}

export interface UsePaginationReturn {
    pagination: PaginationState;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    setTotal: (total: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    goToPage: (page: number) => void;
    offset: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
    const {
        initialPage = 1,
        initialLimit = 20,
        total: initialTotal = 0,
    } = options;

    const [pagination, setPagination] = useState<PaginationState>({
        page: initialPage,
        limit: initialLimit,
        total: initialTotal,
    });

    const setPage = useCallback((page: number) => {
        setPagination(prev => ({ ...prev, page: Math.max(1, page) }));
    }, []);

    const setLimit = useCallback((limit: number) => {
        setPagination(prev => ({
            ...prev,
            limit: Math.min(100, Math.max(1, limit)),
            page: 1, // Reset to first page when limit changes
        }));
    }, []);

    const setTotal = useCallback((total: number) => {
        setPagination(prev => ({ ...prev, total }));
    }, []);

    const nextPage = useCallback(() => {
        setPagination(prev => ({
            ...prev,
            page: Math.min(prev.page + 1, Math.ceil(prev.total / prev.limit) || 1)
        }));
    }, []);

    const prevPage = useCallback(() => {
        setPagination(prev => ({
            ...prev,
            page: Math.max(1, prev.page - 1)
        }));
    }, []);

    const goToPage = useCallback((page: number) => {
        const maxPage = Math.ceil(pagination.total / pagination.limit) || 1;
        setPagination(prev => ({
            ...prev,
            page: Math.max(1, Math.min(page, maxPage))
        }));
    }, [pagination.total, pagination.limit]);

    const offset = useMemo(() => {
        return (pagination.page - 1) * pagination.limit;
    }, [pagination.page, pagination.limit]);

    const totalPages = useMemo(() => {
        return Math.ceil(pagination.total / pagination.limit) || 1;
    }, [pagination.total, pagination.limit]);

    const hasNextPage = useMemo(() => {
        return pagination.page < totalPages;
    }, [pagination.page, totalPages]);

    const hasPrevPage = useMemo(() => {
        return pagination.page > 1;
    }, [pagination.page]);

    return {
        pagination,
        setPage,
        setLimit,
        setTotal,
        nextPage,
        prevPage,
        goToPage,
        offset,
        totalPages,
        hasNextPage,
        hasPrevPage,
    };
}

/**
 * Hook for server-side pagination with React Query
 */
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

export interface UseServerPaginationOptions<T> {
    queryKey: string[];
    queryFn: (params: { page: number; limit: number }) => Promise<{ data: T[]; total: number }>;
    initialLimit?: number;
    enabled?: boolean;
}

export function useServerPagination<T>(options: UseServerPaginationOptions<T>) {
    const { queryKey, queryFn, initialLimit = 20, enabled = true } = options;

    const query = useInfiniteQuery({
        queryKey,
        queryFn: async ({ pageParam = 1 }) => {
            return queryFn({ page: pageParam, limit: initialLimit });
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.data.length < initialLimit) return undefined;
            return allPages.length + 1;
        },
        enabled,
    });

    const allData = useMemo(() => {
        return query.data?.pages.flatMap(page => page.data) || [];
    }, [query.data]);

    const total = query.data?.pages[0]?.total || 0;

    return {
        ...query,
        data: allData,
        total,
    };
}
