import React, { useEffect, useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { RefreshCw, Save, DollarSign, Calendar, FileText, User, Search, Plus, Trash2 } from 'lucide-react';
import { useCreateInvoice } from '../../hooks';
import { useCustomerSearch } from '../../../customers/hooks';
import { useMinimalProducts } from '../../../inventory/hooks';
import { CreateInvoiceDTO } from '../../types';
import Modal from '../../../../ui/base/Modal';
import Button from '../../../../ui/base/Button';
import { cn } from '../../../../core/utils';
import { AuthorizeActionUsecase } from '../../../../core/usecases/auth/AuthorizeActionUsecase';
import { useAuthStore } from '../../../auth/store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateReturnModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuthStore();
  const { mutate: createInvoice, isPending: isSaving } = useCreateInvoice();

  const [customerQuery, setCustomerQuery] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [activeProductSearch, setActiveProductSearch] = useState<number | null>(null);

  const { data: customers } = useCustomerSearch(customerQuery);
  const { data: searchResultsData } = useMinimalProducts();
  const searchResults = searchResultsData || [];

  const { register, control, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      partyId: null as string | null,
      partyName: 'عميل نقدي',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      items: [{ productId: '', name: '', quantity: 1, unitPrice: 0 }],
    }
  });

  const { fields, append, remove, update } = useFieldArray({ control, name: "items" });
  const watchedItems = watch('items');

  const subtotal = useMemo(() => watchedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0), [watchedItems]);

  useEffect(() => {
    if (isOpen) {
      reset();
      setCustomerQuery('');
      setProductQuery('');
    }
  }, [isOpen, reset]);

  const handleFinalSubmit = (data: any) => {
    try {
      AuthorizeActionUsecase.validateAction(user, 'create_sale_return');

      const finalData: CreateInvoiceDTO = {
        partyId: data.partyId,
        type: 'return_sale',
        items: data.items.map((i: any) => ({ ...i, sku: '', costPrice: 0, taxRate: 0, maxStock: 0 })),
        discount: 0,
        status: 'posted',
        notes: data.notes,
        paymentMethod: 'cash',
      };
      createInvoice(finalData, { onSuccess });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const footer = (
    <div className="flex w-full gap-2 p-1">
      <Button variant="outline" onClick={onClose} className="flex-1">إلغاء</Button>
      <Button onClick={handleSubmit(handleFinalSubmit)} isLoading={isSaving} variant="danger" className="flex-[2] rounded-none">تأكيد الإرجاع</Button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} icon={RefreshCw} title="إنشاء مرتجع مبيعات" description="إعادة بضاعة من عميل إلى المخزن" footer={footer}>
      <form className="space-y-3">
        {/* Customer Search */}
        <div className="relative">
          <InputWithIcon icon={User} {...register('partyName')}
            onChange={(e: any) => { setCustomerQuery(e.target.value); setValue('partyName', e.target.value); }}
            placeholder="ابحث عن العميل..."
          />
          {customerQuery && customers && (
            <div className="absolute z-10 w-full bg-white border shadow-lg rounded-md mt-1">
              {customers.map((c: any) => (
                <div key={c.id} onClick={() => { setValue('partyId', c.id); setValue('partyName', c.name); setCustomerQuery(''); }}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm">{c.name}</div>
              ))}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar p-1">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-center relative">
              <input {...register(`items.${index}.name`)}
                onFocus={() => setActiveProductSearch(index)}
                onChange={(e: any) => { update(index, { ...watchedItems[index], name: e.target.value }); setProductQuery(e.target.value); }}
                placeholder="ابحث عن الصنف..."
                className="col-span-5 p-2 bg-gray-50 border rounded text-xs font-bold"
              />
              <input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} className="col-span-2 p-2 bg-gray-50 border rounded text-xs font-bold text-center" />
              <input type="number" {...register(`items.${index}.unitPrice`, { valueAsNumber: true })} className="col-span-2 p-2 bg-gray-50 border rounded text-xs font-bold text-center" />
              <div className="col-span-2 text-xs font-mono font-bold text-right pr-2">
                {(watchedItems[index].quantity * watchedItems[index].unitPrice).toFixed(2)}
              </div>
              <button type="button" onClick={() => remove(index)} className="col-span-1 text-rose-500"><Trash2 size={14} /></button>

              {activeProductSearch === index && productQuery && searchResults.length > 0 && (
                <div className="absolute z-10 w-full bg-white border shadow-lg rounded-md mt-1 top-full left-0 max-h-40 overflow-y-auto">
                  {searchResults.map((p: any) => (
                    <div key={p.id} onClick={() => {
                      setValue(`items.${index}.productId`, p.id);
                      setValue(`items.${index}.name`, p.name);
                      setValue(`items.${index}.unitPrice`, p.selling_price);
                      setActiveProductSearch(null);
                      setProductQuery('');
                    }} className="p-2 hover:bg-gray-100 cursor-pointer text-xs">{p.name} ({p.sku})</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: '', name: '', quantity: 1, unitPrice: 0 })} leftIcon={<Plus size={14} />}>
          إضافة صنف
        </Button>
      </form>
    </Modal>
  );
};

const InputWithIcon = React.forwardRef(({ icon: Icon, ...props }: any, ref) => (
  <div className="relative">
    <Icon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
    <input ref={ref} {...props} className="w-full pr-10 pl-3 py-2 bg-gray-50 border rounded text-sm font-bold" />
  </div>
));

export default CreateReturnModal;