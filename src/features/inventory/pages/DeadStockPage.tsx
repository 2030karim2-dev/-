import { useState, useMemo } from 'react';
import { useTranslation } from '../../../lib/hooks/useTranslation';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../api';
import { Archive } from 'lucide-react';
import { cn } from '../../../core/utils';
import PageLoader from '../../../ui/base/PageLoader';
import DeadStockStats from '../components/dead_stock/DeadStockStats';
import DeadStockTable from '../components/dead_stock/DeadStockTable';

const DeadStockPage = () => {
    const [daysThreshold, setDaysThreshold] = useState(90);
    const { t } = useTranslation();

    const { data: deadStock, isLoading } = useQuery({
        queryKey: ['dead-stock', daysThreshold],
        queryFn: () => inventoryApi.getDeadStock(daysThreshold)
    });

    const items = useMemo(() => (Array.isArray(deadStock?.data) ? deadStock.data : []), [deadStock]);

    const stats = useMemo(() => {
        const totalValue = items.reduce((sum: number, item: any) => sum + (Number(item.total_value) || 0), 0);
        const totalItems = items.reduce((sum: number, item: any) => sum + (Number(item.stock_quantity) || 0), 0);
        return { totalValue, totalItems, uniqueItemsCount: items.length };
    }, [items]);

    if (isLoading) return <PageLoader />;

    return (
        <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500">
            {/* Micro Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-none border-b dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg">
                        <Archive size={20} />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-gray-900 dark:text-white leading-none tracking-tight">{t('dead_stock_analysis')}</h1>
                        <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{t('dead_stock_desc')}</p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800/50 p-1 rounded-lg border dark:border-slate-700">
                    {[60, 90, 180, 365].map(days => (
                        <button
                            key={days}
                            onClick={() => { setDaysThreshold(days); }}
                            className={cn(
                                "px-2.5 py-1 rounded-md text-[9px] font-black transition-all",
                                daysThreshold === days
                                    ? "bg-white dark:bg-slate-700 text-amber-600 shadow-sm"
                                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            )}
                        >
                            {days} يوم
                        </button>
                    ))}
                </div>
            </div>

            <DeadStockStats {...stats} />

            {/* Content */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 flex flex-col overflow-hidden">
                <DeadStockTable items={items} daysThreshold={daysThreshold} />
            </div>
        </div>
    );
};

export default DeadStockPage;
