-- Migration: Fix missing company_id column in key tables
-- Date: 2026-03-07
-- Description: Adds company_id to invoice_items, journal_entry_lines, and product_stock 
-- to ensure consistent multi-tenancy and resolve RPC errors.

-- 1. Add company_id to invoice_items
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'company_id') THEN
        ALTER TABLE public.invoice_items ADD COLUMN company_id UUID;
        
        -- Backfill company_id from parent invoices
        UPDATE public.invoice_items ii
        SET company_id = i.company_id
        FROM public.invoices i
        WHERE ii.invoice_id = i.id;
        
        -- Add FK constraint
        ALTER TABLE public.invoice_items 
        ADD CONSTRAINT fk_invoice_items_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
        
        -- Create index for performance
        CREATE INDEX idx_invoice_items_company_id ON public.invoice_items(company_id);
    END IF;
END $$;

-- 2. Add company_id to journal_entry_lines
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entry_lines' AND column_name = 'company_id') THEN
        ALTER TABLE public.journal_entry_lines ADD COLUMN company_id UUID;
        
        -- Backfill company_id from parent journal_entries
        UPDATE public.journal_entry_lines jel
        SET company_id = je.company_id
        FROM public.journal_entries je
        WHERE jel.journal_entry_id = je.id;
        
        -- Add FK constraint
        ALTER TABLE public.journal_entry_lines 
        ADD CONSTRAINT fk_journal_entry_lines_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
        
        -- Create index for performance
        CREATE INDEX idx_journal_entry_lines_company_id ON public.journal_entry_lines(company_id);
    END IF;
END $$;

-- 3. Add company_id to product_stock
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_stock' AND column_name = 'company_id') THEN
        ALTER TABLE public.product_stock ADD COLUMN company_id UUID;
        
        -- Backfill company_id from products table (product_stock belongs to a warehouse which belongs to a company, but products also have company_id)
        UPDATE public.product_stock ps
        SET company_id = p.company_id
        FROM public.products p
        WHERE ps.product_id = p.id;
        
        -- Add FK constraint
        ALTER TABLE public.product_stock 
        ADD CONSTRAINT fk_product_stock_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
        
        -- Create index for performance
        CREATE INDEX idx_product_stock_company_id ON public.product_stock(company_id);
    END IF;
END $$;
