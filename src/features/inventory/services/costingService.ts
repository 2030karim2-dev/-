
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
    const totalCurrentValue = Math.max(0, currentStock) * currentAvgCost;
    const totalNewValue = newQty * newUnitPrice;
    const totalQty = Math.max(0, currentStock) + newQty;

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
    const profit = product.selling_price - product.cost_price;
    const margin = product.selling_price > 0 ? (profit / product.selling_price) * 100 : 0;
    return {
      profit,
      margin,
      isViable: margin > 10
    };
  }
};
