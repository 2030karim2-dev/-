import React from 'react';
import { Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../../api';
import { formatNumberDisplay } from '../../../../core/utils';
import { cn } from '../../../../core/utils';

interface Props {
    productId: string;
}

const HistorySection: React.FC<Props> = ({ productId }) => {
    const { data: movements, isLoading } = useQuery({
        queryKey: ['product_movements', productId],
        queryFn: () => inventoryApi.getProductMovements(productId)
    });

    return (
        <div className="col-span-1 lg:col-span-2 bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800">
            <h4 className="text-[10px] font-black text-gray-400 uppercase mb-3 flex items-center gap-1.5"><Calendar size={12} /> آخر الحركات (History)</h4>
            <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead>
                        <tr className="text-[10px] text-gray-400 border-b dark:border-slate-800">
                            <th className="pb-2 font-black">التاريخ</th>
                            <th className="pb-2 font-black">النوع</th>
                            <th className="pb-2 font-black">الكمية</th>
                            <th className="pb-2 font-black">المستودع</th>
                        </tr>
                    </thead>
                    <tbody className="text-xs font-bold text-gray-600 dark:text-gray-300">
                        {isLoading ? (
                            <tr><td colSpan={4} className="py-4 text-center">جاري التحميل...</td></tr>
                        ) : movements?.data?.slice(0, 5).map((mov: any) => (
                            <tr key={mov.id} className="border-b dark:border-slate-800 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                <td className="py-2 font-mono text-[10px]">{new Date(mov.created_at).toLocaleDateString('en-GB')}</td>
                                <td className="py-2">
                                    <span className={cn(
                                        "px-1.5 py-0.5 rounded text-[10px]",
                                        mov.transaction_type === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                    )}>
                                        {mov.transaction_type === 'in' ? 'إدخال' : 'إخراج'}
                                    </span>
                                </td>
                                <td dir="ltr" className="py-2 font-mono">{formatNumberDisplay(mov.quantity)}</td>
                                <td className="py-2 text-[10px] text-gray-500">-</td>
                            </tr>
                        )) || <tr><td colSpan={4} className="py-4 text-center text-gray-400">لا توجد حركات</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HistorySection;
