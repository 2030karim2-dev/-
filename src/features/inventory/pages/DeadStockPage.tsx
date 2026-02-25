import React, { useState } from 'react';
import { useTranslation } from '../../../lib/hooks/useTranslation';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../api';
import { formatCurrency, formatNumberDisplay } from '../../../core/utils';
import { Archive, TrendingDown, DollarSign, Filter } from 'lucide-react';
import { cn } from '../../../core/utils';
import PageLoader from '../../../ui/base/PageLoader';

const DeadStockPage = () => {
    const [daysThreshold, setDaysThreshold] = useState(90);
    const { t } = useTranslation();

    const { data: deadStock, isLoading } = useQuery({
        queryKey: ['dead-stock', daysThreshold],
        queryFn: () => inventoryApi.getDeadStock(daysThreshold)
    });

    const totalDeadStockValue = (Array.isArray(deadStock?.data) ? deadStock.data : []).reduce((sum: number, item: any) => sum + (Number(item.total_value) || 0), 0);
    const totalDeadStockItems = (Array.isArray(deadStock?.data) ? deadStock.data : []).reduce((sum: number, item: any) => sum + (Number(item.stock_quantity) || 0), 0);

    if (isLoading) return <PageLoader />;

    return (
        <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                        <Archive size={28} />
                    </div>
                    <div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white">{t('dead_stock_analysis')}</h1>
                            <p className="text-sm font-medium text-gray-500">{t('dead_stock_desc')}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 p-1.5 rounded-xl border dark:border-slate-700">
                    {[60, 90, 180, 365].map(days => (
                        <button
                            key={days}
                            onClick={() => setDaysThreshold(days)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                daysThreshold === days
                                    ? "bg-white dark:bg-slate-700 text-amber-600 shadow-sm"
                                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            )}
                        >
                            {days} {t('days')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400">{t('dead_stock_value')}</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white">{formatCurrency(totalDeadStockValue)}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 flex items-center gap-4">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                        <Archive size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400">{t('dead_stock_count')}</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white">{formatNumberDisplay(totalDeadStockItems)}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Filter size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400">{t('items_count')}</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white">{deadStock?.data?.length || 0}</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 flex flex-col overflow-hidden">
                {!deadStock?.data || deadStock.data.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <TrendingDown size={48} className="mb-4 opacity-20" />
                        <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300">{t('excellent_no_dead_stock')}</h3>
                        <p className="text-sm">{t('all_products_moving', { days: daysThreshold.toString() })}</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-right">
                            <thead className="bg-gray-50 dark:bg-slate-800 sticky top-0 z-10 text-xs font-black text-gray-500">
                                <tr>
                                    <th className="p-4 rounded-tr-xl">{t('product')}</th>
                                    <th className="p-4">{t('quantity')}</th>
                                    <th className="p-4">{t('purchase_cost')}</th>
                                    <th className="p-4">{t('last_sale')}</th>
                                    <th className="p-4 rounded-tl-xl">{t('days_elapsed')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-slate-800">
                                {(Array.isArray(deadStock?.data) ? deadStock.data : []).map((item: any) => (
                                    <tr key={item.id} className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors group">
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900 dark:text-white">{item.name_ar}</div>
                                            <div className="text-xs font-mono text-gray-500 flex gap-2">
                                                <span>{item.part_number}</span>
                                                {item.sku && <span className="text-gray-300">|</span>}
                                                <span>{item.sku}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold text-gray-700 dark:text-gray-300">
                                            {formatNumberDisplay(item.stock_quantity)}
                                        </td>
                                        <td className="p-4 font-bold text-gray-700 dark:text-gray-300">
                                            {formatCurrency(item.total_value)}
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">
                                            {item.last_sale_date ? new Date(item.last_sale_date).toLocaleDateString('ar-SA') : t('never_sold')}
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 rounded-lg bg-red-100 text-red-700 font-bold text-xs">
                                                {item.days_since_last_sale ? `${item.days_since_last_sale} ${t('days')}` : t('never_sold')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeadStockPage;
