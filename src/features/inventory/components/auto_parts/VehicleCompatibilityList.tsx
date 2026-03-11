import React, { useState, useEffect } from 'react';
import { Car, Search, Loader2 } from 'lucide-react';
import { useVehicleCompatibility } from '../../hooks/useVehicleCompatibility';
import { Product } from '../../types';

interface Props {
  product: Product;
}

export const VehicleCompatibilityList: React.FC<Props> = ({ product }) => {
  const [searchTerm, setSearchTerm] = useState(product.part_number || product.sku || '');
  const [activeSearch, setActiveSearch] = useState(searchTerm);

  const { data, isLoading, isError, error } = useVehicleCompatibility(activeSearch);
  const vehicles = data?.vehicles ?? [];

  useEffect(() => {
    // If the product changes, update the initial searchTerm
    setSearchTerm(product.part_number || product.sku || '');
    setActiveSearch(product.part_number || product.sku || '');
  }, [product.part_number, product.sku]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setActiveSearch(searchTerm.trim());
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border dark:border-slate-800 shadow-sm relative overflow-hidden group">
      {/* Search Header */}
      <form onSubmit={handleSearch} className="flex items-center gap-2 mb-4">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 shrink-0">
          <Car size={12} className="text-indigo-500" /> التوافق مع المركبات
        </h4>
        <div className="flex-1 mx-2 relative">
          <input 
            type="text" 
            placeholder="ابحث برقم القطعة (Article No)" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-indigo-300 dark:focus:border-indigo-700/50 rounded-lg py-1.5 px-3 pr-8 outline-none transition-all dark:text-slate-200"
          />
          <Search size={12} className="absolute right-2.5 top-2 text-gray-400" />
        </div>
        <button 
          type="submit" 
          disabled={isLoading || !searchTerm.trim()}
          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 text-xs px-3 py-1.5 rounded-lg font-bold transition-all disabled:opacity-50"
        >
          بحث
        </button>
      </form>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 size={24} className="animate-spin text-indigo-400" />
          <p className="text-[10px] font-bold uppercase tracking-widest mt-1">جاري جلب البيانات من RapidAPI...</p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="text-center py-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-900/30 text-rose-500">
          <p className="text-[10px] font-bold mt-1">حدث خطأ أثناء الاتصال بـ API.</p>
          <p className="text-[9px] text-rose-400 mt-0.5">{error?.message || 'تأكد من إعدادات المفتاح والشبكة'}</p>
        </div>
      )}

      {/* Success State */}
      {!isLoading && !isError && vehicles && vehicles.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
          {vehicles.map((c, i) => (
            <div key={i} className="flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all">
              <span className="text-xs font-bold text-gray-700 dark:text-slate-300">{c.make} {c.model}</span>
              <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-lg text-center max-w-[120px] truncate leading-tight" title={c.years.join(', ')}>
                {c.years.join(', ') || 'كل الموديلات'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && (!vehicles || vehicles.length === 0) && activeSearch && (
        <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800 text-slate-400">
          <Car size={32} strokeWidth={1} className="mx-auto mb-2 opacity-20" />
          <p className="text-[10px] font-bold uppercase tracking-widest">لم يتم العثور على مركبات متوافقة</p>
        </div>
      )}
      
      {/* Empty State (No Search Term) */}
      {!activeSearch && (
        <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800 text-slate-400">
          <Car size={32} strokeWidth={1} className="mx-auto mb-2 opacity-20" />
          <p className="text-[10px] font-bold uppercase tracking-widest">أدخل رقم القطعة للتبحث عن توافق متقدم</p>
        </div>
      )}

      {/* Fallback Display if product has static fallback from DB but API failed / no search */}
      {!activeSearch && product.compatibility && product.compatibility.length > 0 && (
        <div className="mt-4 pt-4 border-t dark:border-slate-800">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1 text-center">بيانات التوافق المحفوظة محلياً</p>
          <div className="space-y-2 opacity-80">
            {product.compatibility.map((c, i) => (
              <div key={`local-${i}`} className="flex justify-between items-center bg-gray-100 dark:bg-slate-800/30 p-2 rounded-xl border border-transparent transition-all">
                <span className="text-[11px] font-bold text-gray-600 dark:text-slate-400">{c.make} {c.model}</span>
                <span className="text-[9px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-700/50 px-2 py-0.5 rounded-lg">{c.years.join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
