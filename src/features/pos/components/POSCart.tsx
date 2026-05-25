import React from 'react';
import { Trash2, Plus, Minus, ShoppingCart, CreditCard, PauseCircle, Coins } from 'lucide-react';
import { useSalesStore } from '../../sales/store';
import { useDiscountStore } from '../../settings/taxDiscountStore';
import { formatCurrency, formatNumberDisplay } from '../../../core/utils';
import CustomerSelector from '../../sales/components/create/CustomerSelector';
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
        <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900 transition-colors duration-300">
            {/* Cart Header */}
            <div className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 p-3 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center rounded-xl shadow-md shadow-blue-500/20">
                            <ShoppingCart size={15} />
                        </div>
                        <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">{t('active_cart')}</span>
                        <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-black min-w-[20px] text-center shadow-sm">{validItems.length}</span>
                    </div>
                    <button
                        onClick={onSuspend}
                        disabled={validItems.length === 0}
                        className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/30 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 uppercase disabled:opacity-30 active:scale-95 border border-amber-100 dark:border-amber-900/20"
                    >
                        <PauseCircle size={14} /> {t('suspend')}
                    </button>
                </div>

                <div className="flex gap-2">
                    <div className="flex-[3]">
                        <CustomerSelector compact />
                    </div>
                    <div className="flex-1 relative">
                        <div className="absolute top-1/2 -translate-y-1/2 right-2 text-slate-400 pointer-events-none z-10">
                            <Coins size={12} />
                        </div>
                        <select
                            value={currency}
                            onChange={(e) => setMetadata('currency', e.target.value)}
                            className="w-full h-[38px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black pr-7 pl-2 outline-none appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white text-center cursor-pointer transition-all"
                        >
                            <option value="YER">YER</option>
                            <option value="SAR">SAR</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                {validItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-800 opacity-40 p-6">
                        <ShoppingCart size={56} strokeWidth={1} />
                        <p className="text-xs md:text-sm font-bold uppercase mt-4 tracking-[0.15em] text-center">{t('waiting_for_items')}</p>
                    </div>
                ) : (
                    <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                        {validItems.map((item) => (
                            <div key={item.productId} className="flex items-center justify-between p-2 md:p-2.5 px-3 group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors animate-in slide-in-from-right-2 duration-200">
                                <div className="flex-1 min-w-0 pr-0.5 flex flex-col justify-center">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs md:text-sm truncate leading-snug mb-0">{item.name}</h4>
                                    <div className="flex justify-between items-center mt-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <span dir="ltr" className="text-[10px] md:text-xs font-mono font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-md">
                                                {formatNumberDisplay(item.quantity)}
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase">x</span>
                                            <span dir="ltr" className="text-[10px] md:text-xs text-slate-500 font-mono font-bold tracking-tighter">
                                                {formatCurrency(item.price)}
                                            </span>
                                        </div>
                                        <span dir="ltr" className="text-xs md:text-sm font-black text-blue-800 dark:text-blue-400 font-mono pr-2">
                                            {formatCurrency(item.price * item.quantity)}
                                        </span>
                                    </div>
                                </div>

                                {/* Modernized Compact Quantity Controls */}
                                <div className="flex items-center gap-1 shrink-0 pl-1">
                                    <button
                                        onClick={() => {
                                            if (item.quantity > 1) updateQuantity(item.productId, item.quantity - 1);
                                            else removeItem(item.productId);
                                        }}
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all border border-slate-200 dark:border-slate-800 active:scale-90"
                                        title="تقليل الكمية"
                                    >
                                        {item.quantity === 1 ? <Trash2 size={11} /> : <Minus size={11} />}
                                    </button>
                                    <button
                                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all border border-slate-200 dark:border-slate-800 active:scale-90"
                                        title="زيادة الكمية"
                                    >
                                        <Plus size={11} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Cart Footer */}
            <div className="p-4 pb-6 md:p-5 bg-slate-950 text-white flex flex-col gap-4 border-t border-slate-800">
                <div className="space-y-2 opacity-80">
                    <div className="flex justify-between text-xs md:text-sm font-bold uppercase tracking-wider">
                        <span>{t('subtotal')}</span>
                        <span dir="ltr" className="font-mono">{formatCurrency(summary.subtotal)} {currency}</span>
                    </div>
                    {useDiscountStore.getState().discountEnabled && summary.discountAmount > 0 && (
                        <div className="flex justify-between text-xs md:text-sm font-bold uppercase tracking-wider text-rose-400">
                            <span>الخصم</span>
                            <span dir="ltr" className="font-mono">-{formatCurrency(summary.discountAmount)} {currency}</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center py-2.5 border-t border-white/10">
                    <span className="font-black text-xs md:text-sm uppercase tracking-wider text-blue-400">{t('net_payable')}</span>
                    <div className="text-right">
                        <span dir="ltr" className="font-black text-2xl md:text-3xl text-white font-mono tracking-tighter leading-none block">
                            {formatCurrency(summary.totalAmount)}
                        </span>
                        <span className="text-[10px] md:text-xs font-bold text-blue-400 uppercase tracking-widest">{currency}</span>
                    </div>
                </div>

                <button
                    onClick={onPay}
                    disabled={validItems.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 py-3.5 md:py-4 font-bold text-xs md:text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl group rounded-xl mb-12 md:mb-4"
                >
                    <CreditCard size={15} className="group-hover:rotate-12 transition-transform" />
                    {t('complete_and_pay')}
                </button>
            </div>
        </div>
    );
};
