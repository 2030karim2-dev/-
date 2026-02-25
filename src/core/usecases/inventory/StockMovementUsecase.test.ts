
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StockMovementUsecase } from './StockMovementUsecase';
import { inventoryApi } from '../../../features/inventory/api';
import { costingService } from '../../../features/inventory/services/costingService';
import { supabase } from '../../../lib/supabaseClient';

// Mock dependencies
vi.mock('../../../features/inventory/api', () => ({
  inventoryApi: {
    // Fix: Added missing createInventoryTransactions to mock definition
    createInventoryTransactions: vi.fn(),
  }
}));

vi.mock('../../../features/inventory/services/costingService', () => ({
  costingService: {
    calculateNewAverageCost: vi.fn(),
  }
}));

vi.mock('../../../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  }
}));

describe('StockMovementUsecase', () => {
  const mockParams = {
    productId: 'prod-123',
    warehouseId: 'wh-1',
    quantity: 10,
    type: 'IN' as const,
    unitPrice: 50,
    referenceType: 'purchase',
    referenceId: 'ref-1',
    userId: 'user-1',
    companyId: 'comp-1'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate new weighted average cost on IN transaction', async () => {
    // Mock Supabase response for product fetch
    const mockProduct = {
      cost_price: 40,
      product_stock: [{ quantity: 20 }]
    };
    
    // Mock chain for supabase.from('products').select(...).eq(...).single()
    const singleFn = vi.fn().mockResolvedValue({ data: mockProduct });
    const eqFn = vi.fn().mockReturnValue({ single: singleFn });
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
    const fromFn = vi.fn().mockReturnValue({ select: selectFn, update: vi.fn().mockReturnValue({ eq: vi.fn() }) });
    (supabase.from as any).mockImplementation(fromFn);

    // Mock costing service result
    (costingService.calculateNewAverageCost as any).mockReturnValue(45);

    // Mock inventory API
    (inventoryApi.createInventoryTransactions as any).mockResolvedValue({ error: null });

    await StockMovementUsecase.execute(mockParams);

    // Verify costing calculation was called
    expect(costingService.calculateNewAverageCost).toHaveBeenCalledWith(20, 40, 10, 50);
    
    // Verify product cost update
    const updateFn = (supabase.from('products') as any).update;
    expect(updateFn).toHaveBeenCalledWith({ cost_price: 45 });
  });

  it('should create inventory transaction record', async () => {
    // Mock minimal supabase response for non-pricing logic
    const singleFn = vi.fn().mockResolvedValue({ data: null }); // Product not found or irrelevant
    const eqFn = vi.fn().mockReturnValue({ single: singleFn });
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
    (supabase.from as any).mockImplementation(() => ({ select: selectFn, update: vi.fn().mockReturnValue({ eq: vi.fn() }) }));

    (inventoryApi.createInventoryTransactions as any).mockResolvedValue({ error: null });

    const outParams = { ...mockParams, type: 'OUT' as const, quantity: -5 };
    await StockMovementUsecase.execute(outParams);

    expect(inventoryApi.createInventoryTransactions).toHaveBeenCalledWith([
      expect.objectContaining({
        product_id: 'prod-123',
        quantity: -5,
        transaction_type: 'OUT'
      })
    ]);
  });

  it('should handle errors from inventory API', async () => {
    (inventoryApi.createInventoryTransactions as any).mockResolvedValue({ error: { message: 'DB Error' } });
    
    // Bypass the product fetch part for this test
    const singleFn = vi.fn().mockResolvedValue({ data: null });
    const eqFn = vi.fn().mockReturnValue({ single: singleFn });
    const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
    (supabase.from as any).mockImplementation(() => ({ select: selectFn }));

    await expect(StockMovementUsecase.execute({ ...mockParams, type: 'OUT' }))
      .rejects
      .toEqual({ message: 'DB Error' });
  });
});
