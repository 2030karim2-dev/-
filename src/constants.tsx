// ============================================
// الثوابت الأساسية المشتركة للتطبيق
// Common Application Constants
// ============================================

import { LucideIcon } from 'lucide-react';

// ------------------------------------------
// Application Info
// ------------------------------------------
export const APP_NAME = 'Alzhra Smart';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'نظام متكامل لإدارة الأعمال';

// ------------------------------------------
// Currency Constants
// ------------------------------------------
export const CURRENCIES = {
    SAR: { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal', name_ar: 'ريال سعودي' },
    YER: { code: 'YER', symbol: 'ر.ي', name: 'Yemeni Rial', name_ar: 'ريال يمني' },
    USD: { code: 'USD', symbol: '$', name: 'US Dollar', name_ar: 'دولار أمريكي' },
    EUR: { code: 'EUR', symbol: '€', name: 'Euro', name_ar: 'يورو' },
    GBP: { code: 'GBP', symbol: '£', name: 'British Pound', name_ar: 'جنيه إسترليني' },
    AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', name_ar: 'درهم إماراتي' },
    OMR: { code: 'OMR', symbol: 'ر.ع', name: 'Omani Rial', name_ar: 'ريال عماني' },
    CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', name_ar: 'يوان صيني' },
} as const;

export const DEFAULT_CURRENCY = 'SAR';

// ------------------------------------------
// Date & Time Formats
// ------------------------------------------
export const DATE_FORMATS = {
    SHORT: 'DD/MM/YYYY',
    LONG: 'DD MMMM YYYY',
    ISO: 'YYYY-MM-DD',
    WITH_TIME: 'YYYY-MM-DD HH:mm:ss',
} as const;

export const DATE_LOCALES = {
    ar: 'ar-SA',
    en: 'en-US',
} as const;

// ------------------------------------------
// Pagination Constants
// ------------------------------------------
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZES: [10, 25, 50, 100],
    MAX_PAGE_SIZE: 100,
} as const;

// ------------------------------------------
// Validation Patterns
// ------------------------------------------
export const VALIDATION_PATTERNS = {
    PHONE: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    TAX_NUMBER: /^\d{15}$/,
    IBAN: /^SA[a-zA-Z0-9]{22}$/,
    SKU: /^[A-Za-z0-9-_]+$/,
} as const;

// ------------------------------------------
// Invoice Status Colors
// ------------------------------------------
export const INVOICE_STATUS_COLORS = {
    draft: 'gray',
    posted: 'blue',
    paid: 'green',
    void: 'red',
} as const;

// ------------------------------------------
// Entity Status
// ------------------------------------------
export const ENTITY_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    PENDING: 'pending',
    DELETED: 'deleted',
} as const;

// ------------------------------------------
// Transaction Types
// ------------------------------------------
export const TRANSACTION_TYPES = {
    SALE: 'sale',
    PURCHASE: 'purchase',
    RETURN_SALE: 'return_sale',
    RETURN_PURCHASE: 'return_purchase',
} as const;

// ------------------------------------------
// Payment Methods
// ------------------------------------------
export const PAYMENT_METHODS = [
    { value: 'cash', label: 'نقدي', label_en: 'Cash' },
    { value: 'card', label: 'بطاقة', label_en: 'Card' },
    { value: 'bank_transfer', label: 'تحويل بنكي', label_en: 'Bank Transfer' },
    { value: 'cheque', label: 'شيك', label_en: 'Cheque' },
    { value: 'other', label: 'أخرى', label_en: 'Other' },
] as const;

// ------------------------------------------
// Units of Measurement
// ------------------------------------------
export const PRODUCT_UNITS = [
    { value: 'piece', label: 'قطعة', label_en: 'Piece', symbol: 'pc' },
    { value: 'kg', label: 'كيلوغرام', label_en: 'Kilogram', symbol: 'kg' },
    { value: 'gram', label: 'غرام', label_en: 'Gram', symbol: 'g' },
    { value: 'liter', label: 'لتر', label_en: 'Liter', symbol: 'L' },
    { value: 'ml', label: 'ملليلتر', label_en: 'Milliliter', symbol: 'ml' },
    { value: 'meter', label: 'متر', label_en: 'Meter', symbol: 'm' },
    { value: 'cm', label: 'سنتيمتر', label_en: 'Centimeter', symbol: 'cm' },
    { value: 'box', label: 'صندوق', label_en: 'Box', symbol: 'box' },
    { value: 'pack', label: 'حزمة', label_en: 'Pack', symbol: 'pack' },
    { value: 'roll', label: 'لفة', label_en: 'Roll', symbol: 'roll' },
] as const;

// ------------------------------------------
// Account Types
// ------------------------------------------
export const ACCOUNT_TYPES = {
    ASSET: { value: 'asset', label: 'أصول', label_en: 'Assets' },
    LIABILITY: { value: 'liability', label: 'خصوم', label_en: 'Liabilities' },
    EQUITY: { value: 'equity', label: 'حقوق الملكية', label_en: 'Equity' },
    REVENUE: { value: 'revenue', label: 'إيرادات', label_en: 'Revenue' },
    EXPENSE: { value: 'expense', label: 'مصروفات', label_en: 'Expenses' },
} as const;

// ------------------------------------------
// Tax Rates
// ------------------------------------------
export const TAX_RATES = [
    { value: 0, label: '0%' },
    { value: 5, label: '5%' },
    { value: 10, label: '10%' },
    { value: 15, label: '15%' },
    { value: 20, label: '20%' },
] as const;

export const DEFAULT_TAX_RATE = 15;

// ------------------------------------------
// Stock Movement Types
// ------------------------------------------
export const STOCK_MOVEMENT_TYPES = {
    IN: { value: 'in', label: 'دخول', label_en: 'In', icon: 'ArrowDown' },
    OUT: { value: 'out', label: 'خروج', label_en: 'Out', icon: 'ArrowUp' },
    TRANSFER: { value: 'transfer', label: 'نقل', label_en: 'Transfer', icon: 'ArrowRightLeft' },
    ADJUSTMENT: { value: 'adjustment', label: 'تسوية', label_en: 'Adjustment', icon: 'Scale' },
} as const;

// ------------------------------------------
// Report Periods
// ------------------------------------------
export const REPORT_PERIODS = [
    { value: 'today', label: 'اليوم', label_en: 'Today' },
    { value: 'yesterday', label: 'أمس', label_en: 'Yesterday' },
    { value: 'this_week', label: 'هذا الأسبوع', label_en: 'This Week' },
    { value: 'this_month', label: 'هذا الشهر', label_en: 'This Month' },
    { value: 'last_month', label: 'الشهر الماضي', label_en: 'Last Month' },
    { value: 'this_quarter', label: 'هذا الربع', label_en: 'This Quarter' },
    { value: 'this_year', label: 'هذا العام', label_en: 'This Year' },
    { value: 'custom', label: 'مخصص', label_en: 'Custom' },
] as const;

// ------------------------------------------
// Chart Colors
// ------------------------------------------
export const CHART_COLORS = [
    '#10b981', // emerald
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#f59e0b', // amber
    '#ef4444', // red
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#84cc16', // lime
] as const;

// ------------------------------------------
// Animation Durations
// ------------------------------------------
export const ANIMATION_DURATION = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
} as const;

// ------------------------------------------
// Storage Keys
// ------------------------------------------
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_DATA: 'user_data',
    COMPANY_DATA: 'company_data',
    THEME: 'theme',
    LANGUAGE: 'language',
    SIDEBAR_COLLAPSED: 'sidebar_collapsed',
    LAST_INVOICE_NUMBER: 'last_invoice_number',
} as const;

// NOTE: This app uses Supabase RPC calls directly, not traditional REST endpoints.

// ------------------------------------------
// Error Messages
// ------------------------------------------
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'خطأ في الاتصال بالخادم',
    UNAUTHORIZED: 'غير مصرح لك بالوصول',
    FORBIDDEN: 'لا تملك صلاحيات كافية',
    NOT_FOUND: 'المورد المطلوب غير موجود',
    VALIDATION_ERROR: 'خطأ في التحقق من البيانات',
    SERVER_ERROR: 'خطأ في الخادم',
    UNKNOWN_ERROR: 'خطأ غير معروف',
} as const;

// ------------------------------------------
// Success Messages
// ------------------------------------------
export const SUCCESS_MESSAGES = {
    SAVED: 'تم الحفظ بنجاح',
    UPDATED: 'تم التحديث بنجاح',
    DELETED: 'تم الحذف بنجاح',
    SENT: 'تم الإرسال بنجاح',
    CREATED: 'تم الإنشاء بنجاح',
} as const;
