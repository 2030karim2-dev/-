import React, { useState } from 'react';
import { useWarehouses, useWarehouseMutations } from '../hooks/useInventoryManagement';
import WarehouseDetailView from './warehouses/WarehouseDetailView';
import WarehouseModal from './WarehouseModal';
import { Loader2, ArrowRight } from 'lucide-react';
import Button from '../../../ui/base/Button';
import FullscreenContainer from '../../../ui/base/FullscreenContainer';
import { cn } from '../../../core/utils';
import WarehouseListSidebar from './warehouses/WarehouseListSidebar';

const WarehousesView: React.FC = () => {
    const { data: warehouses, isLoading } = useWarehouses();
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<any | null>(null);
    const { saveWarehouse, isSaving } = useWarehouseMutations();
    const [isMaximized, setIsMaximized] = useState(false);

    // Select the first warehouse by default if none is selected
    React.useEffect(() => {
        if (warehouses && warehouses.length > 0 && !selectedWarehouseId) {
            setSelectedWarehouseId(warehouses[0].id);
            setViewMode('detail');
        }
    }, [warehouses, selectedWarehouseId]);

    const handleSave = (data: any) => {
        const payload = editingWarehouse ? { ...data, id: editingWarehouse.id } : data;
        saveWarehouse(payload, { onSuccess: () => { setIsModalOpen(false); } });
    };

    const handleViewDetails = (id: string) => {
        setSelectedWarehouseId(id);
        setViewMode('detail');
    };

    if (isLoading) return (
        <div className="h-full flex items-center justify-center bg-white dark:bg-slate-900">
            <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
    );

    return (
        <FullscreenContainer isMaximized={isMaximized} onToggleMaximize={() => { setIsMaximized(false); }}>
            <div className={cn(
                "animate-in fade-in duration-500 h-full flex flex-col bg-[var(--app-bg)] dark:bg-slate-950",
                isMaximized && "p-2 md:p-3"
            )}>
                {/* Sidebar Layout - Split view with scrollable sidebar and detail area */}
                <div className="flex-1 flex overflow-hidden gap-1.5 h-full">
                    {/* Sidebar - List of warehouses */}
                    <div className={cn(
                        "w-64 2xl:w-72 flex-shrink-0 border border-[var(--app-border)] bg-white dark:bg-slate-900 overflow-hidden flex flex-col rounded-xl shadow-sm transition-all duration-300",
                        viewMode === 'detail' ? "hidden md:flex" : "flex"
                    )}>
                        <div className="p-2 border-b border-[var(--app-border)] bg-gray-50/50 dark:bg-slate-950/50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-1.5">
                                <ArrowRight size={14} className="text-blue-600 rotate-180" />
                                <h2 className="text-[10px] font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">المستودعات والفروع</h2>
                            </div>
                            <Button
                                onClick={() => { setEditingWarehouse(null); setIsModalOpen(true); }}
                                size="sm"
                                className="h-6 px-2 rounded-md text-[9px] font-bold"
                            >
                                إضافة مستودع
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto smooth-scroll">
                            <WarehouseListSidebar
                                warehouses={warehouses || []}
                                selectedId={selectedWarehouseId}
                                onSelect={handleViewDetails}
                            />
                        </div>
                    </div>

                    {/* Detail View */}
                    <div className={cn(
                        "flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-slate-900 border border-[var(--app-border)] rounded-xl shadow-sm",
                        viewMode === 'list' && "hidden md:flex"
                    )}>
                        {(!selectedWarehouseId || viewMode === 'list') && (
                            <div className="flex-1 flex items-center justify-center p-4">
                                <h2 className="text-xs font-bold text-gray-400 dark:text-slate-500">اختر مستودعاً من القائمة لعرض التفاصيل</h2>
                            </div>
                        )}
                        {selectedWarehouseId && viewMode === 'detail' && (
                            <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-2">
                                <WarehouseDetailView
                                    warehouseId={selectedWarehouseId}
                                    warehouses={warehouses || []}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <WarehouseModal
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); }}
                    onSave={handleSave}
                    isSaving={isSaving}
                    initialData={editingWarehouse}
                />
            </div>
        </FullscreenContainer>
    );
};

export default WarehousesView;
