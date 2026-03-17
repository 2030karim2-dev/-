import React, { useState } from 'react';
import { X, Box, FileText, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import { Product } from '../types';
import StockStatusBadge from './product_detail/StockStatusBadge';
import ProductDetailsContent from './product_detail/ProductDetailsContent';
import { cn } from '../../../core/utils';

interface Props {
    product: Product | null;
    onClose: () => void;
    onEdit?: (product: Product) => void;
    onDelete?: (id: string) => void;
}

const ProductDetailModal: React.FC<Props> = ({ product, onClose, onEdit, onDelete }) => {
    const [isMaximized, setIsMaximized] = useState(false);
    
    if (!product) return null;

    return (
        <div 
            onClick={onClose} 
            className={cn(
                "fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 transition-all duration-200 animate-in fade-in",
                !isMaximized && "p-4"
            )}
        >
            <div 
                onClick={e => e.stopPropagation()} 
                className={cn(
                    "bg-white dark:bg-slate-950 flex flex-col border border-slate-200 dark:border-slate-800 shadow-xl animate-in zoom-in-95 duration-200 overflow-hidden",
                    isMaximized 
                        ? "w-full h-full rounded-none" 
                        : "w-full max-w-3xl max-h-[90vh] rounded-lg"
                )}
            >
                {/* Header (Flat Excel Style) */}
                <div className="flex justify-between items-center px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 relative z-20">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 shrink-0 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded flex items-center justify-center">
                            <Box size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-none truncate uppercase tracking-wide">
                                    {product.name}
                                </h2>
                                <div className="scale-90 origin-right">
                                    <StockStatusBadge quantity={product.stock_quantity} minLevel={product.min_stock_level} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                    <span className="opacity-60 uppercase">SKU</span>
                                    <span dir="ltr" className="font-mono text-slate-700 dark:text-slate-300">{product.sku}</span>
                                </span>
                                {product.part_number && (
                                    <>
                                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                        <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                            <span className="opacity-60 uppercase">Part #</span>
                                            <span dir="ltr" className="font-mono text-indigo-600 dark:text-indigo-400">{product.part_number}</span>
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {onEdit && (
                            <button 
                                onClick={() => { onEdit(product); onClose(); }} 
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all active:scale-95"
                                title="تعديل"
                            >
                                <FileText size={14} strokeWidth={2.5} />
                            </button>
                        )}
                        {onDelete && (
                            <button 
                                onClick={() => { if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) { onDelete(product.id); onClose(); } }} 
                                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded border border-transparent hover:border-rose-200 dark:hover:border-rose-800 transition-all active:scale-95"
                                title="حذف"
                            >
                                <Trash2 size={14} strokeWidth={2.5} />
                            </button>
                        )}
                        
                        <span className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-0.5" />
                        
                        <button 
                            type="button" 
                            onClick={() => setIsMaximized(!isMaximized)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded bg-transparent transition-colors"
                            title={isMaximized ? "تصغير" : "تكبير"}
                        >
                            {isMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                        </button>
                        
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded bg-transparent transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-white dark:bg-slate-950">
                    <ProductDetailsContent product={product} />
                </div>
            </div>
        </div>
    );
};

export default ProductDetailModal;
