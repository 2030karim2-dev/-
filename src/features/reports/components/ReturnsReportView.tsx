// ============================================
// Returns Report View
// Comprehensive returns reporting system
// Phase 4 - Final Phase
// ============================================

import React, { useState, useMemo } from 'react';
import {
    RefreshCw, TrendingUp, TrendingDown, PieChart, BarChart3,
    Calendar, Filter, Printer, FileSpreadsheet
} from 'lucide-react';
import {
    PieChart as RePieChart, Pie, Cell, BarChart, Bar,
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useSalesReturns, useSalesReturnsStats } from '../../sales/hooks/useSalesReturns';
import { usePurchaseReturns, usePurchaseReturnsStats } from '../../purchases/hooks/usePurchaseReturns';
import { useAuthStore } from '../../auth/store';
import { formatCurrency } from '../../../core/utils';
import { exportReturnsToExcel } from '../../../core/utils/returnsExcelExporter';

type DateRange = 'today' | 'week' | 'month' | 'year' | 'custom';
type ReturnsType = 'all' | 'sales' | 'purchase';
type ReportView = 'overview' | 'sales' | 'purchase';

interface FilterState {
    dateRange: DateRange;
    type: ReturnsType;
    status: string;
    reason: string;
    startDate?: string;
    endDate?: string;
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

const ReturnsReportView: React.FC = () => {
    const { user } = useAuthStore();

    // Filter state
    const [filters, setFilters] = useState<FilterState>({
        dateRange: 'month',
        type: 'all',
        status: 'all',
        reason: 'all'
    });
    const [reportView, setReportView] = useState<ReportView>('overview');

    // Calculate date range
    const dateRange = useMemo(() => {
        const now = new Date();
        let startDate: string;
        let endDate: string = now.toISOString().split('T')[0];

        switch (filters.dateRange) {
            case 'today':
                startDate = endDate;
                break;
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0];
                break;
            case 'year':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0];
                break;
            case 'custom':
                startDate = filters.startDate || endDate;
                endDate = filters.endDate || endDate;
                break;
            default:
                startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0];
        }

        return { startDate, endDate };
    }, [filters.dateRange, filters.startDate, filters.endDate]);

    // Fetch data
    const { data: salesReturns, isLoading: salesLoading } = useSalesReturns({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
    });

    const { data: salesStats } = useSalesReturnsStats();
    const { data: purchaseReturns } = usePurchaseReturns();
    const { data: purchaseStats } = usePurchaseReturnsStats();

    // Filter returns based on status and reason
    const filteredSalesReturns = useMemo(() => {
        if (!salesReturns) return [];
        return salesReturns.filter((r: any) => {
            if (filters.status !== 'all' && r.status !== filters.status) return false;
            if (filters.reason !== 'all' && r.return_reason !== filters.reason) return false;
            return true;
        });
    }, [salesReturns, filters.status, filters.reason]);

    const filteredPurchaseReturns = useMemo(() => {
        if (!purchaseReturns) return [];
        return purchaseReturns.filter((r: any) => {
            if (filters.status !== 'all' && r.status !== filters.status) return false;
            if (filters.reason !== 'all' && r.return_reason !== filters.reason) return false;
            return true;
        });
    }, [purchaseReturns, filters.status, filters.reason]);

    // Calculate statistics
    const stats = useMemo(() => {
        const salesTotal = filteredSalesReturns.reduce((sum: number, r: any) => sum + (Number(r.total_amount) || 0), 0);
        const purchaseTotal = filteredPurchaseReturns.reduce((sum: number, r: any) => sum + (Number(r.total_amount) || 0), 0);

        return {
            salesCount: filteredSalesReturns.length,
            salesTotal,
            salesAvg: filteredSalesReturns.length > 0 ? salesTotal / filteredSalesReturns.length : 0,
            purchaseCount: filteredPurchaseReturns.length,
            purchaseTotal,
            purchaseAvg: filteredPurchaseReturns.length > 0 ? purchaseTotal / filteredPurchaseReturns.length : 0,
            totalCount: filteredSalesReturns.length + filteredPurchaseReturns.length,
            totalAmount: salesTotal + purchaseTotal
        };
    }, [filteredSalesReturns, filteredPurchaseReturns]);

    // Reason distribution for pie chart
    const reasonDistribution = useMemo(() => {
        const reasonMap: Record<string, number> = {};
        const returns = filters.type === 'sales' ? filteredSalesReturns :
            filters.type === 'purchase' ? filteredPurchaseReturns :
                [...filteredSalesReturns, ...filteredPurchaseReturns];

        returns.forEach((r: any) => {
            const reason = r.return_reason || 'أخرى';
            reasonMap[reason] = (reasonMap[reason] || 0) + (Number(r.total_amount) || 0);
        });

        return Object.entries(reasonMap).map(([name, value]) => ({ name, value }));
    }, [filteredSalesReturns, filteredPurchaseReturns, filters.type]);

    // Monthly trends for line chart
    const monthlyTrends = useMemo(() => {
        const monthMap: Record<string, { sales: number; purchase: number }> = {};
        const now = new Date();

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthMap[key] = { sales: 0, purchase: 0 };
        }

        // Aggregate sales returns
        filteredSalesReturns.forEach((r: any) => {
            const date = new Date(r.issue_date || r.created_at);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthMap[key]) {
                monthMap[key].sales += Number(r.total_amount) || 0;
            }
        });

        // Aggregate purchase returns
        filteredPurchaseReturns.forEach((r: any) => {
            const date = new Date(r.issue_date || r.created_at);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthMap[key]) {
                monthMap[key].purchase += Number(r.total_amount) || 0;
            }
        });

        return Object.entries(monthMap).map(([month, data]) => ({
            month,
            ...data
        }));
    }, [filteredSalesReturns, filteredPurchaseReturns]);

    // Top customers/suppliers
    const topParties = useMemo(() => {
        const partyMap: Record<string, { name: string; count: number; total: number }> = {};
        const returns = filters.type === 'sales' ? filteredSalesReturns :
            filters.type === 'purchase' ? filteredPurchaseReturns :
                [...filteredSalesReturns, ...filteredPurchaseReturns];

        returns.forEach((r: any) => {
            const partyName = r.party?.name || 'غير معروف';
            if (!partyMap[partyName]) {
                partyMap[partyName] = { name: partyName, count: 0, total: 0 };
            }
            partyMap[partyName].count += 1;
            partyMap[partyName].total += Number(r.total_amount) || 0;
        });

        return Object.values(partyMap)
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    }, [filteredSalesReturns, filteredPurchaseReturns, filters.type]);

    // Export to Excel
    const handleExportExcel = () => {
        const returns = filters.type === 'sales' ? filteredSalesReturns :
            filters.type === 'purchase' ? filteredPurchaseReturns :
                [...filteredSalesReturns, ...filteredPurchaseReturns];

        const excelData = {
            companyName: 'شركة',
            returns: returns.map((r: any) => ({
                invoiceNumber: r.invoice_number,
                issueDate: r.issue_date,
                customerName: r.party?.name,
                referenceInvoice: r.reference_invoice?.invoice_number,
                returnReason: r.return_reason,
                items: r.invoice_items?.length || 0,
                totalAmount: Number(r.total_amount) || 0,
                status: r.status,
                notes: r.notes
            })),
            summary: {
                totalReturns: stats.totalAmount,
                totalAmount: stats.totalAmount,
                averageAmount: stats.totalCount > 0 ? stats.totalAmount / stats.totalCount : 0,
                count: stats.totalCount
            },
            type: filters.type === 'all' ? 'sales' : filters.type
        };

        exportReturnsToExcel(excelData);
    };

    // Print report
    const handlePrint = () => {
        window.print();
    };

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'posted': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'draft': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'paid': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    // Get reason text in Arabic
    const getReasonText = (reason: string) => {
        const reasonMap: Record<string, string> = {
            'defective': 'منتج تالف',
            'not_as_described': 'غير مطابق',
            'wrong_item': 'صنف خاطئ',
            'quality_issue': 'مشكلة جودة',
            'changed_mind': 'تغيير رأي',
            'expired': 'منتهي الصلاحية',
            'other': 'أخرى'
        };
        return reasonMap[reason] || reason || '-';
    };

    if (salesLoading) {
        return (
            <div className="p-20 text-center font-black text-[10px] text-gray-400 uppercase tracking-widest animate-pulse">
                جاري تحميل بيانات المرتجعات...
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header with filters */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-4">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">تقرير المرتجعات</h3>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                        >
                            <FileSpreadsheet size={16} />
                            تصدير Excel
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-sm"
                        >
                            <Printer size={16} />
                            طباعة
                        </button>
                    </div>
                </div>

                {/* Filter controls */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Date Range */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">الفترة</label>
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-400" />
                            <select
                                value={filters.dateRange}
                                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as DateRange })}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
                            >
                                <option value="today">اليوم</option>
                                <option value="week">أسبوع</option>
                                <option value="month">شهر</option>
                                <option value="year">سنة</option>
                                <option value="custom">مخصص</option>
                            </select>
                        </div>
                    </div>

                    {/* Type Filter */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">النوع</label>
                        <div className="flex items-center gap-2">
                            <Filter size={16} className="text-gray-400" />
                            <select
                                value={filters.type}
                                onChange={(e) => setFilters({ ...filters, type: e.target.value as ReturnsType })}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
                            >
                                <option value="all">الكل</option>
                                <option value="sales">مرتجعات المبيعات</option>
                                <option value="purchase">مرتجعات المشتريات</option>
                            </select>
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">الحالة</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
                        >
                            <option value="all">الكل</option>
                            <option value="draft">مسودة</option>
                            <option value="posted">معتمد</option>
                            <option value="paid">مدفوع</option>
                            <option value="cancelled">ملغي</option>
                        </select>
                    </div>

                    {/* Reason Filter */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">سبب الإرجاع</label>
                        <select
                            value={filters.reason}
                            onChange={(e) => setFilters({ ...filters, reason: e.target.value })}
                            className="px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
                        >
                            <option value="all">الكل</option>
                            <option value="defective">منتج تالف</option>
                            <option value="not_as_described">غير مطابق</option>
                            <option value="wrong_item">صنف خاطئ</option>
                            <option value="quality_issue">مشكلة جودة</option>
                            <option value="changed_mind">تغيير رأي</option>
                            <option value="expired">منتهي الصلاحية</option>
                            <option value="other">أخرى</option>
                        </select>
                    </div>
                </div>

                {/* Custom date range */}
                {filters.dateRange === 'custom' && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">من</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">إلى</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">إجمالي المرتجعات</span>
                        <RefreshCw size={16} className="text-blue-500" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">{stats.totalCount}</h3>
                    <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats.totalAmount)}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">مرتجعات المبيعات</span>
                        <TrendingDown size={16} className="text-rose-500" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">{stats.salesCount}</h3>
                    <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats.salesTotal)}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">مرتجعات المشتريات</span>
                        <TrendingUp size={16} className="text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">{stats.purchaseCount}</h3>
                    <p className="text-xs text-gray-500 mt-1">{formatCurrency(stats.purchaseTotal)}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">متوسط المرتجع</span>
                        <BarChart3 size={16} className="text-purple-500" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">
                        {formatCurrency(stats.totalCount > 0 ? stats.totalAmount / stats.totalCount : 0)}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">لكل مرتجع</p>
                </div>
            </div>

            {/* View Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-slate-800">
                <button
                    onClick={() => setReportView('overview')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${reportView === 'overview'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                >
                    نظرة عامة
                </button>
                <button
                    onClick={() => setReportView('sales')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${reportView === 'sales'
                            ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                >
                    مرتجعات المبيعات
                </button>
                <button
                    onClick={() => setReportView('purchase')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${reportView === 'purchase'
                            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                >
                    مرتجعات المشتريات
                </button>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Monthly Trends Chart */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">اتجاهات المرتجعات الشهرية</h4>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={monthlyTrends}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                            <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="sales" name="المبيعات" stroke="#f43f5e" strokeWidth={2} dot={{ fill: '#f43f5e' }} />
                            <Line type="monotone" dataKey="purchase" name="المشتريات" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Reason Distribution Pie Chart */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">توزيع المرتجعات حسب السبب</h4>
                    {reasonDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <RePieChart>
                                <Pie
                                    data={reasonDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                                >
                                    {reasonDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </RePieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
                            لا توجد بيانات
                        </div>
                    )}
                </div>
            </div>

            {/* Bar Chart - Monthly Comparison */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-4">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">مقارنة المرتجعات الشهرية</h4>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="sales" name="المبيعات" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="purchase" name="المشتريات" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Top Parties */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-4">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                    {filters.type === 'sales' ? 'أكثر العملاء إرجاعاً' :
                        filters.type === 'purchase' ? 'أكثر الموردين إرجاعاً' :
                            'أكثر الأطراف إرجاعاً'}
                </h4>
                {topParties.length > 0 ? (
                    <div className="space-y-3">
                        {topParties.map((party, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
                                        {index + 1}
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">{party.name}</span>
                                </div>
                                <div className="text-left">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(party.total)}
                                    </span>
                                    <span className="text-xs text-gray-500 mr-2">({party.count} مرتجع)</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">لا توجد بيانات</div>
                )}
            </div>

            {/* Detailed Tables */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-slate-800">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        {reportView === 'overview' ? 'تفاصيل المرتجعات' :
                            reportView === 'sales' ? 'تفاصيل مرتجعات المبيعات' :
                                'تفاصيل مرتجعات المشتريات'}
                    </h4>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-800">
                            <tr>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">رقم المرتجع</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">التاريخ</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{filters.type === 'purchase' ? 'المورد' : 'العميل'}</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">الفاتورة المرجعية</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">السبب</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">المبلغ</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                            {(reportView === 'overview'
                                ? [...filteredSalesReturns, ...filteredPurchaseReturns]
                                : reportView === 'sales' ? filteredSalesReturns : filteredPurchaseReturns
                            ).slice(0, 20).map((item: any, index: number) => (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                        {item.invoice_number}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                        {item.issue_date || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                        {item.party?.name || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                        {item.reference_invoice?.invoice_number || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                        {getReasonText(item.return_reason)}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(Number(item.total_amount) || 0)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                            {item.status === 'draft' ? 'مسودة' :
                                                item.status === 'posted' ? 'معتمد' :
                                                    item.status === 'paid' ? 'مدفوع' :
                                                        item.status === 'cancelled' ? 'ملغي' : item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {(reportView === 'overview'
                    ? [...filteredSalesReturns, ...filteredPurchaseReturns]
                    : reportView === 'sales' ? filteredSalesReturns : filteredPurchaseReturns
                ).length > 20 && (
                        <div className="p-4 text-center text-sm text-gray-500">
                            عرض 20 من أصل {reportView === 'overview'
                                ? filteredSalesReturns.length + filteredPurchaseReturns.length
                                : reportView === 'sales' ? filteredSalesReturns.length : filteredPurchaseReturns.length} سجل
                        </div>
                    )}
            </div>
        </div>
    );
};

export default ReturnsReportView;
