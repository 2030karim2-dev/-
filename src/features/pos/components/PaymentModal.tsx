import React, { useState } from 'react';
import { CheckCircle, Banknote, CreditCard, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../../core/utils';
import Button from '../../../ui/base/Button';
import { useTranslation } from '../../../lib/hooks/useTranslation';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    currency: string;
    onConfirm: (method: 'cash' | 'card') => void;
    isProcessing: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, total, currency, onConfirm, isProcessing }) => {
    const [method, setMethod] = useState<'cash' | 'card'>('cash');
    const [received, setReceived] = useState<string>('');
    const { t } = useTranslation();

    if (!isOpen) return null;

    const receivedNum = parseFloat(received) || 0;
    const change = receivedNum - total;

    const handleConfirm = () => {
        onConfirm(method);
    };

    const footer = (
        <>
            <button
                onClick={onClose}
                className="flex-1 py-3 text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors uppercase tracking-wider"
            >
                {t('cancel')}
            </button>
            <Button
                onClick={handleConfirm}
                disabled={isProcessing || (method === 'cash' && receivedNum < total)}
                className="flex-[2] rounded-xl text-xs md:text-sm font-black bg-emerald-600 hover:bg-emerald-700 active:scale-95 border-emerald-700 uppercase shadow-md shadow-emerald-500/20"
                isLoading={isProcessing}
                leftIcon={<CheckCircle size={16} />}
            >
                {t('confirm_operation')}
            </Button>
        </>
    );

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200 rounded-2xl overflow-hidden">
                {/* Total Payable Area */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-6 text-center border-b border-slate-200 dark:border-slate-800">
                    <span className="text-xs md:text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">{t('total_payable_amount')}</span>
                    <h3 dir="ltr" className="text-4xl font-black text-slate-850 dark:text-white font-mono tracking-tighter">
                        {formatCurrency(total, currency as any)}
                    </h3>
                </div>

                <div className="flex-1">
                    {/* Method Selector Tabs */}
                    <div className="flex border-b border-slate-200 dark:border-slate-800 h-16 bg-slate-50/50 dark:bg-slate-950/20">
                        <button
                            type="button"
                            onClick={() => setMethod('cash')}
                            className={`flex-1 flex items-center justify-center gap-2 font-bold text-xs md:text-sm uppercase transition-all ${method === 'cash' ? 'bg-blue-600 text-white shadow-inner shadow-blue-700' : 'bg-transparent text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                        >
                            <Banknote size={18} /> {t('payment_method_cash')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setMethod('card')}
                            className={`flex-1 flex items-center justify-center gap-2 font-bold text-xs md:text-sm uppercase transition-all border-r border-slate-200 dark:border-slate-800 ${method === 'card' ? 'bg-blue-600 text-white shadow-inner shadow-blue-700' : 'bg-transparent text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                        >
                            <CreditCard size={18} /> {t('payment_method_card')}
                        </button>
                    </div>

                    {method === 'cash' ? (
                        <div className="flex flex-col">
                            {/* Received Amount Input */}
                            <div className="flex flex-col border-b border-slate-200 dark:border-slate-800">
                                <label className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 px-4 py-2.5 bg-slate-50/70 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800/50 uppercase">{t('amount_received_from_customer')}</label>
                                <input
                                    type="number"
                                    value={received}
                                    onChange={(e) => setReceived(e.target.value)}
                                    className="w-full text-center text-3xl font-black py-7 bg-white dark:bg-slate-900 outline-none font-mono text-slate-800 dark:text-white focus:bg-blue-50/10 dark:focus:bg-blue-900/5 transition-colors"
                                    autoFocus
                                    dir="ltr"
                                    placeholder="0"
                                />
                            </div>

                            {/* Change Due Display */}
                            <div className="flex items-center justify-between p-4.5 bg-emerald-50/30 dark:bg-emerald-950/10 px-5">
                                <div>
                                    <span className="text-xs md:text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase block mb-1">{t('change_due')}</span>
                                    <span dir="ltr" className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                                        {formatCurrency(Math.max(0, change), currency as any)}
                                    </span>
                                </div>
                                <ArrowRight size={26} className="text-emerald-300 dark:text-emerald-800 rtl:rotate-180" />
                            </div>
                        </div>
                    ) : (
                        <div className="p-10 text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center shadow-inner">
                                <CreditCard size={32} className="text-blue-500 animate-pulse" />
                            </div>
                            <div>
                                <h4 className="text-sm md:text-base font-bold text-slate-800 dark:text-white">{t('waiting_for_card')}</h4>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 uppercase tracking-wide">POS Terminal Integration Active</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer actions */}
                <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex gap-2">
                    {footer}
                </div>
            </div>
        </div>
    );
};
export default PaymentModal;
