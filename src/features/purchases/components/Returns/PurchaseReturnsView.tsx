import React, { useState, useRef } from 'react';
import { Plus, Eye, RotateCcw, FileText } from 'lucide-react';
import { usePurchaseReturns, usePurchaseReturnsStats } from '../../hooks/usePurchaseReturns';
import Button from '../../../../ui/base/Button';
import { exportToPDF } from '../../../../core/utils/pdfExporter';
import { AdvancedReturnModal } from '../../../returns/components/AdvancedReturnModal';
import { useReturnsListView } from '../../../returns/hooks/useReturnsListView';
import { ReturnsStatsHeader } from '../../../returns/components/view/ReturnsStatsHeader';
import { ReturnsFilterControls } from '../../../returns/components/view/ReturnsFilterControls';

// Status labels
const STATUS_LABELS: Record<string, string> = {
    'draft': 'مسودة',
    'posted': 'معتمد',
    'paid': 'مدفوع',
};

interface PurchaseReturnsViewProps {
    searchTerm: string;
    onViewDetails: (id: string) => void;
}

const PurchaseReturnsView: React.FC<PurchaseReturnsViewProps> = ({ searchTerm: propSearchTerm, onViewDetails }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const { data: returns, isLoading, refetch } = usePurchaseReturns();
    const { data: stats } = usePurchaseReturnsStats();

    const {
        localSearchTerm, setLocalSearchTerm,
        showFilters, setShowFilters,
        filters, setFilters,
        sortField, setSortField,
        sortDirection, setSortDirection,
        processedReturns,
        totalAmount,
        handleExportExcel,
        clearFilters,
        hasActiveFilters
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
            await exportToPDF(printRef.current, `مرتجعات_المشتريات_${new Date().toISOString().split('T')[0]}`);
        } catch (error) {
            console.error('Print error:', error);
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 h-full gap-2.5 animate-in fade-in duration-300 pt-2" ref={printRef}>
            {/* Stats Cards */}
            <div className="shrink-0">
                <ReturnsStatsHeader 
                    returnCount={stats?.returnCount || 0}
                    totalReturns={stats?.totalReturns || 0}
                    avgReturn={stats?.returnCount ? ((stats?.totalReturns || 0) / stats.returnCount) : 0}
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
            <div className="flex justify-end shrink-0">
                <Button
                    onClick={() => { setIsModalOpen(true); }}
                    variant="danger"
                    size="sm"
                    leftIcon={<Plus size={14} />}
                >
                    مرتجع مشتريات جديد
                </Button>
            </div>

            {/* Returns List — fills remaining height */}
            {isLoading ? (
                <div className="animate-pulse flex-1">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-20 bg-gray-100 dark:bg-slate-800 rounded mb-3" />
                    ))}
                </div>
            ) : processedReturns.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                        <RotateCcw size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="font-medium">لا توجد مرتجعات مشتريات</p>
                        <p className="text-sm text-gray-400 mt-1">قم بإنشاء مرتجع جديد للبدء</p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-sm">
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-0 divide-y divide-gray-100 dark:divide-slate-800">
                        {processedReturns.map((returnItem: any) => (
                            <div
                                key={returnItem.id}
                                onClick={() => { onViewDetails(returnItem.id); }}
                                className="p-3.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                        <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg shrink-0">
                                            <RotateCcw size={14} className="text-red-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">
                                                مرتجع #{returnItem.invoice_number}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {returnItem.party?.name || 'مورد غير محدد'}
                                            </p>
                                            {returnItem.notes && (
                                                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{returnItem.notes}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-left shrink-0 flex flex-col items-end gap-1">
                                        <p className="font-bold text-red-600 text-sm font-mono" dir="ltr">
                                            -{Number(returnItem.total_amount || 0).toFixed(2)}
                                        </p>
                                        <p className="text-[10px] text-gray-400">
                                            {new Date(returnItem.issue_date || returnItem.created_at).toLocaleDateString('ar-SA')}
                                        </p>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${returnItem.status === 'posted' || returnItem.status === 'paid'
                                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        }`}>
                                            {STATUS_LABELS[returnItem.status] || returnItem.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                    <FileText size={12} className="text-gray-400" />
                                    <span>{returnItem.invoice_items?.length || 0} أصناف</span>
                                    {returnItem.reference_invoice_id && (
                                        <span className="text-blue-500">• فاتورة #{returnItem.reference_invoice_id}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Pinned total footer */}
                    <div className="shrink-0 bg-red-50 dark:bg-red-900/20 px-4 py-2.5 border-t border-red-200 dark:border-red-800 flex justify-between items-center">
                        <span className="font-bold text-xs text-red-800 dark:text-red-300">
                            الإجمالي ({processedReturns.length} من {returns?.length || 0}):
                        </span>
                        <span className="font-bold text-sm text-red-600 dark:text-red-400 font-mono" dir="ltr">
                            {totalAmount.toFixed(2)}
                        </span>
                    </div>
                </div>
            )}

            {/* Advanced Return Modal */}
            <AdvancedReturnModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); }}
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
