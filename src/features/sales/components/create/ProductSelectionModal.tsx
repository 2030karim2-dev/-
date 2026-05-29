import React, { useState, useMemo, useEffect } from 'react';
import { Box, Plus, Settings, Minus } from 'lucide-react';
import { useProducts, useProductMutations } from '../../../inventory/hooks/index';
import type { Product } from '../../../inventory/types';
import Modal from '../../../../ui/base/Modal';
import ExcelTable from '../../../../ui/common/ExcelTable';
import { getProductColumns } from '../../../inventory/components/products/ProductTableColumns';
import AddProductModal from '../../../inventory/components/AddProductModal';
import PageLoader from '../../../../ui/base/PageLoader';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: Product) => void;
    initialQuery?: string;
    mode?: 'sale' | 'purchase';
}

const ProductSelectionModal: React.FC<Props> = ({ isOpen, onClose, onSelect, initialQuery = '', mode = 'sale' }) => {
    const [searchTerm, setSearchTerm] = useState(initialQuery);
    const [debouncedSearch, setDebouncedSearch] = useState(initialQuery);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 250);
        return () => { clearTimeout(handler); };
    }, [searchTerm]);

    const { products, isLoading, refetch } = useProducts(debouncedSearch);
    const { saveProduct, isSaving } = useProductMutations();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);

    // Column Visibility State
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
        name: true,
        part_number: true,
        brand: true,
        size: true,
        category: true,
        location: true,
        stock_quantity: true,
        cost_price: mode === 'purchase', // Default: visible in purchase mode
        selling_price: mode === 'sale', // Default: visible in sale mode
    });

    const columnLabels = [
        { key: 'name', label: 'اسم القطعة' },
        { key: 'part_number', label: 'رقم القطعة' },
        { key: 'brand', label: 'الشركة الصانعة' },
        { key: 'size', label: 'المقاس' },
        { key: 'category', label: 'التصنيف' },
        { key: 'location', label: 'المخزن/الرف' },
        { key: 'stock_quantity', label: 'المخزون' },
        { key: 'cost_price', label: 'التكلفة' },
        { key: 'selling_price', label: 'سعر البيع' },
    ];

    const handleColumnToggle = (key: string) => {
        setVisibleColumns(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Get columns configuration, hiding standard action buttons (edit/delete)
    const allCols = useMemo(() => getProductColumns({
        hideActions: true,
    }), []);

    // Filter columns based on visibleColumns state
    const columns = useMemo(() => {
        return allCols.filter(col => {
            const key = col.sortKey!;
            return visibleColumns[key];
        });
    }, [allCols, visibleColumns]);

    const handleSelect = (product: Product) => {
        onSelect(product);
        onClose();
    };

    const handleAddProductSubmit = async (data: any) => {
        try {
            const newProduct = await saveProduct({ data });
            if (newProduct) {
                // Instantly select the newly created product and close modals
                onSelect(newProduct as Product);
                setIsAddModalOpen(false);
                onClose();
            } else {
                refetch();
                setIsAddModalOpen(false);
            }
        } catch (err) {
            console.error('Failed to save product:', err);
        }
    };

    const headerActions = (
        <div className="flex items-center gap-1.5 font-cairo">
            <button
                type="button"
                onClick={() => { setIsAddModalOpen(true); }}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold active:scale-95 transition-all shadow-sm shadow-blue-500/10"
            >
                <Plus size={12} />
                <span>إضافة صنف</span>
            </button>

            <div className="relative">
                <button
                    type="button"
                    onClick={() => { setShowSettings(!showSettings); }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold active:scale-95 transition-all shadow-sm"
                >
                    <Settings size={12} />
                    <span>تخصيص الأعمدة</span>
                </button>

                {showSettings && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => { setShowSettings(false); }}></div>
                        <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 p-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                            <h4 className="text-[10px] font-black text-slate-900 dark:text-white mb-2 pb-1 border-b dark:border-slate-200/10">أعمدة جدول المنتجات</h4>
                            <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar">
                                {columnLabels.map(col => (
                                    <label key={col.key} className="flex items-center gap-2 text-[10px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={visibleColumns[col.key]}
                                            onChange={() => { handleColumnToggle(col.key); }}
                                            className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-3 h-3"
                                        />
                                        <span>{col.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            icon={Box}
            size="full"
            title="مستكشف الأصناف المتقدم"
            description="ابحث واختر المنتج لإنزاله في الفاتورة"
            headerActions={headerActions}
            footer={
                <button 
                    onClick={onClose} 
                    className="w-full py-2 text-[10px] font-bold bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors uppercase font-cairo"
                >
                    إغلاق المستكشف
                </button>
            }
        >
            <div className="flex-1 flex flex-col min-h-0 h-full bg-[var(--app-bg)] font-cairo">
                {/* Repositioned & Redesigned Primary Search Bar with Adjacent Zoom Controls */}
                <div className="shrink-0 flex items-center justify-between gap-3 p-2 bg-[var(--app-surface)] border-b border-[var(--app-border)]">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); }}
                            placeholder="ابحث بالاسم، رقم القطعة، الشركة الصانعة..."
                            className="w-full pl-3 pr-9 py-1.5 text-xs bg-[var(--app-bg)] text-[var(--app-text)] border border-[var(--app-border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Adjacent Zoom Controls */}
                    <div className="flex items-center gap-1 bg-[var(--app-surface)] border border-[var(--app-border)] rounded-lg p-0.5 shrink-0 select-none">
                        <button 
                            onClick={() => { setZoomLevel(z => Math.max(0.7, z - 0.1)); }} 
                            className="p-1 text-[var(--app-text-secondary)] hover:text-blue-500 hover:bg-[var(--app-bg)] rounded transition-colors"
                            title="تصغير"
                        >
                            <Minus size={12} />
                        </button>
                        <span className="text-[10px] w-9 text-center font-mono font-bold text-[var(--app-text)]">
                            {Math.round(zoomLevel * 100)}%
                        </span>
                        <button 
                            onClick={() => { setZoomLevel(z => Math.min(1.5, z + 0.1)); }} 
                            className="p-1 text-[var(--app-text-secondary)] hover:text-blue-500 hover:bg-[var(--app-bg)] rounded transition-colors"
                            title="تكبير"
                        >
                            <Plus size={12} />
                        </button>
                    </div>
                </div>

                {/* Table Container */}
                <div className="flex-1 overflow-hidden min-h-0 relative flex flex-col p-2">
                    {isLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-20">
                            <PageLoader />
                            <p className="text-[10px] font-bold text-slate-400 mt-4">جاري تحميل مستندات المنتجات ومطابقتها...</p>
                        </div>
                    ) : (
                        <ExcelTable
                            columns={columns}
                            data={products}
                            colorTheme={mode === 'sale' ? 'blue' : 'orange'}
                            pageSize={100}
                            onRowDoubleClick={handleSelect}
                            onRowClick={handleSelect}
                            onOrderChange={() => { }}
                            getRowId={(p) => p.id}
                            showSearch={false}
                            zoomLevel={zoomLevel}
                            setZoomLevel={setZoomLevel}
                        />
                    )}
                </div>

                {/* Add Product Modal (Shortcut) */}
                {isAddModalOpen && (
                    <AddProductModal
                        isOpen={isAddModalOpen}
                        onClose={() => { setIsAddModalOpen(false); }}
                        onSubmit={handleAddProductSubmit}
                        isSubmitting={isSaving}
                    />
                )}
            </div>
        </Modal>
    );
};

export default ProductSelectionModal;