import React from 'react';
import { Trash2, Plus, Minus, ShoppingCart, CreditCard, PauseCircle, Coins } from 'lucide-react';
import { useSalesStore } from '../../sales/store';
import { useTaxDiscountStore } from '../../settings/taxDiscountStore';
import { formatCurrency, formatNumberDisplay } from '../../../core/utils';
import CustomerSelector from '../../sales/components/CreateInvoice/CustomerSelector';
import { useTranslation } from '../../../lib/hooks/useTranslation';

interface POSCartProps {
    onPay: () => void;
    onSuspend: () => void;
}

export const POSCart: React.FC<POSCartProps> = ({ onPay, onSuspend }) => {
    const { items, updateQuantity, removeItem, summary, currency, setMetadata } = useSalesStore();
    const validItems = items.filter(i => i.productId);
    const { t } = useTranslation();

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 transition-colors duration-300">
            <div className="bg-gray-100 dark:bg-slate-950/50 border-b-2 border-blue-600 p-2 space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 bg-blue-600 text-white flex items-center justify-center rounded-md">
                            <ShoppingCart size={12} />
                        </div>
                        <span className="text-[10px] font-black text-gray-800 dark:text-white uppercase tracking-widest">{t('active_cart')}</span>
                        <span className="bg-blue-600 text-white text-[9px] px-1.5 rounded-full font-black min-w-[18px] text-center">{validItems.length}</span>
                    </div>
                    <button
                        onClick={onSuspend}
                        disabled={validItems.length === 0}
                        className="text-[9px] font-black text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/20 px-2 py-1 rounded transition-all flex items-center gap-1 uppercase disabled:opacity-30"
                    >
                        <PauseCircle size={12} /> {t('suspend')}
                    </button>
                </div>

                <div className="flex gap-1">
                    <div className="flex-[3]">
                        <CustomerSelector compact />
                    </div>
                    <div className="flex-1 relative">
                        <div className="absolute top-1/2 -translate-y-1/2 right-2 text-gray-400 pointer-events-none z-10">
                            <Coins size={10} />
                        </div>
                        <select
                            value={currency}
                            onChange={(e) => setMetadata('currency', e.target.value)}
                            className="w-full h-[38px] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[9px] font-black pr-6 pl-1 outline-none appearance-none focus:ring-2 focus:ring-blue-500/20 dark:text-white text-center cursor-pointer"
                        >
                            <option value="YER">YER</option>
                            <option value="SAR">SAR</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                {validItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-slate-800 opacity-40">
                        <ShoppingCart size={48} strokeWidth={1} />
                        <p className="text-[10px] font-black uppercase mt-3 tracking-[0.2em]">{t('waiting_for_items')}</p>
                    </div>
                ) : (
                    <div className="flex flex-col divide-y dark:divide-slate-800">
                        {validItems.map((item) => (
                            <div key={item.productId} className="flex gap-0 group hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-colors animate-in slide-in-from-right-2 duration-300">
                                <div className="flex-1 p-2.5 min-w-0 border-l dark:border-slate-800">
                                    <h4 className="font-black text-gray-800 dark:text-slate-100 text-[10px] truncate leading-none mb-1.5">{item.name}</h4>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1.5">
                                            <span dir="ltr" className="text-[9px] font-mono font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-1 rounded">
                                                {formatNumberDisplay(item.quantity)}
                                            </span>
                                            <span className="text-[8px] text-gray-400 font-bold uppercase">x</span>
                                            <span dir="ltr" className="text-[9px] text-gray-500 font-mono font-bold tracking-tighter">
                                                {formatCurrency(item.price)}
                                            </span>
                                        </div>
                                        <span dir="ltr" className="text-[10px] font-black text-blue-800 dark:text-blue-400 font-mono">
                                            {formatCurrency(item.price * item.quantity)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center bg-gray-50/50 dark:bg-slate-950/30">
                                    <button
                                        onClick={() => {
                                            if (item.quantity > 1) updateQuantity(item.productId, item.quantity - 1);
                                            else removeItem(item.productId);
                                        }}
                                        className="w-9 h-full flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors border-r dark:border-slate-800"
                                    >
                                        {item.quantity === 1 ? <Trash2 size={11} /> : <Minus size={11} strokeWidth={3} />}
                                    </button>
                                    <button
                                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                        className="w-9 h-full flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                    >
                                        <Plus size={11} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-3 bg-slate-900 text-white flex flex-col gap-3">
                <div className="space-y-1 opacity-60">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                        <span>{t('subtotal')}</span>
                        <span dir="ltr" className="font-mono">{formatCurrency(summary.subtotal)} {currency}</span>
                    </div>
                    {useTaxDiscountStore.getState().discountEnabled && summary.discountAmount > 0 && (
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-rose-500">
                            <span>الخصم</span>
                            <span dir="ltr" className="font-mono">-{formatCurrency(summary.discountAmount)} {currency}</span>
                        </div>
                    )}
                    {useTaxDiscountStore.getState().taxEnabled && (
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                            <span>{t('tax_vat')}</span>
                            <span dir="ltr" className="font-mono">{formatCurrency(summary.taxAmount)} {currency}</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center py-2 border-t border-white/10">
                    <span className="font-black text-[10px] uppercase tracking-[0.2em] text-blue-400">{t('net_payable')}</span>
                    <div className="text-right">
                        <span dir="ltr" className="font-black text-2xl text-white font-mono tracking-tighter leading-none block">
                            {formatCurrency(summary.totalAmount)}
                        </span>
                        <span className="text-[9px] font-black text-blue-500 uppercase">{currency}</span>
                    </div>
                </div>

                <button
                    onClick={onPay}
                    disabled={validItems.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 py-3.5 font-black text-[11px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-2xl group"
                >
                    <CreditCard size={14} className="group-hover:rotate-12 transition-transform" />
                    {t('complete_and_pay')}
                </button>
            </div>
        </div>
    );
};
