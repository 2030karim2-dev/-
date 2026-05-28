/**
 * Sales API - Backward compatibility adapter
 * 
 * Re-exports from the centralized core API layer with backward-compatible naming.
 * All new code should import directly from '@/core/database/api'.
 */

import { salesInvoicesApi } from '@/core/database/api';
import type { CreateInvoicePayload, InvoiceResponse } from '@/core/database/api';

// Re-export with backward-compatible name
export const salesApi = salesInvoicesApi;

// Re-export types
export type { CreateInvoicePayload, InvoiceResponse };
