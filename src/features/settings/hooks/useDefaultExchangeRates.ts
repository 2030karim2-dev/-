
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrencies, useCurrencyMutation } from '../hooks';
import { useAuthStore } from '../../auth/store';

/**
 * أسعار الصرف الحقيقية مقابل الريال السعودي (SAR)
 * 
 * rate_to_base = كم ريال سعودي يساوي وحدة واحدة من هذه العملة
 * 
 * حاسبة الصرف: result = (المبلغ × rateFrom) / rateTo
 *   تحويل SAR→YER: (1 × 1) / 0.002326 = 430 ✓
 *   تحويل SAR→USD: (1 × 1) / 3.75 = 0.2667 ✓
 * 
 * المرجع:
 *   1 ريال سعودي = 430 ريال يمني
 *   1 دولار أمريكي = 3.75 ريال سعودي
 *   1 ريال عماني = 9.74 ريال سعودي
 *   1 يوان صيني = 0.515 ريال سعودي
 */
const CORRECT_RATES: Record<string, number> = {
    YER: 0.002326,   // 1/430 — 1 يمني = 0.002326 سعودي
    USD: 3.7500,
    OMR: 9.7400,
    CNY: 0.5150,
};

export function useDefaultExchangeRates() {
    const { rates } = useCurrencies();
    const { setRate } = useCurrencyMutation();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const processed = useRef(false);

    useEffect(() => {
        if (
            processed.current ||
            rates.isLoading ||
            !rates.data ||
            !user?.company_id
        ) return;

        processed.current = true;
        const existingRates = rates.data as any[];
        const today = new Date().toISOString().split('T')[0];
        let needsRefresh = false;

        Object.entries(CORRECT_RATES).forEach(([code, correctRate], index) => {
            // أحدث سعر مسجل لهذه العملة (مرتب بـ effective_date + created_at تنازلي)
            const latestRate = existingRates
                .filter(r => r.currency_code === code)
                .sort((a: any, b: any) => {
                    const dateDiff = new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime();
                    if (dateDiff !== 0) return dateDiff;
                    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
                })[0];

            // إذا السعر مختلف عن الصحيح — أدخل تصحيح
            const currentRate = latestRate?.rate_to_base || 0;
            if (!latestRate || Math.abs(currentRate - correctRate) > 0.00001) {
                needsRefresh = true;
                setTimeout(() => {
                    setRate({
                        currency_code: code,
                        rate_to_base: correctRate,
                        effective_date: today,
                    });
                }, index * 400);
            }
        });

        // أعد تحميل الأسعار بعد التصحيح
        if (needsRefresh) {
            const totalDelay = Object.keys(CORRECT_RATES).length * 400 + 500;
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['exchange_rates'] });
            }, totalDelay);
        }
    }, [rates.isLoading, rates.data, user?.company_id]);
}
