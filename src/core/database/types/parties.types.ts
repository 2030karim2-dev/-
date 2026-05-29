/**
 * Parties Domain Database Types
 * 
 * Types for parties/contacts (customers, suppliers, vendors) and related data.
 * 
 * NOTE: DBParty types are already exported from sales.types.ts
 * because invoices reference parties. Import from sales.types.ts instead:
 * 
 * import { DBParty, DBPartyInsert, DBPartyUpdate } from './sales.types';
 */

import type { TableRow, TableInsert, TableUpdate } from './common.types';
import type { Views } from './common.types';

// ============================================
// Re-export DBParty from sales to avoid duplicate definitions
// These are the same table, so we consolidate in sales.types.ts
export type { DBParty, DBPartyInsert, DBPartyUpdate } from './sales.types';

/**
 * Party balances view - computed from journal entries
 * @deprecated Use computed queries instead
 */
export type DBPartyBalance = Views['party_balances'];

/**
 * Active parties view - parties with non-null deleted_at
 */
export type DBActiveParty = Views['active_parties'];

// ============================================
// Party Categories
// ============================================
export type DBPartyCategory = TableRow<'party_categories'>;
export type DBPartyCategoryInsert = TableInsert<'party_categories'>;
export type DBPartyCategoryUpdate = TableUpdate<'party_categories'>;

// ============================================
// Customer Tags
// ============================================
export type DBCustomerTag = TableRow<'customer_tags'>;
export type DBCustomerTagInsert = TableInsert<'customer_tags'>;
export type DBCustomerTagUpdate = TableUpdate<'customer_tags'>;

export type DBCustomerTagAssignment = TableRow<'customer_tag_assignments'>;
export type DBCustomerTagAssignmentInsert = TableInsert<'customer_tag_assignments'>;
export type DBCustomerTagAssignmentUpdate = TableUpdate<'customer_tag_assignments'>;

// ============================================
// Customer Activities & Notes
// ============================================
export type DBCustomerActivity = TableRow<'customer_activities'>;
export type DBCustomerActivityInsert = TableInsert<'customer_activities'>;
export type DBCustomerActivityUpdate = TableUpdate<'customer_activities'>;

export type DBCustomerNote = TableRow<'customer_notes'>;
export type DBCustomerNoteInsert = TableInsert<'customer_notes'>;
export type DBCustomerNoteUpdate = TableUpdate<'customer_notes'>;

// ============================================
// Messaging & Notifications (Parties-related)
// ============================================
export type DBMessagingConfig = TableRow<'messaging_config'>;
export type DBMessagingConfigInsert = TableInsert<'messaging_config'>;
export type DBMessagingConfigUpdate = TableUpdate<'messaging_config'>;

export type DBNotificationLog = TableRow<'notification_log'>;
export type DBNotificationLogInsert = TableInsert<'notification_log'>;
export type DBNotificationLogUpdate = TableUpdate<'notification_log'>;
