-- =========================================================================
-- Migration: Inventory Improvements (Fuzzy Matching & Multiple UoMs)
-- =========================================================================

-- 1. Enable pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create the Enhanced get_potential_duplicates RPC
CREATE OR REPLACE FUNCTION public.get_potential_duplicates(p_company_id uuid)
 RETURNS TABLE(
    id1 uuid,
    name1 varchar,
    part_number1 varchar,
    brand1 varchar,
    id2 uuid,
    name2 varchar,
    part_number2 varchar,
    brand2 varchar,
    similarity_score float
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        p1.id as id1, p1.name_ar as name1, p1.part_number as part_number1, p1.brand as brand1,
        p2.id as id2, p2.name_ar as name2, p2.part_number as part_number2, p2.brand as brand2,
        SIMILARITY(COALESCE(p1.part_number, '') || ' ' || COALESCE(p1.brand, ''), 
                   COALESCE(p2.part_number, '') || ' ' || COALESCE(p2.brand, ''))::float as similarity_score
    FROM public.products p1
    JOIN public.products p2 
      ON p1.company_id = p2.company_id 
      AND p1.id > p2.id -- avoid pairs showing twice and comparing with self
    WHERE p1.company_id = p_company_id
      AND p1.deleted_at IS NULL 
      AND p2.deleted_at IS NULL
      AND (
          -- High similarity on name
          SIMILARITY(p1.name_ar, p2.name_ar) > 0.8
          OR
          -- High similarity on combination of Part number and Brand
          SIMILARITY(COALESCE(p1.part_number, '') || ' ' || COALESCE(p1.brand, ''), 
                     COALESCE(p2.part_number, '') || ' ' || COALESCE(p2.brand, '')) > 0.85
          OR 
          -- Exact Match on SKU
          (p1.sku IS NOT NULL AND p1.sku = p2.sku)
      )
    ORDER BY similarity_score DESC
    LIMIT 50;
END;
$function$;

-- 3. Create Product UoMs Table
CREATE TABLE IF NOT EXISTS public.product_uoms (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    uom_name varchar(50) NOT NULL, -- e.g. Box, Carton, Dozen
    conversion_factor numeric(10,4) NOT NULL DEFAULT 1.0000, -- e.g. 1 Box = 10 Pcs
    barcode varchar(100), -- Specific barcode for this Unit
    sale_price numeric(12,2), -- Custom price for this whole unit
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(product_id, uom_name)
);

-- Optimize queries for product UoMs
CREATE INDEX IF NOT EXISTS idx_product_uoms_product_id ON public.product_uoms(product_id);
