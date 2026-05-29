import { useState } from 'react';
import { useCurrencyMutation } from '../../../hooks';

export const useCurrencyManager = () => {
    const { setRate, addCurrency, deleteCurrency, refreshRates, isSaving } = useCurrencyMutation();

    const [activeRateEdit, setActiveRateEdit] = useState<string | null>(null);
    // newRateValue يخزن سعر السوق الذي يدخله المستخدم (مثال: 410 ريال يمني لكل ريال سعودي)
    const [newRateValue, setNewRateValue] = useState<number>(0);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newCurrency, setNewCurrency] = useState<{ code: string, name_ar: string, symbol: string, exchange_operator: 'multiply' | 'divide' }>({ code: '', name_ar: '', symbol: '', exchange_operator: 'divide' });

    const handleUpdateRate = (code: string) => {
        if (!newRateValue || newRateValue <= 0) return;

        // المعادلة المطلوبة: rate_to_base = 1 / سعر_السوق
        // مثال: سعر السوق = 410 (ريال يمني لكل ريال سعودي)
        // rate_to_base = 1 / 410 = 0.0024390243902
        const rateToBase = parseFloat((1 / newRateValue).toFixed(10));

        setRate({
            currency_code: code,
            rate_to_base: rateToBase,
            effective_date: new Date().toISOString().split('T')[0]
        }, {
            onSuccess: () => setActiveRateEdit(null)
        });
    };

    // تحويل rate_to_base المخزون إلى سعر السوق للعرض للمستخدم
    // rate_to_base = 1/market_rate => market_rate = 1/rate_to_base
    const toMarketRate = (rateToBase: number): number => {
        if (!rateToBase || rateToBase <= 0) return 0;
        return parseFloat((1 / rateToBase).toFixed(4));
    };

    const handleAddCurrency = () => {
        if (!newCurrency.code || !newCurrency.name_ar) return;
        addCurrency(newCurrency, {
            onSuccess: () => {
                setIsAddModalOpen(false);
                setNewCurrency({ code: '', name_ar: '', symbol: '', exchange_operator: 'divide' });
            }
        });
    };

    return {
        activeRateEdit, setActiveRateEdit,
        newRateValue, setNewRateValue,
        isAddModalOpen, setIsAddModalOpen,
        newCurrency, setNewCurrency,
        handleUpdateRate, handleAddCurrency,
        toMarketRate,
        deleteCurrency, refreshRates, isSaving
    };
};
