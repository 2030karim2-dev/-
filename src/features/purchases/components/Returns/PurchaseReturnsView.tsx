import React, { useState, useRef } from 'react';
import { Plus, RotateCcw, FileText } from 'lucide-react';
import { usePurchaseReturns, usePurchaseReturnsStats } from '../../hooks/usePurchaseReturns';
import Button from '../../../../ui/base/Button';
import { exportToPDF } from '../../../../core/utils/pdfExporter';
import { AdvancedReturnModal } from '../../../returns/components/AdvancedReturnModal';
import { useReturnsListView } from '../../../returns/hooks/useReturnsListView';
import { ReturnsStatsHeader } from '../../../returns/components/view/ReturnsStatsHeader';
import { ReturnsFilterControls } from '../../../returns/components/view/ReturnsFilterControls';

// Status labels
const STATUS_LABELS: Record<string, string> = {
  draft: 'مسودة',
  posted: 'معتمد',
  paid: 'مدفوع',
};

interface PurchaseReturnsViewProps {
  searchTerm: string;
  onViewDetails: (id: string) => void;
}

const PurchaseReturnsView: React.FC<PurchaseReturnsViewProps> = ({
  searchTerm: propSearchTerm,
  onViewDetails,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: returns, isLoading, refetch } = usePurchaseReturns();
  const { data: stats } = usePurchaseReturnsStats();

  const {
    localSearchTerm,
    setLocalSearchTerm,
    showFilters,
    setShowFilters,
    filters,
    setFilters,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    processedReturns,
    totalAmount,
    handleExportExcel,
    clearFilters,
    hasActiveFilters,
  } = useReturnsListView(returns, 'purchase');

  // Sync initial search term
  React.useEffect(() => {
    if (propSearchTerm) {
      setLocalSearchTerm(propSearchTerm);
    }
  }, [propSearchTerm, setLocalSearchTerm]);

  // Handle print
  const handlePrint = async () => {
    if (!printRef.current) return;
    try {
      await exportToPDF(
        printRef.current,
        `مرتجعات_المشتريات_${new Date().toISOString().split('T')[0]}`
      );
    } catch (error) {
      console.error('Print error:', error);
    }
  };

  return (
    <div
      className="animate-in fade-in flex h-full min-h-0 flex-1 flex-col gap-2.5 pt-2 duration-300"
      ref={printRef}
    >
      {/* Stats Cards */}
      <div className="shrink-0">
        <ReturnsStatsHeader
          returnCount={stats?.returnCount || 0}
          totalReturns={stats?.totalReturns || 0}
          avgReturn={stats?.returnCount ? (stats?.totalReturns || 0) / stats.returnCount : 0}
          pendingCount={stats?.returnCount || 0}
          type="purchase"
        />
      </div>

      {/* Search and Filter Bar */}
      <div className="shrink-0">
        <ReturnsFilterControls
          localSearchTerm={localSearchTerm}
          setLocalSearchTerm={setLocalSearchTerm}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          filters={filters}
          setFilters={setFilters}
          sortField={sortField}
          setSortField={setSortField}
          sortDirection={sortDirection}
          setSortDirection={setSortDirection}
          hasActiveFilters={hasActiveFilters}
          clearFilters={clearFilters}
          handleExportExcel={handleExportExcel}
          handlePrint={handlePrint}
          refetch={refetch}
          isLoading={isLoading}
          hasData={processedReturns.length > 0}
          type="purchase"
        />
      </div>

      {/* Add Return Button */}
      <div className="flex shrink-0 justify-end">
        <Button
          onClick={() => {
            setIsModalOpen(true);
          }}
          variant="danger"
          size="sm"
          leftIcon={<Plus size={14} />}
        >
          مرتجع مشتريات جديد
        </Button>
      </div>

      {/* Returns List — fills remaining height */}
      {isLoading ? (
        <div className="flex-1 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-3 h-20 rounded bg-gray-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : processedReturns.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-gray-500">
          <div className="text-center">
            <RotateCcw size={48} className="mx-auto mb-4 opacity-50" />
            <p className="font-medium">لا توجد مرتجعات مشتريات</p>
            <p className="mt-1 text-sm text-gray-400">قم بإنشاء مرتجع جديد للبدء</p>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="custom-scrollbar flex flex-1 flex-col gap-0 divide-y divide-gray-100 overflow-y-auto dark:divide-slate-800">
            {processedReturns.map((returnItem: any) => (
              <div
                key={returnItem.id}
                onClick={() => {
                  onViewDetails(returnItem.id);
                }}
                className="cursor-pointer p-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 rounded-lg bg-red-100 p-1.5 dark:bg-red-900/30">
                      <RotateCcw size={14} className="text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        مرتجع #{returnItem.invoice_number}
                      </p>
                      <p className="text-xs text-gray-500">
                        {returnItem.party?.name || 'مورد غير محدد'}
                      </p>
                      {returnItem.notes && (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-gray-400">
                          {returnItem.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 text-left">
                    <p className="font-mono text-sm font-bold text-red-600" dir="ltr">
                      -{Number(returnItem.total_amount || 0).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(returnItem.issue_date || returnItem.created_at).toLocaleDateString(
                        'ar-SA'
                      )}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        returnItem.status === 'posted' || returnItem.status === 'paid'
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}
                    >
                      {STATUS_LABELS[returnItem.status] || returnItem.status}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <FileText size={12} className="text-gray-400" />
                  <span>{returnItem.invoice_items?.length || 0} أصناف</span>
                  {returnItem.reference_invoice_id && (
                    <span className="text-blue-500">
                      • فاتورة #{returnItem.reference_invoice_id}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Pinned total footer */}
          <div className="flex shrink-0 items-center justify-between border-t border-red-200 bg-red-50 px-4 py-2.5 dark:border-red-800 dark:bg-red-900/20">
            <span className="text-xs font-bold text-red-800 dark:text-red-300">
              الإجمالي ({processedReturns.length} من {returns?.length || 0}):
            </span>
            <span className="font-mono text-sm font-bold text-red-600 dark:text-red-400" dir="ltr">
              {totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Advanced Return Modal */}
      <AdvancedReturnModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
        returnType="purchase"
        partyName="مورد"
        onSuccess={() => {
          setIsModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
};

export default PurchaseReturnsView;
