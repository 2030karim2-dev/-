
import { supabase } from '../../lib/supabaseClient';
import { formatCurrency } from '../../core/utils';

export const dashboardService = {
  getDashboardData: async (companyId: string) => {
    // ⚡ تنفيذ جميع الاستعلامات بالتوازي بدل التتابع
    const [
      invoicesResult,
      expensesResult,
      customersResult,
      suppliersResult,
      bondResult,
      productsResult,
      categoriesResult,
      itemsResult
    ] = await Promise.all([
      // 1. الفواتير
      supabase
        .from('invoices')
        .select('id, total_amount, issue_date, status, type, party_id, currency_code, exchange_rate, parties:party_id(name)')
        .eq('company_id', companyId)
        .neq('status', 'void')
        .order('issue_date', { ascending: true }),
      // 2. المصروفات
      supabase
        .from('expenses')
        .select('id, amount, expense_date, description, status, category_id, currency_code, exchange_rate, expense_categories(name)')
        .eq('company_id', companyId)
        .neq('status', 'void'),
      // 3. العملاء
      supabase
        .from('parties')
        .select('id, name, balance, type')
        .eq('company_id', companyId)
        .eq('type', 'customer')
        .is('deleted_at', null),
      // 4. الموردين
      supabase
        .from('parties')
        .select('id, name, balance, type')
        .eq('company_id', companyId)
        .eq('type', 'supplier')
        .is('deleted_at', null),
      // 5. السندات
      (supabase.from('journal_entries') as any)
        .select(`
          id,
          entry_date,
          reference_type,
          journal_entry_lines(debit_amount, credit_amount)
        `)
        .eq('company_id', companyId)
        .in('reference_type', ['receipt_bond', 'payment_bond'])
        .eq('status', 'posted'),
      // 6. المنتجات مع المخزون
      (supabase.from('products') as any)
        .select(`
          id,
          name_ar,
          min_stock_level,
          product_stock(quantity, warehouse_id)
        `)
        .eq('company_id', companyId)
        .eq('status', 'active'),
      // 7. أصناف المصروفات
      supabase
        .from('expense_categories')
        .select('id, name')
        .eq('company_id', companyId),
      // 8. عناصر الفواتير
      (supabase.from('invoice_items') as any)
        .select(`
          product_id,
          quantity,
          total,
          products:product_id(name_ar),
          invoices:invoice_id!inner(company_id, type, status)
        `)
        .eq('invoices.company_id', companyId)
        .eq('invoices.type', 'sale')
        .neq('invoices.status', 'void'),
    ]);

    // التحقق من الأخطاء
    if (invoicesResult.error) throw invoicesResult.error;
    if (expensesResult.error) throw expensesResult.error;
    if (customersResult.error) throw customersResult.error;
    if (suppliersResult.error) throw suppliersResult.error;
    if (bondResult.error) throw bondResult.error;
    if (productsResult.error) throw productsResult.error;
    if (categoriesResult.error) throw categoriesResult.error;
    if (itemsResult.error) throw itemsResult.error;

    const invoices = invoicesResult.data;
    const expenses = expensesResult.data;
    const customers = customersResult.data;
    const suppliers = suppliersResult.data;
    const bondEntries = bondResult.data;
    const productsWithStock = productsResult.data;
    const invoiceItems = itemsResult.data;

    // تحويل القيود إلى سندات بمبالغها
    const bonds = (bondEntries || []).map((entry: any) => {
      const lines = entry.journal_entry_lines || [];
      const amount = lines.reduce((sum: number, l: any) => sum + Number(l.debit_amount || 0), 0);
      return {
        id: entry.id,
        type: entry.reference_type === 'receipt_bond' ? 'receipt' : 'payment',
        amount,
        date: entry.entry_date
      };
    });

    // فلترة المنتجات ذات المخزون المنخفض
    const lowStockProducts = (productsWithStock || []).filter((p: any) => {
      const totalStock = (p.product_stock || []).reduce((sum: number, s: any) => sum + Number(s.quantity || 0), 0);
      return totalStock <= (p.min_stock_level || 5);
    }).map((p: any) => ({
      ...p,
      name: p.name_ar,
      quantity: (p.product_stock || []).reduce((sum: number, s: any) => sum + Number(s.quantity || 0), 0),
      min_quantity: p.min_stock_level || 5
    }));

    // --- معالجة البيانات (Aggregation) ---
    // تحويل المبلغ من عملة الفاتورة إلى العملة الأساسية (SAR)
    // exchange_rate = كم ريال سعودي يساوي 1 وحدة من العملة الأجنبية
    // مثال: 1 YER = 0.02 SAR → exchange_rate = 0.02
    // لذا: total_in_SAR = total_amount * exchange_rate
    const toBase = (inv: any): number => {
      const amount = Number(inv.total_amount) || 0;
      const rate = Number(inv.exchange_rate) || 1;
      // إذا كانت العملة هي الأساسية أو لم تُحدد عملة، لا تحوّل
      if (!inv.currency_code || inv.currency_code === 'SAR') return amount;
      return amount * rate;
    };

    const totalSales = (invoices || [])
      .filter((i: any) => i.type === 'sale')
      .reduce((sum: number, i: any) => sum + toBase(i), 0);

    const totalPurchases = (invoices || [])
      .filter((i: any) => i.type === 'purchase')
      .reduce((sum: number, i: any) => sum + toBase(i), 0);

    // تحويل مبالغ المصروفات أيضاً إلى العملة الأساسية
    const expenseToBase = (exp: any): number => {
      const amount = Number(exp.amount) || 0;
      const rate = Number(exp.exchange_rate) || 1;
      const currencyCode = exp.currency_code;
      // إذا كانت العملة هي الأساسية، لا تحوّل (أو إذا كان السعر 1)
      if (!currencyCode || currencyCode === 'SAR') return amount;
      return amount * rate;
    };

    const totalExpenses = (expenses || [])
      .reduce((sum: number, e: any) => sum + expenseToBase(e), 0);

    const totalDebts = (customers || [])
      .reduce((sum: number, c: any) => sum + (Number(c.balance) > 0 ? Number(c.balance) : 0), 0);

    const totalSupplierDebts = (suppliers || [])
      .reduce((sum: number, s: any) => sum + (Number(s.balance) > 0 ? Number(s.balance) : 0), 0);

    // صافي الربح التشغيلي: المبيعات - المصاريف (بدون احتساب المشتريات كمصروف مباشر للفترة)
    const netProfit = totalSales - totalExpenses;

    // صافي التدفق النقدي: (المبيعات) - (المشتريات + المصروفات)
    // هذا يعطي صورة عن حركة السيولة
    const netCashPosition = totalSales - totalPurchases - totalExpenses;

    const receiptBonds = (bonds || [])
      .filter((b: any) => b.type === 'receipt')
      .reduce((sum: number, b: any) => sum + Number(b.amount), 0);

    const paymentBonds = (bonds || [])
      .filter((b: any) => b.type === 'payment')
      .reduce((sum: number, b: any) => sum + Number(b.amount), 0);

    const overdueInvoices = (invoices || [])
      .filter((i: any) => {
        const issueDate = new Date(i.issue_date);
        const daysDiff = Math.floor((Date.now() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
        return i.status === 'posted' && daysDiff > 7;
      });

    // 1. Calculate General Stats and Classifications using Helpers
    const {
      salesData,
      topProducts,
      topCustomers,
      categoryData,
      recentActivities
    } = await import('./services/dashboardStats').then(m => m.calculateDashboardStats({
      receiptBonds,
      paymentBonds,
      totalSales,
      totalPurchases,
      totalExpenses,
      netProfit,
      totalDebts,
      totalSupplierDebts,
      invoicesData: invoices || [],
      expensesData: expenses || [],
      invoiceItemsData: invoiceItems || []
    }));

    // 2. Generate Alarms and Insights Using Helpers
    const {
      salesTrend,
      purchasesTrend,
      expensesTrend,
      alerts,
      insights,
      targets,
      olderSales,
      olderPurchases,
      olderExpenses,
      newerSales,
      newerPurchases,
      newerExpenses
    } = await import('./services/dashboardInsights').then(m => m.calculateDashboardInsights({
      receiptBonds,
      paymentBonds,
      totalSales,
      totalPurchases,
      totalExpenses,
      netProfit,
      totalDebts,
      totalSupplierDebts,
      invoicesData: invoices || [],
      expensesData: expenses || [],
      lowStockProducts: lowStockProducts || [],
      overdueInvoices: overdueInvoices || []
    }));

    return {
      stats: {
        sales: formatCurrency(totalSales),
        purchases: formatCurrency(totalPurchases),
        expenses: formatCurrency(totalExpenses),
        debts: formatCurrency(totalDebts),
        invoices: (invoices?.length || 0).toString(),
        profit: formatCurrency(netProfit),
        netCash: formatCurrency(netCashPosition),
        salesTrend: Math.round(salesTrend * 10) / 10,
        purchasesTrend: Math.round(purchasesTrend * 10) / 10,
        expensesTrend: Math.round(expensesTrend * 10) / 10,
        profitTrend: Math.round(((newerSales - newerPurchases - newerExpenses) - (olderSales - olderPurchases - olderExpenses)) / Math.max(Math.abs(olderSales - olderPurchases - olderExpenses), 1) * 1000) / 10
      },
      salesData: salesData.length ? salesData : [{ name: 'اليوم', value: 0, sales: 0 }],
      categoryData: categoryData.length ? categoryData : [{ name: 'لا توجد بيانات', value: 0, color: '#94a3b8' }],
      recentActivities,
      customers: topCustomers,
      topProducts,
      topCustomers,
      targets,
      cashFlow: {
        inflow: receiptBonds,
        outflow: paymentBonds,
        net: receiptBonds - paymentBonds
      },
      alerts,
      insights,
      lowStockProducts: lowStockProducts || []
    };
  }
};
