
import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { DollarSign, Calendar, FileText, ArrowDown, ArrowUpCircle, User, Search, Landmark, Save, Tag, Banknote, Building, Wallet } from 'lucide-react';
import { BondFormData, BondType } from '../types';
// Fix: Corrected import path to point to the barrel file.
import { useAccounts } from '../../accounting/hooks/index';
import { useCurrencies } from '../../settings/hooks';
import { useCustomerSearch } from '../../customers/hooks';
import { useSupplierSearch } from '../../suppliers/hooks';
import Modal from '../../../ui/base/Modal';
import Button from '../../../ui/base/Button';
import Input from '../../../ui/base/Input';
import { cn } from '../../../core/utils';

interface CreateBondModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: BondType;
  onSubmit: (data: BondFormData) => void;
  isSubmitting: boolean;
}

// Micro-Component for Styled Select Inputs
const AccountSelector: React.FC<any> = ({ label, icon: Icon, children, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
    <div className="relative">
      <select {...props} className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 focus:border-blue-500/50 rounded-xl text-sm font-bold outline-none appearance-none pr-10">
        {children}
      </select>
      <Icon className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
    </div>
  </div>
);

const CreateBondModal: React.FC<CreateBondModalProps> = ({ isOpen, onClose, type, onSubmit, isSubmitting }) => {
  const { data: allAccounts, isLoading: isLoadingAccounts } = useAccounts();
  const { currencies, rates } = useCurrencies();
  const [partyQuery, setPartyQuery] = useState('');

  const { data: customers } = useCustomerSearch(partyQuery);
  const { data: suppliers } = useSupplierSearch(partyQuery);

  const parties = useMemo(() => {
    const all = [...(customers || []).map((c: any) => ({ ...c, type: 'customer' })), ...(suppliers || []).map((s: any) => ({ ...s, type: 'supplier' }))];
    return Array.from(new Map(all.map(p => [p.id, p])).values());
  }, [customers, suppliers]);

  const { register, handleSubmit, reset, watch, setValue } = useForm<BondFormData>({
    defaultValues: { type, date: new Date().toISOString().split('T')[0], currency_code: 'SAR', exchange_rate: 1, counterparty_type: 'party', payment_method: 'cash' }
  });

  const selectedCurrency = watch('currency_code');
  const counterpartyType = watch('counterparty_type');

  const currencyObj = currencies.data?.find((c: any) => c.code === selectedCurrency);
  const isDivide = currencyObj?.exchange_operator === 'divide';

  useEffect(() => {
    if (isOpen) {
      reset({ type, date: new Date().toISOString().split('T')[0], currency_code: 'SAR', exchange_rate: 1, counterparty_type: 'party', payment_method: 'cash' });
      setPartyQuery('');
    }
  }, [isOpen, type, reset]);

  useEffect(() => {
    if (selectedCurrency === 'SAR') {
      setValue('exchange_rate', 1);
      setValue('foreign_amount', 0);
    } else {
      const rate = rates.data?.find((r: any) => r.currency_code === selectedCurrency);
      if (rate) setValue('exchange_rate', rate.rate_to_base);
    }
  }, [selectedCurrency, rates.data, setValue]);

  // Auto-calculate base amount when foreign amount or rate changes
  const foreignAmount = watch('foreign_amount');
  const exchangeRate = watch('exchange_rate');

  useEffect(() => {
    if (selectedCurrency !== 'SAR' && foreignAmount && exchangeRate) {
      const baseAmount = parseFloat((foreignAmount * exchangeRate).toFixed(2));
      setValue('amount', baseAmount);
    }
  }, [selectedCurrency, foreignAmount, exchangeRate, setValue]);

  const { cashAccounts, otherAccounts } = useMemo(() => {
    const cash = allAccounts?.filter(acc => acc.code.startsWith('10')) || [];
    const others = allAccounts?.filter(acc => !acc.code.startsWith('10')) || [];
    return { cashAccounts: cash, otherAccounts: others };
  }, [allAccounts]);

  const handlePartySelect = (party: any) => {
    setValue('counterparty_id', party.id);
    setPartyQuery(party.name);
  };

  const theme = type === 'receipt'
    ? { color: 'emerald', icon: ArrowDown, title: 'سند قبض', verbFrom: 'من حساب', verbTo: 'إلى حساب' }
    : { color: 'rose', icon: ArrowUpCircle, title: 'سند صرف', verbFrom: 'من حساب', verbTo: 'إلى حساب' };

  const footer = (
    <div className="flex w-full gap-2 p-1">
      <button onClick={onClose} className="flex-1 py-3 text-[11px] font-black text-gray-500 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 uppercase">إلغاء</button>
      <Button onClick={handleSubmit(onSubmit)} isLoading={isSubmitting} variant={type === 'receipt' ? 'success' : 'danger'}
        className="flex-[2] rounded-none text-[11px] font-black shadow-xl uppercase" leftIcon={<Save size={16} />}>
        حفظ السند
      </Button>
    </div>
  );

  const CounterpartySelector = (
    <div className="space-y-2">
      <div className="flex h-10 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border dark:border-slate-700">
        <button type="button" onClick={() => setValue('counterparty_type', 'party')} className={cn("flex-1 rounded-lg text-[10px] font-black flex items-center justify-center gap-1", counterpartyType === 'party' ? "bg-white dark:bg-slate-600 text-blue-600 shadow-sm" : "text-gray-400")}><Building size={12} /> جهة خارجية</button>
        <button type="button" onClick={() => setValue('counterparty_type', 'account')} className={cn("flex-1 rounded-lg text-[10px] font-black flex items-center justify-center gap-1", counterpartyType === 'account' ? "bg-white dark:bg-slate-600 text-blue-600 shadow-sm" : "text-gray-400")}><Landmark size={12} /> حساب عام</button>
      </div>
      {counterpartyType === 'party' ? (
        <div className="relative">
          <input type="text" value={partyQuery} onChange={(e) => setPartyQuery(e.target.value)} placeholder="ابحث عن عميل, مورد, موظف..."
            className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 focus:border-blue-500/50 rounded-xl text-sm font-bold outline-none pr-9" />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          {partyQuery.length > 1 && parties.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 rounded-xl shadow-lg max-h-40 overflow-auto border dark:border-slate-600 animate-in fade-in slide-in-from-top-2">
              {parties.map((p: any) => (
                <div key={p.id} onClick={() => handlePartySelect(p)} className="p-2.5 hover:bg-blue-50 dark:hover:bg-slate-600 cursor-pointer flex justify-between items-center">
                  <span className="text-xs font-bold">{p.name}</span>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${p.type === 'customer' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{p.type === 'customer' ? 'عميل' : 'مورد'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <AccountSelector icon={Landmark} {...register('counterparty_id', { required: true })}>
          <option value="">-- اختر حساب --</option>
          {otherAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
        </AccountSelector>
      )}
    </div>
  );

  const CashAccountSelector = (
    <AccountSelector icon={Wallet} {...register('cash_account_id', { required: true })}>
      <option value="">-- اختر الصندوق/البنك --</option>
      {cashAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
    </AccountSelector>
  );

  const ReceiptLayout = (<> {CounterpartySelector} <ArrowDown className="text-gray-300 mx-auto my-2" /> {CashAccountSelector} </>);
  const PaymentLayout = (<> {CashAccountSelector} <ArrowDown className="text-gray-300 mx-auto my-2" /> {CounterpartySelector} </>);

  return (
    <Modal isOpen={isOpen} onClose={onClose} icon={theme.icon} title={theme.title} description="إثبات حركة مالية" footer={footer}>
      <form className="flex flex-col">
        <div className={`p-5 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex items-end gap-4`}>
          <div className="flex-1">
            <label className={`block text-[10px] font-black text-${theme.color}-600 dark:text-${theme.color}-400 uppercase tracking-widest mb-1.5 px-1`}>
              {selectedCurrency === 'SAR' ? 'المبلغ (SAR)' : `المبلغ (${selectedCurrency})`}
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                {...register(selectedCurrency === 'SAR' ? 'amount' : 'foreign_amount', { required: true, valueAsNumber: true })}
                className={`w-full px-4 py-3 bg-white dark:bg-slate-950 border-2 border-${theme.color}-100 dark:border-${theme.color}-900/30 rounded-xl text-2xl font-black text-${theme.color}-600 dark:text-${theme.color}-400 outline-none focus:border-${theme.color}-500 font-mono`}
                placeholder="0.00"
                readOnly={selectedCurrency !== 'SAR'}
                tabIndex={selectedCurrency !== 'SAR' ? -1 : 0}
              />
              <DollarSign className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-${theme.color}-300`} size={20} />
            </div>
          </div>

          {selectedCurrency !== 'SAR' && (
            <div className="w-32 shrink-0">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1 truncate">سعر الصرف {isDivide ? '÷' : '×'}</label>
              <input
                type="number"
                step="0.000001"
                value={exchangeRate ? (isDivide ? parseFloat((1 / exchangeRate).toFixed(5)) : exchangeRate) : ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!val) { setValue('exchange_rate', 1); return; }
                  setValue('exchange_rate', isDivide ? (1 / val) : val, { shouldValidate: true });
                }}
                className="w-full px-3 py-3 bg-white dark:bg-slate-950 border-2 border-gray-100 dark:border-slate-800 rounded-xl text-sm font-bold outline-none focus:border-blue-500 font-mono text-center"
              />
            </div>
          )}

          {selectedCurrency !== 'SAR' && (
            <div className="w-32 shrink-0">
              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">المقابل (SAR)</label>
              <input
                type="number"
                step="0.01"
                {...register('amount', { required: true, valueAsNumber: true })}
                readOnly
                className="w-full px-3 py-3 bg-gray-50 dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 rounded-xl text-sm font-black text-gray-500 font-mono text-center outline-none"
                tabIndex={-1}
              />
            </div>
          )}

          <div className="w-24 shrink-0 space-y-1.5">
            <label className="text-[9px] font-black text-gray-400 uppercase text-center">العملة</label>
            <select {...register('currency_code')} className="w-full bg-gray-50 dark:bg-slate-800 border-2 dark:border-slate-700 p-3 rounded-xl text-sm font-black outline-none appearance-none text-center">
              <option value="SAR">SAR</option>
              {currencies.data?.filter((c: any) => c.code !== 'SAR').map((c: any) => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </div>
        </div>

        <div className="p-5 border-b dark:border-slate-800 bg-gray-50/30 dark:bg-slate-950/30 space-y-3">
          <div className={`p-4 rounded-2xl border-2 bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 space-y-3`}>
            <h3 className={`text-xs font-black text-${theme.color}-600`}>{theme.verbFrom}</h3>
            {type === 'receipt' ? CounterpartySelector : CashAccountSelector}
          </div>
          <div className="flex justify-center"><ArrowDown className="text-gray-300 dark:text-slate-600 animate-pulse" /></div>
          <div className={`p-4 rounded-2xl border-2 bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 space-y-3`}>
            <h3 className="text-xs font-black text-gray-500">{theme.verbTo}</h3>
            {type === 'receipt' ? CashAccountSelector : CounterpartySelector}
          </div>
        </div>

        <div className="p-5 space-y-4 bg-white dark:bg-slate-900">
          <Input label="البيان (شرح العملية)" {...register('description', { required: true })} placeholder="أدخل تفاصيل العملية..." icon={<Tag className="text-blue-500" />} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="تاريخ السند" type="date" {...register('date', { required: true })} dir="ltr" icon={<Calendar className="text-emerald-500" />} />
            <Input label="رقم المرجع" {...register('reference_number')} placeholder="Manual ID..." dir="ltr" icon={<FileText className="text-amber-500" />} />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateBondModal;