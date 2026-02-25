// ============================================
// الأنواع الأساسية المشتركة للتطبيق
// Common Application Types
// ============================================

import { LucideIcon } from 'lucide-react';

// ------------------------------------------
// Status Types
// ------------------------------------------
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type EntityStatus = 'active' | 'inactive' | 'pending' | 'deleted';

export type InvoiceType = 'sale' | 'purchase' | 'return_sale' | 'return_purchase';

export type InvoiceStatus = 'draft' | 'pending' | 'confirmed' | 'paid' | 'cancelled';

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'cheque' | 'other';

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
export interface Product extends BaseEntity {
    company_id: string;
    name_ar: string;
    sku: string;
    description?: string;
    category?: string;
    unit: string;
    purchase_price: number;
    sale_price: number;
    cost_price: number;
    reorder_level: number;
    status: EntityStatus;
    image_url?: string;
    barcode?: string;
}

export interface ProductCategory {
    id: string;
    company_id: string;
    name_ar: string;
    name_en?: string;
    parent_id?: string;
    product_count?: number;
}

// ------------------------------------------
// Inventory Types
// ------------------------------------------
export interface StockLevel {
    product_id: string;
    warehouse_id: string;
    quantity: number;
    reserved_quantity: number;
    available_quantity: number;
}

export interface StockMovement extends BaseEntity {
    product_id: string;
    warehouse_id: string;
    quantity: number;
    type: 'in' | 'out' | 'transfer' | 'adjustment';
    reference_type?: string;
    reference_id?: string;
    notes?: string;
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
    credit_limit?: number;
    tax_number?: string;
}

export interface PartyBalance {
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
    tax_rate: number;
    discount_rate: number;
    total: number;
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
    entry_number: string;
    date: string;
    description: string;
    debit_total: number;
    credit_total: number;
    is_posted: boolean;
}

export interface JournalLine {
    id: string;
    journal_id: string;
    account_id: string;
    debit: number;
    credit: number;
    description?: string;
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
    email?: string;
    logo_url?: string;
    base_currency: string;
    fiscal_year_start: string;
    tax_rate: number;
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
