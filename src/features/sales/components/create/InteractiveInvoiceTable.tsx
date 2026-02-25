
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSalesStore, InvoiceItem } from '../../store';
import { useTaxDiscountStore } from '../../../settings/taxDiscountStore';
import { Product } from '../../../inventory/types';
import { Plus, Settings } from 'lucide-react';
import { cn } from '../../../../core/utils';
import ProductSelectionModal from './ProductSelectionModal';
import InvoiceRow from './InvoiceRow';

const InteractiveInvoiceTable: React.FC = () => {
  const {
    items, addItem, updateItem, setProductForRow, removeItem,
    showTax, showDiscount, toggleColumn
  } = useSalesStore();

  const tableRef = useRef<HTMLTableElement>(null);
  const [modalState, setModalState] = useState<{ isOpen: boolean; rowIndex: number; query: string }>({
    isOpen: false, rowIndex: 0, query: ''
  });

  const handleOpenSearch = useCallback((index: number, query: string = '') => {
    setModalState({ isOpen: true, rowIndex: index, query });
  }, []);

  const handleProductSelect = (product: Product) => {
    setProductForRow(modalState.rowIndex, product);
    setModalState(prev => ({ ...prev, isOpen: false }));

    // Auto-focus quantity after selection
    setTimeout(() => {
      const nextCell = tableRef.current?.querySelector(`[data-row-index="${modalState.rowIndex}"][data-col-field="quantity"]`) as HTMLInputElement;
      nextCell?.focus();
      nextCell?.select();
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, field: keyof InvoiceItem) => {
    if (!tableRef.current) return;

    if (field === 'name' && (e.key === 'Enter' || (e.key.length === 1 && !e.ctrlKey && !e.metaKey))) {
      e.preventDefault();
      handleOpenSearch(rowIndex, e.key.length === 1 ? e.key : '');
      return;
    }

    const navigationFields: (keyof InvoiceItem)[] = ['name', 'quantity', 'price'];
    if (showDiscount) navigationFields.push('discount');

    const colIndex = navigationFields.indexOf(field);

    const moveFocus = (row: number, colField: keyof InvoiceItem) => {
      const nextCell = tableRef.current?.querySelector(`[data-row-index="${row}"][data-col-field="${colField}"]`) as HTMLInputElement;
      nextCell?.focus();
      if (nextCell) nextCell.select();
    };

    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); moveFocus(Math.max(0, rowIndex - 1), field); break;
      case 'ArrowDown': e.preventDefault(); moveFocus(Math.min(items.length - 1, rowIndex + 1), field); break;
      case 'Enter':
        e.preventDefault();
        if (rowIndex === items.length - 1 && field === navigationFields[navigationFields.length - 1]) {
          addItem();
          setTimeout(() => moveFocus(rowIndex + 1, 'name'), 50);
        } else {
          moveFocus(rowIndex + 1, field);
        }
        break;
      case 'Tab':
        e.preventDefault();
        const nextColIndex = e.shiftKey ? colIndex - 1 : colIndex + 1;
        if (nextColIndex >= 0 && nextColIndex < navigationFields.length) {
          moveFocus(rowIndex, navigationFields[nextColIndex]);
        } else if (!e.shiftKey && rowIndex === items.length - 1) {
          addItem();
          setTimeout(() => moveFocus(rowIndex + 1, 'name'), 50);
        } else if (!e.shiftKey) {
          moveFocus(rowIndex + 1, navigationFields[0]);
        } else if (e.shiftKey && rowIndex > 0) {
          moveFocus(rowIndex - 1, navigationFields[navigationFields.length - 1]);
        }
        break;
      default: return;
    }
  };

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-1 flex justify-between items-center bg-gray-50 dark:bg-slate-950 border-y dark:border-slate-800">
        <div className="flex items-center gap-2 px-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">محتويات الفاتورة</span>
        </div>
        <div className="flex gap-1.5">
          <div className="flex bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg border dark:border-slate-800">
            {useTaxDiscountStore.getState().discountEnabled && (
              <button onClick={() => toggleColumn('showDiscount')} className={cn("px-4 py-1 text-[9px] font-black uppercase transition-all rounded-md", showDiscount ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-gray-400")}>خصم</button>
            )}
            {useTaxDiscountStore.getState().taxEnabled && (
              <button onClick={() => toggleColumn('showTax')} className={cn("px-4 py-1 text-[9px] font-black uppercase transition-all rounded-md", showTax ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-gray-400")}>ضريبة</button>
            )}
          </div>
          <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors"><Settings size={14} /></button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="overflow-x-auto custom-scrollbar">
        <table ref={tableRef} className="w-full border-collapse table-fixed min-w-[900px]">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-slate-800/20 text-[9px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest text-right">
              <th className="p-2 w-10 text-center border-b border-l dark:border-slate-800">#</th>
              <th className="p-2 border-b border-l dark:border-slate-800">وصف الصنف</th>
              <th className="p-2 text-center w-24 border-b border-l dark:border-slate-800">الكمية</th>
              <th className="p-2 text-center w-28 border-b border-l dark:border-slate-800">سعر الوحدة</th>
              {showDiscount && <th className="p-2 text-center w-24 border-b border-l dark:border-slate-800">الخصم</th>}
              {showTax && <th className="p-2 text-center w-24 border-b border-l dark:border-slate-800">الضريبة %</th>}
              <th className="p-2 text-left w-32 border-b dark:border-slate-800">الإجمالي</th>
              <th className="p-2 w-10 text-center border-b dark:border-slate-800"></th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800">
            {items.map((item, index) => (
              <InvoiceRow
                key={item.id}
                item={item}
                index={index}
                showDiscount={showDiscount}
                showTax={showTax}
                onUpdate={updateItem}
                onRemove={removeItem}
                onKeyDown={handleKeyDown}
                onOpenSearch={handleOpenSearch}
              />
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={addItem} className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-t dark:border-slate-800">
        <Plus size={14} strokeWidth={3} /> إضافة سطر
      </button>

      <ProductSelectionModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        onSelect={handleProductSelect}
        initialQuery={modalState.query}
      />
    </div>
  );
};

export default InteractiveInvoiceTable;
