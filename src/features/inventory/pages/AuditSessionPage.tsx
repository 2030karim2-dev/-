
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardCheck, Save, CheckCircle, Loader2 } from 'lucide-react';
import { useAuditSession, useInventoryMutations, useInventoryCategories } from '../hooks/useInventoryManagement';
import MicroHeader from '../../../ui/base/MicroHeader';
import Button from '../../../ui/base/Button';
import AuditStats from '../components/audit/AuditStats';
import AuditItemsTable from '../components/audit/AuditItemsTable';
import { useForm } from 'react-hook-form';
import { useDebounce } from 'use-debounce';
import { Layers, ScanBarcode } from 'lucide-react';
import ScannerOverlay from '../../../ui/base/ScannerOverlay';

const AuditSessionPage: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const { data, isLoading, isError } = useAuditSession(sessionId);
    const { saveAuditProgress, isSavingProgress, finalizeAudit, isFinalizing } = useInventoryMutations();
    const { data: categories } = useInventoryCategories();

    const [filter, setFilter] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [debouncedFilter] = useDebounce(filter, 300);

    const { register, reset, watch } = useForm({
        defaultValues: { items: [] as Record<string, unknown>[] }
    });
    const watchedItems = watch('items');

    useEffect(() => {
        if (data?.items) {
            reset({ items: data.items });
        }
    }, [data, reset]);

    const stats = useMemo(() => {
        const total = watchedItems.length;
        const counted = watchedItems.filter(i => i.counted_quantity !== null && i.counted_quantity !== undefined).length;
        const discrepancies = watchedItems.filter(i => {
            const diff = (i.counted_quantity !== null && i.counted_quantity !== undefined) ? Number(i.counted_quantity) - Number(i.expected_quantity) : 0;
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
        setIsScannerOpen(false);
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
                searchPlaceholder="بحث في الأصناف..."
                searchValue={filter}
                onSearchChange={setFilter}
                extraRow={
                    <button
                        onClick={() => setIsScannerOpen(true)}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all font-bold text-[11px]"
                    >
                        <ScanBarcode size={18} />
                        <span className="hidden sm:inline">الجرد بالكاميرا</span>
                    </button>
                }
            />
            <div className="flex-1 overflow-y-auto p-2 pb-16 custom-scrollbar">
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
                        filter={debouncedFilter}
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