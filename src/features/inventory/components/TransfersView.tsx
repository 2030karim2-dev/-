import React, { useState, useMemo } from 'react';
import { ArrowLeftRight, Plus, AlertTriangle, CheckCircle, Maximize2 } from 'lucide-react';
import NewTransferModal from './NewTransferModal';
import { useTransfers, useWarehouses } from '../hooks/useInventoryManagement';
import { useProducts } from '../hooks/useProducts';
import { useSmartTransferSuggestions } from '../hooks/useSmartTransferSuggestions';
import ExcelTable from '../../../ui/common/ExcelTable';
import EmptyState from '../../../ui/base/EmptyState';
import TableSkeleton from '../../../ui/base/TableSkeleton';
import FullscreenContainer from '../../../ui/base/FullscreenContainer';
import { cn } from '../../../core/utils';
import TransferStats from './transfers/TransferStats';
import SmartSuggestionsSection from './transfers/SmartSuggestionsSection';

const TransfersView: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data: transfers, isLoading: isTransfersLoading } = useTransfers();
    const { data: warehouses } = useWarehouses();
    const { products } = useProducts('');
    const [isMaximized, setIsMaximized] = useState(false);

    const { suggestions } = useSmartTransferSuggestions(products, warehouses);

    const stats = useMemo(() => {
        const transfersArray = Array.isArray(transfers) ? transfers : [];
        return {
            total: transfersArray.length,
            thisMonth: transfersArray.filter((t: any) => {
                const d = new Date(t.created_at);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length,
            totalItems: transfersArray.reduce((s: number, t: any) => s + (Number(t.item_count) || 0), 0),
            warehouseCount: warehouses?.length || 0
        };
    }, [transfers, warehouses]);

    const columns = [
        { header: '#', accessor: (row: any) => <span className="font-mono font-bold text-gray-400">{row.transfer_number || '-'}</span>, width: 'w-24' },
        {
            header: 'من مستودع', accessor: (row: any) => (
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></div>
                    <span className="font-black text-[11px] text-rose-600 dark:text-rose-400 uppercase tracking-tight">{row.from_warehouse_name}</span>
                </div>
            ), sortKey: 'from_warehouse_name'
        },
        {
            header: 'إلى مستودع', accessor: (row: any) => (
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></div>
                    <span className="font-black text-[11px] text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">{row.to_warehouse_name}</span>
                </div>
            ), sortKey: 'to_warehouse_name'
        },
        {
            header: 'التاريخ', accessor: (row: any) => (
                <span className="text-gray-600 dark:text-gray-400 font-mono text-[10px]">
                    {new Date(row.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
            ), width: 'w-32', sortKey: 'created_at'
        },
        {
            header: 'الأصناف', accessor: (row: any) => (
                <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {row.item_count} أصناف
                </span>
            ), className: 'text-center', width: 'w-24'
        },
        {
            header: 'الحالة',
            accessor: (row: any) => (
                <span className={cn(
                    "px-2.5 py-1 rounded-full text-[9px] font-bold flex items-center gap-1 w-fit mx-auto",
                    row.status === 'completed'
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                        : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
                )}>
                    {row.status === 'completed' ? <><CheckCircle size={10} /> مكتملة</> : <><AlertTriangle size={10} /> معلقة</>}
                </span>
            ),
            className: 'text-center',
            width: 'w-28'
        },
    ];

    if (isTransfersLoading) return <TableSkeleton rows={5} cols={6} />;

    return (
        <FullscreenContainer isMaximized={isMaximized} onToggleMaximize={() => { setIsMaximized(false); }}>
            <div className={cn(
                "space-y-4 flex flex-col h-full",
                isMaximized && "bg-[var(--app-bg)] p-4 md:p-8"
            )}>
                <TransferStats stats={stats} />

                <SmartSuggestionsSection 
                    suggestions={suggestions} 
                    onTransfer={() => { setIsModalOpen(true); }} 
                />

                <div className="flex justify-end gap-1.5">
                    {!isMaximized && (
                        <button
                            onClick={() => { setIsMaximized(true); }}
                            className="bg-white dark:bg-slate-800 text-gray-400 border border-gray-100 dark:border-slate-800 px-3 py-1.5 rounded-lg text-[9px] font-black active:scale-95 flex items-center gap-1.5 shadow-sm transition-all"
                        >
                            <Maximize2 size={12} />
                            <span className="hidden sm:inline">ملئ الشاشة</span>
                        </button>
                    )}
                    <button
                        onClick={() => { setIsModalOpen(true); }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-[9px] font-black active:scale-95 flex items-center gap-1.5 shadow-md shadow-emerald-500/10 transition-all"
                    >
                        <Plus size={12} strokeWidth={3} />
                        <span>مناقلة جديدة</span>
                    </button>
                </div>

                {!isTransfersLoading && (!transfers || transfers.length === 0) ? (
                    <EmptyState
                        icon={ArrowLeftRight}
                        title="لا توجد عمليات مناقلة"
                        description="لم يتم تسجيل أي عمليات نقل بضاعة بين المستودعات بعد. ابدأ بإنشاء أول عملية مناقلة."
                    />
                ) : (
                    <ExcelTable
                        columns={columns}
                        data={transfers || []}
                        colorTheme="green"
                        title="سجل المناقلات المخزنية"
                        subtitle={`${stats.total} عملية مسجلة • ${stats.totalItems} صنف تم نقله`}
                    />
                )}

                <NewTransferModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); }} />
            </div>
        </FullscreenContainer>
    );
};

export default TransfersView;