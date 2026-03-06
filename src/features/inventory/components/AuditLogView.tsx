import React, { useState, useRef, useEffect } from 'react';
import { useItemMovement, useProducts } from '../hooks';
import { formatNumberDisplay } from '../../../core/utils';
import { History, User, Clock, Search, X, ArrowUpRight, ArrowDownLeft, RefreshCw, ClipboardCheck, Box, Info } from 'lucide-react';
import { cn } from '../../../core/utils';
import Avatar from '../../../ui/base/Avatar';

const AuditLogView: React.FC = () => {
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { products, isLoading: isProductsLoading } = useProducts(searchQuery, { enabled: isDropdownOpen });
    const { data: log, isLoading: isLogLoading } = useItemMovement(selectedProduct?.id || null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectProduct = (product: any) => {
        setSelectedProduct(product);
        setSearchQuery('');
        setIsDropdownOpen(false);
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
            {/* Searchable Product Picker */}
            <div className="relative" ref={dropdownRef}>
                <div className={cn(
                    "bg-white dark:bg-slate-900 rounded-3xl border transition-all duration-300 flex items-center gap-3 px-4 py-3 shadow-sm",
                    isDropdownOpen ? "border-blue-500 ring-4 ring-blue-500/10 shadow-lg" : "border-gray-100 dark:border-slate-800"
                )}>
                    <div className="p-2 bg-blue-600/10 text-blue-600 rounded-2xl">
                        <Search size={20} />
                    </div>

                    {selectedProduct ? (
                        <div className="flex-1 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{selectedProduct.name}</span>
                                <span className="text-[10px] bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg font-mono text-gray-500">{selectedProduct.sku}</span>
                            </div>
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-gray-400 hover:text-rose-500 rounded-xl transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <input
                            type="text"
                            placeholder="ابحث عن صنف بالاسم أو الكود للبدء في التدقيق..."
                            value={searchQuery}
                            onFocus={() => setIsDropdownOpen(true)}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-sm font-bold placeholder:text-gray-400 dark:text-white"
                        />
                    )}
                </div>

                {/* Dropdown Results */}
                {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2rem] shadow-2xl z-[100] overflow-hidden animate-in zoom-in-95 duration-200 backdrop-blur-xl">
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {isProductsLoading ? (
                                <div className="p-8 text-center space-y-2">
                                    <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
                                    <p className="text-[10px] font-bold text-gray-400">جاري البحث عن الأصناف...</p>
                                </div>
                            ) : products.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <Box size={32} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-xs font-bold">لا توجد نتائج مطابقة</p>
                                </div>
                            ) : (
                                <div className="p-2 grid grid-cols-1 gap-1">
                                    {products.map((p: any) => (
                                        <button
                                            key={p.id}
                                            onClick={() => handleSelectProduct(p)}
                                            className="flex items-center justify-between p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl transition-all group text-right"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    <Box size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800 dark:text-slate-200">{p.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{p.sku}</p>
                                                </div>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-bold text-emerald-600">{p.stock_quantity ?? 0} في المخزن</p>
                                                <p className="text-[9px] text-gray-400 font-bold">{p.brand || 'ماركة غير محددة'}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Movement Log Content */}
            <div className="flex flex-col flex-1">
                {selectedProduct ? (
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-sm min-h-[400px]">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b dark:border-slate-800">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-600/10 text-blue-600 rounded-2xl">
                                    <History size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">سجل العمليات التفصيلي</h3>
                                    <p className="text-xs text-gray-500 font-medium">مراجعة كافة الحركات المخزنية للصنف في الوقت الفعلي</p>
                                </div>
                            </div>
                            <div className="text-left">
                                <p className="text-2xl font-black text-gray-900 dark:text-white font-mono leading-none">
                                    {formatNumberDisplay(selectedProduct.stock_quantity)}
                                </p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">الرصيد الحالي الكلي</p>
                            </div>
                        </div>

                        {isLogLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-10 h-10 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                                <p className="text-xs font-bold text-gray-400 tracking-widest">جاري استرجاع البيانات التاريخية...</p>
                            </div>
                        ) : !log || log.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-50/50 dark:bg-slate-800/20 rounded-[2rem] border-2 border-dashed dark:border-slate-800">
                                <Info size={48} className="mb-4 opacity-10" />
                                <p className="text-sm font-bold">لا يوجد حركات مسجلة لهذا الصنف بعد</p>
                                <p className="text-xs opacity-60 mt-1">سيتم سرد المبيعات والمشتريات والمناقلات هنا فور حدوثها</p>
                            </div>
                        ) : (
                            <div className="relative border-r-2 border-slate-100 dark:border-slate-800 mr-8 pr-10 space-y-8">
                                {log.map((entry: any, i: number) => (
                                    <div key={i} className="relative group animate-in slide-in-from-top-2 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                                        {/* Timeline Dot */}
                                        <div className={cn(
                                            "absolute -right-[49px] top-2 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 z-10 transition-transform group-hover:scale-125 shadow-sm",
                                            getTransactionColor(entry.transaction_type, entry.reference_type)
                                        )} />

                                        <div className="bg-gray-50 dark:bg-slate-800/40 p-5 rounded-3xl border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30 transition-all hover:shadow-xl hover:shadow-blue-500/5 group">
                                            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "p-2.5 rounded-2xl shadow-sm",
                                                        entry.transaction_type === 'in' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-rose-50 text-rose-600 dark:bg-rose-900/20"
                                                    )}>
                                                        {getTransactionIcon(entry.transaction_type, entry.reference_type)}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 leading-tight">
                                                            {entry.document_number}
                                                        </h4>
                                                        <p className="text-[10px] text-gray-500 font-bold mt-0.5">
                                                            {entry.source_name}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-left bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border dark:border-slate-800 shadow-sm">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 font-mono">
                                                        <Clock size={12} className="opacity-50" />
                                                        <span>{new Date(entry.date).toLocaleString('ar-SA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-4 border-t dark:border-slate-800/50">
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">الكمية</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={cn(
                                                            "text-lg font-black font-mono",
                                                            entry.transaction_type === 'in' ? "text-emerald-500" : "text-rose-500"
                                                        )}>
                                                            {entry.transaction_type === 'in' ? '+' : '-'}{formatNumberDisplay(Math.abs(entry.quantity))}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-400">قطعة</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">الرصيد بعدها</span>
                                                    <span className="text-lg font-black font-mono text-gray-900 dark:text-white">
                                                        {formatNumberDisplay(entry.balance_after)}
                                                    </span>
                                                </div>

                                                <div className="col-span-2 sm:col-span-1 flex items-center gap-3 bg-white/50 dark:bg-slate-900/50 p-2 rounded-2xl border dark:border-slate-800/40">
                                                    <Avatar name={entry.source_user || entry.created_by_name || 'System'} size="xs" />
                                                    <div className="overflow-hidden">
                                                        <span className="text-[9px] font-bold text-gray-400 block uppercase">بواسطة</span>
                                                        <span className="text-[10px] font-bold text-gray-700 dark:text-slate-300 truncate block">
                                                            {entry.source_user?.split('@')[0] || entry.created_by_name?.split(' ')[0] || 'النظام'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {entry.notes && (
                                                <div className="mt-4 text-[10px] text-gray-500 bg-blue-50/30 dark:bg-blue-900/10 p-3 rounded-2xl border border-blue-100/20 dark:border-blue-900/20 italic flex gap-2">
                                                    <Info size={12} className="shrink-0 mt-0.5" />
                                                    <span>"{entry.notes}"</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 min-h-[500px] flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed dark:border-slate-800 animate-in fade-in zoom-in duration-700">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                            <div className="relative p-8 bg-blue-600/10 text-blue-600 rounded-[2.5rem] shadow-inner">
                                <History size={64} strokeWidth={1.5} />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">تدقيق سجل الحركة المتطور</h2>
                        <p className="max-w-md text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                            قم باختيار صنف من صندوق البحث أعلاه للبدء في تتبع كافة الحركات المخزنية، المبيعات، المشتريات والمناقلات بدقة كاملة.
                        </p>
                        <div className="mt-8 flex gap-3">
                            <div className="px-4 py-2 bg-gray-50 dark:bg-slate-800 rounded-2xl text-[10px] font-bold text-gray-500 border dark:border-slate-700">
                                تتبع الوقت الفعلي
                            </div>
                            <div className="px-4 py-2 bg-gray-50 dark:bg-slate-800 rounded-2xl text-[10px] font-bold text-gray-500 border dark:border-slate-700">
                                هوية المستخدمين
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Typed Helpers
const getTransactionIcon = (type: string, ref: string) => {
    if (ref === 'transfer') return <RefreshCw size={18} />;
    if (ref === 'audit') return <ClipboardCheck size={18} />;
    return type === 'in' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />;
};

const getTransactionColor = (type: string, ref: string) => {
    if (ref === 'transfer') return 'bg-blue-500';
    if (ref === 'audit') return 'bg-indigo-500';
    return type === 'in' ? 'bg-emerald-500' : 'bg-rose-500';
};

export default AuditLogView;
