// ============================================
// Statement Excel Exporter
// Professional styled Excel export for party statements
// ============================================

import * as _XLSX from 'xlsx-js-style';
const XLSX = _XLSX as any;

interface CompanyInfo {
    name_ar: string;
    address?: string;
    phone?: string;
    tax_number?: string;
    logo_url?: string;
}

interface StatementEntry {
    date: string;
    operation_type?: string;
    desc: string;
    debit: number;
    credit: number;
    balance: number;
}

export const exportStatementToExcel = (
    company: CompanyInfo,
    partyName: string,
    entries: StatementEntry[]
) => {
    const wb = XLSX.utils.book_new();
    const rows: any[][] = [];

    // --- Header Section ---
    // Row 1: Company Name
    rows.push([company.name_ar]);
    // Row 2: Company Address & Phone
    rows.push([`${company.address || ''} | هاتف: ${company.phone || ''}`]);
    // Row 3: Tax Number
    rows.push([`الرقم الضريبي: ${company.tax_number || '---'}`]);
    // Spacer
    rows.push([]);
    // Row 5: Title
    rows.push([`كشف حساب: ${partyName}`]);
    // Row 6: Export Date
    rows.push([`تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-EG')}`]);
    // Spacer
    rows.push([]);

    // --- Table Header ---
    const tableHeader = ['التاريخ', 'نوع العملية', 'البيان', 'مدين', 'دائن', 'الرصيد'];
    rows.push(tableHeader);

    // --- Data Rows ---
    entries.forEach(entry => {
        rows.push([
            entry.date,
            entry.operation_type || 'قيد محاسبي',
            entry.desc,
            entry.debit || '-',
            entry.credit || '-',
            entry.balance
        ]);
    });

    // --- Footer Summary ---
    rows.push([]);
    const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0);
    const finalBalance = entries[entries.length - 1]?.balance || 0;

    rows.push(['', '', 'الإجمالي', totalDebit, totalCredit, finalBalance]);

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // --- Styling ---
    // Column Widths
    ws['!cols'] = [
        { wch: 15 }, // Date
        { wch: 20 }, // Operation Type
        { wch: 40 }, // Description
        { wch: 15 }, // Debit
        { wch: 15 }, // Credit
        { wch: 15 }, // Balance
    ];

    // Merges for Header
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Company Name
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Info
        { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } }, // Tax
        { s: { r: 4, c: 0 }, e: { r: 4, c: 5 } }, // Title
        { s: { r: 5, c: 0 }, e: { r: 5, c: 5 } }, // Export Date
    ];

    // Apply styles to all cells
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:F1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellRef]) continue;

            // Default border for all cells
            ws[cellRef].s = {
                border: {
                    top: { style: 'thin', color: { rgb: '000000' } },
                    bottom: { style: 'thin', color: { rgb: '000000' } },
                    left: { style: 'thin', color: { rgb: '000000' } },
                    right: { style: 'thin', color: { rgb: '000000' } }
                },
                alignment: { horizontal: 'center', vertical: 'center' }
            };

            // Header (Company Name)
            if (R === 0) {
                ws[cellRef].s.font = { bold: true, size: 16 };
            }
            // Sub-headers
            if (R >= 1 && R <= 5) {
                ws[cellRef].s.font = { bold: true };
            }
            // Table Header styling
            if (R === 7) {
                ws[cellRef].s.fill = { fgColor: { rgb: 'F2F2F2' } };
                ws[cellRef].s.font = { bold: true };
            }
            // Footer summary
            if (R === rows.length - 1) {
                ws[cellRef].s.fill = { fgColor: { rgb: 'EBF1DE' } };
                ws[cellRef].s.font = { bold: true };
            }
        }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'كشف الحساب');

    // RTL and Sheet direction
    if (!ws['!props']) ws['!props'] = {};
    ws['!view'] = [{ RTL: true }];

    XLSX.writeFile(wb, `كشف_حساب_${partyName}_${new Date().toISOString().split('T')[0]}.xlsx`);
};
