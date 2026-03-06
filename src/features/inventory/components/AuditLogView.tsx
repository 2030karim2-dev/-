import React, { useState, useRef, useEffect } from 'react';
import { useItemMovement, useProducts } from '../hooks';
import { formatNumberDisplay } from '../../../core/utils';
import { History, Search, X, ArrowUpRight, ArrowDownLeft, Box, Info } from 'lucide-react';
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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            setIsDropdownOpen(true);
        }
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
                            placeholder="ابحث عن صنف بالاسم أو الكود... (اضغط Enter للبحث)"
                            value={searchQuery}
                            onKeyDown={handleKeyDown}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-sm font-bold placeholder:text-gray-400 dark:text-white"
                        />
                    )}
                </div>

                {/* Dropdown Results */}
                {isDropdownOpen && searchQuery.trim() && (
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

            {/* Movement Log Table Content */}
            <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                {selectedProduct ? (
                    <>
                        {/* Table Header / Summary */}
                        <div className="p-5 border-b dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600/10 text-blue-600 rounded-xl">
                                    <History size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">سجل العمليات (Excel Style)</h3>
                                    <p className="text-[10px] text-gray-500 font-medium tracking-tight">تدقيق كامل لكل العمليات المخزنية بحسب التسلسل الزمني</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-xs font-black text-gray-900 dark:text-white font-mono leading-none">
                                        {formatNumberDisplay(selectedProduct.stock_quantity)}
                                    </p>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">الرصيد الكلي الحالي</p>
                                </div>
                                <div className="h-8 w-px bg-gray-200 dark:bg-slate-800" />
                                <div className="text-right">
                                    <p className="text-xs font-black text-gray-900 dark:text-white font-mono leading-none">
                                        {log?.length || 0}
                                    </p>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">إجمالي العمليات</p>
                                </div>
                            </div>
                        </div>

                        {/* Excel-Style Table Container */}
                        <div className="flex-1 overflow-auto custom-scrollbar relative">
                            {isLogLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <div className="w-8 h-8 border-2 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                                    <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">جاري تجهيز البيانات التدقيقية...</p>
                                </div>
                            ) : !log || log.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                    <Info size={40} className="mb-3 opacity-10" />
                                    <p className="text-xs font-bold">لا توجد حركات مسجلة لهذا الصنف</p>
                                </div>
                            ) : (
                                <table className="w-full border-collapse text-right select-all">
                                    <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-slate-800 shadow-sm border-b-2 border-gray-200 dark:border-slate-700">
                                        <tr>
                                            <th className="border border-gray-100 dark:border-slate-700 p-2 text-[9px] font-black text-gray-500 uppercase tracking-tighter w-12 text-center">#</th>
                                            <th className="border border-gray-100 dark:border-slate-700 p-2 text-[10px] font-bold text-gray-600 dark:text-gray-300">التاريخ والوقت</th>
                                            <th className="border border-gray-100 dark:border-slate-700 p-2 text-[10px] font-bold text-gray-600 dark:text-gray-300">نوع العملية / المرجع</th>
                                            <th className="border border-gray-100 dark:border-slate-700 p-2 text-[10px] font-bold text-gray-600 dark:text-gray-300">الجهة / المورد / العميل</th>
                                            <th className="border border-gray-100 dark:border-slate-700 p-2 text-[10px] font-bold text-gray-600 dark:text-gray-300 text-center w-20">الحالة</th>
                                            <th className="border border-gray-100 dark:border-slate-700 p-2 text-[10px] font-bold text-gray-600 dark:text-gray-300 text-left w-24">الكمية</th>
                                            <th className="border border-gray-100 dark:border-slate-700 p-2 text-[10px] font-bold text-gray-600 dark:text-gray-300 text-left w-24">الرصيد بعدها</th>
                                            <th className="border border-gray-100 dark:border-slate-700 p-2 text-[10px] font-bold text-gray-600 dark:text-gray-300 w-32">المستخدم</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-slate-800">
                                        {log.map((entry: any, i: number) => {
                                            const isIncoming = entry.transaction_type === 'in';
                                            return (
                                                <tr key={i} className="odd:bg-white even:bg-gray-50/30 dark:odd:bg-slate-900 dark:even:bg-slate-800/20 hover:bg-blue-50/50 dark:hover:bg-blue-900/5 transition-colors group">
                                                    <td className="border border-gray-50 dark:border-slate-800/60 p-2 text-center text-[9px] font-mono font-bold text-gray-400 group-hover:text-blue-500">
                                                        {log.length - i}
                                                    </td>
                                                    <td className="border border-gray-50 dark:border-slate-800/60 p-2 text-gray-600 dark:text-gray-400 text-[10px] whitespace-nowrap">
                                                        {new Date(entry.date).toLocaleString('ar-EG', {
                                                            year: 'numeric', month: '2-digit', day: '2-digit',
                                                            hour: '2-digit', minute: '2-digit', hour12: true
                                                        })}
                                                    </td>
                                                    <td className="border border-gray-50 dark:border-slate-800/60 p-2">
                                                        <div className="font-bold text-blue-700 dark:text-blue-400 mb-0.5">{entry.document_number}</div>
                                                        <div className="text-[10px] text-gray-400 font-medium">
                                                            {entry.reference_type === 'invoice' || entry.reference_type?.includes('invoice') ? 'فاتورة إلكترونية' :
                                                                entry.reference_type === 'transfer' ? 'مناقلة مخزنية' :
                                                                    entry.reference_type === 'audit' ? 'تسوية جردية' : 'مستند يدوي'}
                                                        </div>
                                                    </td>
                                                    <td className="border border-gray-50 dark:border-slate-800/60 p-2 text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                                        {entry.source_name || '--'}
                                                    </td>
                                                    <td className="border border-gray-50 dark:border-slate-800/60 p-2 text-center">
                                                        <div className={cn(
                                                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-tighter",
                                                            isIncoming ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                                                        )}>
                                                            {isIncoming ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                                                            {isIncoming ? 'وارد' : 'صادر'}
                                                        </div>
                                                    </td>
                                                    <td dir="ltr" className={cn(
                                                        "border border-gray-50 dark:border-slate-800/60 p-2 text-left text-xs font-black font-mono",
                                                        isIncoming ? "text-emerald-600" : "text-rose-600"
                                                    )}>
                                                        {isIncoming ? '+' : '-'}{formatNumberDisplay(Math.abs(entry.quantity))}
                                                    </td>
                                                    <td dir="ltr" className="border border-gray-50 dark:border-slate-800/60 p-2 text-left text-xs font-black font-mono text-gray-900 dark:text-white bg-blue-50/20 dark:bg-blue-900/5">
                                                        {formatNumberDisplay(entry.balance_after)}
                                                    </td>
                                                    <td className="border border-gray-50 dark:border-slate-800/60 p-2">
                                                        <div className="flex items-center gap-2">
                                                            <Avatar name={entry.source_user || entry.created_by_name || 'System'} size="xs" />
                                                            <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 truncate max-w-[80px]">
                                                                {entry.source_user?.split('@')[0] || entry.created_by_name?.split(' ')[0] || 'النظام'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Footer Excel-like Info */}
                        <div className="p-2 px-4 bg-gray-50 dark:bg-slate-800 border-t dark:border-slate-700 flex justify-between items-center text-[9px] font-bold text-gray-400">
                            <div className="flex gap-4">
                                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> واردات (مشتريات/مردود)</span>
                                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> صادرات (مبيعات/هالك)</span>
                            </div>
                            <span>* كافة الكميات معالجة ومربوطة بالرصيد التراكمي في الوقت الفعلي</span>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900 animate-in fade-in zoom-in duration-700">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full" />
                            <div className="relative p-8 bg-blue-600/5 text-blue-600/30 rounded-[2.5rem]">
                                <History size={64} strokeWidth={1} />
                            </div>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">تدقيق سجل الحركة المتطور</h2>
                        <p className="max-w-sm text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                            اختر صنفاً من مربع البحث بالأعلى لعرض كافة عملياته المخزنية بتنسيق Excel احترافي مع الربط المباشر بالمستخدمين والمستندات.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogView;
