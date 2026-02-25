import React from 'react';
import { Warehouse, Wallet, Layers, Box, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatNumberDisplay } from '../../../../core/utils';
import EmptyState from '../../../../ui/base/EmptyState';
import WarehouseProductList from './WarehouseProductList';
import { useWarehouseProducts } from '../../hooks/useInventoryManagement';
import StatCard from '../../../../ui/common/StatCard';

interface Props {
    warehouseId: string | null;
    warehouses: any[];
}

const WarehouseDetailView: React.FC<Props> = ({ warehouseId, warehouses }) => {

    const warehouse = warehouses.find(w => w.id === warehouseId);
    const { data: products, isLoading: isLoadingProducts } = useWarehouseProducts(warehouseId);

    const lowStockCount = React.useMemo(() => {
        if (!products) return 0;
        return products.filter(p => p.stock_quantity <= p.min_stock_level).length;
    }, [products]);

    if (!warehouse) {
        return (
            <div className="h-full flex items-center justify-center bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-none">
                <EmptyState icon={Warehouse} title="لم يتم اختيار مستودع" description="الرجاء اختيار مستودع من القائمة لعرض بياناته التفصيلية." />
            </div>
        );
    }

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="bg-white dark:bg-slate-900 rounded-none border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex-shrink-0">
                {/* Header */}
                <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-gradient-to-l from-blue-50/50 to-transparent dark:from-blue-900/10">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-xl">
                            <Warehouse size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-800 dark:text-slate-100">{warehouse.name_ar}</h2>
                            <p className="text-xs font-bold text-gray-500 mt-1">{warehouse.location || 'عنوان غير متوفر'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0">
                <StatCard
                    title="قيمة المخزون"
                    value={formatCurrency(Number(warehouse.stockValue || 0))}
                    icon={Wallet}
                    colorClass="text-emerald-500"
                    iconBgClass="bg-emerald-500"
                />
                <StatCard
                    title="الأصناف الفريدة"
                    value={formatNumberDisplay(Number(warehouse.itemCount || 0))}
                    icon={Layers}
                    colorClass="text-blue-500"
                    iconBgClass="bg-blue-500"
                />
                <StatCard
                    title="إجمالي القطع"
                    value={formatNumberDisplay(Number(warehouse.totalStock || 0))}
                    icon={Box}
                    colorClass="text-indigo-500"
                    iconBgClass="bg-indigo-500"
                />
                <StatCard
                    title="نواقص المخزون"
                    value={formatNumberDisplay(lowStockCount)}
                    icon={AlertTriangle}
                    colorClass="text-rose-500"
                    iconBgClass="bg-rose-500"
                />
            </div>

            <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-none border border-gray-100 dark:border-slate-800 shadow-sm p-4">
                <h3 className="text-sm font-black mb-4">أصناف المستودع</h3>
                <div className="h-[calc(100%-2rem)]">
                    <WarehouseProductList
                        products={products || []}
                        isLoading={isLoadingProducts}
                    />
                </div>
            </div>
        </div>
    );
};

export default WarehouseDetailView;