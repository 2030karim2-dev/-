// ============================================
// AuditSearchPanel — بحث الأصناف لجلسة الجرد السريع
// يحتوي: اختيار المستودع + حقل البحث + نتائج البحث كـ dropdown
// ============================================
import React from 'react';
import { Database, Search, Loader2, ScanBarcode } from 'lucide-react';

interface Warehouse {
    id: string;
    name_ar?: string;
    name?: string;
}

export interface SearchResult {
    id: string;
    name_ar?: string;
    sku: string;
    part_number?: string;
    brand?: string;
    alternative_numbers?: string;
    size?: string;
    stock_quantity?: number;
    warehouse_distribution?: { warehouse_id: string; quantity: number }[];
}

interface Props {
    warehouses: Warehouse[];
    isLoadingWarehouses: boolean;
    selectedWarehouseId: string;
    onWarehouseChange: (id: string) => void;
    filter: string;
    onFilterChange: (value: string) => void;
    onScannerOpen: () => void;
    searchResults: SearchResult[] | undefined;
    isLoadingSearch: boolean;
    onAddItem: (product: SearchResult) => void;
}

const AuditSearchPanel: React.FC<Props> = ({
    warehouses, isLoadingWarehouses, selectedWarehouseId, onWarehouseChange,
    filter, onFilterChange, onScannerOpen, searchResults, isLoadingSearch, onAddItem,
}) => (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-800 space-y-4">
        {/* Warehouse Selector */}
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                <Database size={14} className="text-blue-500" /> المستودع المستهدف
            </label>
            {isLoadingWarehouses ? (
                <div className="animate-pulse h-10 bg-gray-100 dark:bg-slate-800 rounded-lg" />
            ) : (
                <select
                    value={selectedWarehouseId}
                    onChange={(e) => onWarehouseChange(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-lg py-2.5 px-4 text-sm font-bold shadow-inner ring-1 ring-gray-200 dark:ring-slate-700"
                >
                    <option value="" disabled>-- اختر المستودع --</option>
                    {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>{w.name_ar || w.name}</option>
                    ))}
                </select>
            )}
        </div>

        {/* Search Field + Scanner Button */}
        <div className="space-y-1.5 opacity-90 relative">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                <Search size={14} className="text-blue-500" /> البحث عن الأصناف للتسوية
            </label>
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="ابحث بالاسم، SKU أو امسح الباركود..."
                    value={filter}
                    onChange={(e) => onFilterChange(e.target.value)}
                    disabled={!selectedWarehouseId}
                    className="flex-1 bg-gray-50 dark:bg-slate-800 border-none rounded-lg py-2.5 px-4 text-sm font-bold shadow-inner ring-1 ring-gray-200 dark:ring-slate-700"
                />
                <button
                    onClick={onScannerOpen}
                    disabled={!selectedWarehouseId}
                    className="bg-blue-600 disabled:opacity-50 text-white p-2.5 rounded-lg shadow disabled:cursor-not-allowed hover:bg-blue-700 transition"
                >
                    <ScanBarcode size={20} />
                </button>
            </div>

            {/* Search Results Dropdown */}
            {filter && (searchResults && searchResults.length > 0 || isLoadingSearch) && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-900 shadow-2xl border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {searchResults && searchResults.length > 0 && (
                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
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
                                    {searchResults.map((p) => (
                                        <tr
                                            key={p.id}
                                            onClick={() => onAddItem(p)}
                                            className="hover:bg-blue-50 dark:hover:bg-blue-500/10 cursor-pointer transition-colors group bg-white dark:bg-slate-900"
                                        >
                                            <td className="py-3 px-4 border-l border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-50 group-hover:text-blue-600 transition-colors text-start">{p.name_ar}</td>
                                            <td className="py-3 px-4 border-l border-slate-100 dark:border-slate-800 font-mono text-slate-600 dark:text-slate-400">{p.part_number || p.sku}</td>
                                            <td className="py-3 px-4 border-l border-slate-100 dark:border-slate-800 text-center">
                                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{p.brand || '-'}</span>
                                            </td>
                                            <td className="py-3 px-4 border-l border-slate-100 dark:border-slate-800 text-center font-bold text-blue-500">{p.size || '-'}</td>
                                            <td className="py-3 px-4 border-l border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">{p.alternative_numbers || '-'}</td>
                                            <td className="py-3 px-4 text-center bg-slate-50/30 dark:bg-slate-800/30 font-mono font-black text-emerald-600 dark:text-emerald-500">{p.stock_quantity || 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {isLoadingSearch && (
                        <div className="p-6 text-center bg-slate-50/50 dark:bg-slate-800/50">
                            <Loader2 size={24} className="animate-spin inline-block text-blue-500 mb-2" />
                            <div className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">جاري البحث عن المنتجات...</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
);

export default AuditSearchPanel;
