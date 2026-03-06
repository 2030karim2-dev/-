// ============================================
// Returns Report View
// Comprehensive returns reporting system
// Phase 4 - Final Phase
// ============================================

import React, { useState, useMemo } from 'react';
import {
    RefreshCw, TrendingUp, TrendingDown, BarChart3,
    Calendar, Filter, Printer, FileSpreadsheet,
    Activity, BrainCircuit, Package
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
    const { } = useAuthStore();

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

    const { data: _salesStats } = useSalesReturnsStats();
    const { data: purchaseReturns } = usePurchaseReturns();
    const { data: _purchaseStats } = usePurchaseReturnsStats();

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

    // Top parties
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
            companyName: 'Al-Zahra Smart',
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
            case 'posted': return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
            case 'draft': return 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
            case 'paid': return 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
            case 'cancelled': return 'bg-rose-500/10 text-rose-600 border border-rose-500/20';
            default: return 'bg-slate-500/10 text-slate-600 border border-slate-500/20';
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
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <div className="w-16 h-16 border-4 border-slate-200 border-t-rose-500 rounded-full animate-spin shadow-xl shadow-rose-500/20" />
                <p className="text-slate-400 font-bold tracking-[0.2em] animate-pulse uppercase text-[10px]">جاري مراجعة سجلات المرتجعات المالية...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20">
            {/* Premium Command Center: Intelligence & Controls */}
            <div className="glass-panel bento-item p-10 bg-white dark:bg-slate-900/50 border-none shadow-2xl relative overflow-visible">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-6 bg-rose-500 rounded-full" />
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">تحليل المرتجعات الذكي</h3>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Returns & Discrepancies Intelligence Center</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleExportExcel}
                            className="group flex items-center gap-3 px-6 py-3.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 font-bold text-xs"
                        >
                            <FileSpreadsheet size={16} className="group-hover:scale-110 transition-transform" />
                            <span>تصدير البيانات</span>
                        </button>
                        <button
                            onClick={handlePrint}
                            className="group flex items-center gap-3 px-6 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-bold text-xs"
                        >
                            <Printer size={16} className="group-hover:scale-110 transition-transform" />
                            <span>طباعة التقرير</span>
                        </button>
                    </div>
                </div>

                {/* Highly Functional Filter Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Period Filter */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">النطاق الزمني</label>
                        <div className="relative group">
                            <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors pointer-events-none" />
                            <select
                                value={filters.dateRange}
                                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as DateRange })}
                                className="w-full pl-4 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 focus:border-rose-500 rounded-2xl text-sm font-bold outline-none transition-all dark:text-white shadow-inner appearance-none"
                            >
                                <option value="today">اليوم</option>
                                <option value="week">آخر ٧ أيام</option>
                                <option value="month">آخر ٣٠ يوم</option>
                                <option value="year">السنة الحالية</option>
                                <option value="custom">تاريخ مخصص</option>
                            </select>
                        </div>
                    </div>

                    {/* Flow Type Filter */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">نوع التدفق</label>
                        <div className="relative group">
                            <Filter size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors pointer-events-none" />
                            <select
                                value={filters.type}
                                onChange={(e) => setFilters({ ...filters, type: e.target.value as ReturnsType })}
                                className="w-full pl-4 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 focus:border-rose-500 rounded-2xl text-sm font-bold outline-none transition-all dark:text-white shadow-inner appearance-none"
                            >
                                <option value="all">كافة التدفقات</option>
                                <option value="sales">مرتجعات المبيعات</option>
                                <option value="purchase">مرتجعات المشتريات</option>
                            </select>
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">الحالة الإدارية</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="w-full px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 focus:border-rose-500 rounded-2xl text-sm font-bold outline-none transition-all dark:text-white shadow-inner appearance-none"
                        >
                            <option value="all">جميع الحالات</option>
                            <option value="draft">مسودة</option>
                            <option value="posted">معتمد</option>
                            <option value="paid">مدفوع</option>
                            <option value="cancelled">ملغي</option>
                        </select>
                    </div>

                    {/* Causation Filter */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">سبب الاسترجاع</label>
                        <select
                            value={filters.reason}
                            onChange={(e) => setFilters({ ...filters, reason: e.target.value })}
                            className="w-full px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 focus:border-rose-500 rounded-2xl text-sm font-bold outline-none transition-all dark:text-white shadow-inner appearance-none"
                        >
                            <option value="all">جميع المسببات</option>
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

                {/* Dynamic Custom Date Picker */}
                {filters.dateRange === 'custom' && (
                    <div className="grid grid-cols-2 gap-6 mt-8 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-700/50 animate-in slide-in-from-top-4 duration-500">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">من تاريخ</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="w-full px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold dark:text-white outline-none focus:border-rose-500 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">إلى تاريخ</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="w-full px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold dark:text-white outline-none focus:border-rose-500 transition-all"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Intelligence Grid: Core Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card bento-item p-8 group hover:scale-[1.02] transition-all duration-500 border-none shadow-xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-blue-500/10 rounded-2xl group-hover:bg-blue-500/20 transition-colors">
                            <RefreshCw size={24} className="text-blue-600 dark:text-blue-400 group-hover:rotate-180 transition-transform duration-700" />
                        </div>
                        <span className="text-[10px] font-black text-blue-600 bg-blue-500/10 px-3 py-1 rounded-full uppercase tracking-widest">Gross Volume</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{stats.totalCount}</h3>
                        <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                            إجمالي عمليات الإرجاع
                        </p>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                        <span className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono">{formatCurrency(stats.totalAmount)}</span>
                    </div>
                </div>

                <div className="glass-card bento-item p-8 group hover:scale-[1.02] transition-all duration-500 border-none shadow-xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-rose-500/10 rounded-2xl group-hover:bg-rose-500/20 transition-colors">
                            <TrendingDown size={24} className="text-rose-600 dark:text-rose-400 group-hover:-translate-y-1 transition-transform" />
                        </div>
                        <span className="text-[10px] font-black text-rose-600 bg-rose-500/10 px-3 py-1 rounded-full uppercase tracking-widest">Outbound</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{stats.salesCount}</h3>
                        <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                            مرتجعات المبيعات
                        </p>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                        <span className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">{formatCurrency(stats.salesTotal)}</span>
                    </div>
                </div>

                <div className="glass-card bento-item p-8 group hover:scale-[1.02] transition-all duration-500 border-none shadow-xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500/20 transition-colors">
                            <TrendingUp size={24} className="text-emerald-600 dark:text-emerald-400 group-hover:translate-y-1 transition-transform" />
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-widest">Inbound</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{stats.purchaseCount}</h3>
                        <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                            مرتجعات المشتريات
                        </p>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(stats.purchaseTotal)}</span>
                    </div>
                </div>

                <div className="glass-card bento-item p-8 group hover:scale-[1.02] transition-all duration-500 border-none shadow-xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-purple-500/10 rounded-2xl group-hover:bg-purple-500/20 transition-colors">
                            <BarChart3 size={24} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-[10px] font-black text-purple-600 bg-purple-500/10 px-3 py-1 rounded-full uppercase tracking-widest">Avg Value</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">
                            {formatCurrency(stats.totalCount > 0 ? stats.totalAmount / stats.totalCount : 0).split(' ')[0]}
                        </h3>
                        <p className="text-sm font-bold text-slate-500">متوسط قيمة المرتجع</p>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Per Return Transaction</span>
                    </div>
                </div>
            </div>

            {/* Insight Tabs Architecture */}
            <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-[2rem] w-fit border border-slate-200/50 dark:border-slate-700/50 self-center">
                <button
                    onClick={() => setReportView('overview')}
                    className={`px-8 py-3 text-xs font-black uppercase tracking-widest rounded-[1.5rem] transition-all duration-500 ${reportView === 'overview'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xl scale-105'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 opacity-60 hover:opacity-100'
                        }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setReportView('sales')}
                    className={`px-8 py-3 text-xs font-black uppercase tracking-widest rounded-[1.5rem] transition-all duration-500 ${reportView === 'sales'
                        ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xl scale-105'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 opacity-60 hover:opacity-100'
                        }`}
                >
                    Sales Returns
                </button>
                <button
                    onClick={() => setReportView('purchase')}
                    className={`px-8 py-3 text-xs font-black uppercase tracking-widest rounded-[1.5rem] transition-all duration-500 ${reportView === 'purchase'
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xl scale-105'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 opacity-60 hover:opacity-100'
                        }`}
                >
                    Purchase Returns
                </button>
            </div>

            {/* Visual Intelligence: Distributions & Temporal Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Temporal Intelligence Chart */}
                <div className="glass-panel bento-item p-10 bg-white/40 dark:bg-slate-900/40 border-none shadow-2xl backdrop-blur-3xl overflow-hidden relative group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500/50 to-emerald-500/50 opacity-30" />
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h4 className="text-lg font-black text-slate-800 dark:text-white mb-1">تحليل الاتجاه الزمني</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Monthly Flow Dynamics</p>
                        </div>
                        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                            <Activity size={18} className="text-rose-500 animate-pulse" />
                        </div>
                    </div>
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyTrends}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorPurchase" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.1} />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                        color: '#fff'
                                    }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: '900' }}
                                />
                                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                                <Line type="monotone" dataKey="sales" name="SALES" stroke="#f43f5e" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#f43f5e' }} />
                                <Line type="monotone" dataKey="purchase" name="PURCHASE" stroke="#10b981" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Causality Intelligence Pie Chart */}
                <div className="glass-panel bento-item p-10 bg-white/40 dark:bg-slate-900/40 border-none shadow-2xl backdrop-blur-3xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-purple-500/50 to-blue-500/50 opacity-30" />
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h4 className="text-lg font-black text-slate-800 dark:text-white mb-1">توزيع مسببات الارتجاع</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Causality Distribution Matrix</p>
                        </div>
                        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                            <BrainCircuit size={18} className="text-purple-500" />
                        </div>
                    </div>
                    {reasonDistribution.length > 0 ? (
                        <div className="h-[320px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={reasonDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={8}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                                    >
                                        {reasonDistribution.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="diamond" wrapperStyle={{ fontSize: '10px', fontWeight: '900', paddingTop: '20px' }} />
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[320px] flex flex-col items-center justify-center text-slate-400 gap-4">
                            <div className="w-12 h-12 rounded-full border-2 border-slate-200 dark:border-slate-800 border-dashed animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-widest">No Causality Data Detected</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Comparative Benchmarking */}
            <div className="glass-panel bento-item p-10 bg-white/40 dark:bg-slate-900/40 border-none shadow-2xl backdrop-blur-3xl relative overflow-hidden group">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white mb-1">مقارنة الأداء الشهري</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Cross-Flow Monthly Benchmarking</p>
                    </div>
                </div>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyTrends}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.1} />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(51, 65, 85, 0.1)' }}
                                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', color: '#fff' }}
                            />
                            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '30px', fontSize: '10px', fontWeight: '900' }} />
                            <Bar dataKey="sales" name="Sales Returns" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={32} minPointSize={1} />
                            <Bar dataKey="purchase" name="Purchase Returns" fill="#10b981" radius={[6, 6, 0, 0]} barSize={32} minPointSize={1} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Tactical Intelligence: Critical Entities */}
            <div className="glass-panel bento-item p-10 bg-white/40 dark:bg-slate-900/40 border-none shadow-2xl backdrop-blur-3xl relative overflow-hidden group">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white mb-1">
                            {filters.type === 'sales' ? 'تحليل العملاء النشطين في المرتجعات' :
                                filters.type === 'purchase' ? 'تحليل الموردين النشطين في المرتجعات' :
                                    'تحليل الأطراف الأكثر تفاعلاً'}
                        </h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">High-Impact Flow Entities Analysis</p>
                    </div>
                </div>
                {topParties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                        {topParties.map((party, index) => (
                            <div key={index} className="group relative flex items-center justify-between p-6 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:border-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 overflow-hidden">
                                <div className="absolute inset-y-0 right-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-lg font-black italic group-hover:scale-110 transition-transform">
                                        #{index + 1}
                                    </div>
                                    <div>
                                        <span className="block font-black text-slate-800 dark:text-white text-lg tracking-tight mb-1">{party.name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Returns Count:</span>
                                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-full text-[10px] font-black text-slate-600 dark:text-slate-300">{party.count}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-left">
                                    <div className="text-2xl font-black text-slate-800 dark:text-white font-mono tracking-tighter">
                                        {formatCurrency(party.total)}
                                    </div>
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1 opacity-60">Aggregate Return Value</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                        <Package size={48} className="mx-auto text-slate-300 mb-4 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">No Significant Flow Detected in Current Context</p>
                    </div>
                )}
            </div>

            {/* Granular Intelligence: Transaction Ledger */}
            <div className="glass-panel bento-item bg-white/40 dark:bg-slate-900/40 border-none shadow-2xl backdrop-blur-3xl overflow-hidden">
                <div className="p-8 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                    <div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-white mb-1 uppercase tracking-tighter">
                            {reportView === 'overview' ? 'سجل العمليات التفصيلي' :
                                reportView === 'sales' ? 'سجل مرتجعات المبيعات' :
                                    'سجل مرتجعات المشتريات'}
                        </h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Granular Transactional Intelligence Ledger</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Records:</span>
                        <span className="px-3 py-1 bg-rose-500/10 text-rose-600 rounded-full text-[10px] font-black">
                            {(reportView === 'overview'
                                ? filteredSalesReturns.length + filteredPurchaseReturns.length
                                : reportView === 'sales' ? filteredSalesReturns.length : filteredPurchaseReturns.length)}
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-slate-100/50 dark:bg-slate-800/80">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">الرقم المرجعي</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">طابع التاريخ</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{filters.type === 'purchase' ? 'المورد المؤسسي' : 'العميل المستفيد'}</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">الفاتورة الأصلية</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">تحليل العلة</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-left">التدفق المالي</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">الوضع الحالي</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {(reportView === 'overview'
                                ? [...filteredSalesReturns, ...filteredPurchaseReturns]
                                : reportView === 'sales' ? filteredSalesReturns : filteredPurchaseReturns
                            ).slice(0, 20).map((item: any, index: number) => (
                                <tr key={index} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all duration-300">
                                    <td className="px-8 py-5">
                                        <span className="text-sm font-black text-slate-800 dark:text-white tracking-tighter group-hover:text-blue-500 transition-colors">
                                            {item.invoice_number}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-bold text-slate-500 font-mono">
                                        {item.issue_date || 'N/A'}
                                    </td>
                                    <td className="px-8 py-5 text-sm font-black text-slate-700 dark:text-slate-300">
                                        {item.party?.name || '-'}
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs font-bold text-slate-500 border border-slate-200/50 dark:border-slate-700/50">
                                            {item.reference_invoice?.invoice_number || 'Internal'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-bold text-slate-600 dark:text-slate-400">
                                        {getReasonText(item.return_reason)}
                                    </td>
                                    <td className="px-8 py-5 text-left">
                                        <span className="text-base font-black text-slate-800 dark:text-white font-mono tracking-tighter">
                                            {formatCurrency(Number(item.total_amount) || 0)}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${getStatusColor(item.status)}`}>
                                            {item.status === 'draft' ? 'Draft' :
                                                item.status === 'posted' ? 'Verified' :
                                                    item.status === 'paid' ? 'Settled' :
                                                        item.status === 'cancelled' ? 'Void' : item.status}
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
                        <div className="p-8 text-center bg-slate-50/30 dark:bg-slate-900/30 border-t border-slate-200/50 dark:border-slate-700/50">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                Showing limited view (Top 20 of {(reportView === 'overview'
                                    ? filteredSalesReturns.length + filteredPurchaseReturns.length
                                    : reportView === 'sales' ? filteredSalesReturns.length : filteredPurchaseReturns.length)} intelligence nodes)
                            </p>
                        </div>
                    )}
            </div>
        </div>
    );
};

export default ReturnsReportView;
