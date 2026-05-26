import React from 'react';
import { Box, Warehouse, Coins, Info, Plus } from 'lucide-react';
import { useLocalProductSearch } from '../../hooks/useVehicleCompatibility';
import { formatCurrency, cn } from '../../../../core/utils';
import { useNavigate } from 'react-router-dom';

interface LocalProductMatchesProps {
  partNumber: string;
}

const LocalProductMatches: React.FC<LocalProductMatchesProps> = ({ partNumber }) => {
  const navigate = useNavigate();
  const { data: localProducts, isLoading, isError } = useLocalProductSearch(partNumber);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 animate-pulse space-y-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-24 bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
          <div className="h-24 bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (isError) return null;

  const matches = localProducts || [];

  return (
    <div className="bg-white dark:bg-slate-900 border border-indigo-100/50 dark:border-slate-800 rounded-3xl p-6 shadow-xl shadow-indigo-500/5 space-y-4 text-right" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Box className="text-indigo-600 dark:text-indigo-400" size={18} />
            البحث في المستودع المحلي
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            الأصناف المسجلة في مخزونك الحالي والتي تطابق رقم القطعة <span className="font-mono bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded text-indigo-600 font-bold">{partNumber}</span>
          </p>
        </div>

        <button
          onClick={() => navigate('/inventory')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold transition-all shrink-0 w-fit self-end sm:self-auto"
        >
          <Plus size={14} /> تسجيل صنف جديد
        </button>
      </div>

      {matches.length === 0 ? (
        <div className="flex gap-3 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-900/20 p-4 rounded-2xl text-amber-800 dark:text-amber-300">
          <div className="shrink-0 text-amber-500"><Info size={18} /></div>
          <div className="text-xs space-y-1">
            <p className="font-bold">هذا الصنف غير متوفر محلياً</p>
            <p className="opacity-90">لا توجد قطع غيار مسجلة بهذا الرقم في مخزون المحل حالياً. يمكنك استخدام زر "تسجيل صنف جديد" لإضافته للمخزون.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((product: any) => {
            const totalStock = Array.isArray(product.quantity)
              ? product.quantity.reduce((acc: number, curr: any) => acc + (Number(curr.quantity) || 0), 0)
              : (Number(product.quantity?.quantity) || 0);

            const isAvailable = totalStock > 0;

            return (
              <div
                key={product.id}
                onClick={() => navigate('/inventory')}
                className={cn(
                  "border p-4 rounded-2xl transition-all flex flex-col justify-between h-full cursor-pointer relative overflow-hidden group hover:shadow-md",
                  isAvailable 
                    ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800" 
                    : "bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80 hover:border-rose-300 dark:hover:border-rose-800"
                )}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-tighter uppercase",
                      isAvailable 
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40" 
                        : "bg-rose-50 text-rose-600 dark:bg-rose-950/40"
                    )}>
                      {isAvailable ? `متوفر (${totalStock})` : "نفذت الكمية"}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-colors">
                      {product.sku || 'بدون SKU'}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {product.name_ar}
                  </h4>
                  
                  {product.brand && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1 uppercase tracking-wider">
                      الماركة: <span className="text-slate-500 dark:text-slate-400 font-mono">{product.brand}</span>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t dark:border-slate-800/60 text-right">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block">سعر البيع</span>
                    <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400 flex items-center gap-1 justify-end">
                      <Coins size={12} />
                      {formatCurrency(product.sale_price || 0)}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block">موقع الرف</span>
                    <span className="text-xs font-bold font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1 justify-end">
                      <Warehouse size={12} />
                      {product.shelf_location || product.warehouses?.name_ar || 'غير محدد'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LocalProductMatches;
