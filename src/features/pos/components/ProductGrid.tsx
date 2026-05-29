
import React, { useMemo } from 'react';
import { Package, Search, Hash, Layers } from 'lucide-react';
import { useProducts, useInventoryCategories } from '../../inventory/hooks/index';
import { formatCurrency, formatNumberDisplay } from '../../../core/utils';
import type { Product } from '../../inventory/types';
import { useSoundStore } from '../../notifications/store';

interface ProductGridProps {
    searchTerm: string;
    onAddToCart: (product: Product) => void;
    inStockOnly?: boolean;
}

const ProductGrid: React.FC<ProductGridProps> = ({ searchTerm, onAddToCart, inStockOnly = false }) => {
    const { products, isLoading: isProductsLoading } = useProducts(searchTerm);
    const { data: categories = [], isLoading: isCategoriesLoading } = useInventoryCategories();
    const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
    const { playNotificationSound } = useSoundStore();
    const isLoading = isProductsLoading || isCategoriesLoading;

    const isSearching = searchTerm.trim().length > 0;

    // Filter by selected category and stock status
    const filteredProducts = useMemo(() => {
        let result = products?.filter(p => selectedCategory ? p.category_id === selectedCategory : true) ?? [];
        if (inStockOnly) {
            result = result.filter(p => p.stock_quantity > 0);
        }
        return result;
    }, [products, selectedCategory, inStockOnly]);

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 gap-2 p-2">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 rounded-xl h-28 animate-pulse shadow-sm border dark:border-slate-800"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="p-2 h-full overflow-y-auto pb-32 custom-scrollbar">
            {/* ── Category Pills ──────────────────────────────── */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide no-scrollbar sticky top-0 bg-gray-50/80 dark:bg-slate-950/80 backdrop-blur-md z-10 px-1 -mx-1 pt-1 border-b dark:border-slate-800/50">
                <button
                    onClick={() => { setSelectedCategory(null); }}
                    className={`px-5 py-2 md:py-2.5 rounded-xl font-black text-xs md:text-sm whitespace-nowrap shadow-sm transition-all active:scale-95 border ${selectedCategory === null ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20 shadow-lg' : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800'}`}
                >
                    الكل
                </button>
                {categories.map((cat: any) => (
                    <button
                        key={cat.id}
                        onClick={() => { setSelectedCategory(cat.id); }}
                        className={`px-5 py-2 md:py-2.5 rounded-xl font-black text-xs md:text-sm whitespace-nowrap shadow-sm transition-all active:scale-95 border ${selectedCategory === cat.id ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20 shadow-lg' : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800'}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* ── Search Context Header ──────────────────────── */}
            {isSearching && (
                <div className="mb-3 px-2 flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full">
                        <Search size={12} />
                        <span className="text-xs font-bold">
                            {filteredProducts.length} نتيجة عن "{searchTerm}"
                        </span>
                    </div>
                    {filteredProducts.length === 0 && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                            جرّب البحث بكلمات مختلفة أو باستخدام الرمز
                        </span>
                    )}
                </div>
            )}

            {/* ── Product Grid ───────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 gap-2">
                {filteredProducts.map((product) => {
                    const hasStock = product.stock_quantity > 0;
                    const isMatchedByAlternative = isSearching &&
                        product.alternative_numbers?.toLowerCase().includes(searchTerm.toLowerCase()) &&
                        !product.name.toLowerCase().includes(searchTerm.toLowerCase());
                    const isLowStock = hasStock && product.stock_quantity <= (product.min_stock_level || 5);

                    return (
                        <button
                            key={product.id}
                            onClick={() => {
                                playNotificationSound();
                                onAddToCart(product);
                            }}
                            className={`
                        relative bg-white dark:bg-slate-900 p-2 rounded-2xl border transition-all active:scale-95 text-right flex flex-col h-48 md:h-52 group
                        ${hasStock
                                    ? 'border-gray-100 dark:border-slate-800 hover:border-blue-500 shadow-sm hover:shadow-md'
                                    : 'border-gray-100 dark:border-slate-800 hover:border-red-500 shadow-sm hover:shadow-md opacity-75'
                                }
                    `}
                        >
                            {/* Image */}
                            <div className="relative w-full h-20 md:h-24 bg-slate-50 dark:bg-slate-800/40 rounded-xl mb-1.5 flex items-center justify-center overflow-hidden border border-slate-100/50 dark:border-slate-700/30 shrink-0">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <Package size={28} strokeWidth={1.5} className="text-slate-300 dark:text-slate-600 transition-transform group-hover:scale-110 duration-300" />
                                )}
                                {/* Stock Badge Overlay */}
                                {isLowStock && hasStock && (
                                    <span className="absolute top-1 right-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                        شحيح
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    {/* Product Name */}
                                    <h3 className="font-bold text-gray-800 dark:text-slate-100 line-clamp-2 text-xs md:text-sm leading-snug mb-1.5">
                                        {product.name}
                                    </h3>

                                    {/* Match badges */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {isMatchedByAlternative && (
                                            <span className="inline-flex items-center gap-0.5 text-[9px] md:text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-full font-bold">
                                                <Hash size={8} />
                                                بديل
                                            </span>
                                        )}
                                        {isSearching && product.part_number && product.part_number !== '---' && (
                                            <span className="inline-flex items-center gap-0.5 text-[9px] md:text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full font-mono">
                                                {product.part_number}
                                            </span>
                                        )}
                                        {isSearching && product.brand && (
                                            <span className="text-[9px] md:text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-bold truncate max-w-[90px]">
                                                {product.brand}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Price + Stock Row */}
                                <div className="mt-2.5 flex justify-between items-end w-full">
                                    <div className="flex flex-col text-right">
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] text-gray-500 dark:text-slate-400 font-black">بيع:</span>
                                            <span dir="ltr" className="font-black text-blue-600 dark:text-blue-400 text-xs md:text-base tracking-tighter">
                                                {formatCurrency(product.sale_price ?? product.selling_price ?? 0)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold">شراء:</span>
                                            <span dir="ltr" className="text-[10px] text-gray-500 dark:text-slate-400 font-mono">
                                                {formatCurrency(product.cost_price ?? 0)}
                                            </span>
                                        </div>
                                    </div>
                                    <span dir="ltr" className={`text-[10px] md:text-xs font-bold uppercase px-2 py-0.5 rounded-lg flex items-center gap-1 ${hasStock
                                        ? isLowStock
                                            ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400'
                                            : 'text-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/20 dark:text-emerald-400'
                                        : 'text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400'
                                        }`}>
                                        <Layers size={11} />
                                        {hasStock ? formatNumberDisplay(product.stock_quantity) : 'نفذ'}
                                    </span>
                                </div>
                            </div>
                        </button>
                    );
                })}

                {/* Empty State */}
                {filteredProducts.length === 0 && !isLoading && (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center gap-3">
                        <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <Package size={42} className="text-slate-300 dark:text-slate-600" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-slate-600 dark:text-slate-300 text-base mb-1">
                                {isSearching ? 'لا توجد منتجات مطابقة' : 'لا توجد منتجات في هذه الفئة'}
                            </h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                {isSearching ? 'جرّب تغيير معايير البحث' : 'اختر فئة أخرى أو امسح البحث'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductGrid;
