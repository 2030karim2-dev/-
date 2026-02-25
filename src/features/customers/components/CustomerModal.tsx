
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, ShieldCheck, Zap, Plus, Phone } from 'lucide-react';
import { CustomerFormData, Customer } from '../types';
import Button from '../../../ui/base/Button';
import Input from '../../../ui/base/Input';
import Modal from '../../../ui/base/Modal';
import { useCustomerCategories, useCustomerCategoryMutations } from '../hooks';
import CategoryModal from '../../parties/components/CategoryModal';
import { cn } from '../../../core/utils';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => void;
  isSubmitting: boolean;
  initialData?: Customer | null;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, onSubmit, isSubmitting, initialData }) => {
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<CustomerFormData>();
  const { data: categories } = useCustomerCategories();
  const { save: saveCategory, isSaving: isSavingCategory } = useCustomerCategoryMutations();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name,
          phone: initialData.phone || '',
          email: initialData.email || '',
          tax_number: initialData.tax_number || '',
          address: initialData.address || '',
          type: 'customer',
          status: (initialData as any).status || 'active',
          category_id: (initialData as any).category_id || ''
        });
      } else {
        reset({ type: 'customer', name: '', phone: '', email: '', tax_number: '', address: '', status: 'active', category_id: '' });
      }
    }
  }, [isOpen, initialData, reset]);

  const title = `${initialData ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}`;
  const currentStatus = watch('status');

  const handleSaveCategory = (data: { name: string }) => {
    saveCategory({ name: data.name }, {
      onSuccess: () => setIsCategoryModalOpen(false)
    });
  };

  const footer = (
    <div className="flex w-full gap-2 p-1">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 py-3 text-[11px] font-black text-gray-500 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 uppercase tracking-widest hover:bg-gray-100 transition-colors"
      >
        إلغاء
      </button>
      <Button
        onClick={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
        variant="success" // Specific color for customers
        className="flex-[2] rounded-none text-[11px] font-black shadow-xl uppercase tracking-widest"
      >
        {initialData ? 'تحديث البيانات' : 'حفظ العميل'}
      </Button>
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        icon={initialData ? ShieldCheck : Zap}
        title={title}
        description="إدارة ملفات العملاء والزبائن"
        footer={footer}
      >
        <form className="flex flex-col">
          <div className="p-5 bg-white dark:bg-slate-900 border-b dark:border-slate-800 space-y-4">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
              <User size={14} className="text-emerald-500" />
              الهوية الأساسية للعميل
            </h4>
            <Input
              label="الاسم الكامل"
              {...register('name', { required: 'الاسم مطلوب' })}
              error={errors.name?.message}
              autoFocus
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase mb-1.5 px-1">الفئة</label>
                <div className="flex gap-2">
                  <select {...register('category_id')} className="w-full flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none appearance-none">
                    <option value="">عام</option>
                    {Array.isArray(categories) && categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="w-12 h-12 flex-shrink-0 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase mb-1.5 px-1">الحالة</label>
                <div className="flex h-12 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border dark:border-slate-700">
                  <button type="button" onClick={() => setValue('status', 'active')} className={cn("flex-1 rounded-lg text-[10px] font-black transition-all", currentStatus === 'active' ? "bg-white dark:bg-slate-600 text-emerald-600 shadow-sm" : "text-gray-400")}>نشط</button>
                  <button type="button" onClick={() => setValue('status', 'blocked')} className={cn("flex-1 rounded-lg text-[10px] font-black transition-all", currentStatus === 'blocked' ? "bg-white dark:bg-slate-600 text-rose-600 shadow-sm" : "text-gray-400")}>محظور</button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 bg-gray-50/30 dark:bg-slate-950/30 space-y-4">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
              <Phone size={14} className="text-emerald-500" />
              بيانات الاتصال والفوترة
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Input label="رقم الجوال" {...register('phone')} dir="ltr" />
              <Input label="البريد الإلكتروني" {...register('email')} type="email" dir="ltr" />
            </div>
            <Input label="العنوان" {...register('address')} />
            <Input label="الرقم الضريبي" {...register('tax_number')} dir="ltr" />
          </div>
        </form>
      </Modal>

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        isSaving={isSavingCategory}
        initialData={null}
      />
    </>
  );
};

export default CustomerModal;
