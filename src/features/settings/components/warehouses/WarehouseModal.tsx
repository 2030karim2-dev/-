
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Package, MapPin, Save, ShieldCheck } from 'lucide-react';
import Modal from '../../../../ui/base/Modal';
import Button from '../../../../ui/base/Button';
import Input from '../../../../ui/base/Input';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  isSaving: boolean;
  initialData?: any;
}

const WarehouseModal: React.FC<Props> = ({ isOpen, onClose, onSave, isSaving, initialData }) => {
  const { register, handleSubmit, reset, watch } = useForm();
  
  useEffect(() => {
    if(isOpen) reset(initialData || { name: '', location: '', is_primary: false });
  }, [isOpen, initialData, reset]);

  const footer = (
    <>
      <button onClick={onClose} className="flex-1 py-3 text-[10px] font-black text-gray-400 bg-white dark:bg-slate-800 border dark:border-slate-700 uppercase">إلغاء</button>
      <Button
        onClick={handleSubmit(onSave)}
        isLoading={isSaving}
        className="flex-[2] rounded-none text-[10px] font-black bg-blue-600 border-blue-700 shadow-none uppercase"
        leftIcon={<Save size={14} />}
      >
        حفظ بيانات الفرع
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={Package}
      title={initialData ? "تعديل الفرع" : "إضافة فرع جديد"}
      description="Micro-UI Warehouse Profile"
      footer={footer}
    >
      <form className="flex flex-col border-t dark:border-slate-800">
        <Input label="اسم المستودع / الفرع" placeholder="أدخل اسم الموقع..." {...register('name', { required: true })} icon={<Package />} />
        <Input label="الموقع الجغرافي" placeholder="المدينة، الحي، الممر..." {...register('location')} icon={<MapPin />} />
        
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-950 border-b dark:border-slate-800">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                    <ShieldCheck size={14} />
                </div>
                <span className="text-[10px] font-black text-gray-600 dark:text-slate-400">مستودع افتراضي للعمليات</span>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" {...register('is_primary')} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </div>
        </div>
      </form>
    </Modal>
  );
};
export default WarehouseModal;
