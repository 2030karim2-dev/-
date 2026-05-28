/**
 * Core Database Types Barrel File
 * 
 * Centralized exports for domain-specific database types mapped from 
 * the auto-generated Supabase database.types.ts file.
 * 
 * IMPORTANT: Original database.types.ts still exists at:
 *   src/core/database.types.ts (4,002 lines)
 * 
 * This directory provides domain-organized types while the original
 * file remains for backward compatibility during migration.
 * 
 * Migration Guide (when ready to fully migrate):
 * Before: import { Database } from '@/core/database.types'
 * After:  import { Database } from '@/core/database/types'
 * 
 * Domain-specific imports:
 * import { DBAccount } from '@/core/database/types/accounting.types';
 * import { DBInvoice, DBInvoiceItem } from '@/core/database/types/sales.types';
 * import { DBProduct, DBProductStock } from '@/core/database/types/inventory.types';
 * etc.
 */

export * from './common.types';
export * from './accounting.types';
export * from './sales.types';
export * from './inventory.types';
export * from './auth.types';
export * from './purchases.types';
export * from './parties.types';
export * from './audit.types';

// Re-export the Database type for Supabase client compatibility
// This re-exports from the original database.types.ts
export type { Database } from '../../database.types';
