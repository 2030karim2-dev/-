import React, { useEffect, useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { RefreshCw, Save, DollarSign, Calendar, FileText, User, Search, Plus, Trash2, Truck, AlertCircle, CheckCircle } from 'lucide-react';
import { useCreatePurchaseReturn, usePurchaseInvoicesForReturn } from '../../hooks/usePurchaseReturns';
import { useSupplierSearch } from '../../hooks';
import { useMinimalProducts } from '../../../inventory/hooks';
import { CreatePurchaseDTO } from '../../types';
import Modal from '../../../../ui/base/Modal';
import Button from '../../../../ui/base/Button';
import { useAuthStore } from '../../../auth/store';
import { useFeedbackStore } from '../../../feedback/store';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    preloadedItems?: any[];
    supplierInfo?: {
        partyId: string;
        partyName: string;
    };
    originalInvoiceNumber?: string;
}

// Return reason options
const RETURN_REASONS = [
    { value: 'defective', label: 'منتج تالف' },
    { value: 'not_as_described', label: 'غير مطابق للمواصفات' },
    { value: 'wrong_item', label: 'صنف خاطئ' },
    { value: 'quality_issue', label: 'مشكلة في الجودة' },
    { value: 'expired', label: 'منتج منتهي الصلاحية' },
    { value: 'other', label: 'أخرى' },
];

const CreatePurchaseReturnModal: React.FC<Props> = ({
    isOpen,
    onClose,
    onSuccess,
    preloadedItems = [],
    supplierInfo,
    originalInvoiceNumber
}) => {
    const { user } = useAuthStore();
    const { showToast } = useFeedbackStore();
    const { mutate: createReturn, isPending: isSaving } = useCreatePurchaseReturn();

    const [supplierQuery, setSupplierQuery] = useState('');
    const [productQuery, setProductQuery] = useState('');
    const [activeProductSearch, setActiveProductSearch] = useState<number | null>(null);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(supplierInfo?.partyId || null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const { data: suppliers } = useSupplierSearch(supplierQuery);
    const { data: searchResultsData } = useMinimalProducts();
    const searchResults = searchResultsData || [];

    const { data: originalInvoices } = usePurchaseInvoicesForReturn(selectedSupplierId);

    const { register, control, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: {
            supplierId: null as string | null,
            supplierName: '',
            invoiceNumber: '',
            date: new Date().toISOString().split('T')[0],
            notes: '',
            returnReason: '',
            items: [{ productId: '', name: '', quantity: 1, unitCost: 0 }],
        }
    });

    const { fields, append, remove, update } = useFieldArray({ control, name: "items" });
    const watchedItems = watch('items');

    const subtotal = useMemo(() => watchedItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0), [watchedItems]);

    // Validation function
    const validateForm = (): boolean => {
        const errors: string[] = [];

        // Check if there are items
        const validItems = watchedItems.filter(item => item.name && item.quantity > 0 && item.unitCost > 0);
        if (validItems.length === 0) {
            errors.push('يجب إضافة صنف واحد على الأقل مع كمية وسعر صحيح');
        }

        // Check if quantity is valid
        watchedItems.forEach((item, index) => {
            if (item.name && item.quantity <= 0) {
                errors.push(`الصنف ${index + 1}: الكمية يجب أن تكون أكبر من صفر`);
            }
            if (item.name && item.unitCost < 0) {
                errors.push(`الصنف ${index + 1}: السعر يجب أن يكون صحيحاً`);
            }
        });

        // Check if total is valid
        if (subtotal <= 0) {
            errors.push('إجمالي المرتجع يجب أن يكون أكبر من صفر');
        }

        setValidationErrors(errors);
        return errors.length === 0;
    };

    // Validation function

    useEffect(() => {
        if (isOpen) {
            // Initialize with preloaded items if available
            if (preloadedItems.length > 0) {
                const formItems = preloadedItems.map((item: any) => ({
                    productId: item.product_id || item.id || '',
                    name: item.description || item.name || '',
                    quantity: item.returnQuantity || item.quantity || 1,
                    unitCost: item.unitCost || item.cost_price || item.unit_price || 0
                }));
                reset({
                    supplierId: supplierInfo?.partyId || null,
                    supplierName: supplierInfo?.partyName || '',
                    invoiceNumber: originalInvoiceNumber || '',
                    date: new Date().toISOString().split('T')[0],
                    notes: 'مرتجع من فاتورة سابقة',
                    items: formItems
                });
            } else {
                reset({
                    supplierId: supplierInfo?.partyId || null,
                    supplierName: supplierInfo?.partyName || '',
                    invoiceNumber: originalInvoiceNumber || '',
                    date: new Date().toISOString().split('T')[0],
                    notes: 'مرتجع مشتريات',
                    items: [{ productId: '', name: '', quantity: 1, unitCost: 0 }]
                });
            }
            setSupplierQuery(supplierInfo?.partyName || '');
            setProductQuery('');
            setSelectedSupplierId(supplierInfo?.partyId || null);
            setValidationErrors([]);
        }
    }, [isOpen, reset, preloadedItems, supplierInfo, originalInvoiceNumber]);

    const handleFinalSubmit = (data: any) => {
        // Validate before submitting
        if (!validateForm()) {
            showToast('يرجى تصحيح الأخطاء قبل الإرسال', 'error');
            return;
        }

        try {
            const finalData: CreatePurchaseDTO = {
                supplierId: data.supplierId,
                invoiceNumber: data.invoiceNumber || '', // Used as original invoice reference
                items: data.items.map((i: any) => ({
                    ...i,
                    sku: '',
                    partNumber: '',
                    brand: '',
                    taxRate: 0,
                    total: i.quantity * i.unitCost
                })),
                issueDate: data.date,
                notes: data.notes,
                status: 'posted',
                paymentMethod: 'cash',
                currency: 'SAR',
                exchangeRate: 1,
                returnReason: data.returnReason || null,
            };
            createReturn(finalData, { onSuccess });
        } catch (e: unknown) {
            const err = e as Error;
            showToast(err.message, 'error');
        }
    };

    const handleSupplierSelect = (supplier: any) => {
        setValue('supplierId', supplier.id);
        setValue('supplierName', supplier.name);
        setSelectedSupplierId(supplier.id);
        setSupplierQuery('');
    };

    const handleInvoiceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setValue('invoiceNumber', e.target.value);
    };

    const footer = (
        <div className="flex w-full gap-2 p-1">
            <Button variant="outline" onClick={onClose} className="flex-1">إلغاء</Button>
            <Button onClick={handleSubmit(handleFinalSubmit)} isLoading={isSaving} variant="danger" className="flex-[2] rounded-none">تأكيد الإرجاع</Button>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} icon={RefreshCw} title="إنشاء مرتجع مشتريات" description="إعادة بضاعة إلى المورد" footer={footer}>
            <form className="space-y-3">
                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                            <AlertCircle size={16} />
                            <span className="text-sm font-bold">يرجى تصحيح الأخطاء التالية:</span>
                        </div>
                        <ul className="list-disc list-inside text-xs text-red-500 space-y-1">
                            {validationErrors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Supplier Search */}
                <div className="relative">
                    <div className="relative">
                        <Truck className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            {...register('supplierName')}
                            onChange={(e: any) => { setSupplierQuery(e.target.value); setValue('supplierName', e.target.value); }}
                            placeholder="ابحث عن المورد..."
                            className="w-full pr-10 pl-3 py-2 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 rounded-lg text-sm font-bold text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                    {supplierQuery && suppliers && (
                        <div className="absolute z-10 w-full bg-white border shadow-lg rounded-md mt-1">
                            {suppliers.map((s: any) => (
                                <div
                                    key={s.id}
                                    onClick={() => handleSupplierSelect(s)}
                                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                >
                                    {s.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Original Invoice Selection */}
                {selectedSupplierId && originalInvoices && originalInvoices.length > 0 && (
                    <div className="relative">
                        <FileText className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <select
                            {...register('invoiceNumber')}
                            onChange={handleInvoiceSelect}
                            className="w-full pr-10 pl-3 py-2 bg-gray-50 border rounded text-sm font-bold"
                        >
                            <option value="">اختر الفاتورة الأصلية (اختياري)</option>
                            {originalInvoices.map((inv: any) => (
                                <option key={inv.id} value={inv.invoice_number}>
                                    {inv.invoice_number} - {new Date(inv.issue_date).toLocaleDateString('ar-SA')} - {Number(inv.total_amount).toFixed(2)}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Date */}
                <div className="relative">
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={16} />
                    <input
                        type="date"
                        {...register('date')}
                        className="w-full pr-10 pl-3 py-2 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 rounded-lg text-sm font-bold text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                    />
                </div>

                {/* Items */}
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar p-1">
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 gap-2 items-center relative">
                            <input
                                {...register(`items.${index}.name`)}
                                onFocus={() => setActiveProductSearch(index)}
                                onChange={(e: any) => {
                                    update(index, { ...watchedItems[index], name: e.target.value });
                                    setProductQuery(e.target.value);
                                }}
                                placeholder="ابحث عن الصنف..."
                                className="col-span-5 p-2 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 rounded text-xs font-bold text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                            />
                            <input
                                type="number"
                                {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                className="col-span-2 p-2 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 rounded text-xs font-bold text-center text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                            />
                            <input
                                type="number"
                                {...register(`items.${index}.unitCost`, { valueAsNumber: true })}
                                className="col-span-2 p-2 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 rounded text-xs font-bold text-center text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                            />
                            <div className="col-span-2 text-xs font-mono font-bold text-right pr-2">
                                {(watchedItems[index].quantity * watchedItems[index].unitCost).toFixed(2)}
                            </div>
                            <button type="button" onClick={() => remove(index)} className="col-span-1 text-rose-500">
                                <Trash2 size={14} />
                            </button>

                            {activeProductSearch === index && productQuery && searchResults.length > 0 && (
                                <div className="absolute z-10 w-full bg-white border shadow-lg rounded-md mt-1 top-full left-0 max-h-40 overflow-y-auto">
                                    {searchResults.map((p: any) => (
                                        <div
                                            key={p.id}
                                            onClick={() => {
                                                setValue(`items.${index}.productId`, p.id);
                                                setValue(`items.${index}.name`, p.name);
                                                setValue(`items.${index}.unitCost`, p.cost_price || 0);
                                                setActiveProductSearch(null);
                                                setProductQuery('');
                                            }}
                                            className="p-2 hover:bg-gray-100 cursor-pointer text-xs"
                                        >
                                            {p.name} ({p.sku})
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ productId: '', name: '', quantity: 1, unitCost: 0 })}
                    leftIcon={<Plus size={14} />}
                >
                    إضافة صنف
                </Button>

                {/* Totals */}
                <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-600">الإجمالي:</span>
                        <span className="font-bold text-lg text-red-600">{subtotal.toFixed(2)}</span>
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <textarea
                        {...register('notes')}
                        placeholder="ملاحظات..."
                        className="w-full p-2 bg-gray-50 border rounded text-sm font-bold"
                        rows={2}
                    />
                </div>

                {/* Success indicator */}
                <div className="flex items-center gap-2 text-green-600 text-xs">
                    <CheckCircle size={14} />
                    <span>سيتم إضافة الكمية للمخزون تلقائياً</span>
                </div>

                {/* Return Reason */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">سبب الإرجاع</label>
                    <select
                        {...register('returnReason')}
                        className="w-full p-2 bg-gray-50 border rounded text-sm font-bold"
                    >
                        <option value="">اختر سبب الإرجاع (اختياري)</option>
                        {RETURN_REASONS.map((reason) => (
                            <option key={reason.value} value={reason.value}>
                                {reason.label}
                            </option>
                        ))}
                    </select>
                </div>
            </form>
        </Modal>
    );
};

export default CreatePurchaseReturnModal;
