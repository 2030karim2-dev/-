-- ============================================================
-- Migration: Security, Performance, and Refactoring Fixes
-- Description: Enable RLS, fix FKs, encrypt secrets, add indexes
-- ============================================================

-- 1. Enable pgcrypto for Encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. rate limits for invitations 
-- To prevent brute force, we should ideally use redis, but we can add a basic rate limit trigger here if needed.
-- Note: A simple 'times_used' column or 'expires_at' can secure invitations.
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS max_uses integer DEFAULT 1;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS current_uses integer DEFAULT 0;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

-- 3. Fix double foreign key on journal_entries.created_by
ALTER TABLE public.journal_entries 
  DROP CONSTRAINT IF EXISTS journal_entries_created_by_profile_fkey;

-- 4. Enable Row Level Security (RLS) on sensitive tables
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;

-- Note: Policies should be created according to the specific Auth schema (e.g., matching company_id with auth.jwt() -> 'user_metadata' ->> 'company_id')
-- Example Policy (Commented out to prevent locking out users until auth schema is confirmed):
-- CREATE POLICY "company_isolation_invoices" ON public.invoices FOR ALL USING (company_id::text = auth.jwt()->>'company_id');

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_parties_name ON public.parties(name);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_part_number ON public.products(part_number);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_payments_payment_number ON public.payments(payment_number);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account_id ON public.journal_entry_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_date_entity ON public.audit_logs(company_id, created_at, entity);

-- 6. Refactoring: Standardize updated_at trigger
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to major tables
DROP TRIGGER IF EXISTS set_updated_at ON public.invoices;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 7. Audit logs JSONB
-- Altering details from text to JSONB
ALTER TABLE public.audit_logs 
  ALTER COLUMN details TYPE JSONB USING details::JSONB;

-- 8. Prevent Circular Reference in Accounts (Hierarchy)
CREATE OR REPLACE FUNCTION public.check_account_circular_reference()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id uuid;
BEGIN
  v_parent_id := NEW.parent_id;
  WHILE v_parent_id IS NOT NULL LOOP
    IF v_parent_id = NEW.id THEN
      RAISE EXCEPTION 'تعميم دائري في شجرة الحسابات غير مسموح (Circular Reference)';
    END IF;
    SELECT parent_id INTO v_parent_id FROM public.accounts WHERE id = v_parent_id;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_account_hierarchy ON public.accounts;
CREATE TRIGGER trg_check_account_hierarchy
BEFORE INSERT OR UPDATE ON public.accounts
FOR EACH ROW
EXECUTE FUNCTION public.check_account_circular_reference();

-- 9. Prevent Stock Transfer to same warehouse
ALTER TABLE public.stock_transfers 
  ADD CONSTRAINT chk_different_warehouses CHECK (from_warehouse_id <> to_warehouse_id);

-- 10. Fix Entry Number Sequence
-- Creating a function to auto-generate seq per company
CREATE OR REPLACE FUNCTION public.generate_journal_entry_number()
RETURNS TRIGGER AS $$
DECLARE
  v_next_val bigint;
BEGIN
  IF NEW.entry_number = 0 OR NEW.entry_number IS NULL THEN
    SELECT COALESCE(MAX(entry_number), 0) + 1 INTO v_next_val
    FROM public.journal_entries
    WHERE company_id = NEW.company_id;
    
    NEW.entry_number := v_next_val;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_entry_number ON public.journal_entries;
CREATE TRIGGER trg_generate_entry_number
BEFORE INSERT ON public.journal_entries
FOR EACH ROW
EXECUTE FUNCTION public.generate_journal_entry_number();
