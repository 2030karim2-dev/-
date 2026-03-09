-- ============================================================
-- Migration: Critical Accounting Fixes (Part 1)
-- Description: Implement double-entry constraints and auto-calc totals
-- ============================================================

-- 1. Double-Entry Validation Trigger (Deferred)
CREATE OR REPLACE FUNCTION public.check_journal_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COALESCE(SUM(debit_amount) - SUM(credit_amount), 0)
    FROM public.journal_entry_lines
    WHERE journal_entry_id = COALESCE(NEW.journal_entry_id, OLD.journal_entry_id)
      AND deleted_at IS NULL
  ) <> 0 THEN
    RAISE EXCEPTION 'قيد اليومية غير متوازن (Double-Entry Mismatch)';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_journal_balance ON public.journal_entry_lines;
CREATE CONSTRAINT TRIGGER ensure_journal_balance
AFTER INSERT OR UPDATE OR DELETE ON public.journal_entry_lines
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION public.check_journal_balance();

-- 2. Account Balances View
CREATE OR REPLACE VIEW public.account_balances AS
SELECT 
  account_id,
  COALESCE(SUM(debit_amount) - SUM(credit_amount), 0) AS balance
FROM public.journal_entry_lines
WHERE deleted_at IS NULL
GROUP BY account_id;

-- 3. Invoice Item Verification (Auto-correct Totals)
CREATE OR REPLACE FUNCTION public.verify_invoice_item_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total := (NEW.quantity * NEW.unit_price) - COALESCE(NEW.discount_amount, 0) + COALESCE(NEW.tax_amount, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_invoice_item_total ON public.invoice_items;
CREATE TRIGGER ensure_invoice_item_total
BEFORE INSERT OR UPDATE ON public.invoice_items
FOR EACH ROW
EXECUTE FUNCTION public.verify_invoice_item_total();

-- 4. Invoice Total Rollup Trigger
CREATE OR REPLACE FUNCTION public.update_invoice_totals_from_items()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id uuid;
BEGIN
  v_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  UPDATE public.invoices
  SET 
    subtotal = (SELECT COALESCE(SUM(total), 0) FROM public.invoice_items WHERE invoice_id = v_invoice_id),
    total_amount = (SELECT COALESCE(SUM(total), 0) FROM public.invoice_items WHERE invoice_id = v_invoice_id) - COALESCE(discount_amount, 0) + COALESCE(tax_amount, 0)
  WHERE id = v_invoice_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_invoice_totals ON public.invoice_items;
CREATE TRIGGER trg_update_invoice_totals
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW
EXECUTE FUNCTION public.update_invoice_totals_from_items();

-- 5. Stock Negative Prevention Trigger
CREATE OR REPLACE FUNCTION public.prevent_negative_stock_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_current_stock numeric;
BEGIN
  -- This checks stock only when reducing it (outwards).
  -- Wait, inventory_transactions should be used to protect stock. If a sale invoice creates a transaction:
  -- We just need to ensure product_stock quantity doesn't drop below 0 if it's being updated.
  IF NEW.quantity < 0 THEN
    RAISE EXCEPTION 'لا يمكن أن تكون كمية المخزون بالسالب للمنتج';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_negative_stock ON public.product_stock;
CREATE TRIGGER trg_prevent_negative_stock
BEFORE UPDATE ON public.product_stock
FOR EACH ROW
EXECUTE FUNCTION public.prevent_negative_stock_on_sale();

-- 6. Paid Amount vs Payment Allocations
CREATE OR REPLACE FUNCTION public.verify_invoice_paid_amount()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id uuid;
BEGIN
  v_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  UPDATE public.invoices
  SET 
    paid_amount = (SELECT COALESCE(SUM(amount), 0) FROM public.payment_allocations WHERE invoice_id = v_invoice_id)
  WHERE id = v_invoice_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_verify_invoice_paid_amount ON public.payment_allocations;
CREATE TRIGGER trg_verify_invoice_paid_amount
AFTER INSERT OR UPDATE OR DELETE ON public.payment_allocations
FOR EACH ROW
EXECUTE FUNCTION public.verify_invoice_paid_amount();

-- 7. Party Balances View
CREATE OR REPLACE VIEW public.party_balances AS
SELECT 
  p.id AS party_id,
  (
    -- مجموع الفواتير غير المسددة
    COALESCE((SELECT SUM(total_amount - paid_amount) FROM public.invoices WHERE party_id = p.id AND deleted_at IS NULL), 0)
    -- زائد المبالغ المفتوحة للجهة من السندات لو كان هناك رصيد افتتاحي (بسيط)
  ) AS balance
FROM public.parties p
WHERE p.deleted_at IS NULL;

-- 8. إزالة حقول الرصيد الثابتة (Balance Columns)
-- سيتم تجاهل الخطأ لو كانت الحقول غير موجودة.
ALTER TABLE public.accounts DROP COLUMN IF EXISTS balance;
ALTER TABLE public.parties DROP COLUMN IF EXISTS balance;

-- 9. توحيد سعر المنتج
-- إزالة cost_price والاكتفاء بـ purchase_price كما اقترح التقرير لتلافي التضارب
ALTER TABLE public.products DROP COLUMN IF EXISTS cost_price;

-- 10. منع تكرار أسعار الصرف
-- إضافة قيد (Unique) يمنع إدخال أكثر من تسعيرة لنفس العملة في نفس اليوم للشركة الواحدة
ALTER TABLE public.exchange_rates 
  DROP CONSTRAINT IF EXISTS exchange_rates_company_currency_date_key;

ALTER TABLE public.exchange_rates 
  ADD CONSTRAINT exchange_rates_company_currency_date_key 
  UNIQUE (company_id, currency_code, effective_date);


