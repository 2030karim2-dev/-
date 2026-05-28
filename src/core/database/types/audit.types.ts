/**
 * Audit Domain Database Types
 * 
 * Types for audit logs, audit sessions, and audit items
 */

import { TableRow, TableInsert, TableUpdate } from './common.types';

// ============================================
// Audit Sessions
// ============================================
export type DBAuditSession = TableRow<'audit_sessions'>;
export type DBAuditSessionInsert = TableInsert<'audit_sessions'>;
export type DBAuditSessionUpdate = TableUpdate<'audit_sessions'>;

// ============================================
// Audit Items
// ============================================
export type DBAuditItem = TableRow<'audit_items'>;
export type DBAuditItemInsert = TableInsert<'audit_items'>;
export type DBAuditItemUpdate = TableUpdate<'audit_items'>;

// ============================================
// Audit Logs - General system audit trail
// ============================================
export type DBAuditLog = TableRow<'audit_logs'>;
export type DBAuditLogInsert = TableInsert<'audit_logs'>;
export type DBAuditLogUpdate = TableUpdate<'audit_logs'>;

// ============================================
// API Rate Limits
// ============================================
export type DBApiRateLimit = TableRow<'api_rate_limits'>;
export type DBApiRateLimitInsert = TableInsert<'api_rate_limits'>;
export type DBApiRateLimitUpdate = TableUpdate<'api_rate_limits'>;
