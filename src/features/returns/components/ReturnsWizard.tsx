import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
    RefreshCw, Save, Calendar, FileText, AlertCircle, CheckCircle,
    ArrowLeft, ArrowRight, Truck, User, RotateCcw, Loader2, Package,
    X, AlertTriangle, Check, Clock, XCircle, Move, GripVertical
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import Modal from '../../../ui/base/Modal';
import Button from '../../../ui/base/Button';
import InvoiceSelector from './InvoiceSelector';
import InvoiceItemsList from './InvoiceItemsList';
import { Invoice, ReturnType, InvoiceItem } from '../types';
import { useSalesInvoicesForReturn } from '../../sales/hooks/useSalesReturns';
import { usePurchaseInvoicesForReturn } from '../../purchases/hooks/usePurchaseReturns';
import { useCreateSalesReturn } from '../../sales/hooks/useSalesReturns';
import { useCreatePurchaseReturn } from '../../purchases/hooks/usePurchaseReturns';

interface ReturnsWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    invoices?: Invoice[];
    returnType: ReturnType;
    partyName?: string;
    partyId?: string;
    onSubmit?: (data: {
        invoiceId: string;
        items: Array<{
            productId: string;
            name: string;
            quantity: number;
            unitPrice: number;
            returnQuantity: number;
        }>;
        returnReason: string;
        notes: string;
        date: string;
        status: 'processing' | 'accepted' | 'rejected';
    }) => void;
    isLoading?: boolean;
}

// Return reasons with icons
const RETURN_REASONS = [
    { value: 'defective', label: 'منتج تالف', icon: '🔴', description: 'المنتج به عيب أو تلف' },
    { value: 'not_as_described', label: 'غير مطابق للمواصفات', icon: '📋', description: 'المنتج لا يطابق المواصفات المطلوبة' },
    { value: 'wrong_item', label: 'صنف خاطئ', icon: '❌', description: 'تم إرسال صنف مختلف عن المطلوب' },
    { value: 'customer_request', label: 'طلب العميل', icon: '👤', description: 'العميل غير راضٍ عن المنتج' },
    { value: 'order_error', label: 'خطأ في الطلب', icon: '⚠️', description: 'خطأ في بيانات الطلب' },
    { value: 'expired', label: 'منتج منتهي الصلاحية', icon: '⏰', description: 'انتهاء تاريخ الصلاحية' },
    { value: 'other', label: 'أخرى', icon: '📝', description: 'أسباب أخرى' },
];

// Return status options
const RETURN_STATUSES = [
    { value: 'processing', label: 'جاري المعالجة', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-700', icon: Clock },
    { value: 'accepted', label: 'مقبول', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700', icon: Check },
    { value: 'rejected', label: 'مرفوض', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-700', icon: XCircle },
];

const ReturnsWizard: React.FC<ReturnsWizardProps> = ({
    isOpen,
    onClose,
    onSuccess,
    invoices: propInvoices,
    returnType,
    partyName,
    partyId,
    onSubmit,
    isLoading: propIsLoading,
}) => {
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
    const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
    const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
    const [step, setStep] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const modalRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    // Fetch invoices from database if not provided as props
    const { data: salesInvoices, isLoading: isLoadingSalesInvoices } = useSalesInvoicesForReturn(null);
    const { data: purchaseInvoices, isLoading: isLoadingPurchaseInvoices } = usePurchaseInvoicesForReturn(null);

    // Create return mutations
    const createSalesReturn = useCreateSalesReturn();
    const createPurchaseReturn = useCreatePurchaseReturn();

    // Use provided invoices or fetched ones
    const invoices = propInvoices || (returnType === 'sale' ? salesInvoices : purchaseInvoices);
    const isLoadingInvoices = returnType === 'sale' ? isLoadingSalesInvoices : isLoadingPurchaseInvoices;
    const isCreating = returnType === 'sale' ? createSalesReturn.isPending : createPurchaseReturn.isPending;

    const { register, handleSubmit, watch, setValue, reset, control, formState: { errors, isValid } } = useForm({
        defaultValues: {
            returnReason: '',
            notes: '',
            date: new Date().toISOString().split('T')[0],
            status: 'processing' as 'processing' | 'accepted' | 'rejected',
        },
        mode: 'onChange'
    });

    // Drag functionality
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.no-drag')) return;
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - (modalRef.current?.getBoundingClientRect().left || 0),
            y: e.clientY - (modalRef.current?.getBoundingClientRect().top || 0)
        });
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !modalRef.current) return;
        const x = e.clientX - dragOffset.x;
        const y = e.clientY - dragOffset.y;
        modalRef.current.style.left = `${Math.max(0, x)}px`;
        modalRef.current.style.top = `${Math.max(0, y)}px`;
        modalRef.current.style.transform = 'none';
    }, [isDragging, dragOffset]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Reset position when modal opens
    useEffect(() => {
        if (isOpen && modalRef.current) {
            modalRef.current.style.left = '50%';
            modalRef.current.style.top = '50%';
            modalRef.current.style.transform = 'translate(-50%, -50%)';
        }
    }, [isOpen]);

    const watchedNotes = watch('notes');
    const watchedReturnReason = watch('returnReason');
    const watchedStatus = watch('status');

    // Get selected invoice
    const selectedInvoice = useMemo(() => {
        return (invoices || []).find((inv: Invoice) => inv.id === selectedInvoiceId);
    }, [invoices, selectedInvoiceId]);

    // Calculate total amount
    const totalAmount = useMemo(() => {
        if (!selectedInvoice?.invoice_items) return 0;
        return selectedInvoice.invoice_items.reduce((sum: number, item: InvoiceItem) => {
            const qty = returnQuantities[item.id] || 0;
            return sum + (qty * item.unit_price);
        }, 0);
    }, [selectedInvoice, returnQuantities]);

    // Calculate total items count
    const totalItemsCount = useMemo(() => {
        return Object.entries(returnQuantities).reduce((sum: number, [, qty]) => {
            return sum + (qty > 0 ? qty : 0);
        }, 0);
    }, [returnQuantities, selectedItems]);

    // Validate form
    const hasValidItems = useMemo(() => {
        return Object.entries(returnQuantities).some(([, qty]) => qty > 0);
    }, [returnQuantities, selectedItems]);

    // Form validation
    const validateForm = useCallback(() => {
        const validationErrors: string[] = [];

        if (!selectedInvoiceId) {
            validationErrors.push('يرجى اختيار الفاتورة الأصلية');
        }

        if (!hasValidItems) {
            validationErrors.push('يرجى اختيار أصناف للإرجاع');
        }

        if (!watchedReturnReason) {
            validationErrors.push('يرجى اختيار سبب الإرجاع');
        }

        return validationErrors;
    }, [selectedInvoiceId, hasValidItems, watchedReturnReason]);

    // Handle item selection
    const handleItemSelect = useCallback((itemId: string, selected: boolean) => {
        setSelectedItems(prev => ({
            ...prev,
            [itemId]: selected
        }));
        if (!selected) {
            setReturnQuantities(prev => ({
                ...prev,
                [itemId]: 0
            }));
        }
    }, []);

    // Handle quantity change with validation
    const handleQuantityChange = useCallback((itemId: string, quantity: number, maxQty: number = 0) => {
        // Get the actual max quantity from the invoice item if not provided
        if (!maxQty && selectedInvoice?.invoice_items) {
            const item = selectedInvoice.invoice_items.find((i: InvoiceItem) => i.id === itemId);
            maxQty = item?.quantity || 0;
        }
        const validQty = Math.min(Math.max(0, quantity), maxQty);
        setReturnQuantities(prev => ({
            ...prev,
            [itemId]: validQty
        }));
        // Auto-select the item when quantity is set
        if (validQty > 0) {
            setSelectedItems(prev => ({ ...prev, [itemId]: true }));
        }
    }, [selectedInvoice]);

    // Handle invoice selection
    const handleInvoiceSelect = useCallback((invoiceId: string) => {
        setSelectedInvoiceId(invoiceId);
        setReturnQuantities({});
        setSelectedItems({});
        setStep(2);
    }, []);

    // Handle form submission with validation
    const handleFormSubmit = async (data: { returnReason: string; notes: string; date: string; status: 'processing' | 'accepted' | 'rejected' }) => {
        const validationErrors = validateForm();

        if (validationErrors.length > 0) {
            return;
        }

        if (!selectedInvoice) return;

        const items = selectedInvoice.invoice_items
            ?.filter((item: any) => returnQuantities[item.id] > 0 && selectedItems[item.id])
            .map((item: any) => ({
                productId: item.product_id,
                name: item.description,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                returnQuantity: returnQuantities[item.id]
            })) || [];

        // If onSubmit prop is provided, call it
        if (onSubmit) {
            onSubmit({
                invoiceId: selectedInvoiceId,
                items,
                returnReason: data.returnReason,
                notes: data.notes,
                date: data.date,
                status: data.status,
            });
            handleClose();
            onSuccess();
            return;
        }

        // Otherwise, use the mutations to create the return
        try {
            const returnData = {
                referenceInvoiceId: selectedInvoiceId,
                partyId: selectedInvoice.party?.id || partyId,
                supplierId: selectedInvoice.party?.id || partyId || null,
                invoiceNumber: selectedInvoice.invoice_number || '',
                paymentMethod: 'cash' as const,
                issueDate: data.date,
                returnReason: data.returnReason,
                notes: data.notes,
                status: (data.status === 'accepted' ? 'posted' : 'draft') as 'posted' | 'draft',
                items: items.map((item: any) => ({
                    productId: item.productId,
                    name: item.name,
                    quantity: item.returnQuantity,
                    unitPrice: item.unitPrice,
                    unitCost: item.unitPrice * 0.6,
                    costPrice: item.unitPrice * 0.6,
                })),
            };

            if (returnType === 'sale') {
                await createSalesReturn.mutateAsync(returnData);
            } else {
                await createPurchaseReturn.mutateAsync(returnData);
            }

            handleClose();
            onSuccess();
        } catch (error) {
            console.error('Error creating return:', error);
        }
    };

    // Reset state on close
    const handleClose = () => {
        setSelectedInvoiceId('');
        setReturnQuantities({});
        setSelectedItems({});
        setStep(1);
        reset();
        onClose();
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'SAR'
        }).format(amount);
    };

    // Format date
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('ar-SA');
    };

    const title = returnType === 'sale' ? 'إنشاء مرتجع مبيعات' : 'إنشاء مرتجع مشتريات';
    const description = returnType === 'sale'
        ? 'إعادة بضاعة من عميل إلى المخزن'
        : 'إعادة بضاعة إلى المورد';

    const validationErrors = validateForm();
    const hasValidationErrors = validationErrors.length > 0 && step === 2;

    const footer = (
        <div className="flex w-full gap-2 p-1 no-drag">
            <Button
                variant="outline"
                onClick={step === 1 ? handleClose : () => setStep(1)}
                className="flex-1"
                disabled={isCreating}
            >
                {step === 1 ? (
                    <>
                        <X size={16} className="ml-1" />
                        إلغاء
                    </>
                ) : (
                    <>
                        <ArrowLeft size={16} className="ml-1" />
                        السابق
                    </>
                )}
            </Button>
            {step === 1 ? (
                <Button
                    onClick={() => selectedInvoiceId && setStep(2)}
                    disabled={!selectedInvoiceId || isLoadingInvoices}
                    className="flex-[2]"
                >
                    {isLoadingInvoices ? (
                        <Loader2 size={16} className="animate-spin ml-2" />
                    ) : (
                        <>
                            التالي
                            <ArrowRight size={16} className="mr-1" />
                        </>
                    )}
                </Button>
            ) : (
                <Button
                    onClick={handleSubmit(handleFormSubmit)}
                    isLoading={isCreating}
                    variant="danger"
                    className="flex-[2]"
                    disabled={!hasValidItems || !watchedReturnReason}
                >
                    <Save size={16} className="ml-1" />
                    حفظ المرتجع
                </Button>
            )}
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            icon={RefreshCw}
            title={title}
            description={description}
            footer={footer}
            size="resizable"
        >
            <div
                ref={modalRef}
                className="transition-all duration-300"
                style={{
                    position: 'relative',
                    animation: isOpen ? 'fadeIn 0.3s ease-out' : 'fadeOut 0.2s ease-in'
                }}
            >
                {/* Drag Handle */}
                <div
                    className="absolute top-0 left-0 right-0 h-8 cursor-move flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-xl no-drag"
                    onMouseDown={handleMouseDown}
                >
                    <GripVertical size={20} className="text-white/70" />
                    <span className="mr-2 text-white/80 text-xs font-medium">اسحب لتحريك النافذة</span>
                </div>

                <form ref={formRef} className="space-y-4 mt-8">
                    {/* Validation Errors Alert */}
                    {hasValidationErrors && (
                        <div className="animate-pulse bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl p-4 no-drag">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="text-red-500 mt-0.5" size={20} />
                                <div>
                                    <h4 className="font-bold text-red-700 dark:text-red-300">يرجى إكمال البيانات المطلوبة:</h4>
                                    <ul className="mt-1 space-y-1">
                                        {validationErrors.map((error, index) => (
                                            <li key={index} className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                                {error}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Invoice Selection */}
                    {step === 1 && (
                        <div className="space-y-4 animate-fade-in">
                            {/* Loading state */}
                            {isLoadingInvoices && (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 size={32} className="animate-spin text-blue-600" />
                                    <span className="mr-2 text-gray-500">جاري تحميل الفواتير...</span>
                                </div>
                            )}

                            {/* Invoice Selector */}
                            {!isLoadingInvoices && (
                                <InvoiceSelector
                                    invoices={invoices || []}
                                    selectedInvoiceId={selectedInvoiceId}
                                    onSelectInvoice={handleInvoiceSelect}
                                    placeholder="اختر الفاتورة الأصلية..."
                                />
                            )}

                            {/* Selected Invoice Details */}
                            {selectedInvoice && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                                            <FileText size={20} className="text-blue-600 dark:text-blue-300" />
                                        </div>
                                        <div>
                                            <span className="font-bold text-blue-800 dark:text-blue-200">تفاصيل الفاتورة</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
                                            <span className="text-gray-500 block text-xs">رقم الفاتورة</span>
                                            <span className="font-bold text-gray-800 dark:text-gray-200">{selectedInvoice.invoice_number}</span>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
                                            <span className="text-gray-500 block text-xs">التاريخ</span>
                                            <span className="font-bold text-gray-800 dark:text-gray-200">{formatDate(selectedInvoice.issue_date)}</span>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
                                            <span className="text-gray-500 block text-xs">
                                                {returnType === 'sale' ? 'العميل' : 'المورد'}
                                            </span>
                                            <span className="font-bold text-gray-800 dark:text-gray-200">
                                                {returnType === 'sale' ? (
                                                    selectedInvoice.party?.name || 'عميل نقدي'
                                                ) : (
                                                    selectedInvoice.party?.name || 'مورد عام'
                                                )}
                                            </span>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
                                            <span className="text-gray-500 block text-xs">إجمالي الفاتورة</span>
                                            <span className="font-bold text-blue-600 text-lg">
                                                {formatCurrency(selectedInvoice.total_amount)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Items count */}
                                    {(selectedInvoice.invoice_items?.length || 0) > 0 && (
                                        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <Package size={16} />
                                            <span>تحتوي على {selectedInvoice.invoice_items?.length} أصناف</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Item Selection & Form Details */}
                    {step === 2 && selectedInvoice && (
                        <div className="space-y-4 animate-fade-in">
                            {/* Invoice Info Header */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 no-drag">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                        <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-800 dark:text-gray-200">{selectedInvoice.invoice_number}</span>
                                        <span className="mx-2 text-gray-400">|</span>
                                        <span className="text-sm text-gray-500">
                                            {selectedInvoice.party?.name || (returnType === 'sale' ? 'عميل نقدي' : 'مورد عام')}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium no-drag"
                                >
                                    تغيير الفاتورة
                                </button>
                            </div>

                            {/* Items List with validation */}
                            <div className="no-drag">
                                <InvoiceItemsList
                                    items={selectedInvoice.invoice_items || []}
                                    returnQuantities={returnQuantities}
                                    selectedItems={selectedItems}
                                    onItemSelect={handleItemSelect}
                                    onQuantityChange={handleQuantityChange}
                                />
                            </div>

                            {/* Status Selection */}
                            <div className="no-drag">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    حالة المرتجع <span className="text-red-500">*</span>
                                </label>
                                <Controller
                                    name="status"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <div className="grid grid-cols-3 gap-3">
                                            {RETURN_STATUSES.map((status) => {
                                                const Icon = status.icon;
                                                const isSelected = field.value === status.value;
                                                return (
                                                    <button
                                                        key={status.value}
                                                        type="button"
                                                        onClick={() => field.onChange(status.value)}
                                                        className={`
                                                            relative p-3 rounded-xl border-2 transition-all duration-200
                                                            flex flex-col items-center gap-2
                                                            ${isSelected
                                                                ? `${status.bgColor} ${status.textColor} border-${status.color}-500 dark:border-${status.color}-400`
                                                                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                                                            }
                                                        `}
                                                    >
                                                        <Icon size={20} className={isSelected ? status.textColor : 'text-gray-400'} />
                                                        <span className={`text-sm font-bold ${isSelected ? status.textColor : 'text-gray-600 dark:text-gray-400'}`}>
                                                            {status.label}
                                                        </span>
                                                        {isSelected && (
                                                            <div className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-${status.color}-500`} />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                />
                            </div>

                            {/* Return Reason */}
                            <div className="no-drag">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    سبب الإرجاع <span className="text-red-500">*</span>
                                </label>
                                <Controller
                                    name="returnReason"
                                    control={control}
                                    rules={{ required: 'يرجى اختيار سبب الإرجاع' }}
                                    render={({ field }) => (
                                        <div className="grid grid-cols-2 gap-2">
                                            {RETURN_REASONS.map((reason) => (
                                                <button
                                                    key={reason.value}
                                                    type="button"
                                                    onClick={() => field.onChange(reason.value)}
                                                    className={`
                                                        relative p-3 rounded-xl border-2 transition-all duration-200 text-right
                                                        ${field.value === reason.value
                                                            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-400 dark:border-orange-500'
                                                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                                                        }
                                                    `}
                                                >
                                                    <span className="text-lg ml-2">{reason.icon}</span>
                                                    <span className={`text-sm font-bold ${field.value === reason.value ? 'text-orange-700 dark:text-orange-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                                        {reason.label}
                                                    </span>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {reason.description}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                />
                                {errors.returnReason && (
                                    <span className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        {errors.returnReason.message as string}
                                    </span>
                                )}
                            </div>

                            {/* Date */}
                            <div className="no-drag">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    تاريخ الإرجاع
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
                                    <input
                                        type="date"
                                        {...register('date')}
                                        className="w-full pr-12 pl-4 py-3 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="no-drag">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    ملاحظات إضافية <span className="text-gray-400 text-xs">(اختياري)</span>
                                </label>
                                <textarea
                                    {...register('notes')}
                                    placeholder="أضف ملاحظات إضافية حول المرتجع..."
                                    className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-sm font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all resize-none"
                                    rows={3}
                                />
                            </div>

                            {/* Total */}
                            <div className="flex justify-between items-center p-5 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl no-drag">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                                        <RotateCcw size={22} className="text-red-600" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-red-700 dark:text-red-300">إجمالي المرتجع</span>
                                        <span className="mr-2 text-xs text-gray-500">
                                            ({totalItemsCount} أصناف)
                                        </span>
                                    </div>
                                </div>
                                <span className="text-2xl font-black text-red-600 dark:text-red-400">
                                    {formatCurrency(totalAmount)}
                                </span>
                            </div>

                            {/* Info Alert */}
                            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl no-drag">
                                <div className="p-1.5 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                    <CheckCircle size={18} className="text-green-600" />
                                </div>
                                <span className="text-sm text-green-700 dark:text-green-300">
                                    {returnType === 'sale'
                                        ? '✅ سيتم إضافة الكمية المرتجعة للمخزون تلقائياً'
                                        : '✅ سيتم خصم الكمية المرتجعة من المخزون تلقائياً'}
                                </span>
                            </div>
                        </div>
                    )}
                </form>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeOut {
                    from { opacity: 1; transform: translateY(0); }
                    to { opacity: 0; transform: translateY(-10px); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </Modal>
    );
};

export default ReturnsWizard;
