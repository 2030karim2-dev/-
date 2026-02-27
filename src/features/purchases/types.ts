
export interface PurchaseStats {
  invoiceCount: number;
  totalPurchases: number;
  pendingPaymentCount: number;
  totalDebt: number;
}

export interface PurchaseItem {
  productId: string;
  name: string;
  sku: string;
  partNumber: string;
  brand: string;
  quantity: number;
  costPrice: number; // سعر الشراء (قد يختلف عن المسجل في النظام)
  taxRate: number;
  total: number;
}

export interface CreatePurchaseDTO {
  supplierId: string | null;
  invoiceNumber: string; // رقم فاتورة المورد المرجعي
  items: PurchaseItem[];
  issueDate: string;
  dueDate?: string;
  notes?: string;
  status: 'draft' | 'posted';
  paymentMethod: 'cash' | 'credit';
  cashAccountId?: string;
  currency?: string;
  exchangeRate?: number;
  // Return-specific fields
  referenceInvoiceId?: string | null;
  returnReason?: string | null;
}

export interface CreatePaymentDTO {
  supplierId: string;
  amount: number;
  date: string;
  method: 'cash' | 'bank';
  reference?: string;
  notes?: string;
  currencyCode?: string;
  exchangeRate?: number;
  foreignAmount?: number;
}
