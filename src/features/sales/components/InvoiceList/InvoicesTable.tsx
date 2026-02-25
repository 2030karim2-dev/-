// ============================================
// Invoices Table Component
// Table view of all invoices
// ============================================

import React from 'react';
import { Eye, FileText, Download, MoreVertical } from 'lucide-react';
import { InvoiceListItem } from '../../types';

interface InvoicesTableProps {
    invoices: InvoiceListItem[];
    onViewInvoice?: (invoice: InvoiceListItem) => void;
    onPrintInvoice?: (invoice: InvoiceListItem) => void;
    isLoading?: boolean;
}

const InvoicesTable: React.FC<InvoicesTableProps> = ({
    invoices,
    onViewInvoice,
    onPrintInvoice,
    isLoading,
}) => {
    if (isLoading) {
        return (
            <div className="animate-pulse">
                <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded mb-4" />
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 dark:bg-slate-800 rounded mb-2" />
                ))}
            </div>
        );
    }

    if (invoices.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p>لا توجد فواتير</p>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-600',
            pending: 'bg-yellow-100 text-yellow-600',
            confirmed: 'bg-blue-100 text-blue-600',
            paid: 'bg-green-100 text-green-600',
            cancelled: 'bg-red-100 text-red-600',
        };
        return colors[status] || colors.draft;
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            draft: 'مسودة',
            pending: 'معلق',
            confirmed: 'مؤكد',
            paid: 'مدفوع',
            cancelled: 'ملغي',
        };
        return labels[status] || status;
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-800">
                    <tr>
                        <th className="p-4 text-right text-sm font-medium text-gray-500">رقم الفاتورة</th>
                        <th className="p-4 text-right text-sm font-medium text-gray-500">العميل</th>
                        <th className="p-4 text-right text-sm font-medium text-gray-500">التاريخ</th>
                        <th className="p-4 text-right text-sm font-medium text-gray-500">المبلغ (الأساسي)</th>
                        <th className="p-4 text-right text-sm font-medium text-gray-500">الحالة</th>
                        <th className="p-4 text-right text-sm font-medium text-gray-500">طريقة الدفع</th>
                        <th className="p-4 text-right text-sm font-medium text-gray-500">عدد العناصر</th>
                        <th className="p-4 text-right text-sm font-medium text-gray-500"></th>
                    </tr>
                </thead>
                <tbody>
                    {invoices.map((invoice) => (
                        <tr
                            key={invoice.id}
                            className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                        >
                            <td className="p-4">
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {invoice.invoiceNumber}
                                </span>
                            </td>
                            <td className="p-4 text-gray-600 dark:text-slate-300">
                                {invoice.customerName || 'نقدي'}
                            </td>
                            <td className="p-4 text-gray-600 dark:text-slate-300">
                                {new Date(invoice.date).toLocaleDateString('ar-SA')}
                            </td>
                            <td className="p-4">
                                <div className="flex flex-col">
                                    <span dir="ltr" className="font-medium text-gray-900 dark:text-white text-right">
                                        {invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs text-gray-500 ml-1">{invoice.currencyCode}</span>
                                    </span>
                                    {invoice.currencyCode !== 'SAR' && (
                                        <span dir="ltr" className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5 text-right">
                                            {invoice.baseTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-[10px] ml-1">SAR</span>
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                                    {getStatusLabel(invoice.status)}
                                </span>
                            </td>
                            <td className="p-4 text-gray-600 dark:text-slate-300">
                                {invoice.paymentMethod === 'cash' ? 'نقدي' : invoice.paymentMethod === 'card' ? 'بطاقة' : 'تحويل بنكي'}
                            </td>
                            <td className="p-4 text-gray-600 dark:text-slate-300">
                                {invoice.itemCount}
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onViewInvoice?.(invoice)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                        title="عرض"
                                    >
                                        <Eye size={18} />
                                    </button>
                                    <button
                                        onClick={() => onPrintInvoice?.(invoice)}
                                        className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
                                        title="طباعة"
                                    >
                                        <Download size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default InvoicesTable;
