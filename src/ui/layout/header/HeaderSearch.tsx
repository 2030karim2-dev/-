import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../../../features/inventory/api/productsApi';
import { useAuthStore } from '../../../features/auth/store';
import { formatCurrency } from '../../../core/utils';

// Custom Debounce Hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const HeaderSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: results, isFetching } = useQuery({
    queryKey: ['product_search', user?.company_id, debouncedQuery],
    queryFn: async () => {
      if (!user?.company_id || !debouncedQuery.trim()) return { data: [], error: null };
      return await productsApi.searchProduct(user.company_id, debouncedQuery);
    },
    enabled: !!user?.company_id && debouncedQuery.trim().length > 0,
    staleTime: 1000 * 60, // 1 minute
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (product: any) => {
    setIsOpen(false);
    setQuery('');
    // Navigate to inventory with the SKU or part number pre-filled in some way, or just go to inventory and let user see it.
    // For now, we will navigate to inventory. The most robust way without changing routing is:
    navigate(`/inventory?search=${encodeURIComponent(product.sku || product.part_number || product.name_ar)}`);
  };

  const hasResults = results?.data && results.data.length > 0;

  return (
    <div ref={wrapperRef} className="flex-1 max-w-lg mx-auto hidden md:block relative z-50">
      <div className="relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="ابحث عن العميل، الصنف، الفاتورة..."
          className="w-full bg-[#f3f4f6] dark:bg-slate-800 border-none rounded-lg py-2.5 pr-10 pl-4 text-sm text-gray-600 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/20 dark:focus:ring-accent/40 transition-all"
        />
        {isFetching ? (
          <Loader2 className="absolute right-3 top-2.5 text-accent animate-spin" size={18} />
        ) : (
          <Search className="absolute right-3 top-2.5 text-gray-400 dark:text-slate-500 group-focus-within:text-accent" size={18} />
        )}
      </div>

      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-[400px] flex flex-col">
          {isFetching && !hasResults ? (
            <div className="p-8 flex justify-center items-center text-gray-400">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : hasResults ? (
            <div className="overflow-y-auto custom-scrollbar flex-1 p-2 space-y-1">
              {results.data.map((product: any) => (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-right group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                      <Package size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {product.name_ar}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span dir="ltr" className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {product.sku}
                        </span>
                        {(product.part_number || product.alternative_numbers) && (
                          <span dir="ltr" className="text-[10px] uppercase font-bold text-amber-600">
                            {product.part_number || product.alternative_numbers}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 pl-2 border-l dark:border-slate-800 ml-4">
                    <span dir="ltr" className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                      {formatCurrency(product.sale_price)} YER
                    </span>
                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-slate-400">
                      <span>عرض</span>
                      <ArrowLeft size={10} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
              لا توجد نتائج مطابقة لـ "{query}"
            </div>
          )}

          <div className="p-2 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <button
              onClick={() => navigate(`/inventory?search=${encodeURIComponent(query)}`)}
              className="w-full text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline p-1"
            >
              عرض كافة النتائج المتقدمة...
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderSearch;
