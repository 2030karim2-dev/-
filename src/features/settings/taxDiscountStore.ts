
import { create } from 'zustand';

const STORAGE_KEY = 'alz_tax_discount_settings';

export interface TaxDiscountSettings {
    /** هل الضريبة مفعلة؟ (افتراضي: false — مناسب لليمن) */
    taxEnabled: boolean;
    /** نسبة الضريبة الافتراضية (0-100) */
    defaultTaxRate: number;
    /** هل الخصم مفعل في الفواتير؟ */
    discountEnabled: boolean;
}

interface TaxDiscountState extends TaxDiscountSettings {
    setTaxEnabled: (enabled: boolean) => void;
    setDefaultTaxRate: (rate: number) => void;
    setDiscountEnabled: (enabled: boolean) => void;
}

const loadSettings = (): TaxDiscountSettings => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return { taxEnabled: false, defaultTaxRate: 0, discountEnabled: false };
};

const saveSettings = (settings: TaxDiscountSettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

export const useTaxDiscountStore = create<TaxDiscountState>((set, get) => ({
    ...loadSettings(),

    setTaxEnabled: (enabled) => {
        set({ taxEnabled: enabled });
        if (!enabled) set({ defaultTaxRate: 0 });
        saveSettings({ taxEnabled: enabled, defaultTaxRate: enabled ? get().defaultTaxRate : 0, discountEnabled: get().discountEnabled });
    },

    setDefaultTaxRate: (rate) => {
        const clamped = Math.max(0, Math.min(100, rate));
        set({ defaultTaxRate: clamped });
        saveSettings({ ...get(), defaultTaxRate: clamped });
    },

    setDiscountEnabled: (enabled) => {
        set({ discountEnabled: enabled });
        saveSettings({ ...get(), discountEnabled: enabled });
    }
}));
