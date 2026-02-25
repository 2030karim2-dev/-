// ============================================
// Invoice Excel Exporter
// Professional styled Excel export for invoices
// ============================================

import * as XLSX from 'xlsx';

interface InvoiceExcelData {
    companyName: string;
    companyAddress?: string;
    taxNumber?: string;
    invoiceNumber: string;
    issueDate: string;
    customerName: string;
    issuedBy: string;
    items: {
        name: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }[];
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
}

export const exportInvoiceToExcel = (data: InvoiceExcelData) => {
    const wb = XLSX.utils.book_new();

    // Build rows manually for full control
    const rows: any[][] = [];

    // Row 1: Company Name (centered header)
    rows.push([data.companyName]);
    // Row 2: Address & Tax Number
    rows.push([`${data.companyAddress || ''} | الرقم الضريبي: ${data.taxNumber || '---'}`]);
    // Row 3: Empty spacer
    rows.push([]);
    // Row 4: Invoice title
    rows.push([`فاتورة بيع رقم: ${data.invoiceNumber}`]);
    // Row 5: Empty spacer
    rows.push([]);
    // Row 6-8: Meta info
    rows.push(['العميل:', data.customerName, '', 'رقم الفاتورة:', data.invoiceNumber]);
    rows.push(['التاريخ:', data.issueDate, '', 'صدرت بواسطة:', data.issuedBy]);
    // Row 9: Empty spacer
    rows.push([]);
    // Row 10: Table header
    rows.push(['#', 'وصف السلعة / الخدمة', 'الكمية', 'سعر الوحدة', 'الإجمالي']);
    // Data rows
    data.items.forEach((item, i) => {
        rows.push([
            i + 1,
            item.name,
            item.quantity,
            item.unitPrice,
            item.total
        ]);
    });
    // Empty spacer
    rows.push([]);
    // Totals
    rows.push(['', '', '', 'المجموع الفرعي:', data.subtotal]);
    rows.push(['', '', '', 'ضريبة القيمة المضافة (15%):', data.taxAmount]);
    rows.push(['', '', '', 'الإجمالي المستحق:', data.totalAmount]);

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Set column widths
    ws['!cols'] = [
        { wch: 5 },   // #
        { wch: 40 },  // Description
        { wch: 12 },  // Quantity
        { wch: 18 },  // Unit Price
        { wch: 18 },  // Total
    ];

    // Merge cells for headers
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Company name
        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // Address
        { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } }, // Invoice title
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'فاتورة');

    // Download
    XLSX.writeFile(wb, `فاتورة_${data.invoiceNumber}.xlsx`);
};
