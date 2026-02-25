import React from 'react';
import { Edit, Trash2, Copy, Send, X, Package } from 'lucide-react';
import { Product, ProductFormData } from '../types';
import { formatCurrency, formatNumberDisplay } from '../../../core/utils';
import { cn } from '../../../core/utils';
import ExcelTable, { Column } from '../../../ui/common/ExcelTable';
import TableSkeleton from '../../../ui/base/TableSkeleton';
import { useProductMutations } from '../hooks';

interface Props {
  products: Product[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onViewDetails: (product: Product) => void;
  onEdit: (product: Product) => void;
}

const ProductExcelGrid: React.FC<Props> = ({ products, isLoading, onDelete, onViewDetails, onEdit }) => {
  const { saveProduct, bulkDeleteProducts } = useProductMutations();
  const [selectedRowIds, setSelectedRowIds] = React.useState<Set<string>>(new Set());

  const handleOrderChange = (reorderedProducts: Product[]) => {
    // In a real app, this would trigger a mutation to save the new order.
  };

  const handleCellUpdate = async (rowIndex: number, accessorKey: string, value: any) => {
    const productToUpdate = products[rowIndex];
    if (productToUpdate) {
      const updatedData = { ...productToUpdate, [accessorKey]: Number(value) || 0 };
      await saveProduct({ data: updatedData as ProductFormData, id: productToUpdate.id });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowIds.size === 0) return;
    if (window.confirm(`هل أنت متأكد من حذف ${selectedRowIds.size} صنف نهائياً؟`)) {
      await bulkDeleteProducts(Array.from(selectedRowIds));
      setSelectedRowIds(new Set());
    }
  };

  const generateShareText = () => {
    const selectedProducts = products.filter(p => selectedRowIds.has(p.id));
    if (selectedProducts.length === 0) return '';

    let text = 'قائمة الأصناف المحددة:\n\n';
    selectedProducts.forEach(p => {
      text += `- ${p.name} `;
      if (p.part_number) text += `(رقم القطعة: ${p.part_number}) `;
      text += `| السعر: ${formatCurrency(p.selling_price)} ريال\n`;
    });
    return text;
  };

  const handleCopy = async () => {
    if (selectedRowIds.size === 0) return;
    const text = generateShareText();
    try {
      await navigator.clipboard.writeText(text);
      alert('تم نسخ البيانات للحافظة');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleSend = () => {
    if (selectedRowIds.size === 0) return;
    const text = encodeURIComponent(generateShareText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (isLoading) return <TableSkeleton rows={10} cols={6} />;

  const columns: Column<Product>[] = [
    {
      header: 'اسم القطعة',
      accessor: (p) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Package size={12} />
          </div>
          <div className="min-w-0">
            <span className="font-black text-sm text-slate-900 dark:text-white block truncate">{p.name}</span>
            {p.brand && <span className="text-[9px] font-bold text-blue-500 dark:text-blue-400">{p.brand}</span>}
          </div>
        </div>
      ),
      sortKey: 'name'
    },
    {
      header: 'رقم القطعة',
      accessor: (p) => (
        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px] bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded">
          {p.part_number || '—'}
        </span>
      ),
      width: 'w-32',
      sortKey: 'part_number'
    },
    {
      header: 'المخزون',
      accessor: (p) => (
        <span className={cn(
          "font-black font-mono text-sm px-2 py-0.5 rounded-md",
          p.isLowStock
            ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20'
            : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
        )}>
          {formatNumberDisplay(p.stock_quantity)}
        </span>
      ),
      className: 'text-center',
      width: 'w-24',
      sortKey: 'stock_quantity'
    },
    {
      header: 'التكلفة',
      accessor: (p) => <span dir="ltr" className="font-mono font-bold text-gray-700 dark:text-gray-300">{formatCurrency(p.cost_price)}</span>,
      className: 'text-left',
      width: 'w-28',
      sortKey: 'cost_price',
      accessorKey: 'cost_price',
      isEditable: true,
    },
    {
      header: 'سعر البيع',
      accessor: (p) => <span dir="ltr" className="font-mono font-black text-blue-700 dark:text-blue-400 text-sm">{formatCurrency(p.selling_price)}</span>,
      className: 'text-left',
      width: 'w-28',
      sortKey: 'selling_price',
      accessorKey: 'selling_price',
      isEditable: true,
    },
    {
      header: 'إجراءات',
      accessor: (p) => (
        <div className="flex justify-center items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(p); }}
            className="p-1.5 text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors border border-blue-100 dark:border-blue-800/50"
            title="تعديل"
          >
            <Edit size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); if (window.confirm('هل أنت متأكد من حذف هذا الصنف نهائياً؟')) onDelete(p.id); }}
            className="p-1.5 text-rose-600 bg-rose-50 dark:bg-rose-900/30 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-800/50 transition-colors border border-rose-100 dark:border-rose-800/50"
            title="حذف"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
      width: 'w-24',
      className: 'text-center'
    },
  ];

  return (
    <div className="relative h-full flex flex-col">
      {/* Bulk actions bar */}
      {selectedRowIds.size > 0 && (
        <div className="absolute top-0 left-0 right-0 z-50 p-3 bg-white dark:bg-slate-900 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-blue-200 dark:border-blue-900/50 rounded-lg flex items-center justify-between mx-2 mt-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
              تم تحديد {selectedRowIds.size} منتج
            </span>
            <button
              onClick={() => setSelectedRowIds(new Set())}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
            >
              <X size={14} /> إلغاء التحديد
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded flex items-center gap-1.5 transition-colors dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
            >
              <Copy size={14} /> نسخ للنص
            </button>
            <button
              onClick={handleSend}
              className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded flex items-center gap-1.5 transition-colors dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
            >
              <Send size={14} /> مشاركة وتس
            </button>
            <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1"></div>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Trash2 size={14} /> حذف المحدد
            </button>
          </div>
        </div>
      )}

      <ExcelTable
        columns={columns}
        data={products}
        title="المنتجات"
        subtitle={`${products.length} منتج في المستودع`}
        colorTheme="indigo"
        pageSize={500}
        onRowDoubleClick={onViewDetails}
        onOrderChange={handleOrderChange}
        onCellUpdate={handleCellUpdate}
        enableSelection={true}
        selectedRowIds={selectedRowIds}
        onSelectionChange={setSelectedRowIds}
        getRowId={(p) => p.id}
      />
    </div>
  );
};

export default ProductExcelGrid;