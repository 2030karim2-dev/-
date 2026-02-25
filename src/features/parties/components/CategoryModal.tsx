
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { LayoutGrid } from 'lucide-react';
import Modal from '../../../ui/base/Modal';
import Button from '../../../ui/base/Button';
import Input from '../../../ui/base/Input';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string }) => void;
  isSaving: boolean;
  initialData?: any;
}

const CategoryModal: React.FC<Props> = ({ isOpen, onClose, onSave, isSaving, initialData }) => {
  const { register, handleSubmit, reset } = useForm<{ name: string }>();

  useEffect(() => {
    if (isOpen) reset(initialData || { name: '' });
  }, [isOpen, initialData, reset]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={LayoutGrid}
      title={initialData ? "تعديل الفئة" : "إضافة فئة جديدة"}
      description="تنظيم وتصنيف العملاء / الموردين"
      footer={
        <>
          <Button variant="outline" onClick={onClose} className="flex-1">إلغاء</Button>
          <Button onClick={handleSubmit(onSave)} isLoading={isSaving} className="flex-1">
            {initialData ? "حفظ التعديلات" : "إضافة"}
          </Button>
        </>
      }
    >
      <form>
        <Input
          label="اسم الفئة"
          {...register('name', { required: true })}
          placeholder="مثال: جملة، قطاعي، شركات..."
        />
      </form>
    </Modal>
  );
};

export default CategoryModal;
