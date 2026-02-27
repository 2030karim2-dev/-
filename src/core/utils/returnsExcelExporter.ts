// ============================================
// Returns Excel Exporter
// Export returns data to Excel with professional styling
// ============================================

import * as XLSX from 'xlsx';

interface ReturnExcelData {
    companyName: string;
    returns: {
        invoiceNumber: string;
        issueDate: string;
        customerName: string;
        supplierName?: string;
        referenceInvoice?: string;
        returnReason?: string;
        items: number;
        totalAmount: number;
        status: string;
        notes?: string;
    }[];
    summary: {
        totalReturns: number;
        totalAmount: number;
        averageAmount: number;
        count: number;
    };
    type: 'sales' | 'purchase';
}

// Helper to get Arabic status
const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
        'draft': 'مسودة',
        'posted': 'معتمد',
        'paid': 'مدفوع',
        'cancelled': 'ملغي'
    };
    return statusMap[status] || status;
};

// Helper to get Arabic return reason
const getReturnReasonText = (reason: string): string => {
    const reasonMap: Record<string, string> = {
        'defective': 'منتج تالف',
        'not_as_described': 'غير مطابق للمواصفات',
        'wrong_item': 'صنف خاطئ',
        'quality_issue': 'مشكلة في الجودة',
        'changed_mind': 'تغيير رأي العميل',
        'expired': 'منتج منتهي الصلاحية',
        'other': 'أخرى'
    };
    return reasonMap[reason] || reason || '-';
};

export const exportReturnsToExcel = (data: ReturnExcelData) => {
    const wb = XLSX.utils.book_new();

    const isSales = data.type === 'sales';
    const title = isSales ? 'مرتجعات المبيعات' : 'مرتجعات المشتريات';
    const partyTitle = isSales ? 'العميل' : 'المورد';

    // Build rows manually for full control
    const rows: any[][] = [];

    // Row 1: Company Name (centered header)
    rows.push([data.companyName]);
    // Row 2: Report title
    rows.push([title]);
    // Row 3: Empty spacer
    rows.push([]);
    // Row 4: Date generated
    rows.push(['تاريخ التقرير:', new Date().toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })]);
    // Row 5: Empty spacer
    rows.push([]);

    // Table headers
    rows.push([
        '#',
        'رقم المرتجع',
        'التاريخ',
        partyTitle,
        'فاتورة مرجعية',
        'سبب الإرجاع',
        'عدد الأصناف',
        'المبلغ',
        'الحالة',
        'ملاحظات'
    ]);

    // Data rows
    data.returns.forEach((item, i) => {
        rows.push([
            i + 1,
            item.invoiceNumber,
            item.issueDate,
            item.customerName || item.supplierName || '-',
            item.referenceInvoice || '-',
            getReturnReasonText(item.returnReason || ''),
            item.items,
            item.totalAmount,
            getStatusText(item.status),
            item.notes || '-'
        ]);
    });

    // Empty spacer
    rows.push([]);

    // Summary section
    rows.push(['ملخص الإحصائيات']);
    rows.push(['إجمالي عدد المرتجعات:', data.summary.count]);
    rows.push(['إجمالي المبالغ المرتجعة:', data.summary.totalAmount.toFixed(2)]);
    rows.push(['متوسط قيمة المرتجع:', data.summary.averageAmount.toFixed(2)]);

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Set column widths
    ws['!cols'] = [
        { wch: 5 },   // #
        { wch: 18 },  // Invoice Number
        { wch: 12 },  // Date
        { wch: 25 },  // Customer/Supplier
        { wch: 18 },  // Reference Invoice
        { wch: 18 },  // Reason
        { wch: 10 },  // Items count
        { wch: 15 },  // Amount
        { wch: 12 },  // Status
        { wch: 30 },  // Notes
    ];

    // Merge cells for headers
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }, // Company name
        { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } }, // Title
    ];

    const sheetName = isSales ? 'مرتجعات المبيعات' : 'مرتجعات المشتريات';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Download
    const fileName = `${title}_${new Date().toISOString().split('T')[0]}`;
    XLSX.writeFile(wb, `${fileName}.xlsx`);
};

// Export single return to Excel (detailed)
export const exportSingleReturnToExcel = (data: {
    companyName: string;
    companyAddress?: string;
    taxNumber?: string;
    invoiceNumber: string;
    issueDate: string;
    customerName: string;
    supplierName?: string;
    referenceInvoice?: string;
    returnReason?: string;
    issuedBy: string;
    status: string;
    items: {
        name: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }[];
    subtotal: number;
    notes?: string;
    type: 'sales' | 'purchase';
}) => {
    const wb = XLSX.utils.book_new();

    const isSales = data.type === 'sales';
    const title = isSales ? 'مرتجع مبيعات' : 'مرتجع مشتريات';
    const partyTitle = isSales ? 'العميل' : 'المورد';
    const partyName = isSales ? data.customerName : data.supplierName || '';

    // Build rows
    const rows: any[][] = [];

    // Header section
    rows.push([data.companyName]);
    rows.push([`${data.companyAddress || ''} | الرقم الضريبي: ${data.taxNumber || '---'}`]);
    rows.push([]);
    rows.push([`${title} رقم: ${data.invoiceNumber}`]);
    rows.push([]);

    // Meta info
    rows.push([`${partyTitle}:`, partyName, '', 'رقم المرتجع:', data.invoiceNumber]);
    rows.push(['التاريخ:', data.issueDate, '', 'الحالة:', getStatusText(data.status)]);
    if (data.referenceInvoice) {
        rows.push(['الفاتورة المرجعية:', data.referenceInvoice, '', 'سبب الإرجاع:', getReturnReasonText(data.returnReason || '')]);
    } else if (data.returnReason) {
        rows.push(['', '', '', 'سبب الإرجاع:', getReturnReasonText(data.returnReason)]);
    }
    rows.push(['صدرت بواسطة:', data.issuedBy]);
    rows.push([]);

    // Table header
    rows.push(['#', 'وصف الصنف', 'الكمية', 'سعر الوحدة', 'الإجمالي']);

    // Items
    data.items.forEach((item, i) => {
        rows.push([
            i + 1,
            item.name,
            item.quantity,
            item.unitPrice,
            item.total
        ]);
    });

    rows.push([]);

    // Totals
    rows.push(['', '', '', 'المجموع:', data.subtotal]);

    if (data.notes) {
        rows.push(['ملاحظات:', data.notes]);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Set column widths
    ws['!cols'] = [
        { wch: 5 },   // #
        { wch: 40 },  // Description
        { wch: 12 },  // Quantity
        { wch: 15 },  // Unit Price
        { wch: 15 },  // Total
    ];

    // Merge cells for headers
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Company name
        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // Address
        { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } }, // Title
    ];

    const sheetName = isSales ? 'مرتجع مبيعات' : 'مرتجع مشتريات';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Download
    XLSX.writeFile(wb, `${title}_${data.invoiceNumber}.xlsx`);
};
