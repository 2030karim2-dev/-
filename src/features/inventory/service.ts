/**
 * Inventory Service - Main entry point
 * 
 * This file provides backward compatibility by delegating to specialized services.
 * The service has been split into modular components for better maintainability:
 * 
 * - productService: Product CRUD operations
 * - warehouseService: Warehouse management
 * - transferService: Stock transfers
 * - auditService: Inventory audits
 * - categoryService: Category management
 * - analyticsService: Inventory analytics
 * 
 * @see ./services/ for individual service modules
 */

import { Product, ProductFormData, CreateTransferDTO } from './types';
import { inventoryApi } from './api';
import { supabase } from '../../lib/supabaseClient';

// Import specialized services
import { productService } from './services/productService';
import { warehouseService } from './services/warehouseService';
import { transferService } from './services/transferService';
import { auditService } from './services/auditService';
import { categoryService } from './services/categoryService';
import { analyticsService } from './services/analyticsService';

/**
 * Main inventory service object
 * Maintains backward compatibility while delegating to specialized services
 */
export const inventoryService = {
  // ==========================================
  // Product Operations (delegated to productService)
  // ==========================================

  getProducts: async (companyId: string): Promise<Product[]> => {
    return productService.getProducts(companyId);
  },

  searchProducts: async (companyId: string, term: string): Promise<any[]> => {
    return productService.searchProducts(companyId, term);
  },

  createProduct: async (data: ProductFormData, companyId: string, userId: string) => {
    return productService.createProduct(data, companyId, userId);
  },

  updateProduct: async (id: string, data: ProductFormData, companyId: string) => {
    return productService.updateProduct(id, data, companyId);
  },

  deleteProduct: async (id: string) => {
    return productService.deleteProduct(id);
  },

  bulkDeleteProducts: async (ids: string[]) => {
    return productService.bulkDeleteProducts(ids);
  },

  getMinimalProducts: async (companyId: string) => {
    return productService.getMinimalProducts(companyId);
  },

  getItemMovement: async (productId: string, from?: string, to?: string) => {
    return productService.getItemMovement(productId, from, to);
  },

  processImportFile: async (file: File, companyId: string, userId: string) => {
    return productService.processImportFile(file, companyId, userId);
  },

  // ==========================================
  // Warehouse Operations (delegated to warehouseService)
  // ==========================================

  getWarehouses: async (companyId: string) => {
    return warehouseService.getWarehouses(companyId);
  },

  getProductsForWarehouse: async (companyId: string, warehouseId: string) => {
    return warehouseService.getProductsForWarehouse(companyId, warehouseId);
  },

  // ==========================================
  // Transfer Operations (delegated to transferService)
  // ==========================================

  createTransfer: async (data: CreateTransferDTO) => {
    return transferService.createTransfer(data);
  },

  getTransfers: async (companyId: string) => {
    return transferService.getTransfers(companyId);
  },

  // ==========================================
  // Audit Operations (delegated to auditService)
  // ==========================================

  startAudit: async (data: any, companyId: string, userId: string) => {
    return auditService.startAudit(data, companyId, userId);
  },

  finalizeAudit: async (sessionId: string, items: any[], companyId: string, userId: string) => {
    return auditService.finalizeAudit(sessionId, items, companyId, userId);
  },

  getAuditSessions: async (companyId: string) => {
    return auditService.getAuditSessions(companyId);
  },

  getAuditSessionDetails: async (sessionId: string) => {
    return auditService.getAuditSessionDetails(sessionId);
  },

  saveAuditProgress: async (items: any[]) => {
    return auditService.saveAuditProgress(items);
  },

  // ==========================================
  // Category Operations (delegated to categoryService)
  // ==========================================

  getInventoryCategories: async (companyId: string) => {
    return categoryService.getCategories(companyId);
  },

  createCategory: async (companyId: string, name: string) => {
    return categoryService.createCategory(companyId, name);
  },

  deleteCategory: async (id: string) => {
    return categoryService.deleteCategory(id);
  },

  // ==========================================
  // Analytics Operations (delegated to analyticsService)
  // ==========================================

  getInventoryAnalytics: async (companyId: string, from?: string, to?: string) => {
    return analyticsService.getInventoryAnalytics(companyId, from, to);
  }
};

// Export specialized services for direct access if needed
export {
  productService,
  warehouseService,
  transferService,
  auditService,
  categoryService,
  analyticsService
};

export default inventoryService;
