import React from 'react';
import { Save, Landmark } from 'lucide-react';
import { ExpenseFormData } from '../../types';
import Button from '../../../../ui/base/Button';
import Modal from '../../../../ui/base/Modal';
import { useExpenseForm } from './hooks/useExpenseForm';
import { ExpenseAmountSection } from './components/ExpenseAmountSection';
import { ExpenseCategorySection } from './components/ExpenseCategorySection';
import { RecurringExpenseSection } from './components/RecurringExpenseSection';
import { ExpenseFinancialSection } from './components/ExpenseFinancialSection';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ExpenseFormData) => void;
    isSubmitting: boolean;
}

const CreateExpenseModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
    const {
        form,
        categories,
        currencies,
        newCatMode,
        setNewCatMode,
        newCatName,
        setNewCatName,
        handleAddCategory,
        isAddingCategory
    } = useExpenseForm(isOpen);

    const { register, handleSubmit, watch, setValue } = form;
    const isRecurring = watch('is_recurring');

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
                className="flex-[2] rounded-none text-[11px] font-black bg-rose-600 border-rose-700 shadow-xl uppercase tracking-widest"
                leftIcon={<Save size={16} />}
            >
                حفظ واعتماد المصروف
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            icon={Landmark}
            title="قسيمة صرف مالي"
            description="إدارة التدفقات النقدية الخارجة"
            footer={footer}
        >
            <form className="flex flex-col">
                <ExpenseAmountSection
                    register={register}
                    currenciesData={currencies.data}
                    watch={watch}
                    setValue={setValue}
                />

                <ExpenseCategorySection
                    register={register}
                    categories={categories as any[]}
                    newCatMode={newCatMode}
                    setNewCatMode={setNewCatMode}
                    newCatName={newCatName}
                    setNewCatName={setNewCatName}
                    handleAddCategory={handleAddCategory}
                    isAddingCategory={isAddingCategory}
                />

                <RecurringExpenseSection
                    register={register}
                    isRecurring={isRecurring}
                />

                <ExpenseFinancialSection
                    watch={watch}
                    setValue={setValue}
                />
            </form>
        </Modal>
    );
};

export default CreateExpenseModal;
