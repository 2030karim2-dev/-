
import { create } from 'zustand';
import { Product } from '../inventory/types';
import { useTaxDiscountStore } from '../settings/taxDiscountStore';

/**
 * SalesCartItem - Used for the sales cart/UI state
 * Different from InvoiceItem in types.ts which represents database records
 */
export interface SalesCartItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  partNumber?: string;    // OEM part number - matches purchases
  brand?: string;        // Brand/manufacturer - matches purchases
  quantity: number;
  basePrice: number; // Price in SAR (base currency)
  price: number;     // Converted price based on current exchange rate
  discount: number;
  tax: number;
}

/** @deprecated Use SalesCartItem instead */
export type InvoiceItem = SalesCartItem;

export interface SalesSummary {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
}

interface SalesState {
  items: InvoiceItem[];
  selectedCustomer: { id: string, name: string, phone?: string } | null;
  summary: SalesSummary;
  invoiceType: 'cash' | 'credit';
  currency: string;
  exchangeRate: number;
  exchangeOperator: 'multiply' | 'divide';
  warehouseId: string;
  cashboxId: string;

  showTax: boolean;
  showDiscount: boolean;

  // Actions
  initializeItems: (count: number) => void;
  updateItem: (index: number, field: keyof InvoiceItem, value: string | number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setProductForRow: (index: number, product: Product) => void;
  addItem: () => void;
  addProductToCart: (product: Product) => void;
  removeItem: (idOrIndex: number | string) => void;
  calculateTotals: () => void;
  setCustomer: (customer: { id: string, name: string, phone?: string } | null) => void;
  setMetadata: (field: string, value: string | boolean | null | number) => void;
  toggleColumn: (field: 'showTax' | 'showDiscount') => void;
  resetCart: () => void;
}

const createNewItem = (): InvoiceItem => ({
  id: crypto.randomUUID(),
  productId: '',
  sku: '',
  name: '',
  partNumber: '',
  brand: '',
  quantity: 0,
  basePrice: 0,
  price: 0,
  discount: 0,
  tax: 0,
});

export const useSalesStore = create<SalesState>((set, get) => ({
  items: [],
  selectedCustomer: null,
  summary: { subtotal: 0, taxAmount: 0, discountAmount: 0, totalAmount: 0 },
  invoiceType: 'cash',
  currency: 'SAR',
  exchangeRate: 1,
  exchangeOperator: 'multiply',
  warehouseId: 'wh_main',
  cashboxId: 'box_1',
  showTax: false,
  showDiscount: false,

  initializeItems: (count) => set({ items: Array.from({ length: count }, createNewItem) }),

  updateItem: (index, field, value) => {
    set(state => {
      const newItems = [...state.items];
      if (newItems[index]) newItems[index][field] = value as never;
      return { items: newItems };
    });
    get().calculateTotals();
  },

  updateQuantity: (productId, quantity) => {
    set(state => ({
      items: state.items.map(item =>
        item.productId === productId ? { ...item, quantity: Math.max(0, quantity) } : item
      )
    }));
    get().calculateTotals();
  },

  setProductForRow: (index, product) => {
    set(state => {
      const newItems = [...state.items];
      const basePrice = product.selling_price || 0;
      const convertedPrice = state.exchangeOperator === 'divide'
        ? basePrice * state.exchangeRate
        : basePrice / state.exchangeRate;

      if (newItems[index]) {
        newItems[index] = {
          ...newItems[index],
          productId: product.id,
          name: product.name,
          sku: product.sku,
          partNumber: product.part_number || '',
          brand: product.brand || '',
          basePrice: basePrice,
          price: convertedPrice,
          quantity: 1
        };
      }
      return { items: newItems };
    });
    get().calculateTotals();
  },

  addItem: () => set(state => ({ items: [...state.items, createNewItem()] })),

  addProductToCart: (product) => {
    set(state => {
      const existing = state.items.find(i => i.productId === product.id);
      if (existing) {
        return {
          items: state.items.map(i =>
            i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }

      const { taxEnabled, defaultTaxRate } = useTaxDiscountStore.getState();
      const basePrice = product.selling_price || 0;
      const convertedPrice = state.exchangeOperator === 'divide'
        ? basePrice * state.exchangeRate
        : basePrice / state.exchangeRate;

      const newItem: InvoiceItem = {
        id: crypto.randomUUID(),
        productId: product.id,
        sku: product.sku,
        name: product.name,
        partNumber: product.part_number || '',
        brand: product.brand || '',
        quantity: 1,
        basePrice: basePrice,
        price: convertedPrice,
        discount: 0,
        tax: taxEnabled ? defaultTaxRate : 0
      };

      return { items: [newItem, ...state.items] };
    });
    get().calculateTotals();
  },

  removeItem: (idOrIndex) => {
    set(state => {
      const newItems = typeof idOrIndex === 'string'
        ? state.items.filter(i => i.productId !== idOrIndex)
        : state.items.filter((_, i) => i !== idOrIndex);
      return { items: newItems };
    });
    get().calculateTotals();
  },

  calculateTotals: () => {
    set(state => {
      let subtotal = 0;
      let taxAmount = 0;
      let discountAmount = 0;

      // Read tax/discount settings
      const { taxEnabled, defaultTaxRate, discountEnabled } = useTaxDiscountStore.getState();

      state.items.forEach(item => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const lineSub = qty * price;
        subtotal += lineSub;

        // Discount: only if globally enabled AND column shown
        const lineDiscount = (discountEnabled && state.showDiscount) ? (Number(item.discount) || 0) : 0;
        discountAmount += lineDiscount;

        const afterDiscount = lineSub - lineDiscount;

        // Tax: only if globally enabled AND column shown
        if (taxEnabled && state.showTax) {
          const itemTaxRate = Number(item.tax) > 0 ? Number(item.tax) : defaultTaxRate;
          const lineTax = afterDiscount * (itemTaxRate / 100);
          taxAmount += lineTax;
        }
      });

      const totalAmount = subtotal - discountAmount + taxAmount;

      return {
        summary: { subtotal, taxAmount, discountAmount, totalAmount }
      };
    });
  },

  setCustomer: (selectedCustomer) => set({ selectedCustomer }),

  setMetadata: (field, value) => {
    set((state) => {
      const newState = { ...state, [field]: value };

      // Re-calculate all prices if currency or rate or operator changes
      if (['currency', 'exchangeRate', 'exchangeOperator'].includes(field as string)) {
        const rate = (newState.currency === 'SAR') ? 1 : newState.exchangeRate;
        const op = (newState.currency === 'SAR') ? 'multiply' : newState.exchangeOperator;

        newState.items = newState.items.map(item => {
          if (!item.productId) return item;
          const newPrice = op === 'divide' ? item.basePrice * rate : item.basePrice / rate;
          return { ...item, price: newPrice };
        });
      }

      return newState;
    });
    get().calculateTotals();
  },

  toggleColumn: (field) => {
    set(state => ({ [field]: !state[field] }));
    get().calculateTotals();
  },

  resetCart: () => set({
    items: [],
    selectedCustomer: null,
    summary: { subtotal: 0, taxAmount: 0, discountAmount: 0, totalAmount: 0 },
    invoiceType: 'cash',
    currency: 'SAR',
    exchangeRate: 1,
    exchangeOperator: 'multiply'
  })
}));
