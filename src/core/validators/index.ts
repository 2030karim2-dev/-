/**
 * Core Validators - Barrel Export
 * Re-exports all Zod validation schemas
 */

export * from './accounting';
export * from './expenses';

// Import reusable schemas
import { z } from 'zod';

// Common validation schemas
export const uuidSchema = z.string().uuid('معرف غير صالح');

export const emailSchema = z.string().email('بريد إلكتروني غير صالح');

export const phoneSchema = z.string().regex(
    /^\+?[0-9]{10,15}$/,
    'رقم هاتف غير صالح'
);

export const passwordSchema = z.string()
    .min(8, '8 أحرف على الأقل')
    .regex(/[A-Z]/, 'حرف كبير واحد على الأقل')
    .regex(/[a-z]/, 'حرف صغير واحد على الأقل')
    .regex(/[0-9]/, 'رقم واحد على الأقل')
    .regex(/[!@#$%^&*]/, 'رمز خاص واحد على الأقل');

export const positiveNumberSchema = z.number().positive('يجب أن يكون رقم موجب');

export const nonNegativeNumberSchema = z.number().nonnegative('يجب أن يكون رقم غير سالب');

export const dateSchema = z.string().datetime('تاريخ غير صالح');

export const dateRangeSchema = z.object({
    from: dateSchema,
    to: dateSchema,
});

export const paginationSchema = z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
});

export const searchQuerySchema = z.string().min(1, 'استعلام البحث مطلوب').max(100);

export const idParamSchema = z.object({
    id: uuidSchema,
});

// Currency schemas
export const currencyAmountSchema = z.object({
    amount: nonNegativeNumberSchema,
    currency: z.string().length(3, 'رمز عملة مكون من 3 أحرف'),
});

// Invoice item schema
export const invoiceItemSchema = z.object({
    id: uuidSchema.optional(),
    product_id: uuidSchema,
    name: z.string().min(1, 'اسم الصنف مطلوب'),
    quantity: positiveNumberSchema,
    unit_price: nonNegativeNumberSchema,
    discount: nonNegativeNumberSchema.default(0),
    tax_rate: z.number().min(0).max(100).default(15),
});

// Invoice schema
export const invoiceSchema = z.object({
    party_id: uuidSchema.optional(),
    type: z.enum(['sale', 'purchase', 'return_sale', 'return_purchase']),
    payment_method: z.enum(['cash', 'card', 'transfer', 'credit']),
    currency: z.string().length(3).default('SAR'),
    items: z.array(invoiceItemSchema).min(1, 'صنف واحد على الأقل'),
    notes: z.string().optional(),
});

// Journal entry schema
export const journalEntrySchema = z.object({
    date: dateSchema,
    description: z.string().min(1, 'الوصف مطلوب'),
    reference: z.string().optional(),
    lines: z.array(z.object({
        account_id: uuidSchema,
        debit_amount: nonNegativeNumberSchema.default(0),
        credit_amount: nonNegativeNumberSchema.default(0),
    })).min(2, 'قيد يومية يتطلب سطرين على الأقل'),
});

// Product schema
export const productSchema = z.object({
    name: z.string().min(1, 'اسم الصنف مطلوب'),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    category_id: uuidSchema.optional(),
    cost_price: nonNegativeNumberSchema.default(0),
    sell_price: nonNegativeNumberSchema.default(0),
    stock_quantity: z.number().int().nonnegative().default(0),
    min_stock_level: z.number().int().nonnegative().default(5),
});

// Customer/Supplier schema
export const partySchema = z.object({
    name: z.string().min(1, 'الاسم مطلوب'),
    phone: phoneSchema.optional(),
    email: emailSchema.optional(),
    address: z.string().optional(),
    tax_number: z.string().optional(),
    category: z.string().optional(),
});

// Export types from schemas
export type UUIDSchema = z.infer<typeof uuidSchema>;
export type EmailSchema = z.infer<typeof emailSchema>;
export type PhoneSchema = z.infer<typeof phoneSchema>;
export type PasswordSchema = z.infer<typeof passwordSchema>;
export type PositiveNumber = z.infer<typeof positiveNumberSchema>;
export type NonNegativeNumber = z.infer<typeof nonNegativeNumberSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
export type JournalEntry = z.infer<typeof journalEntrySchema>;
export type Product = z.infer<typeof productSchema>;
export type Party = z.infer<typeof partySchema>;
