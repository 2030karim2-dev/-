
import React from 'react';
import { Box, Search, Edit, Trash2, TrendingUp, Layers, Car, DollarSign, Package, TrendingDown, X } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency, formatNumberDisplay } from '../../../core/utils';
import { cn } from '../../../core/utils';
import Button from '../../../ui/base/Button';
import { CrossReferenceList } from './auto_parts/CrossReferenceList';
import { SupplierPricesList } from './auto_parts/SupplierPricesList';
import { ProductKitList } from './auto_parts/ProductKitList';

interface Props {
  product: Product | null;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}

const StatCard: React.FC<{ icon: any, label: string, value: string | number, color: string }> = ({ icon: Icon, label, value, color }) => (
  <div className={cn("bg-opacity-10 p-4 rounded-2xl border flex items-start gap-3", color.replace('text-', 'bg-').replace('600', '50'), color.replace('text-', 'border-'))}>
    <div className={cn("p-2 rounded-xl bg-opacity-20", color.replace('text-', 'bg-'))}>
      <Icon size={16} className={color} />
    </div>
    <div>
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <h3 dir="ltr" className={cn("text-lg font-black font-mono leading-none tracking-tight", color)}>{value}</h3>
    </div>
  </div>
);

const ProductDetailPane: React.FC<Props> = ({ product, onEdit, onDelete, onClose }) => {
  if (!product) {
    return (
      <div className="sticky top-[8.5rem] h-[calc(100vh-10rem)] flex flex-col items-center justify-center bg-white dark:bg-slate-900 border-2 border-dashed dark:border-slate-800 rounded-[2rem] text-gray-300 dark:text-slate-700">
        <Search size={48} strokeWidth={1} />
        <p className="mt-4 text-sm font-bold">اختر منتجاً لعرض التفاصيل</p>
        <p className="text-xs text-gray-400">Select an item from the list</p>
      </div>
    );
  }

  return (
    <div className="sticky top-[8.5rem] bg-gray-50 dark:bg-slate-950 w-full shadow-lg overflow-hidden flex flex-col border dark:border-slate-800 animate-in fade-in duration-300 max-h-[calc(100vh-10rem)] rounded-[2rem]">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
              <X size={20} />
            </button>
          )}
          <div className="p-2 bg-blue-600/10 text-blue-600 rounded-2xl">
            <Box size={24} />
          </div>
          <div className="overflow-hidden">
            <h2 className="text-base font-black text-gray-800 dark:text-slate-100 leading-tight truncate">{product.name}</h2>
            <p dir="ltr" className="text-xs font-bold text-gray-400 font-mono tracking-tighter mt-1">{product.sku}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button onClick={() => onEdit(product)} variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg"><Edit size={14} /></Button>
          <Button onClick={() => { if (confirm('هل أنت متأكد؟')) onDelete(product.id); }} variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-rose-500 hover:bg-rose-50"><Trash2 size={14} /></Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard icon={DollarSign} label="سعر التكلفة" value={formatCurrency(product.cost_price)} color="text-rose-600" />
          <StatCard icon={TrendingUp} label="سعر البيع" value={formatCurrency(product.selling_price)} color="text-emerald-600" />
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800">
          <h4 className="text-[10px] font-black text-gray-400 uppercase mb-2">بيانات أساسية</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span>رقم القطعة:</span> <strong className="font-mono">{product.part_number || 'N/A'}</strong></div>
            <div className="flex justify-between"><span>الشركة:</span> <strong className="text-blue-600">{product.brand}</strong></div>
            <div className="flex justify-between"><span>المورد:</span> <strong>{product.supplier_name || 'غير محدد'}</strong></div>
            <div className="flex justify-between"><span>الفئة:</span> <strong>{product.category || 'عام'}</strong></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={Package} label="إجمالي المشتريات" value={formatNumberDisplay(product.total_purchases_qty)} color="text-blue-600" />
          <StatCard icon={TrendingDown} label="إجمالي المبيعات" value={formatNumberDisplay(product.total_sales_qty)} color="text-blue-600" />
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800">
          <h4 className="text-[10px] font-black text-gray-400 uppercase mb-3 flex items-center gap-1.5"><Layers size={12} /> توزيع المخزون</h4>
          <div className="space-y-2">
            {product.warehouse_distribution?.map((wh, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl border dark:border-slate-800">
                <span className="text-xs font-bold text-gray-700 dark:text-slate-300">{wh.warehouse_name}</span>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-gray-400 font-mono font-bold">الرف: {wh.location}</span>
                  <span dir="ltr" className="text-sm font-black text-blue-600 font-mono">{formatNumberDisplay(wh.quantity)}</span>
                </div>
              </div>
            )) || <div className="text-center p-2 text-xs text-gray-400">لا توجد بيانات توزيع</div>}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800">
          <h4 className="text-[10px] font-black text-gray-400 uppercase mb-3 flex items-center gap-1.5"><Car size={12} /> التوافق</h4>
          <div className="space-y-2">
            {product.compatibility?.map((c, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl border dark:border-slate-800">
                <span className="text-xs font-bold text-gray-700 dark:text-slate-300">{c.make} {c.model}</span>
                <span className="text-xs font-bold text-gray-500">{c.years.join(', ')}</span>
              </div>
            )) || <div className="text-center p-2 text-xs text-gray-400">لا توجد بيانات توافق</div>}
          </div>
        </div>

        {/* Auto Parts Extensions */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 overflow-hidden">
          <CrossReferenceList product={product} />
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 overflow-hidden">
          <ProductKitList product={product} />
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 overflow-hidden">
          <SupplierPricesList product={product} />
        </div>

      </div>
    </div>
  );
};

export default ProductDetailPane;
