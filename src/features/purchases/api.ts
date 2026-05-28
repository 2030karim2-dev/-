/**
 * Purchases API - Backward compatibility re-export
 * 
 * This file now re-exports from the centralized core API layer.
 * All new code should import directly from '@/core/database/api'.
 */

export { purchaseInvoicesApi as purchasesApi } from '@/core/database/api';
