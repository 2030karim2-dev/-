
import React from 'react';
import { Box, Edit, Trash2, Layers, Car, DollarSign, Package, TrendingDown, X, Hash, Activity, TrendingUp, Info } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency, formatNumberDisplay } from '../../../core/utils';
import Button from '../../../ui/base/Button';
import { CrossReferenceList } from './auto_parts/CrossReferenceList';
import { SupplierPricesList } from './auto_parts/SupplierPricesList';
import { ProductKitList } from './auto_parts/ProductKitList';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../api';
import StatCard from './product_detail/StatCard';
import StockStatusBadge from './product_detail/StockStatusBadge';
import AlternativesSection from './product_detail/AlternativesSection';
import { VehicleCompatibilityList } from './auto_parts/VehicleCompatibilityList';

interface Props {
  product: Product | null;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}

const ProductDetailPane: React.FC<Props> = ({ product, onEdit, onDelete, onClose }) => {
  // Fetch real-time analytics
  const { data: analytics } = useQuery({
    queryKey: ['product_analytics_pane', product?.id],
    queryFn: async () => {
      if (!product?.id) return null;
      const { data, error } = await inventoryApi.getProductAnalytics(product.id);
      const safeData = data as unknown as Record<string, unknown>[];
      if (!error && safeData && safeData.length > 0) return safeData[0];

      // Fallback to movements if RPC fails
      const { data: txs } = await inventoryApi.getProductMovements(product.id);
      if (!txs) return null;

      const sales = txs.filter((t: any) => t.transaction_type === 'out').reduce((sum: number, t: any) => sum + (t.quantity || 0), 0);
      const purchases = txs.filter((t: any) => t.transaction_type === 'in').reduce((sum: number, t: any) => sum + (t.quantity || 0), 0);

      return { total_sales_qty: sales, total_purchases_qty: purchases, total_profit: 0, total_loss: 0 };
    },
    enabled: !!product?.id
  });

  if (!product) {
    return (
      <div className="sticky top-[8.5rem] h-[calc(100vh-10rem)] flex flex-col items-center justify-center bg-white dark:bg-slate-900 border-2 border-dashed dark:border-slate-800 rounded-[2.5rem] text-gray-300 dark:text-slate-700 p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-full mb-4">
          <Package size={48} strokeWidth={1} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">اختر منتجاً لعرض التفاصيل</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-[200px]">قم بتحديد أي صنف من القائمة لعرض كامل تفاصيله وإحصائياته هنا</p>
      </div>
    );
  }

  const stats = {
    total_sales: (analytics as any)?.total_sales_qty ?? product.total_sales_qty ?? 0,
    total_purchases: (analytics as any)?.total_purchases_qty ?? product.total_purchases_qty ?? 0,
    profit: (analytics as any)?.total_profit ?? product.total_profit ?? 0,
  };

  const cost = Number(product.cost_price) || 0;
  const selling = Number(product.sale_price ?? product.selling_price) || 0;
  const margin = cost > 0 ? ((selling - cost) / cost) * 100 : 0;

  return (
    <div className="sticky top-[8.5rem] bg-gray-50 dark:bg-slate-950 w-full shadow-2xl overflow-hidden flex flex-col border dark:border-slate-800 animate-in slide-in-from-right-4 fade-in duration-500 max-h-[calc(100vh-10rem)] rounded-[2.5rem]">
      {/* Header */}
      <div className="flex justify-between items-center p-5 border-b dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-all active:scale-90">
              <X size={20} />
            </button>
          )}
          <div className="p-2.5 bg-blue-600/10 text-blue-600 rounded-2xl">
            <Box size={24} />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight truncate">{product.name}</h2>
              <StockStatusBadge quantity={product.stock_quantity} minLevel={product.min_stock_level} />
            </div>
            <p dir="ltr" className="text-[10px] font-bold text-gray-400 font-mono tracking-tighter mt-0.5">{product.sku}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 pl-1">
          <Button onClick={() => onEdit(product)} variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"><Edit size={16} /></Button>
          <Button onClick={() => { if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) onDelete(product.id); }} variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"><Trash2 size={16} /></Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">

        {/* Gallery Section */}
        <div className="aspect-video bg-white dark:bg-slate-900 rounded-3xl border dark:border-slate-800 flex items-center justify-center relative group shadow-sm overflow-hidden shrink-0">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="max-w-full max-h-full object-contain p-4 transition-transform duration-700 group-hover:scale-110" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-200 dark:text-slate-800">
              <Box size={64} strokeWidth={1} />
              <span className="text-[10px] font-bold uppercase tracking-widest">No Image Available</span>
            </div>
          )}
          <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-black/80 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex items-center gap-2">
            <Hash size={14} className="text-blue-600" />
            <span className="text-[10px] font-bold font-mono">{product.part_number || 'No PN'}</span>
          </div>
        </div>

        {/* Major Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={DollarSign} label="سعر التكلفة" value={formatCurrency(product.cost_price)} color="text-rose-600" />
          <StatCard icon={TrendingUp} label="سعر البيع" value={formatCurrency(selling)} color="text-emerald-600" />
        </div>

        {/* Business Identity */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border dark:border-slate-800 shadow-sm">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-4 tracking-widest flex items-center gap-1.5">
            <Info size={12} className="text-blue-500" /> بيانات أساسية
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">رقم القطعة (OEM)</span>
              <strong className="font-mono bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-lg text-indigo-600 dark:text-indigo-400">{product.part_number || '—'}</strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">الشركة المصنعة</span>
              <strong className="text-gray-900 dark:text-white">{product.brand || 'غير محدد'}</strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">التصنيف</span>
              <strong className="text-gray-900 dark:text-white">{product.category || 'عام'}</strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">الوحدة القياسية</span>
              <strong className="text-gray-900 dark:text-white bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md">{product.unit || 'piece'}</strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">الحجم / المقاس</span>
              <strong className="text-gray-900 dark:text-white bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{product.size || '—'}</strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">موقع الرف</span>
              <strong className="text-gray-900 dark:text-white bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{product.location || '—'}</strong>
            </div>
          </div>
        </div>

        {/* Performance & Stock */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Package} label="المشتريات" value={formatNumberDisplay(stats.total_purchases)} color="text-blue-600" />
          <StatCard icon={TrendingDown} label="المبيعات" value={formatNumberDisplay(stats.total_sales)} color="text-purple-600" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Activity} label="هامش الربح" value={`${margin.toFixed(1)}%`} color={margin > 0 ? "text-emerald-600" : "text-rose-600"} />
          <StatCard icon={Box} label="المخزون الكلي" value={formatNumberDisplay(product.stock_quantity)} color="text-slate-900" />
        </div>

        {/* Warehouse Distribution */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border dark:border-slate-800 shadow-sm">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-4 tracking-widest flex items-center gap-1.5">
            <Layers size={12} className="text-amber-500" /> توزيع المخزون
          </h4>
          <div className="space-y-2">
            {product.warehouse_distribution && product.warehouse_distribution.length > 0 ? (
              product.warehouse_distribution.map((wh, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30 transition-all">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-800 dark:text-slate-200">{wh.warehouse_name}</span>
                    <span className="text-[9px] text-gray-400 font-mono mt-0.5">SITE: {wh.location || 'N/A'}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 px-3 py-1 rounded-xl shadow-sm self-center">
                    <span dir="ltr" className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">{formatNumberDisplay(wh.quantity)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">لا توجد بيانات توزيع</p>
              </div>
            )}
          </div>
        </div>

        {/* Vehicle Compatibility Dynamic Search */}
        <VehicleCompatibilityList product={product} />

        {/* Extension Sections */}
        <div className="space-y-4">
          <AlternativesSection alternatives={product.alternative_numbers} />

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border dark:border-slate-800 shadow-sm overflow-hidden">
            <ProductKitList product={product} />
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border dark:border-slate-800 shadow-sm overflow-hidden">
            <SupplierPricesList product={product} />
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border dark:border-slate-800 shadow-sm overflow-hidden">
            <CrossReferenceList product={product} />
          </div>
        </div>

        {/* Specifications */}
        {product.specifications && (
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border dark:border-slate-800 shadow-sm">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-widest">مواصفات إضافية</h4>
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl whitespace-pre-wrap">
              {product.specifications}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductDetailPane;
