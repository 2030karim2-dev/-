
import React from 'react';
import { Package, AlertCircle } from 'lucide-react';
import { useProducts } from '../../inventory/hooks';
import { formatCurrency, formatNumberDisplay } from '../../../core/utils';
import { Product } from '../../inventory/types';

interface ProductGridProps {
    searchTerm: string;
    onAddToCart: (product: Product) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ searchTerm, onAddToCart }) => {
    const { products, isLoading } = useProducts(searchTerm);

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
            <div className="flex gap-1.5 overflow-x-auto pb-3 mb-1.5 scrollbar-hide no-scrollbar">
                <button className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-black text-[9px] whitespace-nowrap shadow-md">الكل</button>
                {['محركات', 'هيكل', 'زيوت', 'كهرباء', 'تكييف'].map(cat => (
                    <button key={cat} className="px-4 py-1.5 bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 border border-gray-100 dark:border-slate-800 hover:bg-gray-50 rounded-lg font-black text-[9px] whitespace-nowrap">{cat}</button>
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {products?.map((product) => {
                    const hasStock = product.stock_quantity > 0;
                    return (
                        <button
                            key={product.id}
                            onClick={() => onAddToCart(product)}
                            disabled={!hasStock}
                            className={`
                        relative bg-white dark:bg-slate-900 p-2 rounded-xl border transition-all active:scale-95 text-right flex flex-col justify-between h-28 md:h-32
                        ${hasStock
                                    ? 'border-gray-100 dark:border-slate-800 hover:border-blue-600'
                                    : 'bg-gray-50 dark:bg-slate-900 opacity-60 cursor-not-allowed'
                                }
                    `}
                        >
                            <div className="flex-1">
                                <h3 className="font-black text-gray-800 dark:text-slate-100 line-clamp-2 text-[10px] md:text-[11px] leading-tight">
                                    {product.name}
                                </h3>
                                {searchTerm && product.alternative_numbers?.toLowerCase().includes(searchTerm.toLowerCase()) && (
                                    <span className="absolute top-2 left-2 text-[8px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold shadow-sm animate-pulse">
                                        بديل
                                    </span>
                                )}
                            </div>

                            <div className="mt-1 flex justify-between items-center w-full">
                                <span dir="ltr" className="font-black text-blue-600 dark:text-blue-400 text-[10px] md:text-xs">
                                    {formatCurrency(product.selling_price)}
                                </span>
                                <span dir="ltr" className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${hasStock ? 'text-gray-400 bg-gray-50 dark:bg-slate-800' : 'text-red-500 bg-red-100'}`}>
                                    {hasStock ? `${formatNumberDisplay(product.stock_quantity)} PC` : 'نفذ'}
                                </span>
                            </div>

                            {!hasStock && (
                                <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
                                    <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm">نفذت</span>
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
