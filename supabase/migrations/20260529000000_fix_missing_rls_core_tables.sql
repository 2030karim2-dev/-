-- ============================================================
-- Migration: Fix Missing RLS on Core Financial Tables
-- Date: 2026-05-29
-- Purpose: invoices, journal_entries, payments, and related tables
--          had NO RLS policies — any authenticated user could read
--          or mutate any company's financial data (critical multi-tenant
--          isolation breach).
-- ============================================================


-- ============================================================
-- 1. INVOICES TABLE
-- ============================================================
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_select_company"  ON public.invoices;
DROP POLICY IF EXISTS "invoices_insert_company"  ON public.invoices;
DROP POLICY IF EXISTS "invoices_update_company"  ON public.invoices;
DROP POLICY IF EXISTS "invoices_delete_company"  ON public.invoices;

CREATE POLICY "invoices_select_company" ON public.invoices
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "invoices_insert_company" ON public.invoices
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "invoices_update_company" ON public.invoices
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "invoices_delete_company" ON public.invoices
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
    )
  );


-- ============================================================
-- 2. INVOICE_ITEMS TABLE (via parent invoice's company_id)
-- ============================================================
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoice_items_select_company" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_insert_company" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_update_company" ON public.invoice_items;
DROP POLICY IF EXISTS "invoice_items_delete_company" ON public.invoice_items;

CREATE POLICY "invoice_items_select_company" ON public.invoice_items
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE company_id IN (
        SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "invoice_items_insert_company" ON public.invoice_items
  FOR INSERT WITH CHECK (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE company_id IN (
        SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "invoice_items_update_company" ON public.invoice_items
  FOR UPDATE USING (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE company_id IN (
        SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "invoice_items_delete_company" ON public.invoice_items
  FOR DELETE USING (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE company_id IN (
        SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
      )
    )
  );


-- ============================================================
-- 3. JOURNAL_ENTRIES TABLE
-- ============================================================
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journal_entries_select_company" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_entries_insert_company" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_entries_update_company" ON public.journal_entries;

CREATE POLICY "journal_entries_select_company" ON public.journal_entries
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "journal_entries_insert_company" ON public.journal_entries
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "journal_entries_update_company" ON public.journal_entries
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
    )
  );


-- ============================================================
-- 4. JOURNAL_ENTRY_LINES TABLE (via parent journal's company_id)
-- ============================================================
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journal_lines_select_company" ON public.journal_entry_lines;
DROP POLICY IF EXISTS "journal_lines_insert_company" ON public.journal_entry_lines;
DROP POLICY IF EXISTS "journal_lines_update_company" ON public.journal_entry_lines;

CREATE POLICY "journal_lines_select_company" ON public.journal_entry_lines
  FOR SELECT USING (
    journal_entry_id IN (
      SELECT id FROM public.journal_entries
      WHERE company_id IN (
        SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "journal_lines_insert_company" ON public.journal_entry_lines
  FOR INSERT WITH CHECK (
    journal_entry_id IN (
      SELECT id FROM public.journal_entries
      WHERE company_id IN (
        SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "journal_lines_update_company" ON public.journal_entry_lines
  FOR UPDATE USING (
    journal_entry_id IN (
      SELECT id FROM public.journal_entries
      WHERE company_id IN (
        SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
      )
    )
  );


-- ============================================================
-- 5. PAYMENTS TABLE
-- ============================================================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_company" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_company" ON public.payments;
DROP POLICY IF EXISTS "payments_update_company" ON public.payments;

CREATE POLICY "payments_select_company" ON public.payments
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "payments_insert_company" ON public.payments
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "payments_update_company" ON public.payments
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
    )
  );


-- ============================================================
-- 6. INVENTORY_TRANSACTIONS TABLE
-- ============================================================
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_tx_select_company" ON public.inventory_transactions;
DROP POLICY IF EXISTS "inventory_tx_insert_company" ON public.inventory_transactions;

CREATE POLICY "inventory_tx_select_company" ON public.inventory_transactions
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "inventory_tx_insert_company" ON public.inventory_transactions
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
    )
  );


-- ============================================================
-- 7. BONDS TABLE (financial bonds / سندات القبض والصرف)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bonds') THEN
    EXECUTE 'ALTER TABLE public.bonds ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "bonds_select_company" ON public.bonds';
    EXECUTE 'DROP POLICY IF EXISTS "bonds_insert_company" ON public.bonds';
    EXECUTE 'DROP POLICY IF EXISTS "bonds_update_company" ON public.bonds';

    EXECUTE $pol$
      CREATE POLICY "bonds_select_company" ON public.bonds
        FOR SELECT USING (
          company_id IN (
            SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
          )
        )
    $pol$;

    EXECUTE $pol$
      CREATE POLICY "bonds_insert_company" ON public.bonds
        FOR INSERT WITH CHECK (
          company_id IN (
            SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
          )
        )
    $pol$;

    EXECUTE $pol$
      CREATE POLICY "bonds_update_company" ON public.bonds
        FOR UPDATE USING (
          company_id IN (
            SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
          )
        )
    $pol$;
  END IF;
END $$;


-- ============================================================
-- 8. EXPENSES TABLE
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'expenses') THEN
    EXECUTE 'ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "expenses_select_company" ON public.expenses';
    EXECUTE 'DROP POLICY IF EXISTS "expenses_insert_company" ON public.expenses';
    EXECUTE 'DROP POLICY IF EXISTS "expenses_update_company" ON public.expenses';

    EXECUTE $pol$
      CREATE POLICY "expenses_select_company" ON public.expenses
        FOR SELECT USING (
          company_id IN (
            SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
          )
        )
    $pol$;

    EXECUTE $pol$
      CREATE POLICY "expenses_insert_company" ON public.expenses
        FOR INSERT WITH CHECK (
          company_id IN (
            SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
          )
        )
    $pol$;

    EXECUTE $pol$
      CREATE POLICY "expenses_update_company" ON public.expenses
        FOR UPDATE USING (
          company_id IN (
            SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
          )
        )
    $pol$;
  END IF;
END $$;


-- ============================================================
-- 9. INVOICE_PAYMENTS (allocation table) — via invoice company_id
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoice_payments') THEN
    EXECUTE 'ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "invoice_payments_select" ON public.invoice_payments';
    EXECUTE 'DROP POLICY IF EXISTS "invoice_payments_insert" ON public.invoice_payments';

    EXECUTE $pol$
      CREATE POLICY "invoice_payments_select" ON public.invoice_payments
        FOR SELECT USING (
          invoice_id IN (
            SELECT id FROM public.invoices
            WHERE company_id IN (
              SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
            )
          )
        )
    $pol$;

    EXECUTE $pol$
      CREATE POLICY "invoice_payments_insert" ON public.invoice_payments
        FOR INSERT WITH CHECK (
          invoice_id IN (
            SELECT id FROM public.invoices
            WHERE company_id IN (
              SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
            )
          )
        )
    $pol$;
  END IF;
END $$;
