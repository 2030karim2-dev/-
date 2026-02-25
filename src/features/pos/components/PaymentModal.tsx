import React, { useState } from 'react';
import { X, CheckCircle, Banknote, CreditCard, Loader2, DollarSign, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../../core/utils';
import Button from '../../../ui/base/Button';
import { useTranslation } from '../../../lib/hooks/useTranslation';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onConfirm: () => void;
  isProcessing: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, totalAmount, onConfirm, isProcessing }) => {
  const [method, setMethod] = useState<'cash' | 'card'>('cash');
  const [received, setReceived] = useState<string>('');
  const { t } = useTranslation();

  if (!isOpen) return null;

  const receivedNum = parseFloat(received) || 0;
  const change = receivedNum - totalAmount;

  const footer = (
    <>
        <button onClick={onClose} className="flex-1 py-4 text-[10px] font-black text-gray-400 bg-white dark:bg-slate-800 border dark:border-slate-700 uppercase tracking-widest">{t('cancel')}</button>
        <Button 
            onClick={onConfirm}
            disabled={isProcessing || (method === 'cash' && receivedNum < totalAmount)}
            className="flex-[2] rounded-none text-xs font-black bg-emerald-600 border-emerald-700 uppercase shadow-none"
            isLoading={isProcessing}
            leftIcon={<CheckCircle size={16} />}
        >
            {t('confirm_operation')}
        </Button>
    </>
  );

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-0">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm shadow-2xl flex flex-col border dark:border-slate-800 animate-in zoom-in duration-200 rounded-none">
         
         <div className="bg-gray-50 dark:bg-slate-950 p-6 text-center border-b dark:border-slate-800">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">{t('total_payable_amount')}</span>
            <h3 dir="ltr" className="text-4xl font-black text-gray-800 dark:text-white font-mono tracking-tighter">
                {formatCurrency(totalAmount)}
            </h3>
         </div>

         <div className="flex-1">
            <div className="flex border-b dark:border-slate-800 h-16">
                <button 
                    onClick={() => setMethod('cash')}
                    className={`flex-1 flex items-center justify-center gap-2 font-black text-[10px] uppercase transition-colors ${method === 'cash' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 text-gray-400 hover:bg-gray-50'}`}
                >
                    <Banknote size={16} /> {t('payment_method_cash')}
                </button>
                <button 
                    onClick={() => setMethod('card')}
                    className={`flex-1 flex items-center justify-center gap-2 font-black text-[10px] uppercase transition-colors border-r dark:border-slate-800 ${method === 'card' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 text-gray-400 hover:bg-gray-50'}`}
                >
                    <CreditCard size={16} /> {t('payment_method_card')}
                </button>
            </div>

            {method === 'cash' ? (
                <div className="flex flex-col">
                    <div className="flex flex-col border-b dark:border-slate-800">
                        <label className="text-[8px] font-black text-gray-400 px-3 py-2 bg-gray-50 dark:bg-slate-800/30 uppercase">{t('amount_received_from_customer')}</label>
                        <input 
                            type="number" 
                            value={received}
                            onChange={(e) => setReceived(e.target.value)}
                            className="w-full text-center text-3xl font-black py-6 bg-white dark:bg-slate-900 outline-none font-mono text-gray-800 dark:text-white focus:bg-blue-50/30"
                            autoFocus
                            dir="ltr"
                        />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-emerald-50/30 dark:bg-emerald-900/5">
                        <div>
                            <span className="text-[9px] font-black text-emerald-600 uppercase block">{t('change_due')}</span>
                            <span dir="ltr" className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                                {formatCurrency(Math.max(0, change))}
                            </span>
                        </div>
                        <ArrowRight size={24} className="text-emerald-200" />
                    </div>
                </div>
            ) : (
                <div className="p-8 text-center flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <CreditCard size={32} className="text-blue-500 animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-gray-800 dark:text-white">{t('waiting_for_card')}</h4>
                        <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">POS Terminal Integration Active</p>
                    </div>
                </div>
            )}
         </div>

         <div className="p-2 border-t dark:border-slate-800 bg-gray-50 dark:bg-slate-950 flex gap-1">
            {footer}
         </div>
      </div>
    </div>
  );
};
