import React from 'react';
import { Warehouse, Wallet, Layers, Box, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatNumberDisplay } from '../../../../core/utils';
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
        return products.filter((p: any) => p.stock_quantity <= ((p).min_stock_level || 5)).length;
    }, [products]);

    if (!warehouse) return null;

    return (
        <div className="flex flex-col h-full gap-2 overflow-hidden">
            {/* Header info bar */}
            <div className="flex items-center justify-between bg-gray-50/50 dark:bg-slate-900/50 p-2 rounded-lg border border-[var(--app-border)]/50 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-md">
                        <Warehouse size={14} />
                    </div>
                    <div>
                        <h3 className="text-xs font-extrabold text-[var(--app-text)]">{warehouse.name_ar}</h3>
                        <p className="text-[9px] font-bold text-[var(--app-text-secondary)]">{warehouse.location || 'عنوان غير متوفر'}</p>
                    </div>
                </div>
                <div className="text-left">
                    <span className="text-[8px] font-bold text-[var(--app-text-secondary)] uppercase tracking-wider">قيمة المخزون</span>
                    <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatCurrency(Number(warehouse.stockValue || 0))}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 shrink-0">
                <StatCard
                    title="قيمة المخزون"
                    value={formatCurrency(Number(warehouse.stockValue || 0))}
                    icon={Wallet}
                    colorClass="text-emerald-500 text-[10px]"
                    iconBgClass="bg-emerald-500"
                    variant="compact"
                />
                <StatCard
                    title="الأصناف الفريدة"
                    value={formatNumberDisplay(Number(warehouse.itemCount || 0))}
                    icon={Layers}
                    colorClass="text-blue-500 text-[10px]"
                    iconBgClass="bg-blue-500"
                    variant="compact"
                />
                <StatCard
                    title="إجمالي القطع"
                    value={formatNumberDisplay(Number(warehouse.totalStock || 0))}
                    icon={Box}
                    colorClass="text-indigo-500 text-[10px]"
                    iconBgClass="bg-indigo-500"
                    variant="compact"
                />
                <StatCard
                    title="نواقص المخزون"
                    value={formatNumberDisplay(lowStockCount)}
                    icon={AlertTriangle}
                    colorClass="text-rose-500 text-[10px]"
                    iconBgClass="bg-rose-500"
                    variant="compact"
                />
            </div>

            {/* Products table list card */}
            <div className="flex-1 min-h-0 border border-[var(--app-border)]/50 rounded-lg overflow-hidden flex flex-col bg-white dark:bg-slate-900">
                <div className="flex-1 overflow-hidden">
                    <WarehouseProductList
                        products={(products || [])}
                        isLoading={isLoadingProducts}
                    />
                </div>
            </div>
        </div>
    );
};

export default WarehouseDetailView;