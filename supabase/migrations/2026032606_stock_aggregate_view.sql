-- =========================================================================
-- Migration: Product Total Stock Materialized/Calculated View
-- =========================================================================

-- Create a view to offload the heavy .reduce() JS summation to the database engine
CREATE OR REPLACE VIEW public.product_total_stock_view AS
SELECT 
    product_id,
    COALESCE(SUM(quantity), 0) as total_quantity
FROM public.product_stock
GROUP BY product_id;

-- Optionally, add a comment
COMMENT ON VIEW public.product_total_stock_view IS 'Pre-aggregates inventory stock across all warehouses per product to prevent JS memory loops.';
