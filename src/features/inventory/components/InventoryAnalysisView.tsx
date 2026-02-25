import React, { useMemo } from 'react';
import { TrendingUp, AlertTriangle, ArrowUpRight, Calendar, Zap, Lightbulb, Package, Loader2, DollarSign, Activity, BellRing } from 'lucide-react';
import { Product } from '../types';
import { aiInventoryService } from '../services/aiInventoryService';
import InventoryStats from './InventoryStats';
import { formatCurrency, formatNumberDisplay } from '../../../core/utils';
import Card from '../../../ui/base/Card';
import { cn } from '../../../core/utils';
import { LucideIcon } from 'lucide-react';

interface Props {
  stats: any;
  products: Product[];
  isLoading: boolean;
}

const InsightCard: React.FC<{title: string, icon: LucideIcon, iconClass: string, children: React.ReactNode}> = ({ title, icon: Icon, iconClass, children }) => (
    <Card className="flex flex-col p-0 rounded-none">
        <div className={cn("p-3 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2", iconClass.replace('text-','bg-') + '/10')}>
            <Icon size={14} className={iconClass} />
            <h3 className="text-[10px] font-black uppercase tracking-widest">{title}</h3>
        </div>
        <div className="flex-1 p-2 space-y-1.5">
            {children}
        </div>
    </Card>
);

const InsightItem: React.FC<{title: string, value: string | number, valueLabel: string, valueClass?: string, onAction?: () => void}> = ({ title, value, valueLabel, valueClass, onAction }) => (
    <div onClick={onAction} className={cn("flex justify-between items-center p-2 group transition-colors", onAction && "cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50")}>
        <span className="text-[10px] font-bold text-gray-700 dark:text-slate-200 truncate pr-2">{title}</span>
        <div className="flex items-center gap-1.5 text-[8px] font-bold text-gray-400">
            <span>{valueLabel}:</span>
            <span dir="ltr" className={cn("font-mono font-black text-xs", valueClass)}>{value}</span>
        </div>
    </div>
);


const InventoryAnalysisView: React.FC<Props> = ({ stats, products, isLoading }) => {
    
  const restockItems = useMemo(() => {
    return products
        .filter(p => p.isLowStock)
        .sort((a,b) => (a.min_stock_level - a.stock_quantity) - (b.min_stock_level - b.stock_quantity))
        .slice(0, 5);
  }, [products]);

  const stagnantItems = useMemo(() => {
      return aiInventoryService.detectStagnantItems(products, 180).slice(0, 5);
  }, [products]);

  const topMovers = useMemo(() => {
      return [...products].sort((a, b) => b.total_sales_qty - a.total_sales_qty).slice(0, 5);
  }, [products]);
  
  const topProfitMakers = useMemo(() => {
      return [...products].sort((a, b) => b.total_profit - a.total_profit).slice(0, 5);
  }, [products]);


  if (isLoading) {
    return <div className="p-20 text-center animate-pulse text-xs font-black text-gray-400 uppercase tracking-widest">جاري تحليل بيانات المخزون...</div>;
  }

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <InventoryStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
        {/* Action Center Column */}
        <div className="space-y-3">
            <InsightCard title="توصيات إعادة التخزين" icon={BellRing} iconClass="text-amber-500">
                {restockItems.length > 0 ? restockItems.map(p => (
                    <InsightItem 
                        key={p.id}
                        title={p.name}
                        valueLabel="اطلب"
                        value={aiInventoryService.calculateOptimalReorder(p)}
                        valueClass="text-amber-600"
                    />
                )) : <p className="p-4 text-center text-[10px] font-bold text-gray-400">لا توجد نواقص حرجة حالياً</p>}
            </InsightCard>
            
            <InsightCard title="المخزون الراكد (180+ يوم)" icon={Package} iconClass="text-rose-500">
                {stagnantItems.length > 0 ? stagnantItems.map(p => (
                    <InsightItem 
                        key={p.id}
                        title={p.name}
                        valueLabel="الكمية"
                        value={formatNumberDisplay(p.stock_quantity)}
                        valueClass="text-rose-600"
                    />
                )) : <p className="p-4 text-center text-[10px] font-bold text-gray-400">لا يوجد مخزون راكد</p>}
            </InsightCard>
        </div>

        {/* Performance Column */}
        <div className="space-y-3">
            <InsightCard title="الأصناف الأكثر حركة (مبيعات)" icon={Activity} iconClass="text-blue-500">
                {topMovers.map(p => (
                    <InsightItem 
                        key={p.id}
                        title={p.name}
                        valueLabel="بيع"
                        value={`${formatNumberDisplay(p.total_sales_qty)} قطعة`}
                        valueClass="text-blue-600"
                    />
                ))}
            </InsightCard>

            <InsightCard title="رواد الربحية" icon={DollarSign} iconClass="text-emerald-500">
                {topProfitMakers.map(p => (
                    <InsightItem 
                        key={p.id}
                        title={p.name}
                        valueLabel="ربح"
                        value={formatCurrency(p.total_profit)}
                        valueClass="text-emerald-600"
                    />
                ))}
            </InsightCard>
        </div>
      </div>
    </div>
  );
};

export default InventoryAnalysisView;