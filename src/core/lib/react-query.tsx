// ============================================
// إعداد React Query
// React Query Configuration
// ============================================

import React, { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ------------------------------------------
// Query Configuration
// ------------------------------------------
export const QUERY_CONFIG = {
    // Default stale time (5 minutes)
    DEFAULT_STALE_TIME: 5 * 60 * 1000,

    // Cache time (10 minutes)
    DEFAULT_CACHE_TIME: 10 * 60 * 1000,

    // Retry configuration
    DEFAULT_RETRY: 2,
    RETRY_DELAY: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Refetch on window focus
    REFETCH_ON_WINDOW_FOCUS: false,

    // Refetch on reconnect
    REFETCH_ON_RECONNECT: true,

    // Timeout for queries
    DEFAULT_QUERY_TIMEOUT: 15000, // 15 seconds

    // Retry only on network errors
    RETRY_ON_SERVER_ERROR: false,
    RETRY_ON_CLIENT_ERROR: false,
} as const;

// ------------------------------------------
// Query Keys
// ------------------------------------------

// ------------------------------------------
// Query Keys
// ------------------------------------------
export const queryKeys = {
    // Auth
    auth: {
        me: ['auth', 'me'] as const,
        session: ['auth', 'session'] as const,
    },

    // Inventory
    inventory: {
        all: ['inventory'] as const,
        products: () => [...inventoryKeys.all, 'products'] as const,
        product: (id: string) => [...inventoryKeys.products(), id] as const,
        categories: () => [...inventoryKeys.all, 'categories'] as const,
        warehouses: () => [...inventoryKeys.all, 'warehouses'] as const,
        stock: (warehouseId?: string) => [...inventoryKeys.all, 'stock', warehouseId] as const,
        movements: (productId?: string) => [...inventoryKeys.all, 'movements', productId] as const,
    },

    // Sales
    sales: {
        all: ['sales'] as const,
        invoices: () => [...salesKeys.all, 'invoices'] as const,
        invoice: (id: string) => [...salesKeys.invoices(), id] as const,
        returns: () => [...salesKeys.all, 'returns'] as const,
        stats: () => [...salesKeys.all, 'stats'] as const,
        analytics: (period: string) => [...salesKeys.all, 'analytics', period] as const,
    },

    // Purchases
    purchases: {
        all: ['purchases'] as const,
        invoices: () => [...purchasesKeys.all, 'invoices'] as const,
        invoice: (id: string) => [...purchasesKeys.invoices(), id] as const,
        returns: () => [...purchasesKeys.all, 'returns'] as const,
        stats: () => [...purchasesKeys.all, 'stats'] as const,
    },

    // Accounting
    accounting: {
        all: ['accounting'] as const,
        accounts: () => [...accountingKeys.all, 'accounts'] as const,
        account: (id: string) => [...accountingKeys.accounts(), id] as const,
        journals: () => [...accountingKeys.all, 'journals'] as const,
        journal: (id: string) => [...accountingKeys.journals(), id] as const,
        trialBalance: (date: string) => [...accountingKeys.all, 'trial-balance', date] as const,
        balanceSheet: (date: string) => [...accountingKeys.all, 'balance-sheet', date] as const,
        incomeStatement: (period: string) => [...accountingKeys.all, 'income-statement', period] as const,
    },

    // Parties (Customers/Suppliers)
    parties: {
        all: ['parties'] as const,
        customers: () => [...partiesKeys.all, 'customers'] as const,
        customer: (id: string) => [...partiesKeys.customers(), id] as const,
        suppliers: () => [...partiesKeys.all, 'suppliers'] as const,
        supplier: (id: string) => [...partiesKeys.suppliers(), id] as const,
        statement: (id: string, type: 'customer' | 'supplier') => [...partiesKeys.all, 'statement', id, type] as const,
    },

    // Dashboard
    dashboard: {
        stats: ['dashboard', 'stats'] as const,
        recentActivity: ['dashboard', 'recent-activity'] as const,
        topProducts: ['dashboard', 'top-products'] as const,
        topCustomers: ['dashboard', 'top-customers'] as const,
        salesChart: (period: string) => ['dashboard', 'sales-chart', period] as const,
        inventoryChart: (period: string) => ['dashboard', 'inventory-chart', period] as const,
    },

    // Reports
    reports: {
        all: ['reports'] as const,
        inventory: (type: string) => ['reports', 'inventory', type] as const,
        financial: (type: string, period: string) => ['reports', 'financial', type, period] as const,
        tax: (period: string) => ['reports', 'tax', period] as const,
        cashFlow: (period: string) => ['reports', 'cash-flow', period] as const,
    },

    // Settings
    settings: {
        all: ['settings'] as const,
        company: ['settings', 'company'] as const,
        warehouses: ['settings', 'warehouses'] as const,
        currency: ['settings', 'currency'] as const,
        fiscalYear: ['settings', 'fiscal-year'] as const,
        taxDiscount: ['settings', 'tax-discount'] as const,
        notifications: ['settings', 'notifications'] as const,
        security: ['settings', 'security'] as const,
    },
} as const;

// Type-safe query key accessors
const inventoryKeys = queryKeys.inventory;
const salesKeys = queryKeys.sales;
const purchasesKeys = queryKeys.purchases;
const accountingKeys = queryKeys.accounting;
const partiesKeys = queryKeys.parties;

// ------------------------------------------
// Query Client Factory
// ------------------------------------------
export const createQueryClient = (options?: Partial<typeof QUERY_CONFIG>) => {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: options?.DEFAULT_STALE_TIME ?? QUERY_CONFIG.DEFAULT_STALE_TIME,
                gcTime: options?.DEFAULT_CACHE_TIME ?? QUERY_CONFIG.DEFAULT_CACHE_TIME,
                retry: options?.DEFAULT_RETRY ?? QUERY_CONFIG.DEFAULT_RETRY,
                refetchOnWindowFocus: options?.REFETCH_ON_WINDOW_FOCUS ?? QUERY_CONFIG.REFETCH_ON_WINDOW_FOCUS,
                refetchOnReconnect: options?.REFETCH_ON_RECONNECT ?? QUERY_CONFIG.REFETCH_ON_RECONNECT,
            },
            mutations: {
                retry: 1,
            },
        },
    });
};

// ------------------------------------------
// React Query Provider Component
// ------------------------------------------
interface ReactQueryProviderProps {
    children: ReactNode;
    client?: QueryClient;
}

export const ReactQueryProvider: React.FC<ReactQueryProviderProps> = ({
    children,
    client
}) => {
    const [queryClient] = useState(() => client ?? createQueryClient());

    return (
        <QueryClientProvider client={queryClient} >
            {children}
        </QueryClientProvider>
    );
};

// ------------------------------------------
// Query Hook Options
// ------------------------------------------
export interface UseQueryOptions<TData, TError = Error> {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
    refetchOnWindowFocus?: boolean;
    refetchOnReconnect?: boolean;
    retry?: number | false;
    retryDelay?: (attemptIndex: number) => number;
    select?: (data: unknown) => TData;
    placeholderData?: unknown;
    initialData?: unknown;
}

export interface UseMutationOptions<TData, TError, TVariables, TContext> {
    onMutate?: (variables: TVariables) => Promise<TContext | void> | TContext | void;
    onError?: (error: TError, variables: TVariables, context?: TContext) => void | Promise<void>;
    onSettled?: (data: TData, error: TError | null, variables: TVariables, context?: TContext) => void | Promise<void>;
    retry?: number | false;
    retryDelay?: (attemptIndex: number) => number;
}

// ------------------------------------------
// Utility Hooks
// ------------------------------------------
export const useInvalidateQueries = () => {
    // This will be used with useQueryClient in components
    return {
        invalidateAll: () => {
            // Will be implemented with queryClient.invalidateQueries()
        },
        invalidateInventory: () => {
            // Will be implemented with queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
        },
        invalidateSales: () => {
            // Will be implemented with queryClient.invalidateQueries({ queryKey: salesKeys.all })
        },
        invalidatePurchases: () => {
            // Will be implemented with queryClient.invalidateQueries({ queryKey: purchasesKeys.all })
        },
        invalidateAccounting: () => {
            // Will be implemented with queryClient.invalidateQueries({ queryKey: accountingKeys.all })
        },
        invalidateParties: () => {
            // Will be implemented with queryClient.invalidateQueries({ queryKey: partiesKeys.all })
        },
        invalidateDashboard: () => {
            // Will be implemented with queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        },
    };
};

export default queryKeys;
