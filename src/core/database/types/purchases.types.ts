/**
 * Purchases Domain Database Types
 * 
 * Types for purchase-related operations based on actual database schema.
 * Note: purchase_orders, purchase_quotations tables may be implemented as 
 * extended types or computed from invoices table with party_type filter.
 */

import type { TableRow, TableInsert, TableUpdate } from './common.types';

// ============================================
// Supplier related types
// ============================================
export type DBSupplierRating = TableRow<'supplier_ratings'>;
export type DBSupplierRatingInsert = TableInsert<'supplier_ratings'>;
export type DBSupplierRatingUpdate = TableUpdate<'supplier_ratings'>;

export type DBSupplierPriceHistory = TableRow<'supplier_price_history'>;
export type DBSupplierPriceHistoryInsert = TableInsert<'supplier_price_history'>;
export type DBSupplierPriceHistoryUpdate = TableUpdate<'supplier_price_history'>;

export type DBProductSupplierPrice = TableRow<'product_supplier_prices'>;
export type DBProductSupplierPriceInsert = TableInsert<'product_supplier_prices'>;
export type DBProductSupplierPriceUpdate = TableUpdate<'product_supplier_prices'>;

/**
 * Purchase Order type - computed from invoices where party_type = 'supplier'
 * This is a domain concept that may be represented as an extended type
 */
export interface DBPurchaseOrder extends TableRow<'invoices'> {
    party_type?: 'supplier';
}

/**
 * Purchase Quotation type - computed from invoices where party_type = 'supplier'
 * and status = 'quotation'
 */
export interface DBPurchaseQuotation extends TableRow<'invoices'> {
    party_type?: 'supplier';
    is_quotation?: boolean;
}
