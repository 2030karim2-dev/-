import React, { useState } from 'react';
import { Search, X, Box } from 'lucide-react';
import { useProducts } from '../../../inventory/hooks';
import { Product } from '../../../inventory/types';
import Modal from '../../../../ui/base/Modal';
import { formatCurrency } from '../../../../core/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
  initialQuery?: string;
}

const ProductSelectionModal: React.FC<Props> = ({ isOpen, onClose, onSelect, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const { products, isLoading } = useProducts(query);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={Box}
      size="4xl" // Increased size for desktop users
      title="مستكشف الأصناف المتقدم"
      description="ابحث واختر المنتج لإنزاله في الفاتورة"
      footer={<button onClick={onClose} className="w-full py-2 text-[10px] font-black bg-gray-100 dark:bg-slate-800 uppercase">إغلاق</button>}
    >
        <div className="flex flex-col h-[500px] bg-white dark:bg-slate-900">
            <div className="p-2 border-b dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        autoFocus
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="ابحث بالاسم، رقم الصنف، المواصفات..."
                        className="w-full pr-10 pl-4 py-2.5 bg-gray-50 dark:bg-slate-800 border-2 border-blue-500/20 focus:border-blue-500 outline-none rounded-none text-sm font-bold"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full border-collapse border-spacing-0">
                    <thead className="bg-gray-100 dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
                        <tr className="text-[8px] font-black text-gray-500 uppercase tracking-tighter">
                            <th className="border border-gray-200 dark:border-slate-700 p-2 w-8">ت</th>
                            <th className="border border-gray-200 dark:border-slate-700 p-2 text-right">اسم المنتج</th>
                            <th className="border border-gray-200 dark:border-slate-700 p-2 text-right">رقم الصنف</th>
                            <th className="border border-gray-200 dark:border-slate-700 p-2 text-right">الشركة</th>
                            <th className="border border-gray-200 dark:border-slate-700 p-2 text-center w-12">كمية</th>
                            <th className="border border-gray-200 dark:border-slate-700 p-2 text-left">البيع</th>
                            <th className="border border-gray-200 dark:border-slate-700 p-2 text-right">المقاس</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                        {isLoading ? (
                            <tr><td colSpan={7} className="p-10 text-center animate-pulse text-[10px] font-black text-gray-400">جاري مسح قاعدة البيانات...</td></tr>
                        ) : products.length === 0 ? (
                            <tr><td colSpan={7} className="p-10 text-center text-gray-300">لا توجد نتائج مطابقة</td></tr>
                        ) : (
                            products.map((p, idx) => (
                                <tr 
                                    key={p.id} 
                                    onClick={() => onSelect(p)}
                                    onKeyDown={(e) => e.key === 'Enter' && onSelect(p)}
                                    tabIndex={0}
                                    className="hover:bg-blue-600 hover:text-white cursor-pointer group transition-colors focus:bg-blue-600 focus:text-white outline-none"
                                >
                                    <td className="border border-gray-100 dark:border-slate-800 p-1.5 text-center text-[9px] font-mono opacity-50">{idx + 1}</td>
                                    <td className="border border-gray-100 dark:border-slate-800 p-1.5 text-[10px] font-black">{p.name}</td>
                                    <td className="border border-gray-100 dark:border-slate-800 p-1.5 text-[9px] font-mono group-hover:text-blue-200">{p.sku}</td>
                                    <td className="border border-gray-100 dark:border-slate-800 p-1.5 text-[9px] font-bold opacity-60">{p.brand}</td>
                                    <td className="border border-gray-100 dark:border-slate-800 p-1.5 text-center text-[10px] font-black font-mono">{p.stock_quantity}</td>
                                    <td className="border border-gray-100 dark:border-slate-800 p-1.5 text-left text-[10px] font-black font-mono text-emerald-600 group-hover:text-white">{p.selling_price}</td>
                                    <td className="border border-gray-100 dark:border-slate-800 p-1.5 text-[9px] opacity-60">{p.size || '---'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </Modal>
  );
};

export default ProductSelectionModal;