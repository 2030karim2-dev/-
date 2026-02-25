
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSalesStore } from './store';
import { useTaxDiscountStore } from '../settings/taxDiscountStore';

describe('Sales Store Logic', () => {
  beforeEach(() => {
    useSalesStore.getState().resetCart();
    // Default: tax and discount disabled (Yemen context)
    useTaxDiscountStore.setState({ taxEnabled: false, defaultTaxRate: 0, discountEnabled: false });
  });

  it('should initialize with empty items', () => {
    const { items, summary } = useSalesStore.getState();
    // Default initializes with 6 empty rows
    expect(items).toHaveLength(6);
    expect(summary.totalAmount).toBe(0);
  });

  it('should calculate totals correctly when adding a product (no tax by default)', () => {
    const product = {
      id: 'p1',
      name: 'Test Product',
      sku: 'TP-001',
      selling_price: 100,
      cost_price: 80,
      stock_quantity: 10,
      min_stock_level: 5,
      company_id: '1', part_number: '', brand: '', category: '', size: '', specifications: '', unit: 'piece', created_at: '', alternatives: [], compatibility: [], warehouse_distribution: [], total_purchases_qty: 0, total_sales_qty: 0, last_invoice_date: '', total_profit: 0, total_loss: 0, isLowStock: false
    };

    useSalesStore.getState().addProductToCart(product);

    const { items, summary } = useSalesStore.getState();
    const activeItem = items.find(i => i.productId === 'p1');

    expect(activeItem).toBeDefined();
    expect(activeItem?.price).toBe(100);
    expect(activeItem?.quantity).toBe(1);

    // Tax is disabled by default — no tax should be added
    expect(summary.subtotal).toBe(100);
    expect(summary.taxAmount).toBe(0);
    expect(summary.totalAmount).toBe(100);
  });

  it('should calculate tax correctly when tax is enabled in settings', () => {
    // Enable tax at 15% in settings
    useTaxDiscountStore.setState({ taxEnabled: true, defaultTaxRate: 15 });

    const product = {
      id: 'p1', name: 'Product', sku: '123', selling_price: 200,
      cost_price: 100, stock_quantity: 10, min_stock_level: 1,
      company_id: '1', part_number: '', brand: '', category: '', size: '', specifications: '', unit: 'piece', created_at: '', alternatives: [], compatibility: [], warehouse_distribution: [], total_purchases_qty: 0, total_sales_qty: 0, last_invoice_date: '', total_profit: 0, total_loss: 0, isLowStock: false
    };

    useSalesStore.getState().addProductToCart(product);
    useSalesStore.getState().toggleColumn('showTax');

    const { summary } = useSalesStore.getState();

    expect(summary.subtotal).toBe(200);
    expect(summary.taxAmount).toBe(30); // 200 * 0.15 = 30
    expect(summary.totalAmount).toBe(230);
  });

  it('should not apply tax even when column toggled if tax is disabled in settings', () => {
    // Tax remains disabled in settings
    const product = {
      id: 'p1', name: 'Product', sku: '123', selling_price: 200,
      cost_price: 100, stock_quantity: 10, min_stock_level: 1,
      company_id: '1', part_number: '', brand: '', category: '', size: '', specifications: '', unit: 'piece', created_at: '', alternatives: [], compatibility: [], warehouse_distribution: [], total_purchases_qty: 0, total_sales_qty: 0, last_invoice_date: '', total_profit: 0, total_loss: 0, isLowStock: false
    };

    useSalesStore.getState().addProductToCart(product);
    useSalesStore.getState().toggleColumn('showTax');

    const { summary } = useSalesStore.getState();

    expect(summary.taxAmount).toBe(0);
    expect(summary.totalAmount).toBe(200);
  });

  it('should apply discount correctly when enabled in settings', () => {
    // Enable discount in settings
    useTaxDiscountStore.setState({ discountEnabled: true });

    const product = {
      id: 'p1', name: 'Product', sku: '123', selling_price: 100,
      cost_price: 50, stock_quantity: 10, min_stock_level: 1,
      company_id: '1', part_number: '', brand: '', category: '', size: '', specifications: '', unit: 'piece', created_at: '', alternatives: [], compatibility: [], warehouse_distribution: [], total_purchases_qty: 0, total_sales_qty: 0, last_invoice_date: '', total_profit: 0, total_loss: 0, isLowStock: false
    };

    useSalesStore.getState().addProductToCart(product);
    useSalesStore.getState().toggleColumn('showDiscount');

    const index = useSalesStore.getState().items.findIndex(i => i.productId === 'p1');
    useSalesStore.getState().updateItem(index, 'discount', 10);

    const { summary } = useSalesStore.getState();

    expect(summary.subtotal).toBe(100);
    expect(summary.discountAmount).toBe(10);
    expect(summary.totalAmount).toBe(90);
  });
});

