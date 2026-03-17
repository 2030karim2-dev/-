import React from 'react';
import { Search, X, Box } from 'lucide-react';
import { cn } from '../../../../core/utils';

interface AuditProductPickerProps {
    selectedProduct: any;
    setSelectedProduct: (p: any) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    isDropdownOpen: boolean;
    setIsDropdownOpen: (open: boolean) => void;
    isProductsLoading: boolean;
    products: any[];
    isMaximized: boolean;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    dropdownRef: React.RefObject<HTMLDivElement | null>;
}

const AuditProductPicker: React.FC<AuditProductPickerProps> = ({
    selectedProduct,
    setSelectedProduct,
    searchQuery,
    setSearchQuery,
    isDropdownOpen,
    setIsDropdownOpen,
    isProductsLoading,
    products,
    isMaximized,
    handleKeyDown,
    dropdownRef
}) => {
    return (
        <div className={cn("relative p-2", isMaximized && "mt-10 max-w-4xl mx-auto w-full")} ref={dropdownRef}>
            <div className={cn(
                "bg-white dark:bg-slate-900 rounded-3xl border transition-all duration-300 flex items-center gap-3 px-4 py-3 shadow-sm",
                isDropdownOpen ? "border-blue-500 ring-4 ring-blue-500/10 shadow-lg" : "border-gray-100 dark:border-slate-800"
            )}>
                <div className="p-2 bg-blue-600/10 text-blue-600 rounded-2xl">
                    <Search size={20} />
                </div>

                {selectedProduct ? (
                    <div className="flex-1 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{selectedProduct.name}</span>
                            <span className="text-[10px] bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg font-mono text-gray-500">{selectedProduct.sku}</span>
                        </div>
                        <button
                            onClick={() => setSelectedProduct(null)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-gray-400 hover:text-rose-500 rounded-xl transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <input
                        type="text"
                        placeholder="ابحث عن صنف بالاسم أو الكود... (اضغط Enter للبحث)"
                        value={searchQuery}
                        onKeyDown={handleKeyDown}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-sm font-bold placeholder:text-gray-400 dark:text-white"
                    />
                )}
            </div>

            {isDropdownOpen && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2rem] shadow-2xl z-[100] overflow-hidden animate-in zoom-in-95 duration-200 backdrop-blur-xl">
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {isProductsLoading ? (
                            <div className="p-8 text-center space-y-2">
                                <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
                                <p className="text-[10px] font-bold text-gray-400">جاري البحث عن الأصناف...</p>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <Box size={32} className="mx-auto mb-2 opacity-20" />
                                <p className="text-xs font-bold">لا توجد نتائج مطابقة</p>
                            </div>
                        ) : (
                            <div className="p-2 grid grid-cols-1 gap-1">
                                {products.map((p: any) => (
                                    <button
                                        key={p.id}
                                        onClick={() => {
                                            setSelectedProduct(p);
                                            setIsDropdownOpen(false);
                                        }}
                                        className="flex items-center justify-between p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl transition-all group text-right"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <Box size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800 dark:text-slate-200">{p.name}</p>
                                                <p className="text-[10px] text-gray-400 font-mono mt-0.5">{p.sku}</p>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-bold text-emerald-600">{p.stock_quantity ?? 0} في المخزن</p>
                                            <p className="text-[9px] text-gray-400 font-bold">{p.brand || 'ماركة غير محددة'}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditProductPicker;
