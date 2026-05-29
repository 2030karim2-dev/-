// ============================================
// InteractivePurchaseTable — جدول أصناف فاتورة الشراء
// تم الاستفادة من useColumnResize المشتركة لإزالة الكود المكرر
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { usePurchaseStore, type PurchaseInvoiceItem } from '../../store';
import { useDiscountStore } from '../../../settings/taxDiscountStore';
import type { Product } from '../../../inventory/types';
import { Plus, Trash2, Settings, Search } from 'lucide-react';
import { cn } from '../../../../core/utils';
import ProductSelectionModal from '../../../sales/components/create/ProductSelectionModal';
import { useColumnResize } from '../../../../ui/common/hooks/useColumnResize';

const PURCHASE_DEFAULT_WIDTHS = {
  index: 40,
  name: 350,
  partNumber: 130,
  brand: 110,
  quantity: 70,
  costPrice: 90,
  discount: 80,
  total: 120,
};

const InteractivePurchaseTable: React.FC = () => {
  const {
    items,
    initializeItems,
    addItem,
    updateItem,
    setProductForRow,
    removeItem,
    showDiscount,
    toggleColumn,
  } = usePurchaseStore();

  const tableRef = useRef<HTMLTableElement>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    rowIndex: number;
    query: string;
  }>({
    isOpen: false,
    rowIndex: 0,
    query: '',
  });

  // ── Column Resize (مشتركة) ──────────────────────────────────
  const { colWidths, onResizeMouseDown } = useColumnResize({
    storageKey: 'purchase_col_widths',
    defaultWidths: PURCHASE_DEFAULT_WIDTHS,
  });

  // ── Init rows ───────────────────────────────────────────────
  useEffect(() => {
    if (items.length === 0) initializeItems(6);
  }, [initializeItems, items.length]);

  // ── Handlers ───────────────────────────────────────────────
  const handleOpenSearch = (index: number, query = '') => {
    setModalState({ isOpen: true, rowIndex: index, query });
  };

  const handleProductSelect = (product: Product) => {
    setProductForRow(modalState.rowIndex, product);
    setModalState({ ...modalState, isOpen: false });
    setTimeout(() => {
      const nextCell = tableRef.current?.querySelector(
        `[data-row-index="${modalState.rowIndex}"][data-col-field="quantity"]`
      ) as HTMLInputElement | null;
      nextCell?.focus();
      if (nextCell) nextCell.select();
    }, 50);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    field: keyof PurchaseInvoiceItem
  ) => {
    if (!tableRef.current) return;

    if (
      field === 'name' &&
      (e.key === 'Enter' || (e.key.length === 1 && !e.ctrlKey && !e.metaKey))
    ) {
      e.preventDefault();
      handleOpenSearch(rowIndex, e.key.length === 1 ? e.key : '');
      return;
    }

    const fieldsOrder: Array<keyof PurchaseInvoiceItem> = ['name', 'quantity', 'costPrice'];
    if (showDiscount) fieldsOrder.push('discount');
    const colIndex = fieldsOrder.indexOf(field);

    const moveFocus = (row: number, colField: keyof PurchaseInvoiceItem) => {
      const nextCell = tableRef.current?.querySelector(
        `[data-row-index="${row}"][data-col-field="${colField}"]`
      ) as HTMLInputElement | null;
      nextCell?.focus();
      if (nextCell) nextCell.select();
    };

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        moveFocus(Math.max(0, rowIndex - 1), field);
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveFocus(Math.min(items.length - 1, rowIndex + 1), field);
        break;
      case 'Enter':
        e.preventDefault();
        if (rowIndex === items.length - 1 && field === 'costPrice') {
          addItem();
          setTimeout(() => {
            moveFocus(rowIndex + 1, 'name');
          }, 50);
        } else {
          moveFocus(rowIndex + 1, field);
        }
        break;
      case 'Tab': {
        e.preventDefault();
        const nextColIndex = e.shiftKey ? colIndex - 1 : colIndex + 1;
        if (nextColIndex >= 0 && nextColIndex < fieldsOrder.length) {
          moveFocus(rowIndex, fieldsOrder[nextColIndex]);
        } else if (!e.shiftKey && rowIndex === items.length - 1) {
          addItem();
          setTimeout(() => {
            moveFocus(rowIndex + 1, fieldsOrder[0]);
          }, 50);
        } else if (!e.shiftKey) {
          moveFocus(rowIndex + 1, fieldsOrder[0]);
        } else if (e.shiftKey && rowIndex > 0) {
          moveFocus(rowIndex - 1, fieldsOrder[fieldsOrder.length - 1]);
        }
        break;
      }
      default:
        return;
    }
  };

  // ── Resize handle element ───────────────────────────────────
  const ResizeHandle = ({ field }: { field: string }) => (
    <div
      onMouseDown={e => {
        onResizeMouseDown(e, field);
      }}
      className="absolute left-0 top-0 z-20 h-full w-1 cursor-col-resize transition-colors hover:bg-blue-300"
    />
  );

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col overflow-hidden border-y-2 border-blue-600 bg-white dark:bg-slate-900">
      {/* Table Toolbar */}
      <div className="flex justify-end gap-2 border-b bg-blue-600 p-1.5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex rounded-none border border-white/20 bg-white/10 p-0.5">
          {useDiscountStore.getState().discountEnabled && (
            <button
              onClick={() => {
                toggleColumn('showDiscount');
              }}
              className={cn(
                'px-3 py-1 text-[9px] font-bold uppercase transition-all',
                showDiscount ? 'bg-white text-blue-600' : 'text-blue-100'
              )}
            >
              إظهار الخصم
            </button>
          )}
        </div>
        <div className="p-1.5 text-white/50">
          <Settings size={14} />
        </div>
      </div>

      <div className="custom-scrollbar overflow-x-auto">
        <table ref={tableRef} className="w-full min-w-max table-fixed border-collapse">
          <thead>
            <tr className="bg-blue-600 text-right text-[10px] font-black uppercase tracking-widest text-white">
              <th
                style={{ width: colWidths.index }}
                className="relative border-l border-white/10 p-2 text-center"
              >
                #
              </th>
              <th
                style={{ width: colWidths.name }}
                className="relative border-l border-white/10 p-2 pr-4"
              >
                وصف الصنف المورد <ResizeHandle field="name" />
              </th>
              <th
                style={{ width: colWidths.partNumber }}
                className="relative border-l border-white/10 p-2 text-center"
              >
                رقم القطعة <ResizeHandle field="partNumber" />
              </th>
              <th
                style={{ width: colWidths.brand }}
                className="relative border-l border-white/10 p-2 text-center"
              >
                الشركة الصانعة <ResizeHandle field="brand" />
              </th>
              <th
                style={{ width: colWidths.quantity }}
                className="relative border-l border-white/10 p-2 text-center"
              >
                الكمية <ResizeHandle field="quantity" />
              </th>
              <th
                style={{ width: colWidths.costPrice }}
                className="relative border-l border-white/10 p-2 text-center"
              >
                سعر التكلفة <ResizeHandle field="costPrice" />
              </th>
              {showDiscount && (
                <th
                  style={{ width: colWidths.discount }}
                  className="relative border-l border-white/10 p-2 text-center"
                >
                  الخصم <ResizeHandle field="discount" />
                </th>
              )}
              <th style={{ width: colWidths.total }} className="relative p-2 pr-4 text-left">
                الإجمالي <ResizeHandle field="total" />
              </th>
              <th className="w-8 bg-blue-700 p-2 text-center" />
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800">
            {items.map((item, index) => (
              <tr
                key={item.id}
                className="group transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/5"
              >
                <td className="border-l p-2 text-center font-mono text-[10px] font-bold text-blue-300 dark:border-slate-800">
                  {index + 1}
                </td>
                <td className="border-l p-0 dark:border-slate-800">
                  <div className="flex items-center px-2">
                    <input
                      type="text"
                      value={item.name}
                      data-row-index={index}
                      data-col-field="name"
                      onKeyDown={e => {
                        handleKeyDown(e, index, 'name');
                      }}
                      onClick={() => {
                        handleOpenSearch(index, item.name || '');
                      }}
                      readOnly
                      className="flex-1 cursor-pointer bg-transparent p-2 text-right text-[11px] font-bold text-blue-900 outline-none placeholder:text-blue-200 dark:text-slate-100"
                      placeholder="اختر صنفاً..."
                    />
                    <Search size={12} className="text-blue-300 opacity-0 group-hover:opacity-100" />
                  </div>
                </td>
                <td className="border-l p-2 text-center font-mono text-[10px] font-bold text-gray-500 dark:border-slate-800">
                  {item.partNumber || '---'}
                </td>
                <td className="border-l p-2 text-center text-[10px] font-bold text-blue-600 dark:border-slate-800">
                  {item.brand || '---'}
                </td>
                <td className="border-l p-0 dark:border-slate-800">
                  <input
                    type="number"
                    value={item.quantity || ''}
                    onChange={e => {
                      updateItem(index, 'quantity', parseFloat(e.target.value) || 0);
                    }}
                    onKeyDown={e => {
                      handleKeyDown(e, index, 'quantity');
                    }}
                    data-row-index={index}
                    data-col-field="quantity"
                    className="h-full w-full bg-transparent p-2 text-center font-mono text-[11px] font-bold outline-none focus:bg-blue-50 dark:focus:bg-slate-800"
                    placeholder="0"
                  />
                </td>
                <td className="border-l p-0 dark:border-slate-800">
                  <input
                    type="number"
                    value={item.costPrice || ''}
                    onChange={e => {
                      updateItem(index, 'costPrice', parseFloat(e.target.value) || 0);
                    }}
                    onKeyDown={e => {
                      handleKeyDown(e, index, 'costPrice');
                    }}
                    data-row-index={index}
                    data-col-field="costPrice"
                    className="h-full w-full bg-transparent p-2 text-center font-mono text-[11px] font-bold text-rose-600 outline-none focus:bg-rose-50 dark:focus:bg-slate-800"
                    placeholder="0.00"
                  />
                </td>
                {showDiscount && (
                  <td className="border-l p-0 dark:border-slate-800">
                    <input
                      type="number"
                      value={item.discount || ''}
                      onChange={e => {
                        updateItem(index, 'discount', parseFloat(e.target.value) || 0);
                      }}
                      onKeyDown={e => {
                        handleKeyDown(e, index, 'discount');
                      }}
                      data-row-index={index}
                      data-col-field="discount"
                      className="h-full w-full bg-transparent p-2 text-center font-mono text-[11px] font-bold outline-none focus:bg-amber-50 dark:focus:bg-slate-800"
                    />
                  </td>
                )}
                <td
                  dir="ltr"
                  className="bg-blue-50/50 p-2 text-left font-mono text-[11px] font-bold text-blue-900 dark:bg-slate-950/30 dark:text-white"
                >
                  {(
                    Number(item.quantity) * Number(item.costPrice) -
                    (showDiscount ? Number(item.discount || 0) : 0)
                  ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="bg-blue-50/30 p-0">
                  <button
                    onClick={() => {
                      removeItem(index);
                    }}
                    className="flex h-full w-full items-center justify-center text-rose-300 transition-colors hover:text-rose-600"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex border-t-2 border-blue-700 bg-blue-600">
        <button
          onClick={addItem}
          className="flex flex-1 items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-blue-700 active:scale-95"
        >
          <Plus size={14} strokeWidth={4} /> إضافة سطر جديد (New Purchase Row)
        </button>
      </div>

      <ProductSelectionModal
        isOpen={modalState.isOpen}
        onClose={() => {
          setModalState({ ...modalState, isOpen: false });
        }}
        onSelect={handleProductSelect}
        initialQuery={modalState.query}
      />
    </div>
  );
};

export default InteractivePurchaseTable;
