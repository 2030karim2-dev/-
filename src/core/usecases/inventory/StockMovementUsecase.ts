import { inventoryApi } from '../../../features/inventory/api';
import { costingService } from '../../../features/inventory/services/costingService';
import { supabase } from '../../../lib/supabaseClient';

interface MovementParams {
  productId: string;
  warehouseId: string;
  quantity: number; // موجبة للوارد، سالبة للصادر
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN';
  unitPrice?: number; // مطلوب فقط في حالات التوريد (IN) لتحديث التكلفة
  referenceType: string;
  referenceId: string;
  userId: string;
  companyId: string;
}

export class StockMovementUsecase {
  static async execute(params: MovementParams) {

    // 1. إذا كانت الحركة توريد (IN)، نقوم بتحديث متوسط التكلفة أولاً
    if (params.type === 'IN' && params.unitPrice !== undefined) {
      const { data: product } = await (supabase.from('products') as any)
        .select('cost_price, product_stock(quantity)')
        .eq('id', params.productId)
        .single();

      if (product) {
        const currentTotalStock = (product.product_stock || []).reduce((s: number, i: any) => s + i.quantity, 0);
        const newWac = costingService.calculateNewAverageCost(
          currentTotalStock,
          product.cost_price,
          params.quantity,
          params.unitPrice
        );

        await (supabase.from('products') as any).update({ cost_price: newWac }).eq('id', params.productId);
      }
    }

    // 2. تسجيل العملية في سجل الحركات (Transactions)
    // Fix: Corrected method name from 'adjustStock' to 'createInventoryTransactions' and wrapped payload in an array.
    const { error: txError } = await inventoryApi.createInventoryTransactions([{
      company_id: params.companyId,
      product_id: params.productId,
      warehouse_id: params.warehouseId,
      quantity: params.quantity,
      transaction_type: StockMovementUsecase.mapTransactionType(params.type, params.quantity),
      reference_type: params.referenceType,
      reference_id: params.referenceId,
      created_by: params.userId
    }]);

    if (txError) throw txError;

    // 3. تحديث الرصيد اللحظي في المستودع المحدد (تم عبر Trigger في SQL ولكن هنا نؤكده للبيئة المحلية)
    // ملاحظة: الـ SupabaseClient المحلي يقوم بالمحاكاة يدوياً
    return { success: true };
  }

  /**
   * Map internal movement types to DB-valid transaction_type values
   */
  private static mapTransactionType(type: string, quantity: number): string {
    switch (type) {
      case 'IN': return 'purchase';
      case 'OUT': return 'sale';
      case 'ADJUSTMENT': return quantity > 0 ? 'adj_in' : 'adj_out';
      case 'RETURN': return quantity > 0 ? 'return_purchase' : 'return_sale';
      default: return type; // already a valid DB value
    }
  }
}
