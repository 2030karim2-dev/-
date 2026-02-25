// ============================================
// ثوابت وبيانات التطبيق
// Application Data Constants
// ============================================

import { LucideIcon } from 'lucide-react';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Receipt,
    Wallet,
    Users,
    Truck,
    FileText,
    Settings,
    Palette,
    Link2,
    PiggyBank,
    Target,
    BarChart3,
    TrendingUp,
    DollarSign,
    Boxes,
    Building2
} from 'lucide-react';

// ------------------------------------------
// Navigation Menu Items
// ------------------------------------------
export interface NavItem {
    id: string;
    label_key: string;
    icon: LucideIcon;
    path: string;
    color: string;
    badge?: number;
    children?: NavItem[];
}

export const MAIN_NAV_ITEMS: NavItem[] = [
    {
        id: 'dashboard',
        label_key: 'nav.dashboard',
        icon: LayoutDashboard,
        path: '/',
        color: 'blue',
    },
    {
        id: 'inventory',
        label_key: 'nav.inventory',
        icon: Package,
        path: '/inventory',
        color: 'emerald',
    },
    {
        id: 'pos',
        label_key: 'nav.pos',
        icon: ShoppingCart,
        path: '/pos',
        color: 'purple',
    },
    {
        id: 'sales',
        label_key: 'nav.sales',
        icon: Receipt,
        path: '/sales',
        color: 'green',
    },
    {
        id: 'purchases',
        label_key: 'nav.purchases',
        icon: Truck,
        path: '/purchases',
        color: 'orange',
    },
    {
        id: 'accounting',
        label_key: 'nav.accounting',
        icon: Wallet,
        path: '/accounting',
        color: 'sky',
    },
    {
        id: 'expenses',
        label_key: 'nav.expenses',
        icon: PiggyBank,
        path: '/expenses',
        color: 'red',
    },
    {
        id: 'customers',
        label_key: 'nav.customers',
        icon: Users,
        path: '/clients',
        color: 'indigo',
    },
    {
        id: 'suppliers',
        label_key: 'nav.suppliers',
        icon: Building2,
        path: '/suppliers',
        color: 'teal',
    },
    {
        id: 'reports',
        label_key: 'nav.reports',
        icon: BarChart3,
        path: '/reports',
        color: 'pink',
    },
    {
        id: 'bonds',
        label_key: 'nav.bonds',
        icon: FileText,
        path: '/bonds',
        color: 'amber',
    },
];

export const SETTINGS_NAV_ITEMS: NavItem[] = [
    {
        id: 'settings',
        label_key: 'nav.settings',
        icon: Settings,
        path: '/settings',
        color: 'slate',
    },
    {
        id: 'appearance',
        label_key: 'nav.appearance',
        icon: Palette,
        path: '/settings/appearance',
        color: 'violet',
    },
];

// ------------------------------------------
// Quick Actions
// ------------------------------------------
export interface QuickAction {
    id: string;
    label_key: string;
    icon: LucideIcon;
    color: string;
    action: string;
}

export const QUICK_ACTIONS: QuickAction[] = [
    {
        id: 'new_invoice',
        label_key: 'quick_actions.new_invoice',
        icon: Receipt,
        color: 'bg-blue-500',
        action: 'create-invoice',
    },
    {
        id: 'new_purchase',
        label_key: 'quick_actions.new_purchase',
        icon: Truck,
        color: 'bg-green-500',
        action: 'create-purchase',
    },
    {
        id: 'new_product',
        label_key: 'quick_actions.new_product',
        icon: Boxes,
        color: 'bg-purple-500',
        action: 'create-product',
    },
    {
        id: 'new_customer',
        label_key: 'quick_actions.new_customer',
        icon: Users,
        color: 'bg-cyan-500',
        action: 'create-customer',
    },
    {
        id: 'new_expense',
        label_key: 'quick_actions.new_expense',
        icon: DollarSign,
        color: 'bg-red-500',
        action: 'create-expense',
    },
    {
        id: 'new_transfer',
        label_key: 'quick_actions.new_transfer',
        icon: Link2,
        color: 'bg-amber-500',
        action: 'create-transfer',
    },
];

// ------------------------------------------
// Dashboard Stats Config
// ------------------------------------------
export interface DashboardStatConfig {
    id: string;
    label_key: string;
    icon: LucideIcon;
    color: string;
    bg_color: string;
}

export const DASHBOARD_STATS: DashboardStatConfig[] = [
    {
        id: 'total_sales',
        label_key: 'dashboard.stats.total_sales',
        icon: TrendingUp,
        color: 'text-green-600',
        bg_color: 'bg-green-100 dark:bg-green-900',
    },
    {
        id: 'total_purchases',
        label_key: 'dashboard.stats.total_purchases',
        icon: ShoppingCart,
        color: 'text-orange-600',
        bg_color: 'bg-orange-100 dark:bg-orange-900',
    },
    {
        id: 'total_products',
        label_key: 'dashboard.stats.total_products',
        icon: Package,
        color: 'text-purple-600',
        bg_color: 'bg-purple-100 dark:bg-purple-900',
    },
    {
        id: 'low_stock',
        label_key: 'dashboard.stats.low_stock',
        icon: Target,
        color: 'text-red-600',
        bg_color: 'bg-red-100 dark:bg-red-900',
    },
    {
        id: 'total_customers',
        label_key: 'dashboard.stats.total_customers',
        icon: Users,
        color: 'text-blue-600',
        bg_color: 'bg-blue-100 dark:bg-blue-900',
    },
    {
        id: 'total_suppliers',
        label_key: 'dashboard.stats.total_suppliers',
        icon: Building2,
        color: 'text-teal-600',
        bg_color: 'bg-teal-100 dark:bg-teal-900',
    },
];

// ------------------------------------------
// Activity Types
// ------------------------------------------
export interface ActivityType {
    id: string;
    label_key: string;
    icon: LucideIcon;
    color: string;
}

export const ACTIVITY_TYPES: ActivityType[] = [
    {
        id: 'sale',
        label_key: 'activity.sale',
        icon: Receipt,
        color: 'green',
    },
    {
        id: 'purchase',
        label_key: 'activity.purchase',
        icon: Truck,
        color: 'blue',
    },
    {
        id: 'payment',
        label_key: 'activity.payment',
        icon: DollarSign,
        color: 'purple',
    },
    {
        id: 'inventory',
        label_key: 'activity.inventory',
        icon: Boxes,
        color: 'orange',
    },
];

// ------------------------------------------
// Status Options
// ------------------------------------------
export const STATUS_OPTIONS = [
    { value: 'active', label: 'نشط', label_en: 'Active' },
    { value: 'inactive', label: 'غير نشط', label_en: 'Inactive' },
    { value: 'pending', label: 'معلق', label_en: 'Pending' },
] as const;

// ------------------------------------------
// Invoice Type Options
// ------------------------------------------
export const INVOICE_TYPE_OPTIONS = [
    { value: 'sale', label: 'مبيعات', label_en: 'Sales' },
    { value: 'purchase', label: 'مشتريات', label_en: 'Purchases' },
    { value: 'return_sale', label: 'مردود مبيعات', label_en: 'Sales Return' },
    { value: 'return_purchase', label: 'مردود مشتريات', label_en: 'Purchase Return' },
] as const;

// ------------------------------------------
// Invoice Status Options
// ------------------------------------------
export const INVOICE_STATUS_OPTIONS = [
    { value: 'draft', label: 'مسودة', label_en: 'Draft', color: 'gray' },
    { value: 'pending', label: 'معلق', label_en: 'Pending', color: 'yellow' },
    { value: 'confirmed', label: 'مؤكد', label_en: 'Confirmed', color: 'blue' },
    { value: 'paid', label: 'مدفوع', label_en: 'Paid', color: 'green' },
    { value: 'cancelled', label: 'ملغي', label_en: 'Cancelled', color: 'red' },
] as const;
