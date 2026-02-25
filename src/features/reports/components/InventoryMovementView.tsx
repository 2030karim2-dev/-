import React, { useState, useMemo } from 'react';
import { useItemMovement, useMinimalProducts } from '../../inventory/hooks';
import ExcelTable from '../../../ui/common/ExcelTable';
import { Search, Package, History, Loader2, ArrowUpRight, ArrowDownRight, TrendingUp, Calendar, Filter, FileText, User, ArrowLeftRight, CheckCircle2, Zap, BarChart3, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useThemeStore } from '@/lib/themeStore';
import { cn } from '@/core/utils';

const InventoryMovementView: React.FC = () => {
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Date Filtering State
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');

    const { data: allProducts } = useMinimalProducts();
    const { data: movement, isLoading } = useItemMovement(selectedProductId || null, fromDate, toDate);

    const filteredProducts = useMemo(() => {
        if (!searchQuery) return [];
        return allProducts?.filter((p: any) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 10) || [];
    }, [allProducts, searchQuery]);

    const selectedProduct = useMemo(() => {
        return allProducts?.find((p: any) => p.id === selectedProductId);
    }, [allProducts, selectedProductId]);

    const analysis = useMemo(() => {
        if (!movement || movement.length === 0) return null;
        const totalIn = movement.reduce((sum: number, m: any) => sum + (m.quantity > 0 ? m.quantity : 0), 0);
        const totalOut = movement.reduce((sum: number, m: any) => sum + (m.quantity < 0 ? Math.abs(m.quantity) : 0), 0);
        const startBalance = movement[0].balance_after - movement[0].quantity;
        const avgStock = (startBalance + movement[movement.length - 1].balance_after) / 2;

        return {
            currentStock: movement[movement.length - 1].balance_after,
            totalIn,
            totalOut,
            turnover: avgStock > 0 ? (totalOut / avgStock).toFixed(1) : 0,
            lastMovement: new Date(movement[movement.length - 1].date).toLocaleDateString('ar-SA')
        };
    }, [movement]);

    const chartData = useMemo(() => {
        return movement?.map((m: any) => ({
            date: new Date(m.date).toLocaleDateString('en-GB'), // Keep consistent for chart
            balance: m.balance_after
        })).reverse(); // Correct chronological order for chart
    }, [movement]);

    const columns = [
        { header: 'التاريخ', accessor: (row: any) => <span dir="ltr" className="font-mono text-[10px] text-slate-500">{new Date(row.date).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}</span> },
        {
            header: 'نوع الحركة', accessor: (row: any) => {
                let icon = <CheckCircle2 size={12} />;
                let color = 'text-slate-500';
                let bg = 'bg-slate-100';
                let label = '---';

                if (row.quantity > 0) {
                    icon = <ArrowDownRight size={12} />;
                    color = 'text-emerald-600';
                    bg = 'bg-emerald-50';
                    label = 'وارد';
                } else {
                    icon = <ArrowUpRight size={12} />;
                    color = 'text-rose-600';
                    bg = 'bg-rose-50';
                    label = 'صادر';
                }

                if (row.reference_type === 'transfer') {
                    icon = <ArrowLeftRight size={12} />;
                    label = row.quantity > 0 ? 'استلام مناقلة' : 'إرسال مناقلة';
                    color = 'text-blue-600';
                    bg = 'bg-blue-50';
                } else if (row.reference_type === 'audit') {
                    icon = <CheckCircle2 size={12} />;
                    label = 'جرد';
                    color = 'text-amber-600';
                    bg = 'bg-amber-50';
                }

                return (
                    <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md w-fit mx-auto", bg, color)}>
                        {icon}
                        <span className="text-[10px] font-bold">{label}</span>
                    </div>
                );
            }, className: 'text-center'
        },
        {
            header: 'الوثيقة', accessor: (row: any) => (
                <div className="flex flex-col">
                    <span className="font-bold text-[10px] text-slate-700">{row.document_number}</span>
                    <span className="text-[9px] text-slate-400">{row.source_name}</span>
                </div>
            )
        },
        { header: 'الكمية', accessor: (row: any) => <span dir="ltr" className={`font-mono font-bold text-sm ${row.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{row.quantity > 0 ? '+' : ''}{row.quantity}</span>, className: 'text-center' },
        { header: 'الرصيد', accessor: (row: any) => <span dir="ltr" className="font-mono font-black text-blue-700 text-sm">{row.balance_after}</span>, className: 'text-center' },
        { header: 'مستخدم', accessor: (row: any) => row.source_user || '---', className: 'text-xs text-slate-400' },
    ];

    const { theme } = useThemeStore();
    const isDark = theme === 'dark';

    const handleSelectProduct = (product: any) => {
        setSelectedProductId(product.id);
        setSearchQuery(product.name);
        setIsDropdownOpen(false);
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
            {/* Header: Search & Filters */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col md:flex-row gap-6 items-end md:items-center justify-between">
                <div className="relative w-full md:w-96">
                    <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">بحث عن صنف</label>
                    <div className="relative group">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
                            onFocus={() => setIsDropdownOpen(true)}
                            placeholder="اسم الصنف، الكود، أو الباركود..."
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 focus:border-blue-500 rounded-2xl py-3 pl-4 pr-12 text-sm font-bold outline-none transition-all dark:text-slate-100 shadow-sm"
                        />
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    </div>
                    {isDropdownOpen && filteredProducts.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] shadow-2xl z-50 max-h-72 overflow-y-auto backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 animate-in fade-in zoom-in-95 duration-200">
                            {filteredProducts.map((p: any) => (
                                <div key={p.id} onClick={() => handleSelectProduct(p)} className="p-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 cursor-pointer flex justify-between items-center group transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 rounded-xl">
                                            <Package size={16} className="text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="font-black text-xs text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">{p.name}</p>
                                            <p className="text-slate-400 text-[10px] font-bold font-mono uppercase tracking-tighter">{p.sku}</p>
                                        </div>
                                    </div>
                                    <ArrowLeftRight size={14} className="text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Date Filters */}
                <div className="flex gap-4 w-full md:w-auto">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">من تاريخ</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl py-2.5 px-4 text-xs font-mono font-bold outline-none focus:border-blue-500 w-full md:w-36 transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">إلى تاريخ</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl py-2.5 px-4 text-xs font-mono font-bold outline-none focus:border-blue-500 w-full md:w-36 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {!selectedProductId ? (
                <div className="h-96 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center shadow-inner">
                    <div className="p-8 bg-blue-500/10 rounded-[2.5rem] mb-6 relative group overflow-hidden">
                        <History size={64} className="text-blue-500 relative z-10 group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent opacity-50" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-3 tracking-tight">تتبع حركة صنف</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">اختر قطعة لعرض سجل مفصل لجميع عمليات الدخول والخروج من المخزون مع تحليل كامل للنشاط.</p>
                </div>
            ) : isLoading ? (
                <div className="h-96 flex flex-col justify-center items-center gap-6 bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                    <div className="relative">
                        <Loader2 className="animate-spin text-blue-500" size={48} />
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                    </div>
                    <span className="text-sm font-black uppercase tracking-[0.2em] animate-pulse">جاري تحليل بيانات الحركة...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Analytics Cards */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl space-y-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-xl">
                                    <Package size={16} className="text-blue-500" />
                                </div>
                                ملخص الحركة
                            </h3>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-3xl text-white shadow-lg shadow-blue-500/20 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                                        <BarChart3 size={40} />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-blue-100/80">الرصيد الحالي</p>
                                    <p className="font-black text-3xl font-mono tracking-tight">{analysis?.currentStock || 0}</p>
                                </div>
                                <div className="bg-slate-900 p-6 rounded-3xl text-white border border-slate-800 shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:-translate-y-1 transition-transform">
                                        <Activity size={40} />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-500">معدل الدوران</p>
                                    <p className="font-black text-3xl font-mono tracking-tight text-blue-400">{analysis?.turnover || 0}<span className="text-sm ml-1 text-slate-500 font-bold uppercase tracking-widest">x</span></p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl group transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500 group-hover:scale-110 transition-transform"><ArrowDownRight size={16} /></div>
                                        <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">إجمالي الوارد</span>
                                    </div>
                                    <span className="font-mono font-black text-base text-emerald-500">+{analysis?.totalIn}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 rounded-2xl group transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500 group-hover:scale-110 transition-transform"><ArrowUpRight size={16} /></div>
                                        <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">إجمالي الصادر</span>
                                    </div>
                                    <span className="font-mono font-black text-base text-rose-500">-{analysis?.totalOut}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-dashed border-slate-200 dark:border-slate-800">
                                <p className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-[0.1em]">
                                    آخر حركة: <span className="font-mono text-slate-900 dark:text-slate-100 ml-1">{analysis?.lastMovement}</span>
                                </p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl h-64 flex flex-col relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 relative z-10 flex items-center gap-2">
                                <Zap size={12} className="text-blue-500" />
                                تطور الرصيد
                            </h4>
                            <div className="flex-1 w-full min-h-0 relative z-10">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150}>
                                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                        <XAxis dataKey="date" hide />
                                        <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
                                        <defs>
                                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Tooltip
                                            content={({ active, payload }: any) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="p-4 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{payload[0].payload.date}</p>
                                                            <p className="text-sm font-black text-slate-900 dark:text-white font-mono">{payload[0].value}</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="balance"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorBalance)"
                                            animationDuration={1500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden">
                            <ExcelTable
                                columns={columns}
                                data={movement || []}
                                colorTheme="blue"
                                title={`سجل حركة: ${selectedProduct?.name}`}
                                subtitle={`SKU: ${selectedProduct?.sku || '---'}`}
                                emptyMessage="لا توجد حركات مسجلة في هذا النطاق الزمني"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryMovementView;