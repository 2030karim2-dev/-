
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardCheck, Save, CheckCircle, Loader2, Search } from 'lucide-react';
import { useAuditSession, useInventoryMutations } from '../hooks/useInventoryManagement';
import MicroHeader from '../../../ui/base/MicroHeader';
import Button from '../../../ui/base/Button';
import AuditStats from '../components/audit/AuditStats';
import AuditItemsTable from '../components/audit/AuditItemsTable';
import { useForm, useFieldArray } from 'react-hook-form';
import { useDebounce } from 'use-debounce';

const AuditSessionPage: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const { data, isLoading, isError } = useAuditSession(sessionId);
    const { saveAuditProgress, isSavingProgress, finalizeAudit, isFinalizing } = useInventoryMutations();

    const [filter, setFilter] = useState('');
    const [debouncedFilter] = useDebounce(filter, 300);

    const { control, register, handleSubmit, reset, watch } = useForm({
        defaultValues: { items: [] as any[] }
    });
    const { fields } = useFieldArray({ control, name: "items" });
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
    
    if (isLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-blue-500" /></div>;
    if (isError) return <div>حدث خطأ أثناء تحميل بيانات الجرد.</div>;

    const session = data?.session;

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
            <MicroHeader 
                title={session?.title || "جلسة جرد"}
                icon={ClipboardCheck}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleSave} isLoading={isSavingProgress} leftIcon={<Save size={14}/>}>
                            حفظ التقدم
                        </Button>
                        <Button 
                            variant="success" 
                            size="sm" 
                            onClick={handleFinalize}
                            isLoading={isFinalizing}
                            disabled={session?.status === 'completed'}
                            leftIcon={<CheckCircle size={14}/>}
                        >
                            {session?.status === 'completed' ? 'تم الإغلاق' : 'إنهاء وترحيل الفروقات'}
                        </Button>
                    </div>
                }
                searchPlaceholder="بحث في الأصناف..."
                searchValue={filter}
                onSearchChange={setFilter}
            />
            <div className="flex-1 overflow-y-auto p-2 pb-16 custom-scrollbar">
                <div className="max-w-7xl mx-auto space-y-2">
                    <AuditStats stats={stats} session={session} />
                    <AuditItemsTable 
                        fields={fields}
                        register={register}
                        filter={debouncedFilter}
                        isCompleted={session?.status === 'completed'}
                    />
                </div>
            </div>
        </div>
    );
};

export default AuditSessionPage;