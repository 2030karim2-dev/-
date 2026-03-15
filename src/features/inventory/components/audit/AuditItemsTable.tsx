
import React from 'react';
import {  UseFormRegister } from 'react-hook-form';
import { formatNumberDisplay } from '../../../../core/utils';
import { cn } from '../../../../core/utils';

interface Props {
    items: any[];
    register: UseFormRegister<any>;
    filter: string;
    category?: string | null;
    isCompleted: boolean;
}

const AuditItemsTable: React.FC<Props> = ({ items, register, filter, category, isCompleted }) => {

    const filteredFields = items.map((item, index) => ({ ...item, index })).filter(field => {
        const product = field.products;
        if (!product) return false;
        
        const term = filter.toLowerCase();
        const matchesSearch = !filter || 
            (product.name?.toLowerCase().includes(term) || 
             product.sku?.toLowerCase().includes(term) ||
             product.part_number?.toLowerCase().includes(term));
             
        const matchesCategory = !category || product.category === category;
        
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden rounded-xl">
            <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 font-bold border-b-2 border-gray-200 dark:border-slate-700 uppercase tracking-widest">
                    <tr>
                        <th className="p-3 w-10 text-center border-l dark:border-slate-700">#</th>
                        <th className="p-3 border-l dark:border-slate-700 min-w-[200px]">اسم القطعة / الصنف</th>
                        <th className="p-3 border-l dark:border-slate-700 w-32 text-center">رقم القطعة</th>
                        <th className="p-3 border-l dark:border-slate-700 w-32 text-center">الشركة الصانعة</th>
                        <th className="p-3 border-l dark:border-slate-700 w-24 text-center">المقاس</th>
                        <th className="p-3 border-l dark:border-slate-700 w-32 text-center">الكمية الدفترية</th>
                        <th className="p-3 border-l dark:border-slate-700 w-40 text-center">الكمية الفعلية</th>
                        <th className="p-3 text-center w-32">الفرق</th>
                    </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                    {filteredFields.map((field, index) => {
                        const product = field.products;
                        const diff = (field.counted_quantity !== null && field.counted_quantity !== undefined)
                            ? Number(field.counted_quantity) - Number(field.expected_quantity)
                            : null;
                        
                        return (
                            <tr key={field.id} className={cn(
                                "transition-colors",
                                "border-b dark:border-slate-800",
                                diff !== null && diff !== 0 ? (diff > 0 ? "bg-emerald-50/30" : "bg-rose-50/30") : "hover:bg-gray-50/50"
                            )}>
                                <td className="p-3 text-center font-mono text-gray-500 border-l dark:border-slate-700">{index + 1}</td>
                                <td className="p-3 border-l dark:border-slate-700">
                                    <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">{product.name}</p>
                                </td>
                                <td className="p-3 text-center font-mono font-bold text-gray-700 dark:text-slate-300 border-l dark:border-slate-700">
                                    <span className={cn(!product.part_number && "text-rose-500/70 text-[10px] font-normal italic")}>
                                        {product.part_number || 'غير متوفر'}
                                    </span>
                                </td>
                                <td className="p-3 text-center font-bold text-gray-600 dark:text-slate-400 border-l dark:border-slate-700">
                                    <span className={cn(!product.brand && "text-gray-300 dark:text-slate-700 text-[10px] font-normal italic")}>
                                        {product.brand || 'غير محدد'}
                                    </span>
                                </td>
                                <td className="p-3 text-center font-mono font-bold text-gray-600 dark:text-slate-400 border-l dark:border-slate-700">
                                    <span className={cn(!product.size && "text-gray-300 dark:text-slate-700 text-[10px] font-normal italic")}>
                                        {product.size || '---'}
                                    </span>
                                </td>
                                <td className="p-3 text-center font-mono font-bold text-blue-600 text-xl border-l dark:border-slate-700">
                                    {formatNumberDisplay(field.expected_quantity)}
                                </td>
                                <td className="p-2 text-center border-l dark:border-slate-700">
                                    <input 
                                        type="number"
                                        {...register(`items.${field.index}.counted_quantity`, { valueAsNumber: true })}
                                        className="w-full h-12 bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-xl text-center font-mono font-bold text-2xl text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                        readOnly={isCompleted}
                                        placeholder="0"
                                    />
                                </td>
                                <td className={cn(
                                    "p-3 text-center font-mono font-bold text-xl",
                                    diff === null ? 'text-gray-300' : (diff > 0 ? 'text-emerald-500' : (diff < 0 ? 'text-rose-500' : 'text-gray-500'))
                                )}>
                                    {diff !== null ? (diff > 0 ? `+${diff}` : diff) : '---'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default AuditItemsTable;