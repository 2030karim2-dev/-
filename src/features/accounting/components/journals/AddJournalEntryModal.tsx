
import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { X, Plus, Trash2, Save, Loader2, Calculator } from 'lucide-react';
import { JournalEntryFormData } from '../../types/index';
// Fix: Corrected import path to point to the barrel file.
import { useAccounts } from '../../hooks/index';
import { useCurrencies } from '../../../settings/hooks';
import { formatCurrency } from '../../../../core/utils';

interface AddJournalEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: JournalEntryFormData) => void;
    isSubmitting: boolean;
}

const AddJournalEntryModal: React.FC<AddJournalEntryModalProps> = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
    const { data: accounts, isLoading: isLoadingAccounts } = useAccounts();
    const { currencies, rates } = useCurrencies();

    const { control, register, handleSubmit, watch, reset, setValue } = useForm<JournalEntryFormData>({
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            description: '',
            currency_code: 'SAR',
            exchange_rate: 1,
            lines: [
                { account_id: '', description: '', debit_amount: 0, credit_amount: 0 },
                { account_id: '', description: '', debit_amount: 0, credit_amount: 0 }
            ]
        }
    });

    const selectedCurrency = watch('currency_code');
    const exchangeRate = watch('exchange_rate') || 1;

    const currencyObj = currencies.data?.find((c: any) => c.code === selectedCurrency);
    const isDivide = currencyObj?.exchange_operator === 'divide';

    useEffect(() => {
        if (selectedCurrency === 'SAR') {
            setValue('exchange_rate', 1);
        } else {
            const rate = rates.data?.find((r: any) => r.currency_code === selectedCurrency);
            if (rate) setValue('exchange_rate', rate.rate_to_base);
        }
    }, [selectedCurrency, rates.data, setValue]);

    const { fields, append, remove } = useFieldArray({
        control,
        name: "lines"
    });

    const lines = watch("lines");

    const totals = lines.reduce((acc, line) => ({
        debit_amount: acc.debit_amount + (Number(line.debit_amount) || 0),
        credit_amount: acc.credit_amount + (Number(line.credit_amount) || 0)
    }), { debit_amount: 0, credit_amount: 0 });

    const difference = totals.debit_amount - totals.credit_amount;
    const isBalanced = Math.abs(difference) < 0.01 && totals.debit_amount > 0;

    useEffect(() => {
        if (isOpen) {
            reset();
        }
    }, [isOpen, reset]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl my-auto animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] border dark:border-slate-800">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent/10 rounded-xl">
                            <Calculator className="text-accent" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">قيد يومية جديد</h2>
                            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">إنشاء قيد محاسبي يدوي في دفتر اليومية</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                        {/* Header Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                            <div className="space-y-1.5 md:col-span-1">
                                <label className="text-xs font-bold text-gray-600 dark:text-slate-400">تاريخ القيد</label>
                                <input
                                    type="date"
                                    {...register('date', { required: true })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl dark:text-slate-100 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                                    dir="ltr"
                                />
                            </div>

                            <div className="space-y-1.5 md:col-span-1">
                                <label className="text-xs font-bold text-gray-600 dark:text-slate-400">العملة</label>
                                <select
                                    {...register('currency_code')}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl dark:text-slate-100 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                                >
                                    {currencies.data?.map((c: any) => <option key={c.code} value={c.code}>{c.code}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-bold text-gray-600 dark:text-slate-400">سعر الصرف {selectedCurrency !== 'SAR' && (isDivide ? '(القسمة ÷)' : '(الضرب ×)')}</label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    disabled={selectedCurrency === 'SAR'}
                                    value={exchangeRate ? (isDivide ? parseFloat((1 / exchangeRate).toFixed(5)) : exchangeRate) : ''}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (!val) { setValue('exchange_rate', 1); return; }
                                        setValue('exchange_rate', isDivide ? (1 / val) : val, { shouldValidate: true });
                                    }}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl dark:text-slate-100 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all disabled:opacity-50 font-mono"
                                    dir="ltr"
                                />
                            </div>

                            <div className="md:col-span-4 space-y-1.5">
                                <label className="text-xs font-bold text-gray-600 dark:text-slate-400">البيان (الوصف العام)</label>
                                <input
                                    type="text"
                                    {...register('description', { required: true })}
                                    placeholder="مثال: إثبات فاتورة مبيعات رقم 102"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl dark:text-slate-100 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Lines Table */}
                        <div className="border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
                            <div className="bg-gray-100 dark:bg-slate-800 px-4 py-2.5 grid grid-cols-12 gap-4 text-[11px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                                <div className="col-span-1 text-center">#</div>
                                <div className="col-span-3">الحساب</div>
                                <div className="col-span-4">البيان (اختياري)</div>
                                <div className="col-span-2 text-left">مدين</div>
                                <div className="col-span-2 text-left">دائن</div>
                            </div>

                            <div className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900/50">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-start group hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="col-span-1 flex items-center justify-center pt-2">
                                            <span dir="ltr" className="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400 flex items-center justify-center text-xs font-bold">
                                                {index + 1}
                                            </span>
                                        </div>

                                        <div className="col-span-3">
                                            {isLoadingAccounts ? (
                                                <div className="text-xs text-gray-400 p-2 animate-pulse">جاري التحميل...</div>
                                            ) : (
                                                <select
                                                    {...register(`lines.${index}.account_id`, { required: true })}
                                                    className="w-full px-2 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-slate-200 focus:border-accent outline-none"
                                                >
                                                    <option value="">اختر الحساب...</option>
                                                    {accounts?.map(acc => (
                                                        <option key={acc.id} value={acc.id}>
                                                            {acc.code} - {acc.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                        <div className="col-span-4">
                                            <input
                                                type="text"
                                                {...register(`lines.${index}.description`)}
                                                placeholder="شرح للحركة..."
                                                className="w-full px-2 py-2 bg-transparent border border-transparent hover:border-gray-200 dark:hover:border-slate-700 rounded-xl text-sm dark:text-slate-200 focus:border-accent outline-none transition-all"
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                {...register(`lines.${index}.debit_amount`, { valueAsNumber: true })}
                                                className="w-full px-2 py-2 bg-emerald-50/10 dark:bg-emerald-900/5 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-900/30 rounded-xl text-sm dark:text-emerald-400 focus:border-accent outline-none text-left font-mono"
                                                onChange={(e) => {
                                                    if (parseFloat(e.target.value) > 0) setValue(`lines.${index}.credit_amount`, 0);
                                                }}
                                                dir="ltr"
                                            />
                                        </div>

                                        <div className="col-span-2 relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                {...register(`lines.${index}.credit_amount`, { valueAsNumber: true })}
                                                className="w-full px-2 py-2 bg-red-50/10 dark:bg-red-900/5 border border-transparent hover:border-red-200 dark:hover:border-red-900/30 rounded-xl text-sm dark:text-red-400 focus:border-accent outline-none text-left font-mono"
                                                onChange={(e) => {
                                                    if (parseFloat(e.target.value) > 0) setValue(`lines.${index}.debit_amount`, 0);
                                                }}
                                                dir="ltr"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => remove(index)}
                                                className="absolute -left-10 top-2 p-1.5 text-gray-300 dark:text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() => append({ account_id: '', description: '', debit_amount: 0, credit_amount: 0 })}
                                className="w-full py-3 bg-gray-50/50 dark:bg-slate-800/30 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400 text-sm font-bold flex items-center justify-center gap-2 border-t border-gray-100 dark:border-slate-800 transition-colors"
                            >
                                <Plus size={18} />
                                <span>إضافة صف جديد</span>
                            </button>
                        </div>

                        {/* Totals Section */}
                        <div className="flex justify-end pt-2">
                            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 w-full md:w-80 space-y-3 shadow-inner">
                                <div className="flex justify-between items-start text-sm">
                                    <span className="text-gray-500 dark:text-slate-400">إجمالي المدين</span>
                                    <div className="flex flex-col items-end">
                                        <span dir="ltr" className="font-mono font-bold text-gray-800 dark:text-slate-100">{formatCurrency(totals.debit_amount, selectedCurrency)}</span>
                                        {selectedCurrency !== 'SAR' && <span dir="ltr" className="font-mono text-[10px] text-gray-500">{formatCurrency(totals.debit_amount * exchangeRate)}</span>}
                                    </div>
                                </div>
                                <div className="flex justify-between items-start text-sm">
                                    <span className="text-gray-500 dark:text-slate-400">إجمالي الدائن</span>
                                    <div className="flex flex-col items-end">
                                        <span dir="ltr" className="font-mono font-bold text-gray-800 dark:text-slate-100">{formatCurrency(totals.credit_amount, selectedCurrency)}</span>
                                        {selectedCurrency !== 'SAR' && <span dir="ltr" className="font-mono text-[10px] text-gray-500">{formatCurrency(totals.credit_amount * exchangeRate)}</span>}
                                    </div>
                                </div>
                                <div className={`flex justify-between items-start text-sm pt-3 border-t border-gray-200 dark:border-slate-700 font-bold ${isBalanced ? 'text-emerald-600' : 'text-red-600'}`}>
                                    <span>الفرق</span>
                                    <div className="flex flex-col items-end">
                                        <span dir="ltr" className="font-mono">{formatCurrency(Math.abs(difference), selectedCurrency)}</span>
                                        {selectedCurrency !== 'SAR' && <span dir="ltr" className="font-mono text-[10px] opacity-70">{formatCurrency(Math.abs(difference) * exchangeRate)}</span>}
                                    </div>
                                </div>
                                {!isBalanced && (
                                    <div className="text-[10px] text-red-500 dark:text-red-400 text-center bg-red-50 dark:bg-red-900/20 p-1.5 rounded-lg border border-red-100 dark:border-red-900/30 animate-pulse">
                                        {totals.debit_amount === 0 ? 'يجب إدخال مبالغ' : 'القيد غير متوازن'}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 flex justify-end gap-3 rounded-b-3xl">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-gray-600 dark:text-slate-400 font-bold hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm rounded-xl transition-all"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={!isBalanced || isSubmitting}
                            className="px-8 py-2.5 bg-accent hover:bg-emerald-600 disabled:bg-gray-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-emerald-500/10 transition-all flex items-center gap-2"
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            <span>حفظ وترحيل القيد</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddJournalEntryModal;