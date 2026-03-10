-- Fix report_debt_aging RPC
CREATE OR REPLACE FUNCTION public.report_debt_aging(p_company_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_currency text;
  v_receivables numeric;
  v_payables numeric;
  v_debts json;
BEGIN
  -- Get company base currency
  SELECT COALESCE(base_currency, 'SAR') INTO v_currency
  FROM public.companies WHERE id = p_company_id;

  -- Receivables (customers with positive balance)
  -- Positive balance in active_parties means they owe us money
  SELECT COALESCE(SUM(balance), 0) INTO v_receivables
  FROM public.active_parties WHERE company_id = p_company_id AND type = 'customer' AND balance > 0;

  -- Payables (suppliers with negative balance = we owe them money)
  SELECT COALESCE(SUM(ABS(balance)), 0) INTO v_payables
  FROM public.active_parties WHERE company_id = p_company_id AND type = 'supplier' AND balance < 0;

  -- All debts
  SELECT COALESCE(json_agg(json_build_object(
    'id', p.id,
    'name', p.name,
    'type', p.type,
    'currency', v_currency,
    'total_sales', 0,
    'paid_amount', 0,
    'remaining_amount', p.balance
  ) ORDER BY ABS(p.balance) DESC), '[]'::json)
  INTO v_debts
  FROM public.active_parties p
  WHERE p.company_id = p_company_id AND p.balance != 0;

  RETURN json_build_object(
    'summary', json_build_object(
      'receivables', v_receivables,
      'payables', v_payables,
      'currency', v_currency
    ),
    'debts', v_debts
  );
END;
$function$;

-- Fix Recursive RLS on user_company_roles
DROP POLICY IF EXISTS "user_company_roles_select" ON public.user_company_roles;

CREATE POLICY "user_company_roles_select_v2" ON public.user_company_roles
  FOR SELECT
  USING (
    user_id = (SELECT auth.uid() AS uid)
    OR
    company_id IN (SELECT public.get_auth_companies())
  );
