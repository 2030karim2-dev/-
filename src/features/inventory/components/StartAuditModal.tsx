
import React, { useState } from 'react';
import { X, ClipboardCheck, Database, LayoutGrid, CheckCircle2, Loader2, Info } from 'lucide-react';
import { useWarehouses, useInventoryMutations } from '../hooks';
import Button from '../../../ui/base/Button';
import Modal from '../../../ui/base/Modal';
import { cn } from '../../../core/utils';

interface StartAuditModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const StartAuditModal: React.FC<StartAuditModalProps> = ({ isOpen, onClose }) => {
    const { data: warehouses } = useWarehouses();
    const { startAudit, isStartingAudit } = useInventoryMutations();

    const [formData, setFormData] = useState({
        title: `جرد دوري - ${new Date().toLocaleDateString('ar-SA')}`,
        warehouse_id: '',
        category: 'all'
    });

    if (!isOpen) return null;

    const handleStart = () => {
        if (!formData.warehouse_id || !formData.title) return;
        startAudit(formData, { onSuccess: onClose });
    };

    const footerContent = (
        <>
            <Button variant="outline" onClick={onClose} className="flex-1">إلغاء</Button>
            <Button
                onClick={handleStart}
                isLoading={isStartingAudit}
                disabled={!formData.warehouse_id || !formData.title}
                className="flex-1"
            >
                بدء الجلسة الآن
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            icon={ClipboardCheck}
            title="بدء جلسة جرد ميداني"
            description="إنشاء تقرير لمطابقة الكميات الفعلية مع المسجلة بالنظام"
            footer={footerContent}
        >
            <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/20 flex gap-3">
                    <Info size={20} className="text-blue-600 flex-shrink-0" />
                    <p className="text-[10px] text-blue-800 dark:text-blue-300 font-bold leading-relaxed">
                        يفضل استخدام باركود الأصناف أثناء الجرد لزيادة الدقة وسرعة الإنجاز.
                    </p>
                </div>

                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase mr-1">اسم جلسة الجرد</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg py-2 px-3 text-xs font-bold"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase mr-1">المستودع المستهدف</label>
                        <div className="grid grid-cols-1 gap-1">
                            {warehouses?.map((w: any) => (
                                <button
                                    key={w.id}
                                    onClick={() => setFormData({ ...formData, warehouse_id: w.id })}
                                    className={cn("flex items-center justify-between p-2 rounded-lg border text-right",
                                        formData.warehouse_id === w.id
                                            ? 'bg-blue-50 border-blue-600 dark:bg-blue-900/20'
                                            : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700'
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <Database size={14} className={formData.warehouse_id === w.id ? 'text-blue-600' : 'text-gray-400'} />
                                        <span className="text-xs font-bold">{w.name}</span>
                                    </div>
                                    {formData.warehouse_id === w.id && <CheckCircle2 size={16} className="text-blue-600" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase mr-1">نطاق الجرد</label>
                        <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
                            <button
                                onClick={() => setFormData({ ...formData, category: 'all' })}
                                className={`flex-1 py-1.5 rounded-md text-[9px] font-black ${formData.category === 'all' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-gray-400'}`}
                            >كافة الأصناف</button>
                            <button
                                onClick={() => setFormData({ ...formData, category: 'partial' })}
                                className={`flex-1 py-1.5 rounded-md text-[9px] font-black ${formData.category === 'partial' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-gray-400'}`}
                            >أصناف مختارة</button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default StartAuditModal;