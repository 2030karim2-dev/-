import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../../inventory/api';
import { formatCurrency, formatNumberDisplay } from '../../../core/utils';
import { FileDown, Filter, AlertTriangle, PackageX } from 'lucide-react';
import * as XLSX from 'xlsx';

const DeadStockReport: React.FC = () => {
    const [daysThreshold, setDaysThreshold] = useState(90);

    const { data: deadStock, isLoading, isError } = useQuery({
        queryKey: ['dead_stock', daysThreshold],
        queryFn: () => inventoryApi.getDeadStock(daysThreshold)
    });

    const exportToExcel = () => {
        if (!deadStock?.data) return;

        const data = deadStock.data.map((item: any) => ({
            'المنتج': item.name_ar,
            'رقم القطعة': item.part_number,
            'الكمية': item.stock_quantity,
            'تكلفة الوحدة': item.cost_price,
            'القيمة الإجمالية': item.total_value,
            'تاريخ آخر بيع': item.last_sale_date ? new Date(item.last_sale_date).toLocaleDateString('en-GB') : 'لا يوجد',
            'يوم منذ آخر بيع': item.days_since_last_sale || '-'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Dead Stock");
        XLSX.writeFile(wb, `DeadStock_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const totalDeadValue = deadStock?.data?.reduce((sum: number, item: any) => sum + (Number(item.total_value) || 0), 0) || 0;
    const totalDeadItems = deadStock?.data?.length || 0;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <PackageX className="text-rose-600" />
                        تحليل المخزون الراكد (Dead Stock)
                    </h1>
                    <p className="text-gray-500 mt-1">عرض الأصناف التي لم يتم بيعها لفترة طويلة</p>
                </div>
                <button
                    onClick={exportToExcel}
                    disabled={!deadStock?.data?.length}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FileDown size={18} />
                    تصدير إكسيل
                </button>
            </div>

            {/* Filters & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 shadow-sm col-span-1 md:col-span-2 flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 dark:bg-slate-800 rounded-xl text-indigo-600">
                        <Filter size={24} />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1">فترة الركود (أيام)</label>
                        <select
                            value={daysThreshold}
                            onChange={(e) => setDaysThreshold(Number(e.target.value))}
                            className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value={30}>أكثر من 30 يوم</option>
                            <option value={60}>أكثر من 60 يوم</option>
                            <option value={90}>أكثر من 90 يوم</option>
                            <option value={180}>أكثر من 180 يوم</option>
                            <option value={365}>أكثر من سنة</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 shadow-sm border-r-4 border-r-rose-500">
                    <p className="text-xs font-black text-gray-400 uppercase mb-1">قيمة المخزون الراكد</p>
                    <h3 className="text-2xl font-black text-rose-600 font-mono" dir="ltr">{formatCurrency(totalDeadValue)}</h3>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 shadow-sm border-r-4 border-r-orange-500">
                    <p className="text-xs font-black text-gray-400 uppercase mb-1">عدد الأصناف الراكدة</p>
                    <h3 className="text-2xl font-black text-gray-800 dark:text-white font-mono" dir="ltr">{formatNumberDisplay(totalDeadItems)}</h3>
                </div>
            </div>

            {/* Warning if RPC fails */}
            {isError && (
                <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl border border-yellow-200 flex items-center gap-3">
                    <AlertTriangle />
                    <div>
                        <h4 className="font-bold">تنبيه قاعدة البيانات</h4>
                        <p className="text-sm">لم يتم العثور على الدالة البرمجية `get_dead_stock`. يرجى التأكد من تشغيل ملف الترحيل (Migration) الجديد.</p>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-black">
                            <tr>
                                <th className="px-6 py-4">المنتج</th>
                                <th className="px-6 py-4">رقم القطعة</th>
                                <th className="px-6 py-4">الكمية</th>
                                <th className="px-6 py-4">التكلفة</th>
                                <th className="px-6 py-4">القيمة الإجمالية</th>
                                <th className="px-6 py-4">آخر بيع</th>
                                <th className="px-6 py-4">يوم منذ آخر بيع</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {isLoading ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">جاري تحميل البيانات...</td></tr>
                            ) : deadStock?.data?.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">لا توجد أصناف راكدة لهذه الفترة! 🎉</td></tr>
                            ) : (
                                deadStock?.data?.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                            {item.name_ar}
                                            <div className="text-[10px] font-mono text-gray-400 font-normal">{item.sku}</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">{item.part_number || '-'}</td>
                                        <td className="px-6 py-4 font-mono font-bold text-indigo-600" dir="ltr">{formatNumberDisplay(item.stock_quantity)}</td>
                                        <td className="px-6 py-4 font-mono text-xs" dir="ltr">{formatCurrency(item.cost_price)}</td>
                                        <td className="px-6 py-4 font-mono font-bold text-rose-600" dir="ltr">{formatCurrency(item.total_value)}</td>
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                            {item.last_sale_date ? new Date(item.last_sale_date).toLocaleDateString('en-GB') : <span className="text-orange-500">لم يباع أبداً</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 px-2 py-1 rounded-lg text-xs font-bold font-mono">
                                                {item.days_since_last_sale || '∞'} يوم
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DeadStockReport;
