import React, { useState, useMemo } from 'react';
import { useInventoryCategories } from '../../hooks';
import ExcelTable from '../../../../ui/common/ExcelTable';
import { formatNumberDisplay } from '../../../../core/utils';
import { Product } from '../../types';
import { Loader2, Layers } from 'lucide-react';

interface Props {
    products: Product[];
    isLoading: boolean;
}

const WarehouseProductList: React.FC<Props> = ({ products, isLoading }) => {
    const { data: categories } = useInventoryCategories();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const filteredProducts = useMemo(() => {
        if (selectedCategory === 'all') return products;
        return products.filter(p => p.category === selectedCategory);
    }, [products, selectedCategory]);

    const columns = [
        { header: 'اسم الصنف', accessor: (row: any) => <span className="font-bold text-gray-800 dark:text-slate-100 text-sm whitespace-pre-wrap">{row.name_ar || row.name || 'غير متوفر'}</span> },
        { header: 'الشركة الصانعة', accessor: (row: any) => <span className="font-bold text-gray-600 dark:text-slate-300">{row.brand || '---'}</span> },
        { header: 'SKU', accessor: (row: any) => <span className="font-mono text-gray-500 font-bold">{row.sku || '---'}</span>, width: 'w-28' },
        { header: 'رقم القطعة', accessor: (row: any) => <span className="font-mono text-gray-500 font-bold">{row.part_number || '---'}</span>, width: 'w-32' },
        {
            header: 'الكمية',
            accessor: (row: any) => formatNumberDisplay(row.stock_quantity),
            className: 'text-center font-mono font-black text-blue-600',
            width: 'w-20'
        },
        { header: 'الموقع', accessor: (row: any) => <span className="font-mono text-gray-700 dark:text-slate-300 font-bold">{row.location || '---'}</span>, className: 'text-center', width: 'w-24' },
    ];

    if (isLoading) {
        return (
            <div className="p-20 text-center flex justify-center items-center gap-2">
                <Loader2 className="animate-spin text-blue-500" />
                <span className="text-xs font-bold text-gray-400">جاري جرد الأصناف...</span>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex justify-end">
                <div className="relative w-full md:w-64">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 rounded-none py-2 pr-9 pl-3 text-[10px] font-black outline-none appearance-none focus:border-blue-500/50 transition-all dark:text-slate-200"
                    >
                        <option value="all">كل التصنيفات</option>
                        {Array.isArray(categories) && categories.map((cat: any) => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                    <Layers size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>
            <ExcelTable
                columns={columns}
                data={filteredProducts}
                title="الأصناف في المستودع الحالي"
                colorTheme="blue"
            />
        </div>
    );
};

export default WarehouseProductList;