
/**
 * Shared database type aliases used across features (sales, purchases, etc.)
 * Centralizes Db type references to avoid duplication.
 */
import { Database } from '../core/database.types';

// Shared table row types
export type DbInvoice = Database['public']['Tables']['invoices']['Row'];
export type DbInvoiceItem = Database['public']['Tables']['invoice_items']['Row'];
export type DbParty = Database['public']['Tables']['parties']['Row'];
export type DbProduct = Database['public']['Tables']['products']['Row'];
