-- ============================================================
-- Migration: Fix RLS Policies and Function Grants
-- Purpose:  Products, parties, and accounts not visible in UI
--           because get_user_profile RPC denies access (42501)
--           and key tables lack proper RLS SELECT policies.
-- ============================================================

-- ============================================================
-- 1. GRANT EXECUTE ON RPC FUNCTIONS to authenticated role
--    get_user_profile is called during login to build user context
--    (company_id). Without this, company_id is undefined and ALL
--    data queries are disabled (enabled: !!companyId).
-- ============================================================
DO $$
DECLARE
  func_sig TEXT;
BEGIN
  -- Grant on all overloads of get_user_profile
  FOR func_sig IN
    SELECT p.oid::regprocedure::text
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_user_profile'
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', func_sig);
  END LOOP;
END $$;

-- Grant on other RPC functions used by the app
GRANT EXECUTE ON FUNCTION public.get_party_statement(uuid, uuid) TO authenticated;

-- search_inventory (used by POS product search)
DO $$
DECLARE
  func_sig TEXT;
BEGIN
  FOR func_sig IN
    SELECT p.oid::regprocedure::text
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'search_inventory',
        'search_inventory_paginated',
        'save_product_uoms'
      )
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', func_sig);
  END LOOP;
END $$;


-- ============================================================
-- 2. FIX RLS on profiles table
--    Users must be able to read their own profile row.
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);


-- ============================================================
-- 3. FIX RLS on user_company_roles table
--    Users must be able to read their own role row
--    (this is where company_id comes from in the fallback).
-- ============================================================
ALTER TABLE public.user_company_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ucr_select_own" ON public.user_company_roles;
CREATE POLICY "ucr_select_own"
  ON public.user_company_roles
  FOR SELECT
  USING (auth.uid() = user_id);


-- ============================================================
-- 4. FIX RLS on parties table
--    Users can only see parties belonging to their company.
-- ============================================================
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "parties_select_company" ON public.parties;
CREATE POLICY "parties_select_company"
  ON public.parties
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_roles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "parties_insert_company" ON public.parties;
CREATE POLICY "parties_insert_company"
  ON public.parties
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_company_roles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "parties_update_company" ON public.parties;
CREATE POLICY "parties_update_company"
  ON public.parties
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_roles
      WHERE user_id = auth.uid()
    )
  );


-- ============================================================
-- 5. FIX RLS on products table
-- ============================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_company" ON public.products;
CREATE POLICY "products_select_company"
  ON public.products
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_roles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "products_insert_company" ON public.products;
CREATE POLICY "products_insert_company"
  ON public.products
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_company_roles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "products_update_company" ON public.products;
CREATE POLICY "products_update_company"
  ON public.products
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_roles
      WHERE user_id = auth.uid()
    )
  );


-- ============================================================
-- 6. FIX RLS on accounts table
-- ============================================================
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "accounts_select_company" ON public.accounts;
CREATE POLICY "accounts_select_company"
  ON public.accounts
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_roles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "accounts_insert_company" ON public.accounts;
CREATE POLICY "accounts_insert_company"
  ON public.accounts
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_company_roles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "accounts_update_company" ON public.accounts;
CREATE POLICY "accounts_update_company"
  ON public.accounts
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_roles
      WHERE user_id = auth.uid()
    )
  );


-- ============================================================
-- 7. FIX RLS on party_categories table
-- ============================================================
ALTER TABLE public.party_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "party_categories_select_company" ON public.party_categories;
CREATE POLICY "party_categories_select_company"
  ON public.party_categories
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_roles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "party_categories_insert_company" ON public.party_categories;
CREATE POLICY "party_categories_insert_company"
  ON public.party_categories
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_company_roles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "party_categories_update_company" ON public.party_categories;
CREATE POLICY "party_categories_update_company"
  ON public.party_categories
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_roles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "party_categories_delete_company" ON public.party_categories;
CREATE POLICY "party_categories_delete_company"
  ON public.party_categories
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_roles
      WHERE user_id = auth.uid()
    )
  );


-- ============================================================
-- 8. FIX RLS on product_categories table
-- ============================================================
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_categories_select_company" ON public.product_categories;
CREATE POLICY "product_categories_select_company"
  ON public.product_categories
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_roles
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "product_categories_insert_company" ON public.product_categories;
CREATE POLICY "product_categories_insert_company"
  ON public.product_categories
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.user_company_roles
      WHERE user_id = auth.uid()
    )
  );


-- ============================================================
-- 9. FIX RLS on product_stock table
-- ============================================================
ALTER TABLE public.product_stock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_stock_select_company" ON public.product_stock;
CREATE POLICY "product_stock_select_company"
  ON public.product_stock
  FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM public.products
      WHERE company_id IN (
        SELECT company_id FROM public.user_company_roles
        WHERE user_id = auth.uid()
      )
    )
  );


-- ============================================================
-- 10. FIX active_parties view (used by partiesApi.getParties)
--     The view must be accessible to authenticated users.
--     Drop and recreate with SECURITY INVOKER so that the
--     caller's RLS policies apply through the view.
-- ============================================================
DROP VIEW IF EXISTS public.active_parties;
CREATE OR REPLACE VIEW public.active_parties
WITH (security_invoker = true)
AS
  SELECT *
  FROM public.parties
  WHERE deleted_at IS NULL;

GRANT SELECT ON public.active_parties TO authenticated;


-- ============================================================
-- 11. Grant SELECT on companies table
--     Needed for profile fallback to read company name.
-- ============================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companies_select_member" ON public.companies;
CREATE POLICY "companies_select_member"
  ON public.companies
  FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM public.user_company_roles
      WHERE user_id = auth.uid()
    )
  );


-- ============================================================
-- 12. Ensure warehouses table accessible (for product_stock join)
-- ============================================================
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "warehouses_select_company" ON public.warehouses;
CREATE POLICY "warehouses_select_company"
  ON public.warehouses
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.user_company_roles
      WHERE user_id = auth.uid()
    )
  );
