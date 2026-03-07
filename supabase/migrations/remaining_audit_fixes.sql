-- ============================================
-- FIX #10: WAC Calculation (uses inventory_transactions instead of product_stock)
-- ============================================
CREATE OR REPLACE FUNCTION public.update_product_wac()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_invoice_type TEXT;
  v_current_stock DECIMAL;
  v_old_wac DECIMAL;
  v_new_qty DECIMAL;
  v_new_price DECIMAL;
  v_updated_wac DECIMAL;
BEGIN
  SELECT type INTO v_invoice_type FROM public.invoices WHERE id = NEW.invoice_id;
  IF v_invoice_type = 'purchase' THEN
     SELECT COALESCE(SUM(CASE 
            WHEN transaction_type IN ('purchase','sales_return','transfer_in','adj_in') THEN ABS(quantity)
            WHEN transaction_type IN ('sales','purchase_return','transfer_out','adj_out') THEN -ABS(quantity)
            WHEN transaction_type = 'adj' THEN quantity
            ELSE quantity END), 0)
     INTO v_current_stock
     FROM public.inventory_transactions
     WHERE product_id = NEW.product_id AND deleted_at IS NULL;
     SELECT cost_price INTO v_old_wac FROM public.products WHERE id = NEW.product_id;
     v_new_qty := NEW.quantity;
     v_new_price := NEW.unit_price;
     IF (v_current_stock + v_new_qty) > 0 THEN
        v_updated_wac := ((GREATEST(0, v_current_stock) * COALESCE(v_old_wac, 0)) + (v_new_qty * v_new_price)) / (v_current_stock + v_new_qty);
     ELSE
        v_updated_wac := v_new_price;
     END IF;
     UPDATE public.products SET cost_price = v_updated_wac, purchase_price = v_new_price WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- ============================================
-- RECALCULATE ALL ACCOUNT BALANCES
-- (Fixes historical double-counting from removed duplicate trigger)
-- ============================================
DO $$
DECLARE
  v_acc RECORD;
BEGIN
  FOR v_acc IN SELECT id, type FROM public.accounts LOOP
    IF v_acc.type IN ('asset', 'expense') THEN
      UPDATE public.accounts 
      SET balance = COALESCE((
          SELECT SUM(debit_amount) - SUM(credit_amount)
          FROM public.journal_entry_lines jel
          JOIN public.journal_entries j ON j.id = jel.journal_entry_id
          WHERE jel.account_id = v_acc.id 
            AND jel.deleted_at IS NULL 
            AND j.status = 'posted'
            AND j.deleted_at IS NULL
      ), 0)
      WHERE id = v_acc.id;
    ELSE
      UPDATE public.accounts 
      SET balance = COALESCE((
          SELECT SUM(credit_amount) - SUM(debit_amount)
          FROM public.journal_entry_lines jel
          JOIN public.journal_entries j ON j.id = jel.journal_entry_id
          WHERE jel.account_id = v_acc.id 
            AND jel.deleted_at IS NULL 
            AND j.status = 'posted'
            AND j.deleted_at IS NULL
      ), 0)
      WHERE id = v_acc.id;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- RECALCULATE ALL PARTY BALANCES
-- ============================================
DO $$
DECLARE
  v_party RECORD;
BEGIN
  FOR v_party IN SELECT id, type FROM public.parties WHERE deleted_at IS NULL LOOP
    IF v_party.type = 'customer' THEN
      UPDATE public.parties 
      SET balance = COALESCE((
          SELECT SUM(debit_amount) - SUM(credit_amount)
          FROM public.journal_entry_lines jel
          JOIN public.journal_entries j ON j.id = jel.journal_entry_id
          WHERE jel.party_id = v_party.id 
            AND jel.deleted_at IS NULL 
            AND j.status = 'posted'
            AND j.deleted_at IS NULL
      ), 0)
      WHERE id = v_party.id;
    ELSIF v_party.type = 'supplier' THEN
      UPDATE public.parties 
      SET balance = COALESCE((
          SELECT SUM(credit_amount) - SUM(debit_amount)
          FROM public.journal_entry_lines jel
          JOIN public.journal_entries j ON j.id = jel.journal_entry_id
          WHERE jel.party_id = v_party.id 
            AND jel.deleted_at IS NULL 
            AND j.status = 'posted'
            AND j.deleted_at IS NULL
      ), 0)
      WHERE id = v_party.id;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- RELOAD PostgREST SCHEMA CACHE
-- ============================================
NOTIFY pgrst, 'reload schema';
