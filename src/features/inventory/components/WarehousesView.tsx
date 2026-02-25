import React, { useState, useEffect } from 'react';
import { useWarehouses, useWarehouseMutations } from '../hooks/useInventoryManagement';
import WarehouseDetailView from './warehouses/WarehouseDetailView';
import WarehouseModal from './WarehouseModal';
import { Loader2, Edit, Trash2, Eye, Warehouse } from 'lucide-react';
import ExcelTable from '../../../ui/common/ExcelTable';
import Button from '../../../ui/base/Button';
import { formatCurrency, formatNumberDisplay } from '../../../core/utils';

const WarehousesView: React.FC = () => {
    const { data: warehouses, isLoading } = useWarehouses();
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<any | null>(null);
    const { saveWarehouse, deleteWarehouse, isSaving } = useWarehouseMutations();

    const handleSave = (data: any) => {
        const payload = editingWarehouse ? { ...data, id: editingWarehouse.id } : data;
        saveWarehouse(payload, { onSuccess: () => setIsModalOpen(false) });
    };

    const handleEdit = (wh: any) => {
        setEditingWarehouse(wh);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("هل أنت متأكد من حذف هذا المستودع؟")) {
            deleteWarehouse({ id }, {
                onSuccess: () => {
                    if (selectedWarehouseId === id) {
                        setSelectedWarehouseId(null);
                        setViewMode('list');
                    }
                }
            });
        }
    };

    const handleViewDetails = (id: string) => {
        setSelectedWarehouseId(id);
        setViewMode('detail');
    };

    const columns = [
        {
            header: 'اسم المستودع',
            accessor: (row: any) => (
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                        <Warehouse size={16} />
                    </div>
                    <span className="font-black text-gray-800 dark:text-slate-100 text-sm">{row.name_ar}</span>
                </div>
            )
        },
        { header: 'الموقع', accessor: (row: any) => <span className="font-bold text-gray-500">{row.location || '---'}</span> },
        {
            header: 'قيمة المخزون',
            accessor: (row: any) => <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(Number(row.stockValue || 0))}</span>,
            className: 'text-left'
        },
        {
            header: 'الأصناف',
            accessor: (row: any) => <span className="font-mono font-bold text-gray-700 dark:text-slate-300">{formatNumberDisplay(Number(row.itemCount || 0))}</span>,
            className: 'text-center'
        },
        {
            header: 'إجمالي القطع',
            accessor: (row: any) => <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{formatNumberDisplay(Number(row.totalStock || 0))}</span>,
            className: 'text-center'
        },
        {
            header: 'إجراءات',
            accessor: (row: any) => (
                <div className="flex items-center justify-center gap-2">
                    <Button onClick={() => handleViewDetails(row.id)} variant="primary" size="sm" className="h-8 px-3" leftIcon={<Eye size={14} />}>
                        عرض المخزون
                    </Button>
                    <Button onClick={() => handleEdit(row)} variant="outline" size="sm" className="h-8 px-3 text-blue-600 hover:bg-blue-50" leftIcon={<Edit size={14} />}>
                        تعديل
                    </Button>
                    <Button onClick={() => handleDelete(row.id)} variant="danger" size="sm" className="h-8 px-3" leftIcon={<Trash2 size={14} />}>
                        حذف
                    </Button>
                </div>
            ),
            className: 'text-center w-64'
        }
    ];

    if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={32} /></div>;

    return (
        <div className="animate-in fade-in duration-500 h-full flex flex-col">
            {viewMode === 'list' ? (
                <div className="space-y-4 h-full flex flex-col">
                    <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-none border border-gray-100 dark:border-slate-800 shadow-sm shrink-0">
                        <div>
                            <h2 className="text-xl font-black text-gray-800 dark:text-white">إدارة المستودعات والفروع</h2>
                            <p className="text-xs font-bold text-gray-500 mt-1">عرض جميع المستودعات وحالة المخزون بها</p>
                        </div>
                        <Button
                            onClick={() => { setEditingWarehouse(null); setIsModalOpen(true); }}
                            className="h-10 px-6 rounded-xl font-black text-sm shadow-md shadow-blue-500/20"
                        >
                            إضافة مستودع جديد
                        </Button>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex-1">
                        <ExcelTable
                            columns={columns}
                            data={warehouses || []}
                            title="قائمة المستودعات"
                            colorTheme="blue"
                        />
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col space-y-3">
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => setViewMode('list')}
                            variant="outline"
                            className="h-10 px-6 rounded-xl font-black text-sm"
                        >
                            الرجوع للقائمة
                        </Button>
                    </div>
                    <div className="flex-1">
                        <WarehouseDetailView
                            warehouseId={selectedWarehouseId}
                            warehouses={warehouses || []}
                        />
                    </div>
                </div>
            )}

            <WarehouseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                isSaving={isSaving}
                initialData={editingWarehouse}
            />
        </div>
    );
};

export default WarehousesView;
