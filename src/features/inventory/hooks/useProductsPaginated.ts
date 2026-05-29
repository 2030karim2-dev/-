/**
 * useProductsPaginated
 * =====================
 * Server-side pagination hook for the product inventory list.
 *
 * Instead of fetching ALL products at once (which degrades with 10k+ rows),
 * this hook fetches a fixed page from Supabase on demand and keeps track of
 * the total count so the UI can render a proper pagination widget.
 *
 * Features:
 *  - Server-side pagination (OFFSET / LIMIT in the DB query)
 *  - Total-count from Supabase `count: 'exact'`
 *  - Server-side search debounce (300 ms)
 *  - Server-side sort direction
 *  - Real-time invalidation via Supabase channel
 *  - Prefetches the next page for instant navigation
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuthStore } from '../../auth/store';
import { productService } from '../services/productService';
import { Product } from '../types';
import { useDebounce } from '../../../lib/hooks/useDebounce';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProductsPage {
  data: Product[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UseProductsPaginatedOptions {
  pageSize?: number;
  initialPage?: number;
  initialSearch?: string;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
}

// ── Query key factory ────────────────────────────────────────────────────────

export const productsPageKey = (
  companyId: string,
  page: number,
  pageSize: number,
  search: string,
  sortKey: string,
  sortDir: string
) => ['products_paginated', companyId, page, pageSize, search, sortKey, sortDir] as const;

// ── Main hook ────────────────────────────────────────────────────────────────

export const useProductsPaginated = (options: UseProductsPaginatedOptions = {}) => {
  const {
    pageSize = 50,
    initialPage = 1,
    initialSearch = '',
    sortKey = 'updated_at',
    sortDir = 'desc',
  } = options;

  const { user } = useAuthStore();
  const companyId = user?.company_id ?? '';
  const queryClient = useQueryClient();

  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebounce(search, 300);

  // Reset to first page when search query changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  // Sync internal search state if initialSearch prop changes externally
  useEffect(() => {
    setSearch(initialSearch);
    setPage(1);
  }, [initialSearch]);

  // ── Main paginated query ─────────────────────────────────────────────────

  const queryKey = productsPageKey(companyId, page, pageSize, debouncedSearch, sortKey, sortDir);

  const query = useQuery<ProductsPage>({
    queryKey,
    queryFn: async (): Promise<ProductsPage> => {
      if (!companyId) return { data: [], totalCount: 0, page, pageSize, totalPages: 0 };

      const from = (page - 1) * pageSize;

      const { data, error } = await supabase.rpc('search_inventory_paginated', {
        p_company_id: companyId,
        p_term: debouncedSearch.trim(),
        p_limit: pageSize,
        p_offset: from,
        p_sort_key: sortKey,
        p_sort_dir: sortDir
      });
      if (error) throw error;

      const products = productService.mapRawProducts(data ?? []);
      const totalCount = (data as any)?.[0]?.total_count ?? 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return { data: products, totalCount, page, pageSize, totalPages };
    },
    enabled: !!companyId,
    staleTime: 1000 * 30, // 30s - products don't change every second
    placeholderData: (prev) => prev, // Keep previous data while loading new page (no flicker)
  });

  // ── Prefetch next page ───────────────────────────────────────────────────

  useEffect(() => {
    if (!query.data || page >= (query.data.totalPages ?? 1)) return;
    const nextKey = productsPageKey(companyId, page + 1, pageSize, debouncedSearch, sortKey, sortDir);
    void queryClient.prefetchQuery({
      queryKey: nextKey,
      queryFn: async (): Promise<ProductsPage> => {
        const from = page * pageSize;

        const { data, error } = await supabase.rpc('search_inventory_paginated', {
          p_company_id: companyId,
          p_term: debouncedSearch.trim(),
          p_limit: pageSize,
          p_offset: from,
          p_sort_key: sortKey,
          p_sort_dir: sortDir
        });
        if (error) throw error;

        const products = productService.mapRawProducts(data ?? []);
        const totalCount = (data as any)?.[0]?.total_count ?? 0;
        return { data: products, totalCount, page: page + 1, pageSize, totalPages: Math.ceil(totalCount / pageSize) };
      },
      staleTime: 1000 * 30,
    });
  }, [page, query.data, companyId, pageSize, debouncedSearch, sortKey, sortDir, queryClient]);

  // ── Real-time invalidation ───────────────────────────────────────────────
  // Handled globally by useRealtimeSync hook in src/lib/hooks/useRealtimeSync.ts

  // ── Navigation helpers ───────────────────────────────────────────────────

  const goToPage = useCallback((p: number) => setPage(p), []);
  const nextPage = useCallback(() => setPage((p) => p + 1), []);
  const prevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);

  return {
    // Data
    products: query.data?.data ?? [],
    totalCount: query.data?.totalCount ?? 0,
    totalPages: query.data?.totalPages ?? 1,

    // Pagination state
    page,
    pageSize,

    // Loading states
    isLoading: query.isLoading,
    isFetching: query.isFetching,  // true when background-fetching (next page prefetch etc.)
    isError: query.isError,
    error: query.error,

    // Search
    search,
    handleSearchChange,

    // Navigation
    goToPage,
    nextPage,
    prevPage,
  };
};
