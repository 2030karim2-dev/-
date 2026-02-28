// ============================================
// الأنواع الأساسية المشتركة للتطبيق
// Common Application Types
// ============================================

import { LucideIcon } from 'lucide-react';

// ------------------------------------------
// Status Types
// ------------------------------------------
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type EntityStatus = 'active' | 'inactive' | 'pending';

export type InvoiceType = 'sale' | 'purchase' | 'return_sale' | 'return_purchase';

export type InvoiceStatus = 'draft' | 'posted' | 'paid' | 'void';

export type PaymentMethod = 'cash' | 'credit' | 'bank';

export type PartyType = 'customer' | 'supplier';

// ------------------------------------------
// Base Entity Types
// ------------------------------------------
export interface BaseEntity {
    id: string;
    created_at: string;
    updated_at: string;
}

export interface CompanyEntity extends BaseEntity {
    company_id: string;
}

export interface NamedEntity extends BaseEntity {
    name_ar: string;
    name_en?: string;
}

// ------------------------------------------
// Product Types
// ------------------------------------------
export type ProductStatus = 'active' | 'inactive';

export interface Product extends BaseEntity {
    company_id: string;
    name_ar: string;
    sku: string;
    part_number?: string;
    brand?: string;
    description?: string;
    size?: string;
    specifications?: string;
    unit: string;
    purchase_price: number;
    sale_price: number;
    cost_price: number;
    min_stock_level: number;
    image_url?: string;
    barcode?: string;
    alternative_numbers?: string;
    status: ProductStatus;
    category_id?: string;
    is_kit?: boolean;
    has_core_charge?: boolean;
    core_charge_amount?: number;
    deleted_at?: string;
}

export interface ProductCategory {
    id: string;
    company_id: string;
    name: string;
    created_at: string;
}

// ------------------------------------------
// Inventory Types
// ------------------------------------------
export interface StockLevel {
    product_id: string;
    warehouse_id: string;
    quantity: number;
}

export type InventoryTransactionType =
    | 'purchase' | 'sales' | 'purchase_return' | 'sales_return'
    | 'transfer_in' | 'transfer_out' | 'adj_in' | 'adj_out' | 'adj' | 'initial';

export interface StockMovement extends BaseEntity {
    company_id: string;
    product_id: string;
    warehouse_id: string;
    quantity: number;
    transaction_type: InventoryTransactionType;
    reference_type?: string;
    reference_id?: string;
    created_by?: string;
}

// ------------------------------------------
// Party (Customer/Supplier) Types
// ------------------------------------------
export interface Party extends BaseEntity {
    company_id: string;
    name: string;
    type: PartyType;
    phone?: string;
    email?: string;
    address?: string;
    balance: number;
    tax_number?: string;
    status: 'active' | 'blocked';
    category_id?: string;
    deleted_at?: string;
}

export interface PartyBalance {
    company_id: string;
    party_id: string;
    total_debit: number;
    total_credit: number;
    balance: number;
}

// ------------------------------------------
// Invoice Types
// ------------------------------------------
export interface Invoice extends BaseEntity {
    company_id: string;
    party_id?: string;
    invoice_number: string;
    type: InvoiceType;
    status: InvoiceStatus;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    paid_amount: number;
    issue_date: string;
    due_date?: string;
    notes?: string;
}

export interface InvoiceItem {
    id: string;
    invoice_id: string;
    product_id?: string;
    description?: string;
    quantity: number;
    unit_price: number;
    cost_price: number;
    tax_amount: number;
    discount_amount: number;
    total: number;
    is_core_return?: boolean;
}

// ------------------------------------------
// Accounting Types
// ------------------------------------------
export interface Account extends BaseEntity {
    company_id: string;
    code: string;
    name_ar: string;
    name_en?: string;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    parent_id?: string;
    balance: number;
    is_active: boolean;
}

export interface JournalEntry extends BaseEntity {
    company_id: string;
    entry_number: number;
    entry_date: string;
    description?: string;
    reference_type?: string;
    reference_id?: string;
    status: 'draft' | 'posted' | 'void';
    created_by?: string;
    deleted_at?: string;
}

export interface JournalLine {
    id: string;
    journal_entry_id: string;
    account_id: string;
    debit_amount: number;
    credit_amount: number;
    description?: string;
    currency_code?: string;
    foreign_amount?: number;
    exchange_rate?: number;
    deleted_at?: string;
}

// ------------------------------------------
// Financial Types
// ------------------------------------------
export interface FinancialSummary {
    total_revenue: number;
    total_expenses: number;
    net_profit: number;
    total_assets: number;
    total_liabilities: number;
    total_equity: number;
}

export interface CashFlow {
    date: string;
    inflow: number;
    outflow: number;
    net: number;
}

// ------------------------------------------
// Report Types
// ------------------------------------------
export interface ReportFilter {
    start_date?: string;
    end_date?: string;
    warehouse_id?: string;
    category_id?: string;
    party_id?: string;
    account_id?: string;
}

export interface ChartDataPoint {
    label: string;
    value: number;
    color?: string;
}

export interface TimeSeriesData {
    date: string;
    value: number;
}

// ------------------------------------------
// UI Types
// ------------------------------------------
export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface TableColumn<T = unknown> {
    key: string;
    header: string;
    width?: string;
    sortable?: boolean;
    render?: (item: T) => React.ReactNode;
}

export interface PaginationInfo {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
}

export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
    pagination?: PaginationInfo;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, string>;
}

// ------------------------------------------
// Dashboard Types
// ------------------------------------------
export interface DashboardStats {
    total_sales: number;
    total_purchases: number;
    total_products: number;
    total_customers: number;
    total_suppliers: number;
    low_stock_items: number;
    pending_invoices: number;
}

export interface RecentActivity {
    id: string;
    type: 'sale' | 'purchase' | 'payment' | 'inventory';
    description: string;
    amount?: number;
    date: string;
    user?: string;
}

// ------------------------------------------
// Settings Types
// ------------------------------------------
export interface CompanySettings {
    id: string;
    name_ar: string;
    name_en?: string;
    tax_number?: string;
    address?: string;
    phone?: string;
    base_currency: string;
}

export interface Warehouse {
    id: string;
    company_id: string;
    branch_id?: string;
    name_ar: string;
    location?: string;
    is_primary: boolean;
    status: EntityStatus;
}

// ------------------------------------------
// Utility Types
// ------------------------------------------
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Maybe<T> = T | null | undefined;

export type ValueOf<T> = T[keyof T];

export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};

export interface KeyValuePair<K extends string, V> {
    key: K;
    value: V;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
    field: string;
    direction: SortDirection;
}
