import React from 'react';
import { X, Box, TrendingUp, Layers, DollarSign, FileText, Hash, TrendingDown, Package, ShieldCheck, Activity } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency, formatNumberDisplay } from '../../../core/utils';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../api';

// Decomposed sub-components
import StatCard from './product_detail/StatCard';
import FitmentSection from './product_detail/FitmentSection';
import AlternativesSection from './product_detail/AlternativesSection';
import HistorySection from './product_detail/HistorySection';
import StockStatusBadge from './product_detail/StockStatusBadge';

interface Props {
    product: Product | null;
    onClose: () => void;
    onEdit?: (product: Product) => void;
}

const ProductDetailModal: React.FC<Props> = ({ product, onClose, onEdit }) => {
    if (!product) return null;

    // Fetch real-time analytics with fallback
    const { data: analytics } = useQuery({
        queryKey: ['product_analytics', product.id],
        queryFn: async () => {
            const { data, error } = await inventoryApi.getProductAnalytics(product.id);
            const safeData = data as unknown as any[];
            if (!error && safeData && safeData.length > 0) return safeData[0];

            console.warn("RPC failed or empty, using fallback calculation");
            const { data: txs } = await inventoryApi.getProductMovements(product.id);
            if (!txs) return null;

            const sales = txs.filter((t: any) => t.transaction_type === 'out').reduce((sum: number, t: any) => sum + t.quantity, 0);
            const purchases = txs.filter((t: any) => t.transaction_type === 'in').reduce((sum: number, t: any) => sum + t.quantity, 0);

            return { total_sales_qty: sales, total_purchases_qty: purchases, total_profit: 0, total_loss: 0 };
        },
        enabled: !!product.id
    });

    const stats = {
        total_sales: analytics?.total_sales_qty ?? product.total_sales_qty ?? 0,
        total_purchases: analytics?.total_purchases_qty ?? product.total_purchases_qty ?? 0,
        profit: analytics?.total_profit ?? product.total_profit ?? 0,
        loss: product.total_loss ?? 0,
    };

    const cost = Number(product.cost_price) || 0;
    const selling = Number(product.selling_price) || 0;
    const margin = cost > 0 ? ((selling - cost) / cost) * 100 : 0;

    const { data: supplierData } = useQuery({
        queryKey: ['supplier', product.supplier_id],
        queryFn: () => product.supplier_id ? inventoryApi.getSupplier(product.supplier_id) : Promise.resolve(null),
        enabled: !!product.supplier_id
    });

    const supplierName = supplierData?.data?.name || product.supplier_name || 'غير محدد';

    return (
        <div onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 transition-all duration-300">
            <div onClick={e => e.stopPropagation()} className="bg-gray-50 dark:bg-slate-950 w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col border dark:border-slate-800 animate-in zoom-in duration-300 max-h-[95vh] rounded-[2.5rem]">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600/10 text-blue-600 rounded-2xl"><Box size={28} /></div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black text-gray-900 dark:text-slate-100 leading-tight">{product.name}</h2>
                                <StockStatusBadge quantity={product.stock_quantity} minLevel={product.min_stock_level} />
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                                <p dir="ltr" className="text-sm font-bold text-gray-400 font-mono tracking-tighter">{product.sku}</p>
                                {product.part_number && <span className="text-xs bg-gray-100 dark:bg-slate-800 px-2 rounded text-gray-500 font-mono">{product.part_number}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {onEdit && (
                            <button onClick={() => { onEdit(product); onClose(); }} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors shadow-lg shadow-indigo-500/20 active:scale-95">
                                <FileText size={16} /> تعديل المنتج
                            </button>
                        )}
                        <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all active:scale-90">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left: Image & Info */}
                        <div className="lg:col-span-4 space-y-4">
                            <div className="aspect-square bg-white dark:bg-slate-900 rounded-3xl border dark:border-slate-800 p-8 flex items-center justify-center relative group shadow-sm">
                                {product.image_url ? (
                                    <img src={product.image_url} className="max-w-full max-h-full object-contain drop-shadow-xl transition-transform duration-500 group-hover:scale-110" />
                                ) : (
                                    <Box size={80} className="text-gray-100 dark:text-slate-800" />
                                )}
                                <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/90 p-2 rounded-xl shadow-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:scale-110" title="طباعة الباركود">
                                    <Hash size={20} className="text-gray-900 dark:text-white" />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border dark:border-slate-800 shadow-sm">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest">بطاقة الصنف</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">الشركة المصنعة</span>
                                        <span className="font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-lg">{product.brand || '-'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">المورد الرئيسي</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{supplierName}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">التصنيف</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{product.category || 'عام'}</span>
                                    </div>
                                    <div className="pt-2 border-t dark:border-slate-800 flex justify-between items-center text-sm">
                                        <span className="text-gray-500">حد الطلب</span>
                                        <span className="font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded-lg">{product.min_stock_level}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Financials & Analytics */}
                        <div className="lg:col-span-8 flex flex-col gap-6">
                            <div className="grid grid-cols-3 gap-4">
                                <StatCard icon={DollarSign} label="سعر التكلفة" value={formatCurrency(product.cost_price)} color="text-gray-600" />
                                <StatCard icon={TrendingUp} label="سعر البيع" value={formatCurrency(product.selling_price)} color="text-blue-600" />
                                <StatCard icon={Activity} label="هامش الربح" value={`${margin.toFixed(1)}%`} color={margin > 0 ? "text-emerald-600" : "text-rose-600"} />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatCard icon={Package} label="المشتريات" value={formatNumberDisplay(stats.total_purchases)} color="text-indigo-600" />
                                <StatCard icon={TrendingDown} label="المبيعات" value={formatNumberDisplay(stats.total_sales)} color="text-purple-600" />
                                <StatCard icon={DollarSign} label="الأرباح" value={formatCurrency(stats.profit)} color="text-emerald-600" />
                                <StatCard icon={ShieldCheck} label="المخزون الحالي" value={formatNumberDisplay(product.stock_quantity)} color="text-gray-900" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border dark:border-slate-800 shadow-sm flex flex-col">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase mb-4 flex items-center gap-2"><Layers size={14} /> التوزيع الجغرافي</h4>
                                    <div className="space-y-3 flex-1 overflow-y-auto max-h-48 custom-scrollbar pr-1">
                                        {product.warehouse_distribution?.map((wh, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition-colors">
                                                <div>
                                                    <p className="text-xs font-bold text-gray-800 dark:text-slate-200">{wh.warehouse_name}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">REF: {wh.location}</p>
                                                </div>
                                                <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 px-3 py-1.5 rounded-xl shadow-sm">
                                                    <span dir="ltr" className="text-sm font-black text-blue-600 font-mono">{formatNumberDisplay(wh.quantity)}</span>
                                                </div>
                                            </div>
                                        )) || <div className="text-center py-8 text-gray-400 text-xs">لا يوجد بيانات توزيع</div>}
                                    </div>
                                </div>

                                <FitmentSection productId={product.id} />
                            </div>
                        </div>
                    </div>

                    {/* Bottom: History & Alternatives */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                            <AlternativesSection alternatives={product.alternative_numbers} />
                        </div>
                        <HistorySection productId={product.id} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailModal;