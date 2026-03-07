
import { Product } from '../types';

export const costingService = {
  /**
   * حساب المتوسط المرجح للتكلفة (Weighted Average Cost)
   * يضمن أن تكلفة الصنف في المستودع تعكس القيمة الحقيقية بعد الشراء بأسعار مختلفة
   */
  calculateNewAverageCost: (
    currentStock: number,
    currentAvgCost: number,
    newQty: number,
    newUnitPrice: number
  ): number => {
    const totalCurrentValue = currentStock * currentAvgCost;
    const totalNewValue = newQty * newUnitPrice;
    const totalQty = currentStock + newQty;

    if (totalQty <= 0) return newUnitPrice;

    const newWac = (totalCurrentValue + totalNewValue) / totalQty;
    return Number(newWac.toFixed(4));
  },

  /**
   * تقدير قيمة المخزون الحالية بالكامل
   */
  getInventoryAssetValue: (products: Product[]): number => {
    return products.reduce((acc, p) => acc + (p.stock_quantity * p.cost_price), 0);
  },

  /**
   * تحليل الربحية لكل صنف بناءً على آخر تكلفة
   */
  getProductProfitability: (product: Product) => {
    const sellingPrice = product.sale_price ?? product.selling_price ?? 0;
    const profit = sellingPrice - product.cost_price;
    const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
    return {
      profit,
      margin,
      isViable: margin > 10
    };
  }
};
