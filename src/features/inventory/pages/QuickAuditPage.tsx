import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Save, Loader2, ScanBarcode, Database, Search, X } from 'lucide-react';
import MicroHeader from '../../../ui/base/MicroHeader';
import Button from '../../../ui/base/Button';
import ScannerOverlay from '../../../ui/base/ScannerOverlay';
import { useWarehouses, useInventoryMutations } from '../hooks/useInventoryManagement';
import { useSearchProducts } from '../hooks/useProducts';
import { useDebounce } from 'use-debounce';

interface AdjustedItem {
    product_id: string;
    name_ar: string;
    sku: string;
    part_number?: string;
    brand?: string;
    alternative_numbers?: string;
    size?: string;
    warehouse_id: string;
    system_quantity: number;
    quantity: number;
}

const QuickAuditPage: React.FC = () => {
    const navigate = useNavigate();
    const { data: warehouses, isLoading: isLoadingWarehouses } = useWarehouses();
    const { quickAdjustStock, isQuickAdjusting } = useInventoryMutations();

    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
    const [filter, setFilter] = useState('');
    const [debouncedFilter] = useDebounce(filter, 300);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [adjustedItems, setAdjustedItems] = useState<AdjustedItem[]>([]);

    const { data: searchResults, isLoading: isLoadingSearch } = useSearchProducts(debouncedFilter);

    const handleScan = (barcode: string) => {
        setFilter(barcode);
        setIsScannerOpen(false);
    };

    const handleAddItem = (product: any) => {
        if (!selectedWarehouseId) {
            alert('الرجاء اختيار المستودع أولاً');
            return;
        }

        const existing = adjustedItems.find(i => i.product_id === product.id);
        if (existing) return;

        // Try to get current system quantity from product stock distribution or overall stock_quantity
        // Note: search_inventory returns total stock_quantity across all warehouses.
        const stockInfo = (product as any).warehouse_distribution?.find((w: any) => w.warehouse_id === selectedWarehouseId);
        const currentQty = stockInfo ? stockInfo.quantity : (product.stock_quantity || 0);

        setAdjustedItems([
            {
                product_id: product.id,
                name_ar: product.name_ar || product.name,
                sku: product.sku,
                part_number: product.part_number,
                brand: product.brand,
                alternative_numbers: product.alternative_numbers,
                size: product.size,
                warehouse_id: selectedWarehouseId,
                system_quantity: currentQty,
                quantity: currentQty
            },
            ...adjustedItems
        ]);
        setFilter('');
    };

    const handleUpdateQuantity = (productId: string, qty: any) => {
        // Ensure we always have a valid number, defaulting to 0 for invalid input
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
                quantity: item.quantity
            })),
            {
                onSuccess: () => {
                    setAdjustedItems([]);
                    navigate('/inventory');
                }
            }
        );
    };

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
                    
                    {/* Setup Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-800 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                                <Database size={14} className="text-blue-500"/> المستودع المستهدف
                            </label>
                            {isLoadingWarehouses ? (
                                <div className="animate-pulse h-10 bg-gray-100 dark:bg-slate-800 rounded-lg"></div>
                            ) : (
                                <select
                                    value={selectedWarehouseId}
                                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-lg py-2.5 px-4 text-sm font-bold shadow-inner ring-1 ring-gray-200 dark:ring-slate-700"
                                >
                                    <option value="" disabled>-- اختر المستودع --</option>
                                    {warehouses?.map((w: any) => (
                                        <option key={w.id} value={w.id}>{w.name_ar || w.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="space-y-1.5 opacity-90 relative">
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                                <Search size={14} className="text-blue-500"/> البحث عن الأصناف للتسوية
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="ابحث بالاسم، SKU أو امسح الباركود..."
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    disabled={!selectedWarehouseId}
                                    className="flex-1 bg-gray-50 dark:bg-slate-800 border-none rounded-lg py-2.5 px-4 text-sm font-bold shadow-inner ring-1 ring-gray-200 dark:ring-slate-700"
                                />
                                <button
                                    onClick={() => setIsScannerOpen(true)}
                                    disabled={!selectedWarehouseId}
                                    className="bg-blue-600 disabled:opacity-50 text-white p-2.5 rounded-lg shadow disabled:cursor-not-allowed hover:bg-blue-700 transition"
                                >
                                    <ScanBarcode size={20} />
                                </button>
                            </div>

                            {/* Dropdown of search results - Professional Table Style */}
                            {/* Dropdown of search results - Professional Table Style */}
                            {filter && (searchResults && searchResults.length > 0 || isLoadingSearch) && (
                                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-900 shadow-2xl border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    {searchResults && searchResults.length > 0 && (
                                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                                            <table className="w-full text-right text-xs border-collapse">
                                                <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-20 border-b-2 border-slate-200 dark:border-slate-700 backdrop-blur-sm">
                                                    <tr className="text-slate-900 dark:text-gray-100 font-black">
                                                        <th className="py-3 px-4 border-l border-slate-200 dark:border-slate-800 text-start">اسم القطعة</th>
                                                        <th className="py-3 px-4 border-l border-slate-200 dark:border-slate-800 w-[120px]">رقم القطعة</th>
                                                        <th className="py-3 px-4 border-l border-slate-200 dark:border-slate-800 w-[100px] text-center">الماركة</th>
                                                        <th className="py-3 px-4 border-l border-slate-200 dark:border-slate-800 w-[80px] text-center">المقاس</th>
                                                        <th className="py-3 px-4 border-l border-slate-200 dark:border-slate-800 w-[150px]">الأرقام البديلة</th>
                                                        <th className="py-3 px-4 text-center w-[80px]">المخزون</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {searchResults.map((p: any) => (
                                                        <tr 
                                                            key={p.id}
                                                            onClick={() => handleAddItem(p)}
                                                            className="hover:bg-blue-50 dark:hover:bg-blue-500/10 cursor-pointer transition-colors group bg-white dark:bg-slate-900"
                                                        >
                                                            <td className="py-3 px-4 border-l border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-50 italic-arabic group-hover:text-blue-600 transition-colors text-start">
                                                                {p.name_ar}
                                                            </td>
                                                            <td className="py-3 px-4 border-l border-slate-100 dark:border-slate-800 font-mono text-slate-600 dark:text-slate-400">
                                                                {p.part_number || p.sku}
                                                            </td>
                                                            <td className="py-3 px-4 border-l border-slate-100 dark:border-slate-800 text-center">
                                                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                                    {p.brand || '-'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4 border-l border-slate-100 dark:border-slate-800 text-center font-bold text-blue-500">
                                                                {p.size || '-'}
                                                            </td>
                                                            <td className="py-3 px-4 border-l border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
                                                                {p.alternative_numbers || '-'}
                                                            </td>
                                                            <td className="py-3 px-4 text-center bg-slate-50/30 dark:bg-slate-800/30 font-mono font-black text-emerald-600 dark:text-emerald-500">
                                                                {p.stock_quantity || 0}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {isLoadingSearch && (
                                        <div className="p-6 text-center bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700">
                                            <Loader2 size={24} className="animate-spin inline-block text-blue-500 mb-2" />
                                            <div className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">جاري البحث عن المنتجات...</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Adjusted Items Table - Excel Style Grid */}
                    {adjustedItems.length > 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border-2 border-slate-200 dark:border-slate-800 overflow-hidden max-w-full">
                            <div className="overflow-x-auto custom-scrollbar bg-white dark:bg-slate-950">
                                <table className="w-full text-right text-xs border-collapse min-w-[900px]">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-gray-100 font-black border-b-2 border-slate-200 dark:border-slate-700 italic-arabic">
                                            <th className="py-3 px-4 border-l border-slate-200 dark:border-slate-700 min-w-[200px] text-start">اسم القطعة</th>
                                            <th className="py-3 px-4 border-l border-slate-200 dark:border-slate-700 w-[140px]">رقم القطعة</th>
                                            <th className="py-3 px-4 border-l border-slate-200 dark:border-slate-700 w-[100px]">الماركة</th>
                                            <th className="py-3 px-4 border-l border-slate-200 dark:border-slate-700 w-[150px]">الأرقام البديلة</th>
                                            <th className="py-3 px-4 border-l border-slate-200 dark:border-slate-700 w-[80px] text-center">المقاس</th>
                                            <th className="py-3 px-4 border-l border-slate-200 dark:border-slate-700 text-center w-[100px] bg-slate-100/30 dark:bg-slate-800/20">المخزون الحالي</th>
                                            <th className="py-3 px-4 border-l border-slate-200 dark:border-slate-700 text-center w-[110px] bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 font-black italic">الجرد الفعلي</th>
                                            <th className="py-3 px-4 border-l border-slate-200 dark:border-slate-700 text-center w-[90px]">الفارق</th>
                                            <th className="py-3 px-4 w-12 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {adjustedItems.map(item => {
                                            const difference = item.quantity - item.system_quantity;
                                            return (
                                                <tr key={item.product_id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                                    <td className="py-2 px-3 border-l border-slate-100 dark:border-slate-800 font-bold text-gray-900 dark:text-gray-100 italic-arabic">
                                                        {item.name_ar}
                                                    </td>
                                                    <td className="py-2 px-3 border-l border-slate-100 dark:border-slate-800 font-mono text-gray-600 dark:text-gray-400">
                                                        {item.part_number || item.sku}
                                                    </td>
                                                    <td className="py-2 px-3 border-l border-slate-100 dark:border-slate-800">
                                                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">
                                                            {item.brand || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-3 border-l border-slate-100 dark:border-slate-800 text-[10px] text-gray-500 truncate max-w-[150px]" title={item.alternative_numbers}>
                                                        {item.alternative_numbers || '-'}
                                                    </td>
                                                    <td className="py-2 px-3 border-l border-slate-100 dark:border-slate-800 text-center font-bold">
                                                        {item.size || '-'}
                                                    </td>
                                                    <td className="py-2 px-3 border-l border-slate-100 dark:border-slate-800 text-center font-mono font-bold text-gray-400 bg-gray-50/30 dark:bg-slate-800/20">
                                                        {item.system_quantity}
                                                    </td>
                                                    <td className="py-2 px-3 border-l border-slate-100 dark:border-slate-800 text-center bg-blue-50/20 dark:bg-blue-900/5">
                                                        <input
                                                            type="number"
                                                            value={item.quantity === 0 ? '' : item.quantity}
                                                            onChange={(e) => handleUpdateQuantity(item.product_id, e.target.value)}
                                                            onFocus={(e) => {
                                                                if (item.quantity === 0) e.target.select();
                                                            }}
                                                            className="w-20 bg-white dark:bg-slate-950 border-2 border-blue-100 dark:border-blue-900/50 rounded-md py-1.5 px-1 text-center font-bold font-mono text-blue-600 dark:text-blue-400 focus:border-blue-500 focus:ring-0 transition-colors outline-none"
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                    <td className={`py-2 px-3 border-l border-slate-100 dark:border-slate-800 text-center font-bold font-mono ${
                                                        difference > 0 ? 'text-emerald-500' : 
                                                        difference < 0 ? 'text-rose-500' : 
                                                        'text-gray-300'
                                                    }`}>
                                                        {difference > 0 ? `+${difference}` : difference}
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        <button 
                                                            onClick={() => handleRemoveItem(item.product_id)}
                                                            className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <X size={14} strokeWidth={3} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-800 text-center">
                            <ScanBarcode size={48} className="text-gray-300 dark:text-gray-600 mb-4" strokeWidth={1} />
                            <h3 className="font-bold text-gray-600 dark:text-gray-400">القائمة فارغة</h3>
                            <p className="text-xs text-gray-500 mt-2 max-w-xs">ابدأ بالبحث عن الأصناف أو مسح الباركود بعد تحديد المستودع لإنشاء تسوية سريعة</p>
                        </div>
                    )}

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
