-- =========================================================================
-- Migration: Add COGS and Inventory Accounts to Sales Invoice Commit
-- =========================================================================

CREATE OR REPLACE FUNCTION public.commit_sales_invoice(p_invoice_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_invoice RECORD;
    v_item RECORD;
    v_journal_id uuid;
    v_company_id uuid;
    v_cogs_amount numeric := 0;
BEGIN
    -- 1. Get Invoice Details
    SELECT * INTO v_invoice 
    FROM public.invoices 
    WHERE id = p_invoice_id AND status = 'draft';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found or already posted: %', p_invoice_id;
    END IF;

    v_company_id := v_invoice.company_id;

    -- 2. Create Journal Entry Header
    INSERT INTO public.journal_entries (
        company_id, 
        reference_type, 
        reference_id, 
        description, 
        date
    ) VALUES (
        v_company_id, 
        'sales_invoice', 
        p_invoice_id, 
        'فاتورة مبيعات رقم ' || v_invoice.id, 
        v_invoice.date
    ) RETURNING id INTO v_journal_id;

    -- 3. Calculate COGS based on WAC (purchase_price in products)
    FOR v_item IN (SELECT i.*, COALESCE(p.purchase_price, 0) as cost_price 
                   FROM public.invoice_items i 
                   JOIN public.products p ON p.id = i.product_id 
                   WHERE i.invoice_id = p_invoice_id)
    LOOP
        v_cogs_amount := v_cogs_amount + (v_item.quantity * v_item.cost_price);
    END LOOP;

    -- 4. Insert Journal Lines (Double-Entry)
    
    -- Dr. Accounts Receivable (Customer) or Cash
    INSERT INTO public.journal_lines (journal_id, account_id, debit, credit)
    SELECT v_journal_id, 
           CASE WHEN v_invoice.payment_method = 'cash' 
                THEN (SELECT id FROM accounts WHERE system_type = 'cash' AND company_id = v_company_id LIMIT 1)
                ELSE v_invoice.party_id 
           END, 
           v_invoice.total_amount + v_invoice.total_tax, 
           0;

    -- Cr. Sales Revenue
    INSERT INTO public.journal_lines (journal_id, account_id, debit, credit)
    SELECT v_journal_id, 
           (SELECT id FROM accounts WHERE system_type = 'sales_revenue' AND company_id = v_company_id LIMIT 1), 
           0, 
           v_invoice.total_amount;

    -- Cr. VAT Payable (if applicable)
    IF v_invoice.total_tax > 0 THEN
        INSERT INTO public.journal_lines (journal_id, account_id, debit, credit)
        SELECT v_journal_id, 
               (SELECT id FROM accounts WHERE system_type = 'vat_payable' AND company_id = v_company_id LIMIT 1), 
               0, 
               v_invoice.total_tax;
    END IF;

    -- 5. Insert COGS Journal Lines (Dr. COGS, Cr. Inventory)
    IF v_cogs_amount > 0 THEN
        -- Dr. Cost of Goods Sold (COGS)
        INSERT INTO public.journal_lines (journal_id, account_id, debit, credit)
        SELECT v_journal_id, 
               (SELECT id FROM accounts WHERE system_type = 'cogs' AND company_id = v_company_id LIMIT 1), 
               v_cogs_amount, 
               0;

        -- Cr. Inventory Asset
        INSERT INTO public.journal_lines (journal_id, account_id, debit, credit)
        SELECT v_journal_id, 
               (SELECT id FROM accounts WHERE system_type = 'inventory_asset' AND company_id = v_company_id LIMIT 1), 
               0, 
               v_cogs_amount;
    END IF;

    -- 6. Update Invoice Status
    UPDATE public.invoices SET status = 'posted' WHERE id = p_invoice_id;

END;
$function$;
