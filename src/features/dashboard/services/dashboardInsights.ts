import { formatCurrency } from '../../../core/utils';

export const calculateDashboardInsights = (data: {
    receiptBonds: number;
    paymentBonds: number;
    totalSales: number;
    totalPurchases: number;
    totalExpenses: number;
    netProfit: number;
    totalDebts: number;
    totalSupplierDebts: number;
    invoicesData: any[];
    expensesData: any[];
    lowStockProducts: any[];
    overdueInvoices: any[];
}) => {
    const { totalSales, totalPurchases, totalExpenses, invoicesData, expensesData, lowStockProducts, overdueInvoices, totalDebts } = data;

    // تحويل مبلغ الفاتورة إلى العملة الأساسية (SAR)
    const toBase = (inv: any): number => {
        const amount = Number(inv.total_amount) || 0;
        const rate = Number(inv.exchange_rate) || 1;
        if (!inv.currency_code || inv.currency_code === 'SAR') return amount;
        return amount * rate;
    };

    const expToBase = (exp: any): number => {
        const amount = Number(exp.amount) || 0;
        const rate = Number(exp.exchange_rate) || 1;
        if (!exp.currency_code || exp.currency_code === 'SAR') return amount;
        return amount * rate;
    };


    const allInvoices = invoicesData || [];
    const midpoint = Math.floor(allInvoices.length / 2);
    const olderHalf = allInvoices.slice(0, midpoint);
    const newerHalf = allInvoices.slice(midpoint);

    const olderSales = olderHalf.filter((i: any) => i.type === 'sale').reduce((s: number, i: any) => s + toBase(i), 0);
    const newerSales = newerHalf.filter((i: any) => i.type === 'sale').reduce((s: number, i: any) => s + toBase(i), 0);
    const salesTrend = olderSales > 0 ? ((newerSales - olderSales) / olderSales) * 100 : 0;

    const olderPurchases = olderHalf.filter((i: any) => i.type === 'purchase').reduce((s: number, i: any) => s + toBase(i), 0);
    const newerPurchases = newerHalf.filter((i: any) => i.type === 'purchase').reduce((s: number, i: any) => s + toBase(i), 0);
    const purchasesTrend = olderPurchases > 0 ? ((newerPurchases - olderPurchases) / olderPurchases) * 100 : 0;

    const olderExpenses = (expensesData || []).slice(0, Math.floor((expensesData || []).length / 2)).reduce((s: number, e: any) => s + expToBase(e), 0);
    const newerExpenses = (expensesData || []).slice(Math.floor((expensesData || []).length / 2)).reduce((s: number, e: any) => s + expToBase(e), 0);
    const expensesTrend = olderExpenses > 0 ? ((newerExpenses - olderExpenses) / olderExpenses) * 100 : 0;

    const alerts = [];
    if (lowStockProducts && lowStockProducts.length > 0) {
        alerts.push({
            id: 'low-stock',
            type: 'urgent' as const,
            message: `${lowStockProducts.length} منتجات قاربت على النفاد`,
            time: 'الآن'
        });
    }

    if (overdueInvoices.length > 0) {
        alerts.push({
            id: 'overdue-invoices',
            type: 'warning' as const,
            message: `${overdueInvoices.length} فواتير متأخرة التحصيل`,
            time: 'تحتاج متابعة'
        });
    }

    if (totalDebts > 0) {
        alerts.push({
            id: 'debts',
            type: 'info' as const,
            message: `إجمالي المستحقات: ${formatCurrency(totalDebts)}`,
            time: 'قيد التحصيل'
        });
    }

    const insights = [];
    if (salesTrend > 0) {
        insights.push({
            id: 'sales-trend',
            type: 'success' as const,
            message: `المبيعات أعلى بـ ${salesTrend.toFixed(0)}% من الفترة السابقة`,
            detail: 'أداء ممتاز!'
        });
    }

    if (lowStockProducts && lowStockProducts.length > 0) {
        insights.push({
            id: 'stock-alert',
            type: 'warning' as const,
            message: `${lowStockProducts.length} منتجات قاربت على النفاد`,
            detail: 'تحقق من المخزون'
        });
    }

    const collectionRate = totalSales > 0 ? ((totalSales - totalDebts) / totalSales) * 100 : 0;
    if (collectionRate < 80) {
        insights.push({
            id: 'collection',
            type: 'info' as const,
            message: `${overdueInvoices.length} فواتير متأخرة التحصيل`,
            detail: `المجموع: ${formatCurrency(totalDebts)}`
        });
    }

    const salesProgress = totalSales > 0 ? Math.min(100, (totalSales / 100000) * 100) : 0;
    insights.push({
        id: 'target',
        type: 'target' as const,
        message: `تم تحقيق ${salesProgress.toFixed(0)}% من هدف المبيعات`,
        detail: salesProgress > 80 ? 'قريب من الهدف!' : 'استمر في العمل'
    });

    return {
        salesTrend,
        purchasesTrend,
        expensesTrend,
        alerts,
        insights,
        targets: {
            salesProgress: Math.round(salesProgress),
            collectionRate: Math.round(collectionRate)
        },
        olderSales,
        olderPurchases,
        olderExpenses,
        newerSales,
        newerPurchases,
        newerExpenses
    };
};
