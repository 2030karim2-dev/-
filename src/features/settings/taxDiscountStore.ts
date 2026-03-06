
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
        if (stored) {
            const parsed = JSON.parse(stored);
            return { ...parsed, taxEnabled: false, defaultTaxRate: 0 };
        }
    } catch { /* ignore */ }
    return { taxEnabled: false, defaultTaxRate: 0, discountEnabled: false };
};

const saveSettings = (settings: TaxDiscountSettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings, taxEnabled: false, defaultTaxRate: 0 }));
};

export const useTaxDiscountStore = create<TaxDiscountState>((set, get) => ({
    ...loadSettings(),

    setTaxEnabled: () => {
        // Tax is permanently disabled for Yemen
        set({ taxEnabled: false, defaultTaxRate: 0 });
        saveSettings({ ...get(), taxEnabled: false, defaultTaxRate: 0 });
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
