import React, { useState, useMemo, useRef } from 'react';
import { RefreshCw, Plus, Eye, RotateCcw, FileText, Search, Filter, Download, Printer, ChevronDown, X } from 'lucide-react';
import { useSalesReturns, useSalesReturnsStats, useSalesInvoicesForReturn } from '../../hooks/useSalesReturns';
import Button from '../../../../ui/base/Button';
import { exportReturnsToExcel } from '../../../../core/utils/returnsExcelExporter';
import { exportToPDF } from '../../../../core/utils/pdfExporter';
import { AdvancedReturnModal } from '../../../returns/components/AdvancedReturnModal'; // Import new Modal

// Return reason labels
const RETURN_REASON_LABELS: Record<string, string> = {
  'defective': 'منتج تالف',
  'not_as_described': 'غير مطابق للمواصفات',
  'wrong_item': 'صنف خاطئ',
  'quality_issue': 'مشكلة في الجودة',
  'changed_mind': 'تغيير رأي العميل',
  'other': 'أخرى',
};

// Status labels
const STATUS_LABELS: Record<string, string> = {
  'draft': 'مسودة',
  'posted': 'معتمد',
  'paid': 'مدفوع',
};

interface SalesReturnsViewProps {
  searchTerm: string;
  onViewDetails: (id: string) => void;
}

type SortField = 'issue_date' | 'total_amount' | 'party_name' | 'invoice_number';
type SortDirection = 'asc' | 'desc';

const SalesReturnsView: React.FC<SalesReturnsViewProps> = ({ searchTerm: propSearchTerm, onViewDetails }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(propSearchTerm || '');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    returnReason: '',
  });
  const [sortField, setSortField] = useState<SortField>('issue_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const printRef = useRef<HTMLDivElement>(null);

  const { data: returns, isLoading, refetch } = useSalesReturns({
    searchTerm: localSearchTerm,
    status: filters.status || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  });
  const { data: stats } = useSalesReturnsStats();

  // Apply client-side filtering and sorting
  const processedReturns = useMemo(() => {
    if (!returns) return [];

    let filtered = [...returns];

    // Apply amount filters
    if (filters.minAmount) {
      filtered = filtered.filter(r => (Number(r.total_amount) || 0) >= Number(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(r => (Number(r.total_amount) || 0) <= Number(filters.maxAmount));
    }
    if (filters.returnReason) {
      // Note: return_reason is not available in the current query
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'issue_date':
          comparison = new Date(a.issue_date || a.created_at).getTime() - new Date(b.issue_date || b.created_at).getTime();
          break;
        case 'total_amount':
          comparison = (Number(a.total_amount) || 0) - (Number(b.total_amount) || 0);
          break;
        case 'party_name':
          comparison = (a.party?.name || '').localeCompare(b.party?.name || '');
          break;
        case 'invoice_number':
          comparison = (a.invoice_number || '').localeCompare(b.invoice_number || '');
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [returns, filters, sortField, sortDirection]);

  // Calculate totals
  const totalAmount = processedReturns.reduce((sum, r) => {
    return sum + (Number(r.total_amount) || 0);
  }, 0);

  // Handle export to Excel
  const handleExportExcel = () => {
    if (!processedReturns.length) return;

    exportReturnsToExcel({
      companyName: 'شركة',
      returns: processedReturns.map((r: any) => ({
        invoiceNumber: r.invoice_number || '',
        issueDate: new Date(r.issue_date || r.created_at).toLocaleDateString('ar-SA'),
        customerName: r.party?.name || 'عميل نقدي',
        referenceInvoice: '',
        returnReason: '',
        items: r.invoice_items?.length || 0,
        totalAmount: Number(r.total_amount) || 0,
        status: r.status || 'draft',
        notes: r.notes || '',
      })),
      summary: {
        totalReturns: totalAmount,
        totalAmount: totalAmount,
        averageAmount: processedReturns.length > 0 ? totalAmount / processedReturns.length : 0,
        count: processedReturns.length,
      },
      type: 'sales',
    });
  };

  // Handle print
  const handlePrint = async () => {
    if (!printRef.current) return;
    try {
      await exportToPDF(printRef.current, `مرتجعات_المبيعات_${new Date().toISOString().split('T')[0]}`);
    } catch (error) {
      console.error('Print error:', error);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      returnReason: '',
    });
    setLocalSearchTerm('');
  };

  const hasActiveFilters = filters.status || filters.startDate || filters.endDate ||
    filters.minAmount || filters.maxAmount || filters.returnReason || localSearchTerm;

  return (
    <div className="space-y-3 animate-in fade-in duration-300 pt-2" ref={printRef}>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-1">
            <RotateCcw size={18} className="text-red-600" />
            <span className="text-xs font-bold text-red-600 dark:text-red-400">عدد المرتجعات</span>
          </div>
          <p className="text-2xl font-black text-red-700 dark:text-red-300">{stats?.returnCount || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={18} className="text-red-600" />
            <span className="text-xs font-bold text-red-600 dark:text-red-400">إجمالي المرتجعات</span>
          </div>
          <p className="text-2xl font-black text-red-700 dark:text-red-300">
            {(stats?.totalReturns || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={18} className="text-blue-600" />
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">متوسط المرتجع</span>
          </div>
          <p className="text-2xl font-black text-blue-700 dark:text-blue-300">
            {(stats?.avgReturn || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw size={18} className="text-yellow-600" />
            <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">قيد الانتظار</span>
          </div>
          <p className="text-2xl font-black text-yellow-700 dark:text-yellow-300">
            {stats?.pendingCount || 0}
          </p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              placeholder="بحث بالعميل، رقم الفاتورة، سبب الإرجاع..."
              className="w-full pr-10 pl-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400"
            />
            {localSearchTerm && (
              <button
                onClick={() => setLocalSearchTerm('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant={showFilters ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<Filter size={14} />}
            >
              فلترة
              {hasActiveFilters && (
                <span className="mr-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {[filters.status, filters.startDate, filters.endDate, filters.minAmount, filters.maxAmount, filters.returnReason, localSearchTerm].filter(Boolean).length}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={!processedReturns.length}
              leftIcon={<Download size={14} />}
            >
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={!processedReturns.length}
              leftIcon={<Printer size={14} />}
            >
              طباعة
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              leftIcon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
            >
              تحديث
            </Button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-600">
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
              {/* Status Filter */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">الحالة</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded text-sm"
                >
                  <option value="">الكل</option>
                  <option value="draft">مسودة</option>
                  <option value="posted">معتمد</option>
                  <option value="paid">مدفوع</option>
                </select>
              </div>

              {/* Return Reason Filter */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">سبب الإرجاع</label>
                <select
                  value={filters.returnReason}
                  onChange={(e) => setFilters({ ...filters, returnReason: e.target.value })}
                  className="w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded text-sm"
                >
                  <option value="">الكل</option>
                  <option value="defective">منتج تالف</option>
                  <option value="not_as_described">غير مطابق للمواصفات</option>
                  <option value="wrong_item">صنف خاطئ</option>
                  <option value="quality_issue">مشكلة في الجودة</option>
                  <option value="changed_mind">تغيير رأي العميل</option>
                  <option value="other">أخرى</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">من تاريخ</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded text-sm"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">إلى تاريخ</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded text-sm"
                />
              </div>

              {/* Min Amount */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">الحد الأدنى</label>
                <input
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                  placeholder="الحد الأدنى للمبلغ"
                  className="w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded text-sm"
                />
              </div>

              {/* Max Amount */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">الحد الأعلى</label>
                <input
                  type="number"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                  placeholder="الحد الأعلى للمبلغ"
                  className="w-full p-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded text-sm"
                />
              </div>
            </div>

            {/* Sort Options */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-gray-500">ترتيب حسب:</span>
              <div className="flex gap-1">
                {[
                  { value: 'issue_date', label: 'التاريخ' },
                  { value: 'total_amount', label: 'المبلغ' },
                  { value: 'party_name', label: 'العميل' },
                  { value: 'invoice_number', label: 'رقم الفاتورة' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      if (sortField === option.value) {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField(option.value as SortField);
                        setSortDirection('desc');
                      }
                    }}
                    className={`px-2 py-1 text-xs rounded ${sortField === option.value
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300'
                      }`}
                  >
                    {option.label} {sortField === option.value && (sortDirection === 'asc' ? '↑' : '↓')}
                  </button>
                ))}
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="ml-auto text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <X size={12} /> مسح الفلاتر
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Return Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="danger"
          size="sm"
          leftIcon={<Plus size={14} />}
        >
          مرتجع مبيعات جديد
        </Button>
      </div>

      {/* Returns List */}
      {isLoading ? (
        <div className="animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-slate-800 rounded mb-3" />
          ))}
        </div>
      ) : processedReturns.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <RotateCcw size={48} className="mx-auto mb-4 opacity-50" />
          <p className="font-medium">لا توجد مرتجعات مبيعات</p>
          <p className="text-sm text-gray-400 mt-1">قم بإنشاء مرتجع جديد للبدء</p>
        </div>
      ) : (
        <div className="space-y-3">
          {processedReturns.map((returnItem: any) => (
            <div
              key={returnItem.id}
              onClick={() => onViewDetails(returnItem.id)}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-600 transition-colors cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <RotateCcw size={20} className="text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      مرتجع #{returnItem.invoice_number}
                    </p>
                    <p className="text-sm text-gray-500">
                      العميل: {returnItem.party?.name || 'عميل نقدي'}
                    </p>
                    {returnItem.reference_invoice_id && (
                      <p className="text-xs text-blue-600">
                        فاتورة أصلية: {returnItem.reference_invoice_id}
                      </p>
                    )}
                    {returnItem.notes && (
                      <p className="text-xs text-gray-400 mt-1">
                        {returnItem.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-left">
                  <p className="font-bold text-red-600">-{Number(returnItem.total_amount || 0).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(returnItem.issue_date || returnItem.created_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-slate-300">
                    {returnItem.invoice_items?.length || 0} أصناف
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${returnItem.status === 'posted' || returnItem.status === 'paid'
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                    {STATUS_LABELS[returnItem.status] || returnItem.status}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(returnItem.id);
                    }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Total Summary */}
      {processedReturns.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
          <div className="flex justify-between items-center">
            <span className="font-bold text-red-800 dark:text-red-300">إجمالي المرتجعات المعروضة:</span>
            <span className="font-black text-xl text-red-600 dark:text-red-400">
              {totalAmount.toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            عدد النتائج: {processedReturns.length} من {returns?.length || 0}
          </div>
        </div>
      )}

      {/* Advanced Return Modal */}
      <AdvancedReturnModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        returnType="sale"
        partyName="عميل"
        onSuccess={() => {
          setIsModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
};

export default SalesReturnsView;
