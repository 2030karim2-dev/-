// ============================================
// QuickAuditPage — صفحة التسوية السريعة للمخزون
// تم التقسيم: UI → AuditSearchPanel + QuickAuditItemsTable
// ============================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Save, Zap } from 'lucide-react';
import MicroHeader from '../../../ui/base/MicroHeader';
import Button from '../../../ui/base/Button';
import ScannerOverlay from '../../../ui/base/ScannerOverlay';
import { useWarehouses, useInventoryMutations } from '../hooks/useInventoryManagement';
import { useSearchProducts } from '../hooks/useProducts';
import { useDebounce } from 'use-debounce';
import AuditSearchPanel, { SearchResult } from '../components/audit/AuditSearchPanel';
import QuickAuditItemsTable, { type AdjustedItem } from '../components/audit/QuickAuditItemsTable';

const QuickAuditPage: React.FC = () => {
    const navigate = useNavigate();
    const { data: warehouses = [], isLoading: isLoadingWarehouses } = useWarehouses();
    const { quickAdjustStock, isQuickAdjusting } = useInventoryMutations();

    const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
    const [filter, setFilter] = useState('');
    const [debouncedFilter] = useDebounce(filter, 300);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [adjustedItems, setAdjustedItems] = useState<AdjustedItem[]>([]);

    /** toggle: عند التفعيل يُضاف الصنف فوراً بكمية = 1 لحظة مسح الباركود */
    const [instantApprove, setInstantApprove] = useState(false);

    const { data: searchResults, isLoading: isLoadingSearch } = useSearchProducts(debouncedFilter);

    // ── Handlers ───────────────────────────────────────────────
    const handleScan = (barcode: string) => {
        setFilter(barcode);
        setIsScannerOpen(false);
    };

    const handleAddItem = (product: any) => {
        if (!selectedWarehouseId) {
            alert('الرجاء اختيار المستودع أولاً');
            return;
        }

        // إذا كان الصنف موجوداً بالفعل، ارفع الكمية بمقدار 1 (في وضع الاعتماد الفوري)
        const existingIndex = adjustedItems.findIndex(i => i.product_id === product.id);
        if (existingIndex >= 0) {
            if (instantApprove) {
                setAdjustedItems(prev => prev.map((item, idx) =>
                    idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
                ));
                setFilter('');
            }
            return;
        }

        const stockInfo = product.warehouse_distribution?.find((w: any) => w.warehouse_id === selectedWarehouseId);
        const currentQty = stockInfo ? stockInfo.quantity : (product.stock_quantity || 0);

        // في وضع الاعتماد الفوري: الكمية الفعلية = 1، وإلا = الكمية الحالية
        const initialQty = instantApprove ? 1 : currentQty;

        setAdjustedItems(prev => [{
            product_id: product.id,
            name_ar: product.name_ar || product.name,
            sku: product.sku,
            part_number: product.part_number,
            brand: product.brand,
            alternative_numbers: product.alternative_numbers,
            size: product.size,
            warehouse_id: selectedWarehouseId,
            system_quantity: currentQty,
            quantity: initialQty,
        }, ...prev]);
        setFilter('');
    };

    const handleUpdateQuantity = (productId: string, qty: string) => {
        const parsed = parseFloat(qty);
        const numericQty = isNaN(parsed) ? 0 : parsed;
        setAdjustedItems(prev => prev.map(item =>
            item.product_id === productId ? { ...item, quantity: numericQty } : item
        ));
    };

    const handleRemoveItem = (productId: string) => {
        setAdjustedItems(prev => prev.filter(item => item.product_id !== productId));
    };

    const handleSave = () => {
        if (adjustedItems.length === 0) return;
        quickAdjustStock(
            adjustedItems.map(item => ({
                product_id: item.product_id,
                warehouse_id: item.warehouse_id,
                quantity: item.quantity,
            })),
            { onSuccess: () => { setAdjustedItems([]); navigate('/inventory'); } }
        );
    };

    // إجمالي الفروقات
    const totalDiff = adjustedItems.reduce((sum, i) => sum + (i.quantity - i.system_quantity), 0);

    // ── Render ─────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
            <MicroHeader
                title="تسوية جرد سريعة"
                icon={ClipboardCheck}
                actions={
                    <div className="flex items-center gap-3">
                        {/* ── Toggle: اعتماد فوري ── */}
                        <button
                            onClick={() => setInstantApprove(v => !v)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black transition-all active:scale-95 ${
                                instantApprove
                                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25'
                                    : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700'
                            }`}
                            title="عند التفعيل: يُضاف الصنف فوراً بكمية 1 عند مسح الباركود"
                        >
                            <Zap size={12} strokeWidth={3} className={instantApprove ? 'animate-pulse' : ''} />
                            {instantApprove ? 'اعتماد فوري: مفعّل' : 'اعتماد فوري'}
                        </button>

                        <Button
                            variant="success"
                            size="sm"
                            onClick={handleSave}
                            isLoading={isQuickAdjusting}
                            disabled={adjustedItems.length === 0}
                            leftIcon={<Save size={14} />}
                        >
                            اعتماد ({adjustedItems.length})
                            {totalDiff !== 0 && (
                                <span className={`mr-1 font-mono ${totalDiff > 0 ? 'text-emerald-200' : 'text-rose-200'}`}>
                                    {totalDiff > 0 ? `+${totalDiff}` : totalDiff}
                                </span>
                            )}
                        </Button>
                    </div>
                }
            />

            {/* ── Instant Approve Banner ── */}
            {instantApprove && (
                <div className="bg-amber-500/10 border-b border-amber-200 dark:border-amber-900/30 px-4 py-2 flex items-center gap-2 shrink-0">
                    <Zap size={13} className="text-amber-600 dark:text-amber-400 animate-pulse shrink-0" strokeWidth={3} />
                    <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                        وضع الاعتماد الفوري مفعّل — كل صنف يُمسح يُضاف بكمية 1 تلقائياً. المسح المتكرر يرفع الكمية بمقدار 1.
                    </p>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 pb-16 custom-scrollbar">
                <div className="w-full space-y-6">
                    <AuditSearchPanel
                        warehouses={warehouses}
                        isLoadingWarehouses={isLoadingWarehouses}
                        selectedWarehouseId={selectedWarehouseId}
                        onWarehouseChange={setSelectedWarehouseId}
                        filter={filter}
                        onFilterChange={setFilter}
                        onScannerOpen={() => setIsScannerOpen(true)}
                        searchResults={searchResults as SearchResult[] | undefined}
                        isLoadingSearch={isLoadingSearch}
                        onAddItem={handleAddItem}
                    />

                    <QuickAuditItemsTable
                        items={adjustedItems}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemoveItem={handleRemoveItem}
                    />
                </div>
            </div>

            {isScannerOpen && (
                <ScannerOverlay
                    onScan={handleScan}
                    onClose={() => setIsScannerOpen(false)}
                />
            )}
        </div>
    );
};

export default QuickAuditPage;
