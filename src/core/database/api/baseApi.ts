/**
 * Core Database API Base Layer
 * 
 * Provides the shared Supabase client instance and common utilities
 * for all domain-specific API modules.
 * 
 * All feature-level API modules should import `supabase` from here
 * instead of directly from `@/lib/supabaseClient`.
 */

import { supabase } from '@/lib/supabaseClient';
import { parseError } from '@/core/utils/errorUtils';
import type { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';

// Re-export the supabase client for use by all domain APIs
export { supabase };

// Re-export error utilities
export { parseError };

// ============================================
// Common API Response Types
// ============================================

export interface ApiResponse<T> {
    data: T | null;
    error: Error | null;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    total?: number;
    page?: number;
    limit?: number;
}

// ============================================
// Pagination Helpers
// ============================================

export interface PaginationParams {
    page?: number;
    limit?: number;
}

export function buildRange(params: PaginationParams): { from: number; to: number } {
    const page = params.page ?? 0;
    const limit = params.limit ?? 50;
    const from = page * limit;
    const to = from + limit - 1;
    return { from, to };
}

// ============================================
// Date Range Helpers
// ============================================

export function endOfDayISO(dateStr: string): string {
    const date = new Date(dateStr);
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
}

// ============================================
// Soft Delete Helpers
// ============================================

export function softDeletePayload() {
    return { deleted_at: new Date().toISOString() };
}

// ============================================
// Response Helpers
// ============================================

export function unwrapSingle<T>(response: PostgrestSingleResponse<T>): T {
    if (response.error) throw parseError(response.error);
    if (!response.data) throw new Error('Record not found');
    return response.data;
}

export function unwrapList<T>(response: PostgrestResponse<T>): T[] {
    if (response.error) throw parseError(response.error);
    return response.data || [];
}

export function unwrapVoid(response: { error: Error | null }): void {
    if (response.error) throw parseError(response.error);
}

// ============================================
// Safety Check Helpers
// ============================================

export async function checkRelatedRecords(
    table: string,
    column: string,
    value: string,
    errorMessage: string
): Promise<void> {
    const { count, error } = await supabase
        .from(table as any)
        .select('id', { count: 'exact', head: true })
        .eq(column as any, value);

    if (error) throw parseError(error);
    if (count && count > 0) {
        throw new Error(errorMessage);
    }
}
