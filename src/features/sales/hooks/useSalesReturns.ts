// ============================================
// Sales Returns Hook
// Custom hooks for managing sales returns data
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import { useAuthStore } from '../../auth/store';
import { useFeedbackStore } from '../../feedback/store';

interface SalesReturn {
    id: string;
    invoice_number: string;
    issue_date: string;
    total_amount: number;
    status: 'draft' | 'posted' | 'paid';
    notes?: string;
    party?: {
        id: string;
        name: string;
    };
    invoice_items?: any[];
    created_at: string;
}

interface SalesReturnsStats {
    returnCount: number;
    totalReturns: number;
    avgReturn: number;
    pendingCount: number;
}

// Fetch all sales returns with optional filters
export const useSalesReturns = (filters?: {
    searchTerm?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
}) => {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ['sales-returns', filters],
        queryFn: async () => {
            if (!user?.company_id) return [];

            let query = (supabase
                .from('invoices') as any)
                .select(`
          id,
          invoice_number,
          issue_date,
          total_amount,
          status,
          notes,
          party:party_id(id, name),
          invoice_items:invoice_items(
            id,
            product_id,
            description,
            quantity,
            unit_price,
            total
          ),
          created_at
        `)
                .eq('company_id', user.company_id)
                .eq('type', 'return_sale')
                .is('deleted_at', null)
                .order('issue_date', { ascending: false });

            if (filters?.status) {
                query = query.eq('status', filters.status);
            }

            if (filters?.startDate) {
                query = query.gte('issue_date', filters.startDate);
            }

            if (filters?.endDate) {
                query = query.lte('issue_date', filters.endDate);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Client-side search filtering
            let returns = data || [];

            if (filters?.searchTerm) {
                const term = filters.searchTerm.toLowerCase();
                returns = returns.filter((r: any) =>
                    (r.invoice_number || '').toLowerCase().includes(term) ||
                    (r.party?.name || '').toLowerCase().includes(term) ||
                    (r.notes || '').toLowerCase().includes(term)
                );
            }

            return returns as SalesReturn[];
        },
        enabled: !!user?.company_id,
    });
};

// Fetch sales returns statistics
export const useSalesReturnsStats = () => {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ['sales-returns-stats'],
        queryFn: async () => {
            if (!user?.company_id) {
                return { returnCount: 0, totalReturns: 0, avgReturn: 0, pendingCount: 0 };
            }

            const { data, error } = await (supabase
                .from('invoices') as any)
                .select('id, total_amount, status')
                .eq('company_id', user.company_id)
                .eq('type', 'return_sale')
                .is('deleted_at', null);

            if (error) throw error;

            const returns = data || [];
            const returnCount = returns.length;
            const totalReturns = returns.reduce((sum: number, r: any) => sum + (Number(r.total_amount) || 0), 0);
            const avgReturn = returnCount > 0 ? totalReturns / returnCount : 0;
            const pendingCount = returns.filter((r: any) => r.status === 'draft' || r.status === 'posted').length;

            return {
                returnCount,
                totalReturns,
                avgReturn,
                pendingCount
            } as SalesReturnsStats;
        },
        enabled: !!user?.company_id,
    });
};

// Create a new sales return
export const useCreateSalesReturn = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const { showToast } = useFeedbackStore();

    return useMutation({
        mutationFn: async (data: any) => {
            if (!user?.company_id || !user?.id) {
                throw new Error('Missing authentication context');
            }

            // Get the next invoice number
            const { data: countData } = await (supabase
                .from('invoices') as any)
                .select('id', { count: 'exact', head: true })
                .eq('company_id', user.company_id)
                .eq('type', 'return_sale');

            const invoiceNumber = `RET-${String((countData?.length || 0) + 1).padStart(5, '0')}`;

            // Create the return invoice
            const { data: invoice, error: invoiceError } = await (supabase
                .from('invoices') as any)
                .insert({
                    company_id: user.company_id,
                    invoice_number: invoiceNumber,
                    type: 'return_sale',
                    status: data.status || 'posted',
                    party_id: data.partyId,
                    issue_date: data.issueDate || new Date().toISOString().split('T')[0],
                    due_date: data.issueDate || new Date().toISOString().split('T')[0],
                    total_amount: data.items.reduce((sum: number, item: any) => sum + (item.quantity * (item.unitPrice || item.unitCost || 0)), 0),
                    subtotal: data.items.reduce((sum: number, item: any) => sum + (item.quantity * (item.unitPrice || item.unitCost || 0)), 0),
                    tax_amount: 0,
                    discount_amount: 0,
                    notes: data.notes,
                    payment_method: data.paymentMethod || 'cash',
                    currency: data.currency || 'SAR',
                    exchange_rate: data.exchangeRate || 1,
                    reference_invoice_id: data.referenceInvoiceId || null,
                    return_reason: data.returnReason || null,
                    created_by: user.id,
                })
                .select()
                .single();

            if (invoiceError) throw invoiceError;

            // Create invoice items
            const itemsToInsert = data.items.map((item: any) => ({
                invoice_id: invoice.id,
                product_id: item.productId || null,
                description: item.name,
                quantity: item.quantity,
                unit_price: item.unitPrice || item.unitCost || 0,
                total: item.quantity * (item.unitPrice || item.unitCost || 0),
                cost_price: item.costPrice || 0,
                tax_rate: item.taxRate || 0,
            }));

            const { error: itemsError } = await (supabase
                .from('invoice_items') as any)
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;

            // If status is posted, process the return (reverse inventory)
            if (data.status === 'posted') {
                // Update inventory quantities
                for (const item of data.items) {
                    if (item.productId) {
                        const { data: product } = await (supabase
                            .from('products') as any)
                            .select('quantity')
                            .eq('id', item.productId)
                            .single();

                        if (product) {
                            await (supabase
                                .from('products') as any)
                                .update({ quantity: (product.quantity || 0) + item.quantity })
                                .eq('id', item.productId);
                        }
                    }
                }

                // Create journal entry for the return
                const { data: company } = await (supabase
                    .from('companies') as any)
                    .select('default_currency')
                    .eq('id', user.company_id)
                    .single();

                const journalEntry = {
                    company_id: user.company_id,
                    entry_number: `JE-${Date.now()}`,
                    issue_date: new Date().toISOString().split('T')[0],
                    description: `مرتجع مبيعات - ${invoiceNumber}`,
                    debit_account_id: null, // Will be set by system
                    credit_account_id: null, // Will be set by system
                    amount: invoice.total_amount,
                    currency: company?.default_currency || 'SAR',
                    exchange_rate: 1,
                    status: 'posted',
                    reference_type: 'invoice',
                    reference_id: invoice.id,
                    created_by: user.id,
                };

                await (supabase.from('journal_entries') as any).insert(journalEntry);
            }

            return invoice;
        },
        onSuccess: (invoice) => {
            showToast(`تم إنشاء مرتجع المبيعات #${invoice.invoice_number} بنجاح`, 'success');
            queryClient.invalidateQueries({ queryKey: ['sales-returns'] });
            queryClient.invalidateQueries({ queryKey: ['sales-returns-stats'] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
        onError: (error: Error) => {
            showToast(error.message || 'فشل في إنشاء مرتجع المبيعات', 'error');
        }
    });
};

// Fetch sales invoices for return selection
export const useSalesInvoicesForReturn = (customerId?: string | null) => {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ['sales-invoices-for-return', customerId],
        queryFn: async () => {
            if (!user?.company_id) return [];

            let query = (supabase
                .from('invoices') as any)
                .select(`
          id,
          invoice_number,
          issue_date,
          total_amount,
          party:party_id(id, name),
          invoice_items(id, product_id, description, quantity, unit_price, total)
        `)
                .eq('company_id', user.company_id)
                .eq('type', 'sale')
                .eq('status', 'posted')
                .is('deleted_at', null)
                .order('issue_date', { ascending: false })
                .limit(100);

            if (customerId) {
                query = query.eq('party_id', customerId);
            }

            const { data, error } = await query;

            if (error) throw error;

            return data || [];
        },
        enabled: !!user?.company_id,
    });
};
