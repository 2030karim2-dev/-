import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Search, Box } from 'lucide-react';
import { useProducts } from '../../../inventory/hooks/index';
import type { Product } from '../../../inventory/types';
import Modal from '../../../../ui/base/Modal';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: Product) => void;
    initialQuery?: string;
    mode?: 'sale' | 'purchase';
}

const ProductSelectionModal: React.FC<Props> = ({ isOpen, onClose, onSelect, initialQuery = '', mode = 'sale' }) => {
    const [localQuery, setLocalQuery] = useState(initialQuery);
    const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
    const { products, isLoading } = useProducts(submittedQuery);

    // --- Column Resizing Logic ---
    const [colWidths, setColWidths] = useState<Record<string, number>>({
        index: 40,
        name: 250,
        sku: 120,
        brand: 100,
        stock: 60,
        price: 80,
        size: 80,
        specs: 200
    });

    const resizingRef = useRef<{ field: string; startX: number; startWidth: number } | null>(null);

    const onMouseDown = (e: React.MouseEvent, field: string) => {
        resizingRef.current = {
            field,
            startX: e.pageX,
            startWidth: colWidths[field]
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    };

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!resizingRef.current) return;
        const { field, startX, startWidth } = resizingRef.current;
        const delta = e.pageX - startX;
        setColWidths(prev => ({
            ...prev,
            [field]: Math.max(30, startWidth + (document.dir === 'rtl' ? -delta : delta))
        }));
    }, []);

    const onMouseUp = useCallback(() => {
        resizingRef.current = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);

    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
    }, [onMouseMove, onMouseUp]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            setSubmittedQuery(localQuery);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            icon={Box}
            size="full" // Changed to full as requested for heavy tables
            title="مستكشف الأصناف المتقدم"
            description="ابحث واختر المنتج لإنزاله في الفاتورة"
            footer={<button onClick={onClose} className="w-full py-2 text-[10px] font-bold bg-gray-100 dark:bg-slate-800 uppercase">إغلاق</button>}
        >
            <div className="flex flex-col h-[70vh] bg-white dark:bg-slate-900">
                <div className="p-2 border-b dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            autoFocus
                            type="text"
                            value={localQuery}
                            onChange={(e) => { setLocalQuery(e.target.value); }}
                            onKeyDown={handleKeyDown}
                            placeholder="ابحث بالاسم، رقم الصنف... (اضغط Enter للبحث)"
                            className="w-full pr-10 pl-4 py-2.5 bg-gray-50 dark:bg-slate-800 border-2 border-blue-500/20 focus:border-blue-500 outline-none rounded-none text-sm font-bold"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full border-collapse border-spacing-0 table-fixed min-w-max">
                        <thead className="bg-gray-100 dark:bg-slate-800 sticky top-0 z-20 shadow-sm">
                            <tr className="text-[9px] font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-tighter text-right">
                                <th style={{ width: colWidths.index }} className="relative border border-gray-200 dark:border-slate-700 p-2 text-center">ت</th>
                                <th style={{ width: colWidths.name }} className="relative border border-gray-200 dark:border-slate-700 p-2 pr-4">
                                    اسم المنتج
                                    <div onMouseDown={(e) => { onMouseDown(e, 'name'); }} className="absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500/50 transition-colors z-30"></div>
                                </th>
                                <th style={{ width: colWidths.sku }} className="relative border border-gray-200 dark:border-slate-700 p-2 pr-4">
                                    رقم الصنف
                                    <div onMouseDown={(e) => { onMouseDown(e, 'sku'); }} className="absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500/50 transition-colors z-30"></div>
                                </th>
                                <th style={{ width: colWidths.brand }} className="relative border border-gray-200 dark:border-slate-700 p-2 pr-4">
                                    الشركة
                                    <div onMouseDown={(e) => { onMouseDown(e, 'brand'); }} className="absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500/50 transition-colors z-30"></div>
                                </th>
                                <th style={{ width: colWidths.stock }} className="relative border border-gray-200 dark:border-slate-700 p-2 text-center">
                                    كمية
                                    <div onMouseDown={(e) => { onMouseDown(e, 'stock'); }} className="absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500/50 transition-colors z-30"></div>
                                </th>
                                <th style={{ width: colWidths.price }} className="relative border border-gray-200 dark:border-slate-700 p-2 text-left">
                                    {mode === 'sale' ? 'البيع' : 'التكلفة'}
                                    <div onMouseDown={(e) => { onMouseDown(e, 'price'); }} className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500/50 transition-colors z-30"></div>
                                </th>
                                <th style={{ width: colWidths.size }} className="relative border border-gray-200 dark:border-slate-700 p-2 pr-4">
                                    المقاس
                                    <div onMouseDown={(e) => { onMouseDown(e, 'size'); }} className="absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500/50 transition-colors z-30"></div>
                                </th>
                                <th style={{ width: colWidths.specs }} className="relative border border-gray-200 dark:border-slate-700 p-2 pr-4">
                                    المواصفات
                                    <div onMouseDown={(e) => { onMouseDown(e, 'specs'); }} className="absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500/50 transition-colors z-30"></div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-slate-800">
                            {isLoading ? (
                                <tr><td colSpan={8} className="p-10 text-center animate-pulse text-[10px] font-bold text-gray-400">جاري مسح قاعدة البيانات...</td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan={8} className="p-10 text-center text-gray-300">لا توجد نتائج مطابقة</td></tr>
                            ) : (
                                products.map((p, idx) => (
                                    <tr
                                        key={p.id}
                                        onClick={() => { onSelect(p); }}
                                        onKeyDown={(e) => e.key === 'Enter' && onSelect(p)}
                                        tabIndex={0}
                                        className="hover:bg-blue-600 hover:text-white cursor-pointer group transition-colors focus:bg-blue-600 focus:text-white outline-none"
                                    >
                                        <td className="border border-gray-100 dark:border-slate-800 p-1.5 text-center text-[10px] font-mono opacity-50">{idx + 1}</td>
                                        <td className="border border-gray-100 dark:border-slate-800 p-1.5 text-[11px] font-bold truncate">{p.name}</td>
                                        <td className="border border-gray-100 dark:border-slate-800 p-1.5 text-[10px] font-mono group-hover:text-blue-100 truncate">{p.sku}</td>
                                        <td className="border border-gray-100 dark:border-slate-800 p-1.5 text-[10px] font-bold opacity-60 truncate">{p.brand}</td>
                                        <td className="border border-gray-100 dark:border-slate-800 p-1.5 text-center text-[11px] font-black font-mono">{p.stock_quantity}</td>
                                        <td className="border border-gray-100 dark:border-slate-800 p-1.5 text-left text-[11px] font-black font-mono text-emerald-600 group-hover:text-white">
                                            {mode === 'sale' ? p.selling_price || p.sale_price : p.cost_price}
                                        </td>
                                        <td className="border border-gray-100 dark:border-slate-800 p-1.5 text-[10px] opacity-70 truncate">{p.size || '---'}</td>
                                        <td className="border border-gray-100 dark:border-slate-800 p-1.5 text-[10px] opacity-70 truncate" title={p.specifications || ''}>
                                            {p.specifications || '---'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Modal>
    );
};

export default ProductSelectionModal;