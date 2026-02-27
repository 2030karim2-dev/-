import React, { useEffect, useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { RefreshCw, Save, DollarSign, Calendar, FileText, User, Search, Plus, Trash2, AlertCircle, CheckCircle, ChevronDown, X } from 'lucide-react';
import { useCreateInvoice } from '../../hooks';
import { useCustomerSearch } from '../../../customers/hooks';
import { useMinimalProducts } from '../../../inventory/hooks';
import { useSalesInvoicesForReturn } from '../../hooks/useSalesReturns';
import { CreateInvoiceDTO } from '../../types';
import Modal from '../../../../ui/base/Modal';
import Button from '../../../../ui/base/Button';
import { cn } from '../../../../core/utils';
import { AuthorizeActionUsecase } from '../../../../core/usecases/auth/AuthorizeActionUsecase';
import { useAuthStore } from '../../../auth/store';
import { useFeedbackStore } from '../../../feedback/store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preloadedItems?: any[];
  customerInfo?: {
    partyId: string;
    partyName: string;
  };
  preloadInvoiceId?: string;
}

// Return reason options
const RETURN_REASONS: Array<{ value: string; label: string }> = [
  { value: 'defective', label: 'منتج تالف' },
  { value: 'not_as_described', label: 'غير مطابق للمواصفات' },
  { value: 'wrong_item', label: 'صنف خاطئ' },
  { value: 'quality_issue', label: 'مشكلة في الجودة' },
  { value: 'changed_mind', label: 'تغيير رأي العميل' },
  { value: 'other', label: 'أخرى' },
];

const CreateReturnModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, preloadedItems = [], customerInfo, preloadInvoiceId }) => {
  const { user } = useAuthStore();
  const { showToast } = useFeedbackStore();
  const { mutate: createInvoice, isPending: isSaving } = useCreateInvoice();

  const [customerQuery, setCustomerQuery] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [activeProductSearch, setActiveProductSearch] = useState<number | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [customerType, setCustomerType] = useState<'cash' | 'credit'>('cash');
  const [showInvoiceItems, setShowInvoiceItems] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, { quantity: number; selected: boolean }>>({});

  const { data: customers } = useCustomerSearch(customerQuery);
  const { data: searchResultsData } = useMinimalProducts();
  const searchResults = searchResultsData || [];

  const { data: originalInvoices } = useSalesInvoicesForReturn(null);

  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors, isValid } } = useForm({
    defaultValues: {
      partyId: null as string | null,
      partyName: 'عميل نقدي',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      returnReason: '',
      items: [{ productId: '', name: '', quantity: 1, unitPrice: 0 }],
    },
    mode: 'onChange'
  });

  const { fields, append, remove, update } = useFieldArray({ control, name: "items" });
  const watchedItems = watch('items');
  const watchedReturnReason = watch('returnReason');

  const subtotal = useMemo(() => watchedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0), [watchedItems]);

  // Filter invoices based on search
  const filteredInvoices = useMemo(() => {
    if (!originalInvoices) return [];
    if (!productQuery) return originalInvoices;

    const query = productQuery.toLowerCase();
    return originalInvoices.filter((inv: any) =>
      (inv.invoice_number || '').toLowerCase().includes(query) ||
      (inv.party?.name || '').toLowerCase().includes(query) ||
      (inv.issue_date || '').includes(query)
    );
  }, [originalInvoices, productQuery]);

  // Get selected invoice details
  const selectedInvoice = useMemo(() => {
    if (!selectedInvoiceId || !originalInvoices) return null;
    return originalInvoices.find((inv: any) => inv.id === selectedInvoiceId);
  }, [selectedInvoiceId, originalInvoices]);

  // Set preload invoice if provided
  useEffect(() => {
    if (preloadInvoiceId && originalInvoices) {
      setSelectedInvoiceId(preloadInvoiceId);
    }
  }, [preloadInvoiceId, originalInvoices]);

  // Load invoice items when invoice is selected
  useEffect(() => {
    if (selectedInvoice && selectedInvoice.invoice_items) {
      setInvoiceItems(selectedInvoice.invoice_items);
      // Initialize selected items with all items
      const initialSelected: Record<string, { quantity: number; selected: boolean }> = {};
      selectedInvoice.invoice_items.forEach((item: any) => {
        initialSelected[item.id] = { quantity: item.quantity, selected: false };
      });
      setSelectedItems(initialSelected);
      setShowInvoiceItems(true);
    }
  }, [selectedInvoice]);

  // Handle item selection from invoice
  const handleInvoiceItemSelect = (itemId: string, selected: boolean) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], selected }
    }));
  };

  // Handle quantity change for invoice items
  const handleInvoiceItemQuantityChange = (itemId: string, quantity: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity: Math.max(0, quantity) }
    }));
  };

  // Add selected invoice items to return items
  const handleAddSelectedItems = () => {
    const newItems = Object.entries(selectedItems)
      .filter(([_, data]) => data.selected && data.quantity > 0)
      .map(([itemId, data]) => {
        const invoiceItem = invoiceItems.find((i: any) => i.id === itemId);
        return {
          productId: invoiceItem?.product_id || '',
          name: invoiceItem?.description || '',
          quantity: data.quantity,
          unitPrice: invoiceItem?.unit_price || 0
        };
      });

    if (newItems.length > 0) {
      // Clear existing items and add new ones
      newItems.forEach((item, index) => {
        if (index === 0) {
          update(0, item);
        } else {
          append(item);
        }
      });
      // Remove extra items if any
      while (fields.length > newItems.length) {
        remove(fields.length - 1);
      }
      showToast(`تم إضافة ${newItems.length} أصناف من الفاتورة`, 'success');
    }
    setShowInvoiceItems(false);
  };

  // Validation function
  const validateForm = (): boolean => {
    const errors: string[] = [];

    const validItems = watchedItems.filter(item => item.name && item.quantity > 0 && item.unitPrice > 0);
    if (validItems.length === 0) {
      errors.push('يجب إضافة صنف واحد على الأقل مع كمية وسعر صحيح');
    }

    watchedItems.forEach((item, index) => {
      if (item.name && item.quantity <= 0) {
        errors.push(`الصنف ${index + 1}: الكمية يجب أن تكون أكبر من صفر`);
      }
      if (item.name && item.unitPrice < 0) {
        errors.push(`الصنف ${index + 1}: السعر يجب أن يكون صحيحاً`);
      }
    });

    if (subtotal <= 0) {
      errors.push('إجمالي المرتجع يجب أن يكون أكبر من صفر');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  useEffect(() => {
    if (isOpen) {
      if (preloadedItems.length > 0) {
        const formItems = preloadedItems.map((item: any) => ({
          productId: item.product_id || item.id || '',
          name: item.description || item.name || '',
          quantity: item.returnQuantity || item.quantity || 1,
          unitPrice: item.unitPrice || item.unit_price || 0
        }));
        reset({
          partyId: customerInfo?.partyId || null,
          partyName: customerInfo?.partyName || (customerType === 'cash' ? 'عميل نقدي' : ''),
          date: new Date().toISOString().split('T')[0],
          notes: 'مرتجع من فاتورة سابقة',
          returnReason: '',
          items: formItems
        });
      } else {
        reset({
          partyId: customerInfo?.partyId || null,
          partyName: customerInfo?.partyName || (customerType === 'cash' ? 'عميل نقدي' : ''),
          date: new Date().toISOString().split('T')[0],
          notes: '',
          returnReason: '',
          items: [{ productId: '', name: '', quantity: 1, unitPrice: 0 }]
        });
      }
      setCustomerQuery(customerInfo?.partyName || '');
      setProductQuery('');
      setSelectedInvoiceId(preloadInvoiceId || '');
      setValidationErrors([]);
      setShowInvoiceItems(false);
      setInvoiceItems([]);
      setSelectedItems({});
    }
  }, [isOpen, reset, preloadedItems, customerInfo, preloadInvoiceId]);

  const handleFinalSubmit = (data: any) => {
    if (!validateForm()) {
      showToast('يرجى تصحيح الأخطاء قبل الإرسال', 'error');
      return;
    }

    try {
      AuthorizeActionUsecase.validateAction(user, 'create_sale_return');

      const finalData: CreateInvoiceDTO = {
        partyId: customerType === 'cash' ? null : data.partyId,
        type: 'return_sale',
        items: data.items.map((i: any) => ({ ...i, sku: '', costPrice: 0, taxRate: 0, maxStock: 0 })),
        discount: 0,
        status: 'posted',
        notes: data.notes,
        paymentMethod: customerType === 'cash' ? 'cash' : 'credit',
        referenceInvoiceId: selectedInvoiceId || null,
        returnReason: data.returnReason || null,
      };
      createInvoice(finalData, {
        onSuccess: () => {
          showToast('تم إنشاء مرتجع المبيعات بنجاح', 'success');
          onSuccess();
        },
        onError: (error: Error) => {
          showToast(error.message || 'فشل في إنشاء مرتجع المبيعات', 'error');
        }
      });
    } catch (e: unknown) {
      const err = e as Error;
      showToast(err.message, 'error');
    }
  };

  const handleInvoiceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const invoiceId = e.target.value;
    setSelectedInvoiceId(invoiceId);
    setShowInvoiceItems(false);
    setInvoiceItems([]);
    setSelectedItems({});
  };

  const handleAddItem = () => {
    append({ productId: '', name: '', quantity: 1, unitPrice: 0 });
  };

  const handleRemoveItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    } else {
      showToast('يجب إضافة صنف واحد على الأقل', 'error');
    }
  };

  const footer = (
    <div className="flex w-full gap-2 p-1">
      <Button variant="outline" onClick={onClose} className="flex-1">إلغاء</Button>
      <Button
        onClick={handleSubmit(handleFinalSubmit)}
        isLoading={isSaving}
        variant="danger"
        className="flex-[2] rounded-none"
        disabled={!isValid}
      >
        تأكيد الإرجاع
      </Button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} icon={RefreshCw} title="إنشاء مرتجع مبيعات" description="إعادة بضاعة من عميل إلى المخزن" footer={footer}>
      <form className="space-y-3" onSubmit={handleSubmit(handleFinalSubmit)}>
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

        {/* Customer Type Selection */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setCustomerType('cash'); setValue('partyName', 'عميل نقدي'); setValue('partyId', null); }}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors",
              customerType === 'cash'
                ? "bg-green-100 text-green-700 border-2 border-green-500"
                : "bg-gray-100 text-gray-600 border-2 border-gray-200"
            )}
          >
            <DollarSign size={16} />
            عميل نقدي
          </button>
          <button
            type="button"
            onClick={() => { setCustomerType('credit'); setValue('partyName', ''); }}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors",
              customerType === 'credit'
                ? "bg-blue-100 text-blue-700 border-2 border-blue-500"
                : "bg-gray-100 text-gray-600 border-2 border-gray-200"
            )}
          >
            <Calendar size={16} />
            عميل آجل
          </button>
        </div>

        {/* Customer Search - only show for credit customers */}
        {customerType === 'credit' && (
          <div className="relative z-20">
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={16} />
              <input
                {...register('partyName', { required: false })}
                onChange={(e: any) => { setCustomerQuery(e.target.value); setValue('partyName', e.target.value); }}
                placeholder="ابحث عن العميل..."
                className={cn(
                  "w-full pr-10 pl-3 py-2 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 rounded-lg text-sm font-bold text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none relative z-10",
                  errors.partyName ? "border-red-500" : "border-gray-200"
                )}
                style={{ position: 'relative', zIndex: 10 }}
              />
            </div>
            {customerQuery && customers && customers.length > 0 && (
              <div className="absolute z-30 w-full bg-white border shadow-lg rounded-md mt-1 max-h-40 overflow-y-auto">
                {customers.map((c: any) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setValue('partyId', c.id);
                      setValue('partyName', c.name);
                      setCustomerQuery('');
                    }}
                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    {c.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Original Invoice Selection with Search */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <FileText className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={16} />
              <input
                type="text"
                value={productQuery}
                onChange={(e) => {
                  console.log('Search input changed:', e.target.value);
                  setProductQuery(e.target.value);
                }}
                placeholder="بحث بالرقم، العميل، أو التاريخ..."
                className="w-full pr-10 pl-3 py-2 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 rounded-lg text-sm font-bold text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                style={{ position: 'relative', zIndex: 1 }}
              />
              {productQuery && (
                <button
                  type="button"
                  onClick={() => setProductQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Invoice Dropdown */}
          {filteredInvoices && filteredInvoices.length > 0 && (
            <div className="relative mt-1">
              <select
                value={selectedInvoiceId}
                onChange={handleInvoiceSelect}
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-sm font-bold"
              >
                <option value="">اختر الفاتورة الأصلية (اختياري)</option>
                {filteredInvoices.slice(0, 20).map((inv: any) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_number} - {new Date(inv.issue_date).toLocaleDateString('ar-SA')} - {Number(inv.total_amount).toFixed(2)} - {inv.party?.name || 'عميل نقدي'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Invoice Items Preview */}
        {showInvoiceItems && invoiceItems.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                أصناف الفاتورة المختارة ({invoiceItems.length})
              </span>
              <button
                type="button"
                onClick={handleAddSelectedItems}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
              >
                إضافة المحدد
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {invoiceItems.map((item: any) => (
                <div key={item.id} className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded">
                  <input
                    type="checkbox"
                    checked={selectedItems[item.id]?.selected || false}
                    onChange={(e) => handleInvoiceItemSelect(item.id, e.target.checked)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-bold">{item.description}</p>
                    <p className="text-xs text-gray-500">السعر: {Number(item.unit_price).toFixed(2)}</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={item.quantity}
                    value={selectedItems[item.id]?.quantity || 0}
                    onChange={(e) => handleInvoiceItemQuantityChange(item.id, parseInt(e.target.value) || 0)}
                    className="w-16 p-1 text-xs border rounded text-center"
                    disabled={!selectedItems[item.id]?.selected}
                  />
                  <span className="text-xs text-gray-400">/ {item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Return Reason */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">سبب الإرجاع</label>
          <select
            {...register('returnReason')}
            className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-sm font-bold"
          >
            <option value="">اختر سبب الإرجاع (اختياري)</option>
            {RETURN_REASONS.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </div>

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
          <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-500 px-1">
            <div className="col-span-5">الصنف</div>
            <div className="col-span-2 text-center">الكمية</div>
            <div className="col-span-2 text-center">السعر</div>
            <div className="col-span-2 text-right">الإجمالي</div>
            <div className="col-span-1"></div>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-center relative">
              <input {...register(`items.${index}.name`)}
                onFocus={() => setActiveProductSearch(index)}
                onChange={(e: any) => { update(index, { ...watchedItems[index], name: e.target.value }); setProductQuery(e.target.value); }}
                placeholder="ابحث عن الصنف..."
                className="col-span-5 p-2 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 rounded text-xs font-bold text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
              />
              <input
                type="number"
                {...register(`items.${index}.quantity`, { valueAsNumber: true, min: 1 })}
                className="col-span-2 p-2 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 rounded text-xs font-bold text-center text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
              />
              <input
                type="number"
                {...register(`items.${index}.unitPrice`, { valueAsNumber: true, min: 0 })}
                className="col-span-2 p-2 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 rounded text-xs font-bold text-center text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
              />
              <div className="col-span-2 text-xs font-mono font-bold text-right pr-2">
                {(watchedItems[index].quantity * watchedItems[index].unitPrice).toFixed(2)}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveItem(index)}
                className="col-span-1 text-rose-500 hover:bg-red-50 rounded p-1"
              >
                <Trash2 size={14} />
              </button>

              {activeProductSearch === index && productQuery && searchResults.length > 0 && (
                <div className="absolute z-10 w-full bg-white border shadow-lg rounded-md mt-1 top-full left-0 max-h-40 overflow-y-auto">
                  {searchResults.slice(0, 10).map((p: any) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setValue(`items.${index}.productId`, p.id);
                        setValue(`items.${index}.name`, p.name);
                        setValue(`items.${index}.unitPrice`, p.selling_price);
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
          onClick={handleAddItem}
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
            className="w-full p-2 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 rounded-lg text-sm font-bold text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            rows={2}
          />
        </div>

        {/* Success indicator */}
        <div className="flex items-center gap-2 text-green-600 text-xs">
          <CheckCircle size={14} />
          <span>سيتم خصم الكمية من المخزون تلقائياً</span>
        </div>
      </form>
    </Modal>
  );
};

export default CreateReturnModal;
