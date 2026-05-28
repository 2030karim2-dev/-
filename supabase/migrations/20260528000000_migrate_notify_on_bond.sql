-- 20260528000000_migrate_notify_on_bond.sql
-- Migration to ensure notify_on_payment_bond column exists (no reference to deprecated column)

-- Ensure the new column exists with default true; safe no-op if already present
ALTER TABLE messaging_config ADD COLUMN IF NOT EXISTS notify_on_payment_bond BOOLEAN DEFAULT true;
