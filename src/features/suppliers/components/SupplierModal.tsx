
import React from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, User, Phone, CreditCard, ShieldCheck, Zap } from 'lucide-react';
import { SupplierFormData, Supplier } from '../types';
import Button from '../../../ui/base/Button';
import Input from '../../../ui/base/Input';
import Modal from '../../../ui/base/Modal';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SupplierFormData) => void;
  isSubmitting: boolean;
  initialData?: Supplier | null;
}

const SupplierModal: React.FC<SupplierModalProps> = ({ isOpen, onClose, onSubmit, isSubmitting, initialData }) => {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<SupplierFormData>();

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name,
          phone: initialData.phone || '',
          tax_number: initialData.tax_number || '',
          status: (initialData as any).status || 'active',
          category: (initialData as any).category || 'عام'
        });
      } else {
        reset({ type: 'supplier' as any, name: '', phone: '', tax_number: '', status: 'active' as any, category: 'عام' });
      }
    }
  }, [isOpen, initialData, reset]);

  const footer = (
    <>
      <button onClick={onClose} className="flex-1 py-3 text-[10px] font-black text-gray-400 bg-white dark:bg-slate-800 border dark:border-slate-700 uppercase tracking-widest">إلغاء</button>
      <Button
        onClick={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
        className="flex-[2] rounded-none text-[10px] font-black bg-blue-700 shadow-none uppercase tracking-widest"
        leftIcon={<Save size={14} />}
      >
        حفظ المورد
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={initialData ? ShieldCheck : Zap}
      title={initialData ? "تعديل المورد" : "مورد جديد"}
      description="Micro-UI Supplier Profile"
      footer={footer}
    >
      <form className="flex flex-col border-t dark:border-slate-800">
        <Input 
          label="اسم الشركة / المورد"
          placeholder="أدخل اسم المنشأة..."
          {...register('name', { required: 'الاسم مطلوب' })}
          error={errors.name?.message}
          icon={<User />}
        />
        
        <div className="grid grid-cols-2">
           <Input label="رقم الجوال" placeholder="05XXXXXXXX" {...register('phone')} dir="ltr" icon={<Phone />} />
           <Input label="الرقم الضريبي" placeholder="3XXXXXXXXXXXXXX" {...register('tax_number')} dir="ltr" icon={<CreditCard />} />
        </div>

        <div className="grid grid-cols-2">
            <div className="flex flex-col border-b border-l dark:border-slate-800">
                <label className="text-[8px] font-black text-gray-400 px-2 py-1 bg-gray-50 dark:bg-slate-800/30 uppercase">مجموعة الموردين</label>
                <select {...register('category')} className="bg-white dark:bg-slate-900 text-[10px] font-black p-2.5 outline-none dark:text-white appearance-none">
                    <option value="عام">مورد محلي</option>
                    <option value="خارجي">مورد خارجي</option>
                    <option value="رئيسي">وكيل معتمد</option>
                </select>
            </div>
            <div className="flex flex-col border-b dark:border-slate-800">
                <label className="text-[8px] font-black text-gray-400 px-2 py-1 bg-gray-50 dark:bg-slate-800/30 uppercase">الحالة</label>
                <div className="flex h-full">
                    <button type="button" onClick={() => reset({...watch(), status: 'active' as any})} className={`flex-1 text-[9px] font-black ${watch('status') === 'active' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>نشط</button>
                    <button type="button" onClick={() => reset({...watch(), status: 'blocked' as any})} className={`flex-1 text-[9px] font-black ${watch('status') === 'blocked' ? 'bg-rose-600 text-white' : 'text-gray-400'}`}>محظور</button>
                </div>
            </div>
        </div>
      </form>
    </Modal>
  );
};

export default SupplierModal;
