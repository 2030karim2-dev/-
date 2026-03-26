-- =========================================================================
-- Migration: Add Security Audit Triggers and Dynamic RBAC
-- =========================================================================

-- 1. Create Roles Permissions Table
CREATE TABLE IF NOT EXISTS public.roles_permissions (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    role_name varchar(50) NOT NULL,
    action varchar(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(role_name, action)
);

-- Pre-populate default permissions from old AuthorizeActionUsecase
INSERT INTO public.roles_permissions (role_name, action) VALUES
-- Owner
('owner', 'delete_product'), ('owner', 'create_product'), ('owner', 'close_fiscal_year'),
('owner', 'edit_posted_invoice'), ('owner', 'view_financial_reports'), ('owner', 'create_purchase'),
('owner', 'delete_party'), ('owner', 'post_journal_entry'), ('owner', 'create_expense'),
('owner', 'create_bond'), ('owner', 'delete_bond'), ('owner', 'create_sale_return'),
-- Manager
('manager', 'create_product'), ('manager', 'delete_product'), ('manager', 'view_financial_reports'),
('manager', 'create_purchase'), ('manager', 'post_journal_entry'), ('manager', 'create_expense'),
('manager', 'create_bond'), ('manager', 'delete_bond'), ('manager', 'create_sale_return'),
-- Accountant
('accountant', 'view_financial_reports'), ('accountant', 'post_journal_entry'),
('accountant', 'create_expense'), ('accountant', 'create_bond'), ('accountant', 'delete_bond'),
-- Sales
('sales', 'create_product')
ON CONFLICT DO NOTHING;

-- 2. Create Audit Log Table (If not completely existing or enhance existing)
CREATE TABLE IF NOT EXISTS public.db_audit_logs (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    table_name varchar(50) NOT NULL,
    record_id uuid,
    action varchar(20) NOT NULL,
    old_value jsonb,
    new_value jsonb,
    user_id uuid REFERENCES auth.users(id),
    changed_at timestamp with time zone DEFAULT now()
);

-- 3. Create Audit Trigger Function
CREATE OR REPLACE FUNCTION public.fn_audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Try to get the user ID from the Supabase auth context
    v_user_id := auth.uid();
    
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.db_audit_logs (table_name, record_id, action, new_value, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW)::jsonb, v_user_id);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.db_audit_logs (table_name, record_id, action, old_value, new_value, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, v_user_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.db_audit_logs (table_name, record_id, action, old_value, user_id)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD)::jsonb, v_user_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Apply Triggers to sensitive tables
DO $$ 
BEGIN
    -- invoices
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_invoices') THEN
        CREATE TRIGGER trg_audit_invoices
        AFTER INSERT OR UPDATE OR DELETE ON public.invoices
        FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_trigger();
    END IF;

    -- journal_entries
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_journal_entries') THEN
        CREATE TRIGGER trg_audit_journal_entries
        AFTER INSERT OR UPDATE OR DELETE ON public.journal_entries
        FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_trigger();
    END IF;

    -- products
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_products') THEN
        CREATE TRIGGER trg_audit_products
        AFTER INSERT OR UPDATE OR DELETE ON public.products
        FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_trigger();
    END IF;
END $$;
