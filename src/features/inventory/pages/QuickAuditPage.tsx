// ============================================
// QuickAuditPage — صفحة التسوية السريعة للمخزون
// تم التقسيم: UI → AuditSearchPanel + AuditItemsTable
// ============================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Save } from 'lucide-react';
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
        if (adjustedItems.find(i => i.product_id === product.id)) return;

        const stockInfo = product.warehouse_distribution?.find((w: any) => w.warehouse_id === selectedWarehouseId);
        const currentQty = stockInfo ? stockInfo.quantity : (product.stock_quantity || 0);

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
            quantity: currentQty,
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

    // ── Render ─────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
            <MicroHeader
                title="تسوية جرد سريعة"
                icon={ClipboardCheck}
                actions={
                    <Button
                        variant="success"
                        size="sm"
                        onClick={handleSave}
                        isLoading={isQuickAdjusting}
                        disabled={adjustedItems.length === 0}
                        leftIcon={<Save size={14} />}
                    >
                        اعتماد التسوية ({adjustedItems.length})
                    </Button>
                }
            />

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
