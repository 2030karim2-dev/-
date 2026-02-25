
import React, { useState, useMemo } from 'react';
import { Layers, Plus, Trash2, Box, TrendingUp, Search, DollarSign, AlertCircle, BarChart3 } from 'lucide-react';
import { useInventoryCategories, useInventoryCategoryMutations } from '../hooks';
import Button from '../../../ui/base/Button';
import Spinner from '../../../ui/base/Spinner';
import { formatNumberDisplay, formatCurrency } from '../../../core/utils';
import { cn } from '../../../core/utils';

interface Props {
    onFilterProduct: (catName: string) => void;
}

const CategoriesManagementView: React.FC<Props> = ({ onFilterProduct }) => {
    const { data: categories, isLoading } = useInventoryCategories();
    const { createCategory, deleteCategory, isCreating } = useInventoryCategoryMutations();
    const [newCatName, setNewCatName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCategories = useMemo(() => {
        if (!categories) return [];
        if (!searchQuery) return categories;
        return categories.filter((c: any) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [categories, searchQuery]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCatName.trim()) return;
        createCategory(newCatName, { onSuccess: () => setNewCatName('') });
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Spinner size="lg" />
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">تحميل الأقسام...</span>
        </div>
    );

    const totalProducts = categories?.reduce((sum: number, c: any) => sum + (c.productsCount || 0), 0) || 0;
    const alertedCategories = categories?.filter((c: any) => c.hasAlert).length || 0;

    return (
        <div className="space-y-2 animate-in fade-in duration-500">

            {/* Micro Analytics Summary */}
            <div className="grid grid-cols-3 gap-1.5">
                <div className="bg-white dark:bg-slate-900 p-2 border border-gray-100 dark:border-slate-800 rounded-none flex items-center gap-2">
                    <div className="p-1.5 bg-blue-600 text-white rounded shadow-md"><Layers size={12} /></div>
                    <div className="min-w-0">
                        <p className="text-[7px] font-black text-gray-400 uppercase leading-none mb-0.5">الأقسام</p>
                        <h4 className="text-[10px] font-black dark:text-white truncate">{categories?.length || 0}</h4>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 border border-gray-100 dark:border-slate-800 rounded-none flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-600 text-white rounded shadow-md"><Box size={12} /></div>
                    <div className="min-w-0">
                        <p className="text-[7px] font-black text-gray-400 uppercase leading-none mb-0.5">الأصناف</p>
                        <h4 className="text-[10px] font-black dark:text-white truncate">{formatNumberDisplay(totalProducts)}</h4>
                    </div>
                </div>
                <div className="bg-slate-900 p-2 rounded-none border-r-2 border-amber-500 flex items-center gap-2">
                    <div className="p-1.5 bg-amber-500 text-white rounded"><AlertCircle size={12} /></div>
                    <div className="min-w-0">
                        <p className="text-[7px] font-black text-amber-500 uppercase leading-none mb-0.5">تنبيهات</p>
                        <h4 className="text-[10px] font-black text-white truncate">{alertedCategories}</h4>
                    </div>
                </div>
            </div>

            {/* Control Bar: Slim Version */}
            <div className="flex flex-col md:flex-row gap-1.5 bg-white dark:bg-slate-900 p-1.5 border border-gray-100 dark:border-slate-800 shadow-sm">
                <form onSubmit={handleAdd} className="flex-1 flex gap-1.5">
                    <div className="relative flex-1">
                        <Layers className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                        <input
                            type="text"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            placeholder="إضافة قسم جديد..."
                            className="w-full bg-gray-50 dark:bg-slate-800 border-none py-2 pr-8 text-[10px] font-black outline-none focus:ring-1 focus:ring-blue-500/20 dark:text-white"
                        />
                    </div>
                    <Button type="submit" isLoading={isCreating} size="sm" className="px-3 rounded-none text-[9px]">حفظ</Button>
                </form>
                <div className="relative md:w-48">
                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="بحث سريع..."
                        className="w-full bg-gray-50 dark:bg-slate-800 border-none py-2 pr-8 text-[9px] font-bold outline-none dark:text-white"
                    />
                </div>
            </div>

            {/* High-Density Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {filteredCategories.map((cat: any) => (
                    <div key={cat.id} className="group relative bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-none p-2.5 transition-all hover:border-blue-500/40 hover:shadow-lg active:scale-[0.99] overflow-hidden flex flex-col justify-between min-h-[120px]">

                        {cat.hasAlert && (
                            <div className="absolute top-0 left-0 w-8 h-8 bg-rose-500 text-white flex items-center justify-center -translate-x-4 -translate-y-4 rotate-45 shadow-sm">
                                <AlertCircle size={7} className="-rotate-45 translate-x-0.5 translate-y-0.5" />
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-none border border-blue-100 dark:border-blue-800 group-hover:scale-105 transition-transform shrink-0">
                                    <Layers size={14} />
                                </div>
                                <div className="truncate">
                                    <h4 className="text-[11px] font-black text-gray-800 dark:text-slate-100 uppercase tracking-tighter truncate leading-none">{cat.name}</h4>
                                    <span className="text-[6px] font-bold text-gray-400 uppercase tracking-widest leading-none">SEGMENT</span>
                                </div>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); if (confirm('حذف القسم؟')) deleteCategory(cat.id); }}
                                className="p-1 text-gray-300 hover:text-rose-500 transition-colors shrink-0"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>

                        {/* Micro Metrics */}
                        <div className="grid grid-cols-3 gap-0.5 mb-2 border-y border-gray-50 dark:border-slate-800 py-1.5">
                            <div className="text-center">
                                <span className="text-[6px] font-black text-gray-400 uppercase block mb-0.5">أصناف</span>
                                <span className="text-[10px] font-black text-blue-600 font-mono leading-none">{cat.productsCount || 0}</span>
                            </div>
                            <div className="text-center border-x border-gray-100 dark:border-slate-800">
                                <span className="text-[6px] font-black text-gray-400 uppercase block mb-0.5">كمية</span>
                                <span className="text-[10px] font-black text-emerald-600 font-mono leading-none">{cat.totalStock || 0}</span>
                            </div>
                            <div className="text-center min-w-0">
                                <span className="text-[6px] font-black text-gray-400 uppercase block mb-0.5">القيمة</span>
                                <span dir="ltr" className="text-[9px] font-black text-gray-600 dark:text-gray-300 font-mono truncate block leading-none">
                                    {Math.round(cat.totalValue || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => onFilterProduct(cat.name)}
                            className="w-full py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 group/btn"
                        >
                            تحليل
                            <TrendingUp size={10} className="group-hover/btn:translate-x-[-2px] transition-transform" />
                        </button>
                    </div>
                ))}

                {filteredCategories.length === 0 && (
                    <div className="col-span-full p-12 text-center border-2 border-dashed dark:border-slate-800 flex flex-col items-center gap-2">
                        <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-full text-gray-200"><BarChart3 size={32} /></div>
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">لا توجد نتائج</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoriesManagementView;
