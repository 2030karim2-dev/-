-- Supabase Migration: Database Fixes and Constraints
-- Target Database: alzhra100

-- 1. Remove deprecated column notify_on_bond from messaging_config
ALTER TABLE messaging_config DROP COLUMN IF EXISTS notify_on_bond;

-- 2. Enforce consistency constraint in ai_part_lookup_cache
ALTER TABLE ai_part_lookup_cache DROP CONSTRAINT IF EXISTS chk_global_company;
ALTER TABLE ai_part_lookup_cache 
  ADD CONSTRAINT chk_global_company 
  CHECK ((is_global = true AND company_id IS NULL) OR (is_global = false AND company_id IS NOT NULL));

-- 3. Enforce symmetric unique index in product_cross_references to prevent reflected duplicates
ALTER TABLE product_cross_references DROP CONSTRAINT IF EXISTS uq_cross_ref;
DROP INDEX IF EXISTS uq_cross_ref;
CREATE UNIQUE INDEX IF NOT EXISTS uq_cross_ref_symmetric ON product_cross_references (
  company_id,
  LEAST(base_product_id, alternative_product_id),
  GREATEST(base_product_id, alternative_product_id)
);

-- 4. Align parties.updated_at to be NOT NULL
ALTER TABLE parties ALTER COLUMN updated_at SET DEFAULT NOW();
UPDATE parties SET updated_at = NOW() WHERE updated_at IS NULL;
ALTER TABLE parties ALTER COLUMN updated_at SET NOT NULL;
