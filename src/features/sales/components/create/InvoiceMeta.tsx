
import React, { useState, useRef } from 'react';
// Force rebuild
import { Calendar, Hash, CreditCard, Warehouse, Wallet, Coins } from 'lucide-react';
import { useSalesStore } from '../../store';
import { usePaymentAccounts } from '../../../accounting/hooks';
import { useWarehouses } from '../../../inventory/hooks/useInventoryManagement';
import { useCurrencies } from '../../../settings/hooks';
import CustomerSelector from '../CreateInvoice/CustomerSelector';

interface Props {
    invoiceNumber?: string;
}

interface MetaBlockProps {
    label: string;
    value: string | undefined;
    icon: React.ElementType;
    isSelect?: boolean;
    options?: { id: string; label: string }[];
    field?: string;
    colorClass?: string;
    onChange?: (field: string, value: string) => void;
}

const MetaBlock: React.FC<MetaBlockProps> = ({ label, value, icon: Icon, isSelect, options, field, colorClass, onChange }) => (
    <div className="flex-1 bg-white dark:bg-slate-900/50 border-r border-gray-100 dark:border-slate-800 p-2.5 flex flex-col group hover:bg-gray-50/40 transition-colors">
        <div className="flex items-center gap-1.5 mb-1.5">
            <Icon size={12} className={colorClass || "text-gray-400"} />
            <span className="text-[9px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest">{label}</span>
        </div>
        {isSelect && options && field && onChange ? (
            <select
                value={value}
                onChange={(e) => onChange(field, e.target.value)}
                className="bg-transparent text-[11px] font-black outline-none appearance-none cursor-pointer text-gray-800 dark:text-slate-100 text-right w-full"
            >
                {options.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
            </select>
        ) : (
            <span className="text-sm font-black text-gray-800 dark:text-slate-100 font-mono leading-none">
                {value}
            </span>
        )}
    </div>
);

const InvoiceMeta: React.FC<Props> = ({ invoiceNumber }) => {
    const {
        invoiceType, currency, exchangeRate, warehouseId, cashboxId,
        setMetadata
    } = useSalesStore();
    const { data: paymentAccounts } = usePaymentAccounts();
    const { data: warehouses } = useWarehouses();
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
        if (paymentAccounts && paymentAccounts.length > 0) {
            // Find account that matches currency code or contains currency name in Arabic
            // For SAR: "سعودي" or "SAR"
            // For YER: "يمني" or "YER"
            const searchTerms = currency === 'SAR' ? ['SAR', 'سعودي', 'ريال سعودي'] : ['YER', 'يمني', 'ريال يمني'];

            const matchingAccount = paymentAccounts.find(acc =>
                acc.currency_code === currency ||
                searchTerms.some(term => acc.name.toLowerCase().includes(term.toLowerCase()))
            );

            if (matchingAccount) {
                setMetadata('cashboxId', matchingAccount.id);
            }
        }
    }, [currency, paymentAccounts, rates.data]);

    const currencyObj = currencies.data?.find((c: any) => c.code === currency);
    const isDivide = currencyObj?.exchange_operator === 'divide';

    const date = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

    return (
        <div className="bg-gray-50 dark:bg-slate-950/50 border-y-2 border-gray-100 dark:border-slate-800 flex flex-col lg:flex-row">
            <div className="lg:w-[40%] p-3 border-b lg:border-b-0 lg:border-l border-gray-100 dark:border-slate-800 flex items-center">
                <CustomerSelector />
            </div>
            <div className="flex-1 flex flex-col">
                <div className="flex -space-x-px">
                    <MetaBlock label="تاريخ الإصدار" value={date} icon={Calendar} colorClass="text-emerald-500" />
                    <MetaBlock label="رقم الفاتورة" value={invoiceNumber || '---'} icon={Hash} colorClass="text-blue-500" />
                    <MetaBlock
                        label="طريقة الدفع" field="invoiceType" value={invoiceType} icon={CreditCard} isSelect
                        options={[{ id: 'cash', label: 'نقداً (CASH)' }, { id: 'credit', label: 'آجل (CREDIT)' }]}
                        onChange={setMetadata}
                    />
                </div>
                <div className="flex -space-x-px border-t border-gray-100 dark:border-slate-800">
                    <MetaBlock label="العملة" field="currency" value={currency} icon={Coins} isSelect
                        options={currencies.data?.map((c: any) => ({ id: c.code, label: c.code })) || [{ id: 'SAR', label: 'SAR' }]}
                        onChange={setMetadata} />
                    {currency && currency !== 'SAR' && (
                        <div className="flex-1 bg-white dark:bg-slate-900/50 border-r border-gray-100 dark:border-slate-800 p-2.5 flex flex-col group hover:bg-gray-50/40 transition-colors">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <Coins size={12} className="text-amber-500" />
                                <span className="text-[9px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest">
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
                                className="bg-transparent text-sm font-black text-amber-600 dark:text-amber-400 font-mono outline-none w-full"
                            />
                        </div>
                    )}
                    <MetaBlock label="حساب الصندوق" field="cashboxId" value={cashboxId} icon={Wallet} isSelect
                        options={paymentAccounts?.map(a => ({ id: a.id, label: a.name })) || []}
                        onChange={setMetadata} />
                    <MetaBlock label="الفرع / المخزن" field="warehouseId" value={warehouseId} icon={Warehouse} isSelect
                        options={warehouses?.map((w: any) => ({ id: w.id, label: w.name })) || [{ id: 'wh_main', label: 'المستودع الرئيسي' }]}
                        onChange={setMetadata} />
                </div>
            </div>
        </div>
    );
};

export default InvoiceMeta;
