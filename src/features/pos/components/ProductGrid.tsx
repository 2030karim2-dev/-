
import React from 'react';
import { Package } from 'lucide-react';
import { useProducts, useInventoryCategories } from '../../inventory/hooks/index';
import { formatCurrency, formatNumberDisplay } from '../../../core/utils';
import { Product } from '../../inventory/types';
import { useSoundStore } from '../../notifications/store';

interface ProductGridProps {
    searchTerm: string;
    onAddToCart: (product: Product) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ searchTerm, onAddToCart }) => {
    const { products, isLoading: isProductsLoading } = useProducts(searchTerm);
    const { data: categories = [], isLoading: isCategoriesLoading } = useInventoryCategories();
    const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
    const { playNotificationSound } = useSoundStore();
    const isLoading = isProductsLoading || isCategoriesLoading;

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 p-2">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 rounded-xl h-28 animate-pulse shadow-sm border dark:border-slate-800"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="p-2 h-full overflow-y-auto pb-32 custom-scrollbar">
            <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide no-scrollbar sticky top-0 bg-gray-50/80 dark:bg-slate-950/80 backdrop-blur-md z-10 px-1 -mx-1 pt-1">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-6 py-2.5 rounded-xl font-black text-[11px] whitespace-nowrap shadow-sm transition-all active:scale-95 border ${selectedCategory === null ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20 shadow-lg' : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800'}`}
                >
                    الكل
                </button>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-6 py-2.5 rounded-xl font-black text-[11px] whitespace-nowrap shadow-sm transition-all active:scale-95 border ${selectedCategory === cat.id ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20 shadow-lg' : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800'}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {products?.filter(p => selectedCategory ? p.category_id === selectedCategory : true).map((product) => {
                    const hasStock = product.stock_quantity > 0;
                    return (
                        <button
                            key={product.id}
                            onClick={() => {
                                playNotificationSound();
                                onAddToCart(product);
                            }}
                            disabled={!hasStock}
                            className={`
                        relative bg-white dark:bg-slate-900 p-1.5 md:p-2 rounded-xl border transition-all active:scale-95 text-right flex flex-col h-56 md:h-64
                        ${hasStock
                                    ? 'border-gray-100 dark:border-slate-800 hover:border-blue-600 shadow-sm hover:shadow-md'
                                    : 'bg-gray-50 dark:bg-slate-900 opacity-60 cursor-not-allowed'
                                }
                    `}
                        >
                            <div className="w-full h-24 md:h-32 bg-slate-50 dark:bg-slate-800/50 rounded-lg mb-2 flex items-center justify-center overflow-hidden border border-slate-100/50 dark:border-slate-700/30 shrink-0">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <Package size={32} strokeWidth={1.5} className="text-slate-300 dark:text-slate-600" />
                                )}
                            </div>

                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-slate-100 line-clamp-2 text-[10px] md:text-xs leading-tight mb-1">
                                        {product.name}
                                    </h3>
                                    {searchTerm && product.alternative_numbers?.toLowerCase().includes(searchTerm.toLowerCase()) && (
                                        <span className="inline-block text-[8px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold shadow-sm animate-pulse mb-1">
                                            بديل
                                        </span>
                                    )}
                                </div>

                                <div className="mt-2 flex justify-between items-end w-full">
                                    <span dir="ltr" className="font-black text-blue-600 dark:text-blue-400 text-xs md:text-sm tracking-tighter">
                                        {formatCurrency(product.sale_price ?? product.selling_price ?? 0)}
                                    </span>
                                    <span dir="ltr" className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${hasStock ? 'text-gray-500 bg-gray-100 dark:bg-slate-800 dark:text-slate-400' : 'text-red-500 bg-red-100'}`}>
                                        {hasStock ? `${formatNumberDisplay(product.stock_quantity)} PC` : 'نفذ'}
                                    </span>
                                </div>
                            </div>

                            {!hasStock && (
                                <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[1px] rounded-xl flex items-center justify-center z-10">
                                    <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">نفذت الكمية</span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ProductGrid;
