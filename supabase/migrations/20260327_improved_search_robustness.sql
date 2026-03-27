-- Migration: Improved Search Robustness and Space Handling
-- Date: 2026-03-27

-- 1. Update the search vector update function to include more fields
CREATE OR REPLACE FUNCTION public.update_product_search_vector()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- We include core identifiers in A, secondary in B, and descriptions in C
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.name_ar, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.part_number, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.sku, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.barcode, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.brand, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.alternative_numbers, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.size, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(NEW.specifications, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(NEW.location, '')), 'C');
  RETURN NEW;
END;
$function$;

-- 2. Trigger re-indexing for all existing products
UPDATE public.products SET search_vector = NULL WHERE deleted_at IS NULL;

-- 3. Update the search_inventory RPC
DROP FUNCTION IF EXISTS public.search_inventory(text, uuid);
CREATE OR REPLACE FUNCTION public.search_inventory(p_term text, p_company_id uuid)
 RETURNS TABLE(
    id uuid, 
    name_ar varchar, 
    sku varchar, 
    part_number varchar, 
    brand varchar, 
    sale_price numeric, 
    cost_price numeric, 
    stock_quantity numeric, 
    alternative_numbers text, 
    size varchar, 
    category_name varchar, 
    image_url text
 )
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_tsquery tsquery;
  v_clean_term text;
BEGIN
  -- Clean input: keep only alphanumeric and spaces (support Arabic)
  v_clean_term := trim(regexp_replace(p_term, '[^\w\s\u0600-\u06FF]', ' ', 'g'));
  
  IF v_clean_term = '' THEN
    RETURN;
  END IF;

  -- Build tsquery safely using arrays to avoid ":* & :*" errors
  SELECT array_to_string(array_agg(token || ':*'), ' & ')::tsquery
  INTO v_tsquery
  FROM unnest(string_to_array(v_clean_term, ' ')) AS token
  WHERE token != '';

  IF v_tsquery IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name_ar::varchar,
    p.sku::varchar,
    p.part_number::varchar,
    p.brand::varchar,
    p.sale_price::numeric,
    p.purchase_price::numeric as cost_price,
    COALESCE(SUM(ps.quantity), 0)::numeric AS stock_quantity,
    p.alternative_numbers::text,
    p.size::varchar,
    pc.name::varchar as category_name,
    p.image_url::text
  FROM products p
  LEFT JOIN product_stock ps ON ps.product_id = p.id
  LEFT JOIN product_categories pc ON pc.id = p.category_id
  WHERE p.company_id = p_company_id
    AND p.deleted_at IS NULL
    AND p.search_vector @@ v_tsquery
  GROUP BY p.id, p.name_ar, p.sku, p.part_number, p.brand, p.sale_price, p.purchase_price, p.alternative_numbers, p.size, pc.name, p.image_url
  ORDER BY
    ts_rank_cd(p.search_vector, v_tsquery) DESC,
    p.name_ar ASC
  LIMIT 50;
END;
$function$;
