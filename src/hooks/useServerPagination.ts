// ============================================
// useServerPagination - تدوير البيانات من السيرفر
// Al-Zahra Smart ERP
// ============================================

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PaginationParams, PaginatedResponse } from '@/core/types/common';

/**
 * Hook for server-side pagination
 * 
 * @example
 * const { 
 *   data, 
 *   isLoading, 
 *   pagination,
 *   setPage,
 *   setLimit,
 *   nextPage,
 *   prevPage 
 * } = useServerPagination(
 *   (params) => fetchInvoices(params),
 *   { queryKey: ['invoices'] }
 * );
 */
export const useServerPagination = <T>(
    queryFn: (params: PaginationParams) => Promise<PaginatedResponse<T>>,
    options?: {
        queryKey?: unknown[];
        initialParams?: PaginationParams;
        enabled?: boolean;
    }
) => {
    const { queryKey = [], enabled = true } = options || {};

    const [paginationState, setPaginationState] = useState<PaginationParams>(
        options?.initialParams || { page: 1, limit: 20 }
    );

    const query = useQuery({
        queryKey: [...queryKey, 'pagination', paginationState] as unknown[],
        queryFn: () => queryFn(paginationState),
        enabled,
        staleTime: 30 * 1000, // 30 seconds
    });

    const setPage = useCallback((newPage: number) => {
        setPaginationState(prev => ({ ...prev, page: newPage }));
    }, []);

    const setLimit = useCallback((newLimit: number) => {
        setPaginationState(prev => ({ ...prev, limit: newLimit, page: 1 }));
    }, []);

    const setSort = useCallback((sortBy: string, sortOrder: 'asc' | 'desc' = 'desc') => {
        setPaginationState(prev => ({ ...prev, sortBy, sortOrder }));
    }, []);

    const setParams = useCallback((newParams: Partial<PaginationParams>) => {
        setPaginationState(prev => ({ ...prev, ...newParams }));
    }, []);

    const nextPage = useCallback(() => {
        if (query.data && paginationState.page < query.data.totalPages) {
            setPage(paginationState.page + 1);
        }
    }, [query.data, paginationState.page, setPage]);

    const prevPage = useCallback(() => {
        if (paginationState.page > 1) {
            setPage(paginationState.page - 1);
        }
    }, [paginationState.page, setPage]);

    const goToFirstPage = useCallback(() => {
        setPage(1);
    }, [setPage]);

    const goToLastPage = useCallback(() => {
        if (query.data) {
            setPage(query.data.totalPages);
        }
    }, [query.data, setPage]);

    const refresh = useCallback(() => {
        query.refetch();
    }, [query]);

    // Reset page when params change significantly
    useEffect(() => {
        if (!query.data) return;
        if (paginationState.page > query.data.totalPages && query.data.totalPages > 0) {
            setPage(1);
        }
    }, [query.data, paginationState.page, setPage]);

    const pagination = useMemo(() => ({
        page: paginationState.page,
        limit: paginationState.limit,
        sortBy: paginationState.sortBy,
        sortOrder: paginationState.sortOrder,
        total: query.data?.total ?? 0,
        totalPages: query.data?.totalPages ?? 0,
        hasNextPage: query.data ? paginationState.page < query.data.totalPages : false,
        hasPrevPage: paginationState.page > 1,
        isFirstPage: paginationState.page === 1,
        isLastPage: query.data ? paginationState.page >= query.data.totalPages : true,
    }), [paginationState, query.data]);

    return {
        // Query result
        ...query,

        // Data helpers
        data: query.data?.data ?? [],
        total: query.data?.total ?? 0,

        // Pagination state
        params: paginationState,
        setPage,
        setLimit,
        setSort,
        setParams,
        nextPage,
        prevPage,
        goToFirstPage,
        goToLastPage,
        refresh,

        // Pagination info
        pagination,

        // Loading states
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        isPaginationLoading: query.isFetching && !query.isLoading,
    };
};

/**
 * Hook for client-side pagination
 * Useful when all data is loaded at once
 * 
 * @example
 * const {
 *   data: paginatedData,
 *   pagination
 * } = useClientPagination(items, { initialLimit: 20 });
 */
export const useClientPagination = <T>(
    items: T[],
    config?: {
        initialPage?: number;
        initialLimit?: number;
    }
) => {
    const { initialPage = 1, initialLimit = 20 } = config || {};

    const [currentPage, setCurrentPage] = useState(initialPage);
    const [pageLimit, setPageLimit] = useState(initialLimit);

    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / pageLimit);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageLimit;
        return items.slice(start, start + pageLimit);
    }, [items, currentPage, pageLimit]);

    const paginationInfo = useMemo(() => ({
        page: currentPage,
        limit: pageLimit,
        total: totalItems,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
        isFirstPage: currentPage === 1,
        isLastPage: currentPage >= totalPages,
    }), [currentPage, pageLimit, totalItems, totalPages]);

    const goToPage = useCallback((newPage: number) => {
        const maxPage = Math.ceil(totalItems / pageLimit);
        setCurrentPage(Math.min(Math.max(1, newPage), maxPage || 1));
    }, [totalItems, pageLimit]);

    const changeLimit = useCallback((newLimit: number) => {
        setPageLimit(newLimit);
        setCurrentPage(1);
    }, []);

    return {
        data: paginatedData,
        pagination: paginationInfo,
        setPage: goToPage,
        setLimit: changeLimit,
    };
};
