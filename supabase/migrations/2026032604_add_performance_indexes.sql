-- =========================================================================
-- Migration: Add Performance Indexes for Products Table
-- =========================================================================

-- 1. GIN index for Full-Text Search on search_vector
-- This speeds up the textSearch queries significantly
CREATE INDEX IF NOT EXISTS products_search_vector_idx ON public.products USING GIN (search_vector);

-- 2. B-Tree Indexes for common filters and sorting
-- Improves the .order('created_at', { ascending: false }) performance
CREATE INDEX IF NOT EXISTS products_created_at_idx ON public.products USING BTREE (created_at DESC);

-- Improves SKU lookups (often used in barcodes/exact matches)
CREATE INDEX IF NOT EXISTS products_sku_idx ON public.products USING BTREE (company_id, sku);

-- Also index status and deleted_at to speed up common where clauses
CREATE INDEX IF NOT EXISTS products_status_deleted_idx ON public.products USING BTREE (company_id, status, deleted_at);
