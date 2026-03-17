import React, { useState, useEffect } from 'react';
import { Car, Search, Loader2 } from 'lucide-react';
import { useVehicleCompatibility } from '../../hooks/useVehicleCompatibility';
import { Product } from '../../types';
import { cn } from '../../../../core/utils';

interface Props {
  product: Product;
}

export const VehicleCompatibilityList: React.FC<Props> = ({ product }) => {
  const [searchTerm, setSearchTerm] = useState(product.part_number || product.sku || '');
  const [activeSearch, setActiveSearch] = useState(searchTerm);

  const { data, isLoading, isError, error } = useVehicleCompatibility(activeSearch);
  const vehicles = data?.vehicles ?? [];

  useEffect(() => {
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
    <div className="flex flex-col h-full bg-white dark:bg-slate-950">
      {/* Search Toolbar */}
      <form onSubmit={handleSearch} className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex-1 relative">
          <input 
            type="text" 
            placeholder="البحث برقم القطعة (Article No)" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-400 outline-none px-2 py-1 rounded transition-all transition-all"
          />
          <Search size={10} className="absolute left-2 top-2 text-gray-400" />
        </div>
        <button 
          type="submit" 
          disabled={isLoading || !searchTerm.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1 rounded transition-all disabled:opacity-50"
        >
          {isLoading ? <Loader2 size={12} className="animate-spin" /> : 'بحث'}
        </button>
      </form>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="text-right px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight">{activeSearch ? 'المركبة (RapidAPI)' : 'بيانات محلية'}</th>
                    <th className="text-right px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight">سنوات الصنع</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-[11px]">
                {/* API Results */}
                {vehicles && vehicles.length > 0 ? (
                    vehicles.map((c, i) => (
                        <tr key={`api-${i}`} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                            <td className="px-4 py-2 font-bold text-slate-700 dark:text-slate-300">{c.make} {c.model}</td>
                            <td className="px-4 py-2 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                {c.years.join(', ') || 'كل الموديلات'}
                            </td>
                        </tr>
                    ))
                ) : null}

                {/* Local Fallback */}
                {!isLoading && vehicles.length === 0 && product.compatibility && product.compatibility.length > 0 && (
                    product.compatibility.map((c, i) => (
                        <tr key={`local-${i}`} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors opacity-70 italic">
                            <td className="px-4 py-2 font-bold text-slate-600 dark:text-slate-400">{c.make} {c.model} (محلي)</td>
                            <td className="px-4 py-2 font-mono">{c.years.join(', ')}</td>
                        </tr>
                    ))
                )}

                {/* Status States */}
                {!isLoading && vehicles.length === 0 && (!product.compatibility || product.compatibility.length === 0) && (
                    <tr>
                        <td colSpan={2} className="text-center py-12 text-slate-300">
                            <Car size={24} className="mx-auto mb-2 opacity-20" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">
                                {isError ? 'خطأ في الاتصال بـ API' : 'لا توجد بيانات توافق المتقدمة'}
                            </p>
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};
