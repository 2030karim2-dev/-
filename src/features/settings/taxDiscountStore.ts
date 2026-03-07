import { create } from 'zustand';

const STORAGE_KEY = 'alz_discount_settings';

export interface DiscountSettings {
    /** هل الخصم مفعل في الفواتير؟ */
    discountEnabled: boolean;
}

interface DiscountState extends DiscountSettings {
    setDiscountEnabled: (enabled: boolean) => void;
}

const loadSettings = (): DiscountSettings => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return { discountEnabled: false };
};

const saveSettings = (settings: DiscountSettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

export const useDiscountStore = create<DiscountState>((set) => ({
    ...loadSettings(),

    setDiscountEnabled: (enabled) => {
        set({ discountEnabled: enabled });
        saveSettings({ discountEnabled: enabled });
    }
}));
