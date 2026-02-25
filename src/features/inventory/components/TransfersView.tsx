import React, { useState, useMemo } from 'react';
import { ArrowLeftRight, Plus, Sparkles, AlertTriangle, TrendingUp, Package, ArrowRight, Warehouse as WarehouseIcon, CheckCircle } from 'lucide-react';
import NewTransferModal from './NewTransferModal';
import { useTransfers, useWarehouses } from '../hooks/useInventoryManagement';
import { useProducts } from '../hooks/useProducts';
import ExcelTable from '../../../ui/common/ExcelTable';
import EmptyState from '../../../ui/base/EmptyState';
import TableSkeleton from '../../../ui/base/TableSkeleton';
import { cn } from '../../../core/utils';

interface SmartSuggestion {
  productName: string;
  productId: string;
  fromWarehouse: string;
  fromWarehouseId: string;
  toWarehouse: string;
  toWarehouseId: string;
  fromQty: number;
  toQty: number;
  suggestedQty: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

const TransfersView: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: transfers, isLoading } = useTransfers();
  const { data: warehouses } = useWarehouses();
  const { products } = useProducts('');
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  /** 
   * Smart suggestions engine:
   * Analyze stock distribution across warehouses and suggest transfers
   * when a product is low/out-of-stock in one warehouse but available in another.
   */
  const smartSuggestions = useMemo<SmartSuggestion[]>(() => {
    if (!products || products.length === 0 || !warehouses || warehouses.length < 2) return [];

    const suggestions: SmartSuggestion[] = [];
    const whMap = new Map<string, string>();
    (warehouses as any[]).forEach((w: any) => whMap.set(w.id, w.name || w.name_ar));

    for (const product of products) {
      const dist = product.warehouse_distribution || [];
      if (dist.length < 2) continue;

      for (const target of dist) {
        // Target warehouse is low stock
        if (target.quantity <= (product.min_stock_level || 5)) {
          // Find a source warehouse with surplus
          const source = dist.find(d =>
            d.warehouse_id !== target.warehouse_id &&
            d.quantity > (product.min_stock_level || 5) * 2
          );

          if (source) {
            const suggestedQty = Math.min(
              Math.floor(source.quantity / 3), // Transfer a third
              Math.max(1, (product.min_stock_level || 5) - target.quantity) // Or the deficit
            );

            if (suggestedQty > 0) {
              const key = `${product.id}-${source.warehouse_id}-${target.warehouse_id}`;
              if (!dismissedSuggestions.has(key)) {
                suggestions.push({
                  productName: product.name,
                  productId: product.id,
                  fromWarehouse: source.warehouse_name || whMap.get(source.warehouse_id) || 'مستودع',
                  fromWarehouseId: source.warehouse_id,
                  toWarehouse: target.warehouse_name || whMap.get(target.warehouse_id) || 'مستودع',
                  toWarehouseId: target.warehouse_id,
                  fromQty: source.quantity,
                  toQty: target.quantity,
                  suggestedQty,
                  reason: target.quantity === 0 ? 'نفاد مخزون' : 'مخزون منخفض',
                  priority: target.quantity === 0 ? 'high' : target.quantity <= 2 ? 'medium' : 'low'
                });
              }
            }
          }
        }
      }
    }

    // Sort by priority
    return suggestions.sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 };
      return p[a.priority] - p[b.priority];
    }).slice(0, 8); // Max 8 suggestions
  }, [products, warehouses, dismissedSuggestions]);

  const stats = useMemo(() => ({
    total: transfers?.length || 0,
    thisMonth: (transfers || []).filter((t: any) => {
      const d = new Date(t.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
    totalItems: (transfers || []).reduce((s: number, t: any) => s + (Number(t.item_count) || 0), 0),
    warehouseCount: warehouses?.length || 0
  }), [transfers, warehouses]);

  const priorityColors = {
    high: 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20',
    medium: 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20',
    low: 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20'
  };

  const priorityBadges = {
    high: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
    low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
  };

  const columns = [
    { header: '#', accessor: (row: any) => <span className="font-mono font-bold text-gray-400">{row.transfer_number || '-'}</span>, width: 'w-24' },
    {
      header: 'من مستودع', accessor: (row: any) => (
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-rose-500"></div>
          <span className="font-bold text-rose-600 dark:text-rose-400">{row.from_warehouse_name}</span>
        </div>
      ), sortKey: 'from_warehouse_name'
    },
    {
      header: 'إلى مستودع', accessor: (row: any) => (
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">{row.to_warehouse_name}</span>
        </div>
      ), sortKey: 'to_warehouse_name'
    },
    {
      header: 'التاريخ', accessor: (row: any) => (
        <span className="text-gray-600 dark:text-gray-400 font-mono text-[10px]">
          {new Date(row.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      ), width: 'w-32', sortKey: 'created_at'
    },
    {
      header: 'الأصناف', accessor: (row: any) => (
        <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full text-[10px] font-black">
          {row.item_count} أصناف
        </span>
      ), className: 'text-center', width: 'w-24'
    },
    {
      header: 'الحالة',
      accessor: (row: any) => (
        <span className={cn(
          "px-2.5 py-1 rounded-full text-[9px] font-black flex items-center gap-1 w-fit mx-auto",
          row.status === 'completed'
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
            : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
        )}>
          {row.status === 'completed' ? <><CheckCircle size={10} /> مكتملة</> : <><AlertTriangle size={10} /> معلقة</>}
        </span>
      ),
      className: 'text-center',
      width: 'w-28'
    },
  ];

  if (isLoading) return <TableSkeleton rows={5} cols={6} />;

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي المناقلات', value: stats.total, icon: ArrowLeftRight, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
          { label: 'هذا الشهر', value: stats.thisMonth, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
          { label: 'أصناف منقولة', value: stats.totalItems, icon: Package, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' },
          { label: 'المستودعات', value: stats.warehouseCount, icon: WarehouseIcon, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-3 flex items-center gap-3 shadow-sm">
            <div className={cn("p-2 rounded-lg", s.color)}>
              <s.icon size={16} />
            </div>
            <div>
              <span className="text-[9px] font-black text-gray-400 uppercase block">{s.label}</span>
              <span className="text-lg font-black font-mono text-gray-800 dark:text-gray-100">{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Smart Suggestions */}
      {smartSuggestions.length > 0 && (
        <div className="bg-gradient-to-l from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-600 rounded-lg text-white shadow">
                <Sparkles size={14} />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-800 dark:text-gray-100">اقتراحات ذكية للمناقلة</h3>
                <p className="text-[10px] text-gray-500 font-bold">بناءً على تحليل توزيع المخزون بين المستودعات</p>
              </div>
            </div>
            <span className="text-[9px] font-black bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-full">
              {smartSuggestions.length} اقتراح
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {smartSuggestions.map((s, i) => (
              <div key={i} className={cn("rounded-xl border p-3 transition-all hover:shadow-md", priorityColors[s.priority])}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-gray-800 dark:text-gray-100 truncate">{s.productName}</p>
                    <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded mt-1 inline-block", priorityBadges[s.priority])}>
                      {s.reason}
                    </span>
                  </div>
                  <span className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400 shrink-0">
                    {s.suggestedQty}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600 dark:text-gray-400 mb-2.5">
                  <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 px-1.5 py-0.5 rounded">{s.fromWarehouse} ({s.fromQty})</span>
                  <ArrowRight size={10} className="text-gray-400 shrink-0" />
                  <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded">{s.toWarehouse} ({s.toQty})</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex-1 text-center py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-lg transition-colors shadow-sm"
                  >
                    تنفيذ المناقلة
                  </button>
                  <button
                    onClick={() => setDismissedSuggestions(prev => new Set(prev).add(`${s.productId}-${s.fromWarehouseId}-${s.toWarehouseId}`))}
                    className="py-1.5 px-2 text-[10px] font-bold text-gray-400 hover:text-gray-600 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-gray-200 dark:border-slate-700 transition-colors"
                  >
                    تجاهل
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Button + Table */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-[11px] font-black active:scale-95 flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus size={16} strokeWidth={3} />
          <span>مناقلة جديدة</span>
        </button>
      </div>

      {!isLoading && transfers?.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="لا توجد عمليات مناقلة"
          description="لم يتم تسجيل أي عمليات نقل بضاعة بين المستودعات بعد. ابدأ بإنشاء أول عملية مناقلة."
        />
      ) : (
        <ExcelTable
          columns={columns}
          data={transfers || []}
          colorTheme="green"
          title="سجل المناقلات المخزنية"
          subtitle={`${stats.total} عملية مسجلة • ${stats.totalItems} صنف تم نقله`}
        />
      )}

      <NewTransferModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default TransfersView;