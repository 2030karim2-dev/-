-- ============================================================
-- 🛡️ Tax Enforcement Policy
-- Description: Ensures tax is physically zeroed out from all
-- accounting rows if the company's tax setting is disabled.
-- ============================================================

-- 1. Modified Invoice Item Total Verification
CREATE OR REPLACE FUNCTION public.verify_invoice_item_total()
RETURNS TRIGGER AS $$
DECLARE
  v_tax_enabled boolean := false;
BEGIN
  -- Check if tax is enabled for the company owning this invoice
  SELECT COALESCE(is_tax_enabled, false) INTO v_tax_enabled 
  FROM public.companies 
  WHERE id = (SELECT company_id FROM public.invoices WHERE id = NEW.invoice_id)
  LIMIT 1;

  -- If tax is disabled, force tax_amount to 0 BEFORE it gets calculated
  IF NOT v_tax_enabled THEN
    NEW.tax_amount := 0;
  END IF;

  -- Auto-calculate the line total
  NEW.total := (NEW.quantity * NEW.unit_price) - COALESCE(NEW.discount_amount, 0) + COALESCE(NEW.tax_amount, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Modified Invoice Total Rollup Trigger
CREATE OR REPLACE FUNCTION public.update_invoice_totals_from_items()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id uuid;
  v_tax_enabled boolean := false;
  v_items_subtotal numeric;
  v_items_tax numeric;
BEGIN
  v_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Check if tax is enabled for this company
  SELECT COALESCE(is_tax_enabled, false) INTO v_tax_enabled 
  FROM public.companies 
  WHERE id = (SELECT company_id FROM public.invoices WHERE id = v_invoice_id)
  LIMIT 1;

  -- Calculate raw sums from items
  SELECT 
    COALESCE(SUM(total), 0),
    COALESCE(SUM(tax_amount), 0)
  INTO 
    v_items_subtotal,
    v_items_tax
  FROM public.invoice_items 
  WHERE invoice_id = v_invoice_id;

  -- Enforce 0 tax if disabled
  IF NOT v_tax_enabled THEN
    v_items_tax := 0;
  END IF;

  -- Update invoice totals
  UPDATE public.invoices
  SET 
    subtotal = v_items_subtotal,
    tax_amount = v_items_tax,
    total_amount = v_items_subtotal - COALESCE(discount_amount, 0) + v_items_tax
  WHERE id = v_invoice_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
