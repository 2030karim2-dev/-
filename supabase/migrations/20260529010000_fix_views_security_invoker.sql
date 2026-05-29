-- ============================================================
-- Migration: Fix Views Security Invoker
-- Date: 2026-05-29
-- Purpose: active_accounts and active_products views did NOT have
--          security_invoker = true, allowing them to bypass RLS
--          and expose all companies' data to any authenticated user.
--          Only active_parties was fixed in a previous migration.
-- ============================================================

-- 1. Recreate active_accounts with security_invoker = true
DROP VIEW IF EXISTS public.active_accounts;
CREATE OR REPLACE VIEW public.active_accounts
WITH (security_invoker = true)
AS
  SELECT
    a.id,
    a.company_id,
    a.code,
    a.name_ar,
    a.name_en,
    a.type AS account_type,
    a.parent_id,
    a.is_active,
    a.is_system,
    a.currency_code,
    a.created_at,
    a.updated_at,
    a.deleted_at,
    CAST(COALESCE(b.balance, 0) AS NUMERIC(14,2)) AS balance,
    1 AS level
  FROM public.accounts a
  LEFT JOIN public.account_balances b
    ON b.account_id = a.id AND b.company_id = a.company_id
  WHERE a.deleted_at IS NULL;

GRANT SELECT ON public.active_accounts TO authenticated;


-- 2. Recreate active_products with security_invoker = true
DROP VIEW IF EXISTS public.active_products;
CREATE OR REPLACE VIEW public.active_products
WITH (security_invoker = true)
AS
  SELECT
    id, company_id, name_ar, sku, part_number, brand,
    description, size, specifications, unit,
    purchase_price, sale_price, cost_price,
    image_url, barcode, alternative_numbers,
    status, created_at, updated_at, min_stock_level,
    category_id, is_kit, has_core_charge, core_charge_amount,
    deleted_at, location, updated_by
  FROM public.products
  WHERE deleted_at IS NULL;

GRANT SELECT ON public.active_products TO authenticated;


-- 3. Protect account_balances table (joined in active_accounts)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'account_balances') THEN
    EXECUTE 'ALTER TABLE public.account_balances ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "account_balances_select_company" ON public.account_balances';
    EXECUTE $pol$
      CREATE POLICY "account_balances_select_company" ON public.account_balances
        FOR SELECT USING (
          company_id IN (
            SELECT company_id FROM public.user_company_roles WHERE user_id = auth.uid()
          )
        )
    $pol$;
  END IF;
END $$;
