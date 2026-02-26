
import React, { useState } from 'react';
import { Search, User, X, Calendar, Hash, CreditCard, Warehouse, Wallet, Coins } from 'lucide-react';
import { useSupplierSearch } from '../../hooks';
import { usePurchaseStore } from '../../store';
// Fix: Corrected import path to point to the barrel file.
import { usePaymentAccounts } from '../../../accounting/hooks/index';
import { useCurrencies } from '../../../settings/hooks';
import { cn } from '../../../../core/utils';

const PurchaseMeta: React.FC = () => {
    const {
        supplier, setSupplier,
        invoiceNumber, issueDate, currency, exchangeRate, warehouseId,
        invoiceType, cashboxId,
        setMetadata
    } = usePurchaseStore();

    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const { data: suppliers } = useSupplierSearch(query);
    const { data: cashAccounts } = usePaymentAccounts();
    const { currencies, rates } = useCurrencies();

    React.useEffect(() => {
        // 1. Handle Exchange Rate
        if (currency === 'SAR') {
            setMetadata('exchangeRate', 1);
        } else if (rates.data) {
            const rateObj = rates.data.find((r: any) => r.currency_code === currency);
            if (rateObj) {
                setMetadata('exchangeRate', rateObj.rate_to_base);
            }
        }

        // 2. Handle Auto-Treasury (Cashbox) Selection
        if (cashAccounts && cashAccounts.length > 0) {
            const searchTerms = currency === 'SAR' ? ['SAR', 'سعودي', 'ريال سعودي'] : ['YER', 'يمني', 'ريال يمني'];
            const matchingAccount = cashAccounts.find(acc =>
                acc.currency_code === currency ||
                searchTerms.some(term => acc.name.toLowerCase().includes(term.toLowerCase()))
            );

            if (matchingAccount) {
                setMetadata('cashboxId', matchingAccount.id);
            }
        }
    }, [currency, cashAccounts, rates.data]);

    const currencyObj = currencies.data?.find((c: any) => c.code === currency);
    const isDivide = currencyObj?.exchange_operator === 'divide';

    const MetaBlock = ({ label, value, icon: Icon, isSelect, options, field, colorClass, type = "text" }: any) => (
        <div className="flex-1 bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 p-2 flex flex-col group hover:bg-blue-50/40 transition-colors">
            <div className="flex items-center gap-1 mb-1">
                <Icon size={10} className={colorClass || "text-blue-500"} />
                <span className="text-[8px] font-black text-blue-400 dark:text-blue-600 uppercase tracking-widest">{label}</span>
            </div>
            {isSelect ? (
                <select
                    value={value}
                    onChange={(e) => setMetadata(field, e.target.value)}
                    className="bg-transparent text-[11px] font-black outline-none appearance-none cursor-pointer text-blue-900 dark:text-white text-right"
                >
                    {options.map((opt: any) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                </select>
            ) : type === "date" || type === "input" ? (
                <input
                    type={type} value={value}
                    onChange={(e) => setMetadata(field, e.target.value)}
                    className="bg-transparent text-[11px] font-black outline-none text-blue-900 dark:text-white text-right font-mono"
                />
            ) : (
                <span className="text-[11px] font-black text-blue-900 dark:text-gray-100 font-mono leading-none">
                    {value}
                </span>
            )}
        </div>
    );

    return (
        <div className="bg-blue-50/20 dark:bg-slate-950/20 border-b dark:border-slate-800 flex flex-col">
            <div className="relative border-b-2 border-blue-100 dark:border-slate-800">
                {supplier ? (
                    <div className="bg-blue-700 px-3 py-1.5 flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                            <User size={12} className="text-blue-200" />
                            <span className="text-[11px] font-black uppercase">المورد: {supplier.name}</span>
                        </div>
                        <button onClick={() => setSupplier(null)} className="p-1 hover:bg-white/10 rounded"><X size={14} /></button>
                    </div>
                ) : (
                    <div className="relative">
                        <input
                            type="text" value={query}
                            onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
                            placeholder="ابحث عن المورد (Search Supplier)..."
                            className="w-full px-10 py-2.5 bg-white dark:bg-slate-800 text-[10px] font-black outline-none text-blue-600 placeholder:text-blue-200"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={14} />
                        {isOpen && query.length > 1 && (
                            <div className="absolute z-50 w-full top-full bg-white dark:bg-slate-900 border-2 border-blue-600 shadow-2xl">
                                {suppliers?.map((s: any) => (
                                    <div key={s.id} onClick={() => { setSupplier(s); setIsOpen(false); }}
                                        className="p-3 hover:bg-blue-600 hover:text-white cursor-pointer text-[11px] font-black border-b dark:border-slate-800 text-right">
                                        {s.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex flex-col">
                <div className="flex -space-x-px">
                    <MetaBlock label="تاريخ الفاتورة" field="issueDate" value={issueDate} icon={Calendar} type="date" colorClass="text-emerald-500" />
                    <MetaBlock label="رقم فاتورة المورد" field="invoiceNumber" value={invoiceNumber} icon={Hash} type="input" colorClass="text-blue-600" />
                    <MetaBlock label="نوع الفاتورة" field="invoiceType" value={invoiceType} icon={CreditCard} isSelect
                        options={[{ id: 'cash', label: 'نقدي (Cash)' }, { id: 'credit', label: 'آجل (Credit)' }]} />
                    <MetaBlock label="الصندوق / البنك" field="cashboxId" value={cashboxId} icon={Wallet} isSelect
                        options={cashAccounts.map(a => ({ id: a.id, label: a.name }))} />
                </div>
                <div className="flex -space-x-px">
                    <MetaBlock label="المستودع المستلم" field="warehouseId" value={warehouseId} icon={Warehouse} isSelect
                        options={[{ id: 'wh_main', label: 'المستودع الرئيسي' }]} />
                    <MetaBlock label="العملة" field="currency" value={currency} icon={Coins} isSelect
                        options={currencies.data?.map((c: any) => ({ id: c.code, label: c.code })) || [{ id: 'SAR', label: 'SAR' }]} />
                    {currency && currency !== 'SAR' && (
                        <div className="flex-[1.5] bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 p-2 flex flex-col group hover:bg-blue-50/40 transition-colors">
                            <div className="flex items-center gap-1 mb-1">
                                <Coins size={10} className="text-amber-500" />
                                <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">
                                    سعر الصرف {isDivide ? '(القسمة ÷)' : '(الضرب ×)'}
                                </span>
                            </div>
                            <input
                                type="number"
                                step="0.00001"
                                value={exchangeRate ? (isDivide ? parseFloat((1 / exchangeRate).toFixed(5)) : exchangeRate) : ''}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!val) return;
                                    setMetadata('exchangeRate', isDivide ? (1 / val) : val);
                                }}
                                className="bg-transparent text-[11px] font-black outline-none text-amber-600 dark:text-amber-400 text-right font-mono"
                            />
                        </div>
                    )}
                    <div className="flex-[2] bg-gray-50/50 dark:bg-slate-900/50 border border-blue-100 dark:border-slate-800 p-2">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">ملاحظات التوريد</span>
                        <input className="w-full bg-transparent outline-none text-[10px] font-bold mt-1" placeholder="أدخل أي ملاحظات إضافية..." />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseMeta;