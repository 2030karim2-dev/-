-- We use the existing audit_logs table which has the following schema:
-- id, company_id, user_id, action, entity, entity_id, details, created_at, updated_at

-- Create the generic trigger function
CREATE OR REPLACE FUNCTION public.log_table_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
    v_record_id UUID;
    v_company_id UUID := NULL;
BEGIN
    -- Extract company_id if it exists in the new or old record
    BEGIN
        IF (TG_OP = 'DELETE') THEN
            v_company_id := (OLD.company_id)::UUID;
        ELSE
            v_company_id := (NEW.company_id)::UUID;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- If company_id doesn't exist on the table, ignore
        v_company_id := NULL;
    END;

    IF (TG_OP = 'INSERT') THEN
        v_new_data := row_to_json(NEW)::JSONB;
        v_record_id := NEW.id;
        INSERT INTO public.audit_logs (company_id, user_id, action, entity, entity_id, details)
        VALUES (v_company_id, auth.uid(), TG_OP, TG_TABLE_NAME, v_record_id, jsonb_build_object('new_data', v_new_data));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_old_data := row_to_json(OLD)::JSONB;
        v_new_data := row_to_json(NEW)::JSONB;
        v_record_id := NEW.id;
        
        -- Only log if data actually changed
        IF v_old_data != v_new_data THEN
            INSERT INTO public.audit_logs (company_id, user_id, action, entity, entity_id, details)
            VALUES (v_company_id, auth.uid(), TG_OP, TG_TABLE_NAME, v_record_id, jsonb_build_object('old_data', v_old_data, 'new_data', v_new_data));
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        v_old_data := row_to_json(OLD)::JSONB;
        v_record_id := OLD.id;
        INSERT INTO public.audit_logs (company_id, user_id, action, entity, entity_id, details)
        VALUES (v_company_id, auth.uid(), TG_OP, TG_TABLE_NAME, v_record_id, jsonb_build_object('old_data', v_old_data));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach triggers to critical tables
DROP TRIGGER IF EXISTS trg_audit_products ON public.products;
CREATE TRIGGER trg_audit_products
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

DROP TRIGGER IF EXISTS trg_audit_invoices ON public.invoices;
CREATE TRIGGER trg_audit_invoices
AFTER INSERT OR UPDATE OR DELETE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

DROP TRIGGER IF EXISTS trg_audit_invoice_items ON public.invoice_items;
CREATE TRIGGER trg_audit_invoice_items
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

DROP TRIGGER IF EXISTS trg_audit_parties ON public.parties;
CREATE TRIGGER trg_audit_parties
AFTER INSERT OR UPDATE OR DELETE ON public.parties
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

DROP TRIGGER IF EXISTS trg_audit_inventory_transactions ON public.inventory_transactions;
CREATE TRIGGER trg_audit_inventory_transactions
AFTER INSERT OR UPDATE OR DELETE ON public.inventory_transactions
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

DROP TRIGGER IF EXISTS trg_audit_journal_entries ON public.journal_entries;
CREATE TRIGGER trg_audit_journal_entries
AFTER INSERT OR UPDATE OR DELETE ON public.journal_entries
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();
