// ============================================
// بيانات لوحة التحكم الافتراضية
// Default Dashboard Data
// ============================================

import { CHART_COLORS } from '../constants';

// ------------------------------------------
// Mock Data Types
// ------------------------------------------
export interface SalesDataPoint {
    date: string;
    sales: number;
    purchases: number;
}

export interface TopProduct {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    revenue: number;
}

export interface TopCustomer {
    id: string;
    name: string;
    total_invoices: number;
    total_amount: number;
}

export interface RecentTransaction {
    id: string;
    type: 'sale' | 'purchase' | 'payment' | 'inventory';
    description: string;
    amount?: number;
    date: string;
    status: 'completed' | 'pending' | 'cancelled';
}

// ------------------------------------------
// Chart Data Generators
// ------------------------------------------
export const generateSalesChartData = (days: number = 7): SalesDataPoint[] => {
    const data: SalesDataPoint[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        data.push({
            date: date.toISOString().split('T')[0],
            sales: Math.floor(Math.random() * 50000) + 10000,
            purchases: Math.floor(Math.random() * 30000) + 5000,
        });
    }

    return data;
};

export const generateCategoryChartData = () => {
    return [
        { name: 'إلكترونيات', value: 35, color: CHART_COLORS[0] },
        { name: 'ملابس', value: 25, color: CHART_COLORS[1] },
        { name: 'طعام', value: 20, color: CHART_COLORS[2] },
        { name: 'أخرى', value: 20, color: CHART_COLORS[3] },
    ];
};

// ------------------------------------------
// Top Products Data
// ------------------------------------------
export const DEFAULT_TOP_PRODUCTS: TopProduct[] = [
    {
        id: '1',
        name: 'آيفون 14 برو',
        sku: 'IPHONE14PRO',
        quantity: 50,
        revenue: 275000,
    },
    {
        id: '2',
        name: 'لابتوب ديل XPS',
        sku: 'DELLXPS15',
        quantity: 25,
        revenue: 187500,
    },
    {
        id: '3',
        name: 'سماعات سوني',
        sku: 'SONYWH1000',
        quantity: 100,
        revenue: 75000,
    },
    {
        id: '4',
        name: 'ساعة أبل',
        sku: 'APPLEWATCH',
        quantity: 75,
        revenue: 56250,
    },
    {
        id: '5',
        name: 'آيباد برو',
        sku: 'IPADPRO',
        quantity: 30,
        revenue: 135000,
    },
];

// ------------------------------------------
// Top Customers Data
// ------------------------------------------
export const DEFAULT_TOP_CUSTOMERS: TopCustomer[] = [
    {
        id: '1',
        name: 'شركة التقنية الحديثة',
        total_invoices: 45,
        total_amount: 525000,
    },
    {
        id: '2',
        name: 'مؤسسة الأفق',
        total_invoices: 32,
        total_amount: 380000,
    },
    {
        id: '3',
        name: 'شركة الغد',
        total_invoices: 28,
        total_amount: 295000,
    },
    {
        id: '4',
        name: 'متجر النجاح',
        total_invoices: 22,
        total_amount: 210000,
    },
    {
        id: '5',
        name: 'مؤسسة الرواد',
        total_invoices: 18,
        total_amount: 175000,
    },
];

// ------------------------------------------
// Recent Transactions Data
// ------------------------------------------
export const DEFAULT_RECENT_TRANSACTIONS: RecentTransaction[] = [
    {
        id: '1',
        type: 'sale',
        description: 'فاتورة مبيعات #1234',
        amount: 15000,
        date: new Date().toISOString(),
        status: 'completed',
    },
    {
        id: '2',
        type: 'purchase',
        description: 'مشتريات من شركة الأفق',
        amount: 8500,
        date: new Date(Date.now() - 3600000).toISOString(),
        status: 'completed',
    },
    {
        id: '3',
        type: 'payment',
        description: 'دفعة من شركة التقنية',
        amount: 10000,
        date: new Date(Date.now() - 7200000).toISOString(),
        status: 'completed',
    },
    {
        id: '4',
        type: 'inventory',
        description: 'جرد المخزون الشهري',
        date: new Date(Date.now() - 10800000).toISOString(),
        status: 'pending',
    },
    {
        id: '5',
        type: 'sale',
        description: 'فاتورة مبيعات #1235',
        amount: 22500,
        date: new Date(Date.now() - 14400000).toISOString(),
        status: 'completed',
    },
];

// ------------------------------------------
// Summary Statistics
// ------------------------------------------
export interface DashboardSummary {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    totalCustomers: number;
    totalSuppliers: number;
    totalProducts: number;
    lowStockItems: number;
    pendingInvoices: number;
}

export const DEFAULT_DASHBOARD_SUMMARY: DashboardSummary = {
    totalRevenue: 1250000,
    totalExpenses: 850000,
    netProfit: 400000,
    totalCustomers: 245,
    totalSuppliers: 78,
    totalProducts: 1250,
    lowStockItems: 15,
    pendingInvoices: 8,
};

// ------------------------------------------
// Alert Messages
// ------------------------------------------
export interface Alert {
    id: string;
    type: 'warning' | 'danger' | 'info' | 'success';
    title: string;
    message: string;
    timestamp: string;
}

export const DEFAULT_ALERTS: Alert[] = [
    {
        id: '1',
        type: 'warning',
        title: 'مخزون منخفض',
        message: '15 منتج منخفض المخزون',
        timestamp: new Date().toISOString(),
    },
    {
        id: '2',
        type: 'info',
        title: 'فواتير معلقة',
        message: '8 فواتير تنتظر الدفع',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
        id: '3',
        type: 'danger',
        title: 'شيكات مستحقة',
        message: '3 شيكات مستحقة قريباً',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
];

// ------------------------------------------
// Currency Formatter — Use the canonical version from core/utils/currencyUtils
// import { formatCurrency } from '../core/utils/currencyUtils';
// ------------------------------------------

// ------------------------------------------
// Percentage Calculator
// ------------------------------------------
export const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};
