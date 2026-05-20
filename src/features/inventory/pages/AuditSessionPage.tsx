import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardCheck, Save, CheckCircle, Loader2, ScanBarcode, Layers, Search } from 'lucide-react';
import { useAuditSession, useInventoryMutations, useInventoryCategories } from '../hooks/useInventoryManagement';
import { useSearchProducts } from '../hooks/useProducts';
import MicroHeader from '../../../ui/base/MicroHeader';
import Button from '../../../ui/base/Button';
import AuditStats from '../components/audit/AuditStats';
import AuditItemsTable from '../components/audit/AuditItemsTable';
import { useForm } from 'react-hook-form';
import { useDebounce } from 'use-debounce';
import ScannerOverlay from '../../../ui/base/ScannerOverlay';

const AuditSessionPage: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const { data, isLoading, isError } = useAuditSession(sessionId);
    const { saveAuditProgress, isSavingProgress, finalizeAudit, isFinalizing, addItemToAudit, isAddingItem } = useInventoryMutations();
    const { data: categories } = useInventoryCategories();

    const [filter, setFilter] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [debouncedFilter] = useDebounce(filter, 300);
    const [showResults, setShowResults] = useState(false);

    const { data: searchResults, isLoading: isLoadingSearch } = useSearchProducts(debouncedFilter);

    const { register, reset, watch, getValues } = useForm({
        defaultValues: { items: [] as Record<string, unknown>[] }
    });
    const watchedItems = watch('items');

    useEffect(() => {
        if (data?.items) {
            // Merge with local changes? Actually, if data updates from our own mutation, we should just load it.
            // But we want the recently added item to be at the top. We will handle sorting in handleAddItem.
            // Just load if we don't have items, or if the counts are different.
            reset({ items: data.items });
        }
    }, [data, reset]);

    const stats = useMemo(() => {
        const total = watchedItems.length;
        const counted = watchedItems.filter(i => i.counted_quantity !== null && i.counted_quantity !== undefined && i.counted_quantity !== '').length;
        const discrepancies = watchedItems.filter(i => {
            const diff = (i.counted_quantity !== null && i.counted_quantity !== undefined && i.counted_quantity !== '') ? Number(i.counted_quantity) - Number(i.expected_quantity) : 0;
            return diff !== 0;
        }).length;
        return { total, counted, pending: total - counted, discrepancies };
    }, [watchedItems]);

    const handleSave = () => {
        saveAuditProgress(watchedItems);
    };

    const handleFinalize = () => {
        if (stats.pending > 0) {
            if (!window.confirm(`تنبيه: يوجد ${stats.pending} صنف لم يتم جرده. هل تريد المتابعة وإغلاق الجلسة؟`)) {
                return;
            }
        }
        if (sessionId) {
            finalizeAudit({ sessionId, items: watchedItems }, {
                onSuccess: () => navigate('/inventory')
            });
        }
    };

    const handleScan = (barcode: string) => {
        setFilter(barcode);
        setShowResults(true);
        setIsScannerOpen(false);
    };

    const handleAddItem = (product: any) => {
        if (data?.session?.status === 'completed') return;
        
        // 1. Check if already in the list
        const currentItems = getValues('items');
        const existingIndex = currentItems.findIndex((i: any) => i.product_id === product.id);
        
        if (existingIndex >= 0) {
            // Move it to the top
            const newItems = [...currentItems];
            const [existingItem] = newItems.splice(existingIndex, 1);
            newItems.unshift(existingItem);
            reset({ items: newItems });
            setFilter('');
            setShowResults(false);
            return;
        }

        // 2. Add via DB if not present
        if (!sessionId) return;
        
        const stockInfo = product.warehouse_distribution?.find((w: any) => w.warehouse_id === data?.session?.warehouse_id);
        const expectedQuantity = stockInfo ? stockInfo.quantity : (product.stock_quantity || 0);

        // Before adding, save current progress to not lose typed numbers
        if (currentItems.length > 0) {
             saveAuditProgress(currentItems);
        }

        addItemToAudit({ sessionId, productId: product.id, expectedQuantity }, {
            onSuccess: () => {
                setFilter('');
                setShowResults(false);
            }
        });
    };

    if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-blue-500" /></div>;
    if (isError) return <div>حدث خطأ أثناء تحميل بيانات الجرد.</div>;

    const session = data?.session;

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
            <MicroHeader
                title={(session?.title as string) || "جلسة جرد"}
                icon={ClipboardCheck}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleSave} isLoading={isSavingProgress} leftIcon={<Save size={14} />}>
                            حفظ التقدم
                        </Button>
                        <Button
                            variant="success"
                            size="sm"
                            onClick={handleFinalize}
                            isLoading={isFinalizing}
                            disabled={session?.status === 'completed'}
                            leftIcon={<CheckCircle size={14} />}
                        >
                            {session?.status === 'completed' ? 'تم الإغلاق' : 'إنهاء وترحيل الفروقات'}
                        </Button>
                    </div>
                }
            />
            
            {/* Search and Scan Bar */}
            {session?.status !== 'completed' && (
                <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-4 sticky top-0 z-40 shadow-sm">
                    <div className="max-w-[1600px] mx-auto relative">
                        <div className="flex gap-2 relative">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="ابحث عن صنف لجرده (مسح باركود، رقم قطعة، أو اسم)..."
                                    value={filter}
                                    onChange={(e) => {
                                        setFilter(e.target.value);
                                        setShowResults(true);
                                    }}
                                    onFocus={() => setShowResults(true)}
                                    className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-xl py-3 px-10 text-sm font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                />
                                <Search className="absolute right-3 top-3.5 text-gray-400" size={18} />
                                {(isLoadingSearch || isAddingItem) && (
                                    <Loader2 className="absolute left-3 top-3.5 text-blue-500 animate-spin" size={18} />
                                )}
                            </div>
                            <button
                                onClick={() => setIsScannerOpen(true)}
                                className="flex items-center justify-center bg-blue-600 text-white w-12 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                            >
                                <ScanBarcode size={22} />
                            </button>
                        </div>

                        {/* Search Results Dropdown */}
                        {showResults && filter && (searchResults && searchResults.length > 0) && (
                            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-900 shadow-2xl border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-[60vh] overflow-y-auto">
                                <table className="w-full text-right text-xs border-collapse">
                                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                                        <tr className="text-slate-600 dark:text-gray-300">
                                            <th className="py-2 px-4 border-b dark:border-slate-700">الصنف</th>
                                            <th className="py-2 px-4 border-b dark:border-slate-700 w-32 text-center">رقم القطعة/SKU</th>
                                            <th className="py-2 px-4 border-b dark:border-slate-700 w-24 text-center">المقاس</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                        {searchResults.map((p: any) => (
                                            <tr 
                                                key={p.id} 
                                                onClick={() => handleAddItem(p)}
                                                className="hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                                            >
                                                <td className="py-3 px-4 font-bold">{p.name_ar || p.name}</td>
                                                <td className="py-3 px-4 text-center font-mono text-gray-500">{p.part_number || p.sku || '-'}</td>
                                                <td className="py-3 px-4 text-center text-blue-500 font-bold">{p.size || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 pb-16 custom-scrollbar" onClick={() => setShowResults(false)}>
                <div className="max-w-[1600px] mx-auto space-y-4">
                    <AuditStats stats={stats} session={session} />
                    
                    {/* Category Filter Bar */}
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-sm">
                        <div className="flex items-center gap-2 px-3 border-l dark:border-slate-800 text-gray-400">
                            <Layers size={16} />
                            <span className="text-[10px] font-bold whitespace-nowrap">تصفية حسب الفئة:</span>
                        </div>
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${!selectedCategory ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-50 dark:bg-slate-800 text-gray-500'}`}
                        >
                            الكل
                        </button>
                        {categories?.map((cat: any) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.name)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${selectedCategory === cat.name ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-50 dark:bg-slate-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    <AuditItemsTable
                        items={watchedItems}
                        register={register}
                        filter={""} 
                        category={selectedCategory}
                        isCompleted={session?.status === 'completed'}
                    />
                </div>
            </div>

            {isScannerOpen && (
                <ScannerOverlay 
                    onScan={handleScan} 
                    onClose={() => setIsScannerOpen(false)} 
                />
            )}
        </div>
    );
};

export default AuditSessionPage;