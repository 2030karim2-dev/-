import React from 'react';
import { formatCurrency, formatNumberDisplay } from '../../../../core/utils';
import { cn } from '../../../../core/utils';

interface Props {
    warehouses: any[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

const WarehouseListSidebar: React.FC<Props> = ({ warehouses, selectedId, onSelect }) => {
    return (
        <div className="flex flex-col divide-y divide-[var(--app-border)]/60">
            {warehouses.map(wh => (
                <button
                    key={wh.id}
                    onClick={() => { onSelect(wh.id); }}
                    className={cn(
                        "text-right px-2.5 py-1.5 transition-all group relative overflow-hidden flex flex-col gap-1 w-full",
                        "hover:bg-[var(--app-surface-hover)] active:scale-[0.99]",
                        selectedId === wh.id ? "bg-blue-50 dark:bg-blue-950/20 border-r-2 border-blue-600" : ""
                    )}
                >
                    <div className="flex justify-between items-center w-full">
                        <span className={cn(
                            "text-[10px] font-bold tracking-tight transition-colors",
                            selectedId === wh.id ? "text-blue-600 dark:text-blue-400" : "text-[var(--app-text)]"
                        )}>
                            {wh.name_ar}
                        </span>
                        <span dir="ltr" className="text-[10px] font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(Number(wh.stockValue || 0))}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-bold text-[var(--app-text-secondary)] w-full">
                        <span>{wh.location || '---'}</span>
                        <div className="flex gap-2 font-mono">
                            <span><b>{formatNumberDisplay(Number(wh.itemCount || 0))}</b> صنف</span>
                            <span><b>{formatNumberDisplay(Number(wh.totalStock || 0))}</b> قطعة</span>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
};

export default WarehouseListSidebar;
