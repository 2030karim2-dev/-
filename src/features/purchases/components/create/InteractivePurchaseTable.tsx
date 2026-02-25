
import React, { useEffect, useRef, useState } from 'react';
import { usePurchaseStore, PurchaseInvoiceItem } from '../../store';
import { useTaxDiscountStore } from '../../settings/taxDiscountStore';
import { Product } from '../../../inventory/types';
import { Plus, Trash2, Settings, Search, FileCode, Award } from 'lucide-react';
import { cn } from '../../../../core/utils';
import ProductSelectionModal from '../../../sales/components/create/ProductSelectionModal';

const InteractivePurchaseTable: React.FC = () => {
    const {
        items, initializeItems, addItem, updateItem, setProductForRow, removeItem,
        showTax, showDiscount, toggleColumn
    } = usePurchaseStore();

    const tableRef = useRef<HTMLTableElement>(null);
    const [modalState, setModalState] = useState<{ isOpen: boolean; rowIndex: number; query: string }>({
        isOpen: false, rowIndex: 0, query: ''
    });

    useEffect(() => {
        // Only initialize with empty rows if the items array is completely empty
        if (items.length === 0) {
            initializeItems(6);
        }
    }, [initializeItems, items.length]);

    const handleOpenSearch = (index: number, query: string = '') => {
        setModalState({ isOpen: true, rowIndex: index, query });
    };

    const handleProductSelect = (product: Product) => {
        setProductForRow(modalState.rowIndex, product);
        setModalState({ ...modalState, isOpen: false });

        // Auto-focus quantity after selection
        setTimeout(() => {
            const nextCell = tableRef.current?.querySelector(`[data-row-index="${modalState.rowIndex}"][data-col-field="quantity"]`) as HTMLInputElement;
            nextCell?.focus();
            if (nextCell) nextCell.select();
        }, 50);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, field: keyof PurchaseInvoiceItem) => {
        if (!tableRef.current) return;

        // Auto-open search on typing in name cell
        if (field === 'name' && (e.key === 'Enter' || (e.key.length === 1 && !e.ctrlKey && !e.metaKey))) {
            e.preventDefault();
            handleOpenSearch(rowIndex, e.key.length === 1 ? e.key : '');
            return;
        }

        const fieldsOrder: (keyof PurchaseInvoiceItem)[] = ['name', 'quantity', 'costPrice'];
        if (showDiscount) fieldsOrder.push('discount');

        const colIndex = fieldsOrder.indexOf(field);

        const moveFocus = (row: number, colField: keyof PurchaseInvoiceItem) => {
            const nextCell = tableRef.current?.querySelector(`[data-row-index="${row}"][data-col-field="${colField}"]`) as HTMLInputElement;
            nextCell?.focus();
            if (nextCell instanceof HTMLInputElement) nextCell.select();
        };

        switch (e.key) {
            case 'ArrowUp': e.preventDefault(); moveFocus(Math.max(0, rowIndex - 1), field); break;
            case 'ArrowDown': e.preventDefault(); moveFocus(Math.min(items.length - 1, rowIndex + 1), field); break;
            case 'Enter':
                e.preventDefault();
                if (rowIndex === items.length - 1 && field === 'costPrice') {
                    addItem();
                    setTimeout(() => moveFocus(rowIndex + 1, 'name'), 50);
                } else {
                    moveFocus(rowIndex + 1, field);
                }
                break;
            case 'Tab':
                e.preventDefault();
                const nextColIndex = e.shiftKey ? colIndex - 1 : colIndex + 1;
                if (nextColIndex >= 0 && nextColIndex < fieldsOrder.length) {
                    moveFocus(rowIndex, fieldsOrder[nextColIndex]);
                } else if (!e.shiftKey && rowIndex === items.length - 1) {
                    addItem();
                    setTimeout(() => moveFocus(rowIndex + 1, fieldsOrder[0]), 50);
                } else if (!e.shiftKey) {
                    moveFocus(rowIndex + 1, fieldsOrder[0]);
                } else if (e.shiftKey && rowIndex > 0) {
                    moveFocus(rowIndex - 1, fieldsOrder[fieldsOrder.length - 1]);
                }
                break;
            default: return;
        }
    };

    return (
        <div className="flex flex-col border-y-2 border-blue-600 bg-white dark:bg-slate-900 overflow-hidden">
            {/* Table Toolbar */}
            <div className="p-1.5 flex justify-end gap-2 bg-blue-600 dark:bg-slate-950 border-b dark:border-slate-800">
                <div className="flex bg-white/10 p-0.5 rounded-none border border-white/20">
                    {useTaxDiscountStore.getState().discountEnabled && (
                        <button onClick={() => toggleColumn('showDiscount')}
                            className={cn("px-3 py-1 text-[9px] font-black uppercase transition-all", showDiscount ? "bg-white text-blue-600" : "text-blue-100")}>إظهار الخصم</button>
                    )}
                    {useTaxDiscountStore.getState().taxEnabled && (
                        <button onClick={() => toggleColumn('showTax')}
                            className={cn("px-3 py-1 text-[9px] font-black uppercase transition-all border-r border-white/20", showTax ? "bg-white text-blue-600" : "text-blue-100")}>إظهار الضريبة</button>
                    )}
                </div>
                <div className="p-1.5 text-white/50"><Settings size={14} /></div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table ref={tableRef} className="w-full border-collapse table-fixed min-w-[1000px]">
                    <thead>
                        <tr className="bg-blue-600 text-[9px] font-black text-white uppercase tracking-widest text-right">
                            <th className="p-2 w-10 text-center border-l border-white/10">#</th>
                            <th className="p-2 border-l border-white/10">وصف الصنف المورد</th>
                            <th className="p-2 text-center w-32 border-l border-white/10">رقم القطعة</th>
                            <th className="p-2 text-center w-28 border-l border-white/10">الشركة الصانعة</th>
                            <th className="p-2 text-center w-16 border-l border-white/10">الكمية</th>
                            <th className="p-2 text-center w-24 border-l border-white/10">سعر التكلفة</th>
                            {showDiscount && <th className="p-2 text-center w-20 border-l border-white/10">الخصم</th>}
                            {showTax && <th className="p-2 text-center w-20 border-l border-white/10">الضريبة%</th>}
                            <th className="p-2 text-left w-24">الإجمالي</th>
                            <th className="p-2 w-8 text-center bg-blue-700"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                        {items.map((item, index) => (
                            <tr key={item.id} className="group hover:bg-blue-50 dark:hover:bg-blue-900/5 transition-colors">
                                <td className="p-2 text-center text-[10px] font-mono font-black text-blue-300 border-l dark:border-slate-800">{index + 1}</td>
                                <td className="p-0 border-l dark:border-slate-800">
                                    <div className="flex items-center px-2">
                                        <input
                                            type="text"
                                            value={item.name}
                                            data-row-index={index}
                                            data-col-field="name"
                                            onKeyDown={(e) => handleKeyDown(e, index, 'name')}
                                            onClick={() => handleOpenSearch(index, (item.name || ''))}
                                            readOnly
                                            className="flex-1 p-2 bg-transparent outline-none text-right font-black text-[11px] text-blue-900 dark:text-slate-100 cursor-pointer placeholder:text-blue-200"
                                            placeholder="اختر صنفاً..."
                                        />
                                        <Search size={12} className="text-blue-300 opacity-0 group-hover:opacity-100" />
                                    </div>
                                </td>
                                <td className="p-2 border-l dark:border-slate-800 text-center text-[10px] font-mono font-bold text-gray-500">
                                    {item.partNumber || '---'}
                                </td>
                                <td className="p-2 border-l dark:border-slate-800 text-center text-[10px] font-bold text-blue-600">
                                    {item.brand || '---'}
                                </td>
                                <td className="p-0 border-l dark:border-slate-800">
                                    <input type="number" value={item.quantity || ''} onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                        onKeyDown={(e) => handleKeyDown(e, index, 'quantity')} data-row-index={index} data-col-field="quantity"
                                        className="w-full h-full p-2 bg-transparent outline-none text-center font-mono font-black text-[11px] focus:bg-blue-50 dark:focus:bg-slate-800" placeholder="0" />
                                </td>
                                <td className="p-0 border-l dark:border-slate-800">
                                    <input type="number" value={item.costPrice || ''} onChange={(e) => updateItem(index, 'costPrice', parseFloat(e.target.value) || 0)}
                                        onKeyDown={(e) => handleKeyDown(e, index, 'costPrice')} data-row-index={index} data-col-field="costPrice"
                                        className="w-full h-full p-2 bg-transparent outline-none text-center font-mono font-black text-[11px] text-rose-600 focus:bg-rose-50 dark:focus:bg-slate-800" placeholder="0.00" />
                                </td>
                                {showDiscount && (
                                    <td className="p-0 border-l dark:border-slate-800">
                                        <input type="number" value={item.discount || ''} onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                                            onKeyDown={(e) => handleKeyDown(e, index, 'discount')} data-row-index={index} data-col-field="discount"
                                            className="w-full h-full p-2 bg-transparent outline-none text-center font-mono font-black text-[11px] focus:bg-amber-50 dark:focus:bg-slate-800" />
                                    </td>
                                )}
                                {showTax && (
                                    <td className="p-0 border-l dark:border-slate-800">
                                        <input type="number" value={item.tax || ''} onChange={(e) => updateItem(index, 'tax', parseFloat(e.target.value) || 0)}
                                            className="w-full h-full p-2 bg-transparent outline-none text-center font-mono font-black text-[11px] text-indigo-600 focus:bg-indigo-50 dark:focus:bg-slate-800" />
                                    </td>
                                )}
                                <td dir="ltr" className="p-2 text-left font-mono font-black text-[11px] text-blue-900 dark:text-white bg-blue-50/50 dark:bg-slate-950/30">
                                    {((Number(item.quantity) * Number(item.costPrice)) - (showDiscount ? Number(item.discount || 0) : 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="p-0 bg-blue-50/30">
                                    <button onClick={() => removeItem(index)} className="w-full h-full flex items-center justify-center text-rose-300 hover:text-rose-600 transition-colors">
                                        <Trash2 size={12} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex bg-blue-600 border-t-2 border-blue-700">
                <button onClick={addItem} className="flex-1 py-2.5 text-[10px] font-black text-white hover:bg-blue-700 transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95">
                    <Plus size={14} strokeWidth={4} /> إضافة سطر جديد (New Purchase Row)
                </button>
            </div>

            <ProductSelectionModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ ...modalState, isOpen: false })}
                onSelect={handleProductSelect}
                initialQuery={modalState.query}
            />
        </div>
    );
};

export default InteractivePurchaseTable;
