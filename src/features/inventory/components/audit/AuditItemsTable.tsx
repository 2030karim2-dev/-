
import React from 'react';
import { useFieldArray, UseFormRegister, Control } from 'react-hook-form';
import { formatNumberDisplay } from '../../../../core/utils';
import { cn } from '../../../../core/utils';

interface Props {
    fields: any[];
    register: UseFormRegister<any>;
    filter: string;
    isCompleted: boolean;
}

const AuditItemsTable: React.FC<Props> = ({ fields, register, filter, isCompleted }) => {

    const filteredFields = fields.filter(field => {
        const product = field.products;
        if (!product) return false;
        const term = filter.toLowerCase();
        return product.name.toLowerCase().includes(term) || product.sku.toLowerCase().includes(term);
    });

    return (
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-right text-[10px]">
                <thead className="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-black border-b-2 border-gray-200 dark:border-slate-700 uppercase tracking-widest">
                    <tr>
                        <th className="p-2 w-8 text-center">#</th>
                        <th className="p-2">الصنف</th>
                        <th className="p-2 text-center w-24">الكمية الدفترية</th>
                        <th className="p-2 text-center w-32">الكمية الفعلية</th>
                        <th className="p-2 text-center w-24">الفرق</th>
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
                                diff !== null && diff !== 0 ? (diff > 0 ? "bg-emerald-50/20" : "bg-rose-50/20") : "hover:bg-gray-50/50"
                            )}>
                                <td className="p-2 text-center font-mono text-gray-400">{index + 1}</td>
                                <td className="p-2">
                                    <p className="font-bold text-gray-800 dark:text-slate-200">{product.name}</p>
                                    <p className="text-gray-400 font-mono text-[9px]">{product.sku}</p>
                                </td>
                                <td className="p-2 text-center font-mono font-bold text-blue-600 text-lg">
                                    {formatNumberDisplay(field.expected_quantity)}
                                </td>
                                <td className="p-1 text-center">
                                    <input 
                                        type="number"
                                        {...register(`items.${field.index}.counted_quantity`, { valueAsNumber: true })}
                                        className="w-full h-12 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-lg text-center font-mono font-black text-xl text-gray-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:bg-white"
                                        readOnly={isCompleted}
                                    />
                                </td>
                                <td className={cn(
                                    "p-2 text-center font-mono font-black text-lg",
                                    diff === null ? 'text-gray-400' : (diff > 0 ? 'text-emerald-500' : (diff < 0 ? 'text-rose-500' : 'text-gray-500'))
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