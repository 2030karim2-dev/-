import { Product, ProductFormData } from '../types';
import { inventoryApi } from '../api';
import { supabase } from '../../../lib/supabaseClient';
import { InsertDto } from '../../../core/database.helpers';
import { logger } from '../../../core/utils/logger';

interface RawStock {
    quantity?: number | string;
    warehouse_id: string;
    warehouses?: { name_ar?: string };
}

interface RawProduct {
    id: string;
    company_id: string;
    name_ar: string;
    sku?: string;
    part_number?: string;
    brand?: string;
    category?: { id: string; name: string } | null;
    category_id?: string;
    size?: string;
    description?: string;
    cost_price?: number | string;
    sale_price?: number | string;
    min_stock_level?: number | string;
    unit?: string;
    image_url?: string | null;
    alternative_numbers?: string | null;
    barcode?: string | null;
    created_at: string;
    stock?: RawStock[];
    status?: string;
}

export const productService = {
    /**
     * Get all products for a company
     */
    getProducts: async (companyId: string): Promise<Product[]> => {
        const { data, error } = await inventoryApi.getProducts(companyId);
        if (error) throw error;

        return (data || []).map((p: unknown) => {
            const prod = p as RawProduct;
            if (!prod || !prod.id) return null;

            const stockList = Array.isArray(prod.stock) ? prod.stock : [];
            const totalStock = stockList.reduce((sum: number, s: RawStock) => {
                const qty = Number(s.quantity);
                return sum + (isNaN(qty) ? 0 : qty);
            }, 0);

            const categoryName = prod.category?.name || 'عام';

            return {
                id: prod.id,
                company_id: prod.company_id,
                name_ar: prod.name_ar || 'بدون اسم',
                name_en: '',
                name: prod.name_ar || 'بدون اسم',
                sku: prod.sku || '---',
                part_number: prod.part_number || '---',
                brand: prod.brand || '',
                category: categoryName,
                category_id: prod.category_id || null,
                size: prod.size || '',
                specifications: prod.description || '',
                cost_price: Number(prod.cost_price) || 0,
                sale_price: Number(prod.sale_price) || 0,
                selling_price: Number(prod.sale_price) || 0,
                stock_quantity: totalStock,
                min_stock_level: Number(prod.min_stock_level) || 0,
                unit: prod.unit || 'pcs',
                image_url: prod.image_url || null,
                alternative_numbers: prod.alternative_numbers || null,
                barcode: prod.barcode || null,
                created_at: prod.created_at || new Date().toISOString(),
                isLowStock: totalStock <= (Number(prod.min_stock_level) || 5),

                warehouse_distribution: stockList.map((s: RawStock) => ({
                    warehouse_id: s.warehouse_id,
                    warehouse_name: s.warehouses?.name_ar || 'مستودع',
                    quantity: Number(s.quantity) || 0,
                    location: ''
                })),

                alternatives: prod.alternative_numbers ? prod.alternative_numbers.split(',').map(n => n.trim()) : [],
                compatibility: [],
                total_purchases_qty: 0,
                total_sales_qty: 0,
                total_profit: 0,
                total_loss: 0,
                last_invoice_date: new Date().toISOString()
            } as any;
        }).filter(Boolean);
    },

    /**
     * Get a single product by ID
     */
    getProductById: async (id: string) => {
        const { data, error } = await inventoryApi.getProductById(id);
        if (error) throw error;
        return { data };
    },

    /**
     * Search products using advanced database search
     */
    searchProducts: async (companyId: string, term: string): Promise<Record<string, unknown>[]> => {
        const { data, error } = await supabase.rpc('search_inventory', {
            p_term: term,
            p_company_id: companyId
        } as never);
        if (error) throw error;
        return data || [];
    },

    /**
     * Create a new product
     */
    createProduct: async (data: ProductFormData, companyId: string, _userId: string) => {
        // Prevent duplicate names
        const { data: existing } = await supabase
            .from('products')
            .select('id')
            .eq('company_id', companyId)
            .eq('name_ar', data.name)
            .limit(1);

        if (existing && existing.length > 0) {
            throw new Error(`يوجد منتج بنفس الاسم بالفعل: ${data.name}`);
        }

        const payload: InsertDto<'products'> = {
            company_id: companyId,
            name_ar: data.name,
            sku: data.sku || `SKU-${Date.now()}`,
            sale_price: Number(data.selling_price) || 0,
            purchase_price: Number(data.cost_price) || 0,
            cost_price: Number(data.cost_price) || 0,
            min_stock_level: Number(data.min_stock_level) || 5,
            unit: data.unit || 'piece',
            part_number: data.part_number || null,
            brand: data.brand || null,
            status: 'active',
            description: data.specifications || null,
            size: data.size || null,
            image_url: data.image_url || null,
            alternative_numbers: data.alternative_numbers || null,
            barcode: data.barcode || null,
            category_id: (data.category && data.category.length === 36) ? data.category : null
        };

        const { data: product, error } = await inventoryApi.createProduct(payload);
        if (error) throw error;

        // Initialize stock in default warehouse
        if (product) {
            const { data: warehouses } = await supabase
                .from('warehouses')
                .select('id')
                .eq('company_id', companyId)
                .limit(1);

            if (warehouses && warehouses.length > 0) {
                const warehouse = warehouses[0] as { id: string };
                await inventoryApi.initializeStock({
                    product_id: product.id,
                    warehouse_id: warehouse.id,
                    quantity: Number(data.stock_quantity) || 0
                } as any);
            }
        }

        return product;
    },

    /**
     * Update an existing product
     */
    updateProduct: async (id: string, data: ProductFormData, companyId: string) => {
        logger.debug('ProductService', `Updating product ${id}`, data);

        try {
            const payload: any = {
                name_ar: data.name,
                sale_price: Number(data.selling_price),
                cost_price: Number(data.cost_price),
                purchase_price: Number(data.cost_price),
                min_stock_level: Number(data.min_stock_level),
                unit: data.unit,
            };

            if (data.part_number !== undefined) payload.part_number = data.part_number || null;
            if (data.brand !== undefined) payload.brand = data.brand || null;
            if (data.specifications !== undefined) payload.description = data.specifications || null;
            if (data.size !== undefined) payload.size = data.size || null;
            if (data.image_url !== undefined) payload.image_url = data.image_url || null;
            if (data.alternative_numbers !== undefined) payload.alternative_numbers = data.alternative_numbers || null;
            if (data.barcode !== undefined) payload.barcode = data.barcode || null;
            if (data.category) payload.category_id = data.category.length === 36 ? data.category : null;

            logger.debug('ProductService', `Sending update payload to API`, payload);
            const { data: product, error } = await inventoryApi.updateProduct(id, payload);

            if (error) {
                logger.error('ProductService', `API update failed`, error);
                throw error;
            }

            logger.debug('ProductService', `Product metadata updated successfully`, product);

            // Update stock in default warehouse
            if (data.stock_quantity !== undefined) {
                logger.debug('ProductService', `Checking for default warehouse to update stock`);
                const { data: warehouses, error: whError } = await supabase
                    .from('warehouses')
                    .select('id')
                    .eq('company_id', companyId)
                    .limit(1);

                if (whError) {
                    logger.error('ProductService', `Failed to fetch warehouses`, whError);
                } else if (warehouses && warehouses.length > 0) {
                    const warehouse = warehouses[0] as { id: string };
                    logger.debug('ProductService', `Updating stock in warehouse ${warehouse.id} to ${data.stock_quantity}`);
                    try {
                        await inventoryApi.updateStock(id, warehouse.id, Number(data.stock_quantity));
                        logger.debug('ProductService', `Stock updated successfully`);
                    } catch (stockErr) {
                        logger.error('ProductService', `Failed to update stock, but metadata was saved`, stockErr);
                        // We don't throw here to avoid failing the whole operation if only stock fails
                    }
                } else {
                    logger.warn('ProductService', `No default warehouse found for stock initialization`);
                }
            }

            return product;
        } catch (err: any) {
            logger.error('ProductService', `Critical failure in updateProduct`, err);
            throw err;
        }
    },

    /**
     * Delete a product
     */
    deleteProduct: async (id: string) => {
        const { error } = await inventoryApi.deleteProduct(id);
        if (error) throw error;
    },

    /**
     * Bulk delete products
     */
    bulkDeleteProducts: async (ids: string[]) => {
        const { error } = await inventoryApi.bulkDeleteProducts(ids);
        if (error) throw error;
    },

    /**
     * Get minimal product list (for dropdowns and quick selections)
     */
    getMinimalProducts: async (companyId: string) => {
        const { data, error } = await supabase.from('products')
            .select('id, name_ar, sku, sale_price')
            .eq('company_id', companyId)
            .eq('status', 'active');
        if (error) throw error;
        return (data || []).map((p: { id: string, name_ar: string, sku: string | null, sale_price: number | null }) => ({
            id: p.id,
            name: p.name_ar,
            sku: p.sku,
            selling_price: p.sale_price || 0
        }));
    },

    /**
     * Get item movement history with date filtering and detail resolution
     */
    getItemMovement: async (productId: string, from?: string, to?: string) => {
        const { data, error } = await inventoryApi.getProductMovements(productId, from, to);
        if (error) throw error;

        // Collect Reference IDs to fetch details in bulk
        const invoiceIds = data.filter((m: any) => m.reference_type?.includes('invoice')).map((m: any) => m.reference_id).filter(Boolean);
        const transferIds = data.filter((m: any) => m.reference_type === 'transfer').map((m: any) => m.reference_id).filter(Boolean);

        // Fetch Invoices (for Sales/Purchases)
        let invoices: Record<string, any>[] = [];
        if (invoiceIds.length > 0) {
            const { data: inv } = await supabase.from('invoices').select('id, invoice_number, type, party_id, parties(name)').in('id', invoiceIds);
            invoices = (inv || []) as Record<string, any>[];
        }

        // Fetch Transfers (for Stock Transfers)
        let transfers: Record<string, unknown>[] = [];
        if (transferIds.length > 0) {
            const { data: tr } = await supabase.from('stock_transfers').select('id, from_warehouse_id, to_warehouse_id').in('id', transferIds);
            transfers = (tr || []) as Record<string, unknown>[];
        }

        // Fetch Warehouses for name resolution
        const { data: warehouses } = await supabase.from('warehouses').select('id, name_ar');
        const warehouseMap = new Map((warehouses || []).map((w: { id: string, name_ar: string }) => [w.id, w.name_ar]));

        // 1. Map raw transactions and resolve names
        const movements = (data || []).map((m: Record<string, any>) => {
            let sourceName = '---';
            let docNumber = '---';
            let notes = m.notes || '';
            const dbType = (m.transaction_type || '').trim().toLowerCase();
            const rawQty = Number(m.quantity) || 0;

            // Explicitly determine if it's IN (Positive/Increasing) or OUT (Negative/Decreasing)
            // Purchase, Sales Return, Adj In, Transfer In = IN (+)
            // Sales, Purchase Return, Adj Out, Transfer Out = OUT (-)
            // Fallback: use quantity sign
            const incomingTypes = ['purchase', 'sales_return', 'return_sale', 'adj_in', 'transfer_in', 'initial'];
            const outgoingTypes = ['sales', 'purchase_return', 'return_purchase', 'adj_out', 'transfer_out'];

            let isIncoming = false;
            if (incomingTypes.includes(dbType)) isIncoming = true;
            else if (outgoingTypes.includes(dbType)) isIncoming = false;
            else isIncoming = rawQty > 0; // Final fallback

            if (typeof m.reference_type === 'string' && m.reference_type?.includes('invoice')) {
                const inv = invoices.find(i => i.id === m.reference_id);
                if (inv) {
                    const invType = (inv.type || '').trim().toLowerCase();
                    if (invType === 'sale' || invType === 'sales') docNumber = `فاتورة بيع #${inv.invoice_number}`;
                    else if (invType === 'purchase') docNumber = `فاتورة شراء #${inv.invoice_number}`;
                    else if (invType === 'return_sale' || invType === 'sale_return' || invType === 'sales_return') docNumber = `مردود مبيعات #${inv.invoice_number}`;
                    else if (invType === 'return_purchase' || invType === 'purchase_return') docNumber = `مردود مشتريات #${inv.invoice_number}`;
                    else docNumber = `فاتورة #${inv.invoice_number}`;

                    const party = inv.parties as { name?: string };
                    sourceName = party?.name || '---';
                }
            } else if (m.reference_type === 'transfer') {
                const tr = transfers.find(t => t.id === m.reference_id);
                if (tr) {
                    docNumber = 'مناقلة مخزنية';
                    const fromName = warehouseMap.get(tr.from_warehouse_id as string) || '?';
                    const toName = warehouseMap.get(tr.to_warehouse_id as string) || '?';
                    sourceName = `${fromName} ◄ ${toName}`;
                }
            } else if (m.reference_type === 'audit') {
                docNumber = 'جرد مخزني';
                sourceName = 'تسوية جردية';
            }

            return {
                id: m.id,
                date: m.created_at,
                quantity: Math.abs(rawQty), // UI expects positive quantity, logic handled by transaction_type
                transaction_type: isIncoming ? 'in' : 'out',
                original_type: dbType,
                reference_type: m.reference_type,
                source_user: (m.created_by as { email?: string })?.email || 'System',
                source_name: sourceName,
                document_number: docNumber,
                notes: notes,
                raw_quantity: rawQty // Keep for balance calculation
            };
        });

        // 2. Calculate cumulative balance (Bottom to Top)
        // Since database doesn't store balance_after, we must calculate it manually from the history
        // Sort chronologically (oldest first) to calculate running total
        const sortedMovements = [...movements].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        let currentBalance = 0;
        const movementsWithBalance = sortedMovements.map(m => {
            currentBalance += m.raw_quantity;
            return {
                ...m,
                balance_after: currentBalance
            };
        });

        // 3. Return in original order (newest first)
        return movementsWithBalance.reverse();
    },

    /**
     * Process import file (placeholder for future implementation)
     */
    processImportFile: async (_file: File, _companyId: string, _userId: string) => {
        // Simplified import logic placeholder - in production would use XLSX parsing
        return Promise.resolve();
    },

    /**
     * Get products with similar names to detect potential duplicates
     */
    getSimilarProducts: async (name: string, companyId: string) => {
        const { data, error } = await supabase.rpc('get_similar_products', {
            p_name: name,
            p_company_id: companyId
        } as never);
        if (error) throw error;
        return data || [];
    },

    /**
     * Get all potential duplicate pairs in the company inventory
     */
    getPotentialDuplicates: async (companyId: string) => {
        const { data, error } = await supabase.rpc('get_potential_duplicates', {
            p_company_id: companyId
        } as never);
        if (error) throw error;
        return data || [];
    }
};

export default productService;
