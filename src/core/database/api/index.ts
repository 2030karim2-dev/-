/**
 * Core Database API Layer - Barrel File
 * 
 * Centralized exports for all domain-specific API modules.
 * Features should import from here instead of directly from supabase.
 */

export { supabase, parseError } from './baseApi';
export type { ApiResponse, PaginatedResponse, PaginationParams } from './baseApi';
export { buildRange, endOfDayISO, softDeletePayload, unwrapSingle, unwrapList, unwrapVoid, checkRelatedRecords } from './baseApi';

export { accountsApi } from './accountsApi';
export { productsApi } from './productsApi';
export { salesInvoicesApi, purchaseInvoicesApi } from './invoicesApi';
export type { CreateInvoicePayload, CreateInvoiceItem, InvoiceResponse, CreatePurchaseDTO, CreatePurchaseItem, SupplierPaymentData } from './invoicesApi';
export { partiesApi } from './partiesApi';
export type { PartyType, PartyFormData } from './partiesApi';
export { warehouseApi } from './warehouseApi';
export { journalsApi } from './journalsApi';
