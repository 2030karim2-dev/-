-- Fix party_balances view to calculate true accounting balance instead of just invoices
-- This fixes the issue where customer debts show unreal numbers (e.g. 307K) 
-- because payments and journal entries were completely ignored.

CREATE OR REPLACE VIEW public.party_balances AS
SELECT 
    p.id AS party_id,
    p.company_id,
    p.type,
    COALESCE(
        SUM(
            CASE 
                -- For customers, positive balance means they owe us (Asset/Debit normal)
                WHEN p.type = 'customer' THEN jel.debit_amount - jel.credit_amount
                -- For suppliers, positive balance means we owe them (Liability/Credit normal)
                WHEN p.type = 'supplier' THEN jel.credit_amount - jel.debit_amount
                ELSE jel.debit_amount - jel.credit_amount 
            END
        ), 0::numeric
    )::numeric(14,2) AS balance
FROM public.parties p
LEFT JOIN public.journal_entry_lines jel ON jel.party_id = p.id AND jel.deleted_at IS NULL
LEFT JOIN public.journal_entries je ON je.id = jel.journal_entry_id AND je.status = 'posted' AND je.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.company_id, p.type;
