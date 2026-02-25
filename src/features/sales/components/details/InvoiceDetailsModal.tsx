
import React, { useState } from 'react';
import { X, FileText, Loader2, Download, Printer, Share2, FileSpreadsheet } from 'lucide-react';
import ShareButton from '../../../../ui/common/ShareButton';
import { formatCurrency as shareFmtCur } from '../../../../core/utils';
import { useInvoiceDetails } from '../../hooks';
import Modal from '../../../../ui/base/Modal';
import { formatCurrency, formatNumberDisplay } from '../../../../core/utils';
import { exportToPDF } from '../../../../core/utils/pdfExporter';
import { exportInvoiceToExcel } from '../../../../core/utils/invoiceExcelExporter';
import PrintableInvoice from '../PrintableInvoice';
import { useCompany } from '../../../settings/hooks';
import { useAuthStore } from '../../../auth/store';
import InvoiceHealthBadge from './InvoiceHealthBadge';

interface Props {
  invoiceId: string | null;
  onClose: () => void;
}

const InvoiceDetailsModal: React.FC<Props> = ({ invoiceId, onClose }) => {
  const { data: invoice, isLoading } = useInvoiceDetails(invoiceId);
  const { data: company } = useCompany();
  const { user } = useAuthStore();
  const [isExporting, setIsExporting] = useState(false);

  const printRef = React.useRef<HTMLDivElement>(null);

  const issuedByName = user?.full_name || user?.email || 'غير محدد';

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      await exportToPDF(printRef.current, `فاتورة-${invoice?.invoice_number}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    if (!invoice || !company) return;
    exportInvoiceToExcel({
      companyName: company.name || 'الزهراء سمارت',
      companyAddress: company.address,
      taxNumber: company.tax_number,
      invoiceNumber: invoice.invoice_number,
      issueDate: invoice.issue_date,
      customerName: invoice.parties?.name || 'عميل نقدي',
      issuedBy: issuedByName,
      items: (invoice.invoice_items || []).map((i: any) => ({
        name: i.description || i.name || '---',
        quantity: i.quantity,
        unitPrice: i.unit_price,
        total: i.total,
      })),
      subtotal: invoice.subtotal || (invoice.total_amount - invoice.tax_amount),
      taxAmount: invoice.tax_amount || 0,
      totalAmount: invoice.total_amount,
    });
  };

  // Prepare full data for PrintableInvoice
  const fullInvoiceData = invoice && company ? {
    ...invoice,
    company,
    party_name: invoice.parties?.name,
    issuedBy: issuedByName,
    items: invoice.invoice_items.map((i: any) => ({
      ...i,
      name: i.description,
      price: i.unit_price
    }))
  } : null;

  return (
    <Modal
      isOpen={!!invoiceId}
      onClose={onClose}
      icon={FileText}
      title={`تفاصيل الفاتورة #${invoice?.invoice_number || ''}`}
      description="عرض تفصيلي لعملية البيع المسجلة"
      footer={
        <div className="flex gap-2 w-full">
          <button onClick={onClose} className="flex-1 py-3 text-sm font-bold bg-gray-100 dark:bg-slate-800 rounded-lg uppercase tracking-widest text-gray-600 dark:text-slate-400">إغلاق</button>
          {fullInvoiceData && (
            <>
              <ShareButton
                size="md"
                showLabel
                elementRef={printRef as React.RefObject<HTMLElement>}
                title={`مشاركة فاتورة #${invoice?.invoice_number}`}
                eventType="sale_invoice"
                message={`🧾 فاتورة بيع #${invoice?.invoice_number}\n━━━━━━━━━━━━━━\n👤 العميل: ${invoice?.parties?.name || 'عميل نقدي'}\n💰 الإجمالي: ${shareFmtCur(invoice?.total_amount || 0)}\n📅 التاريخ: ${invoice?.issue_date}\n📦 عدد الأصناف: ${invoice?.invoice_items?.length || 0}\n👨‍💼 صدرت بواسطة: ${issuedByName}`}
              />
              <button
                onClick={handleExportExcel}
                className="flex-1 py-3 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-colors"
              >
                <FileSpreadsheet size={18} />
                Excel
              </button>
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex-[2] py-3 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-colors"
              >
                {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                تصدير PDF
              </button>
            </>
          )}
        </div>
      }
    >
      {isLoading ? (
        <div className="p-20 text-center flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>
      ) : invoice ? (
        <>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg"><strong>العميل:</strong> {invoice.parties?.name || 'عميل نقدي'}</div>
              <div className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg"><strong>التاريخ:</strong> {invoice.issue_date}</div>
              <div className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg"><strong>الحالة:</strong> {invoice.status}</div>
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-300"><strong>صدرت بواسطة:</strong> {issuedByName}</div>
            </div>
            {/* AI Health Check */}
            <div className="flex items-center gap-2">
              <InvoiceHealthBadge invoice={{
                number: invoice.invoice_number,
                total: invoice.total_amount,
                itemCount: invoice.invoice_items?.length || 0,
                customerName: invoice.parties?.name || 'عميل نقدي',
                customerDebt: 0,
                avgInvoiceTotal: invoice.total_amount,
              }} />
            </div>
            <table className="w-full text-sm">
              <thead className="border-b-2 border-black dark:border-slate-700"><tr className="bg-gray-100 dark:bg-slate-800"><th className="p-2 font-bold">الصنف</th><th className="p-2 font-bold">الكمية</th><th className="p-2 font-bold">السعر</th><th className="p-2 font-bold">الإجمالي</th></tr></thead>
              <tbody>
                {invoice.invoice_items?.map((item: any) => (
                  <tr key={item.id} className="border-b dark:border-slate-800">
                    <td className="p-2 font-bold">{item.description}</td>
                    <td className="p-2 text-center">{formatNumberDisplay(item.quantity)}</td>
                    <td className="p-2 text-left font-mono">{formatCurrency(item.unit_price)}</td>
                    <td className="p-2 text-left font-bold font-mono">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end pt-4">
              <div className="w-64 space-y-2">
                <div className="flex justify-between font-bold"><span>المجموع:</span> <span dir="ltr" className="font-mono">{formatCurrency(invoice.subtotal)}</span></div>
                <div className="flex justify-between font-bold"><span>الضريبة:</span> <span dir="ltr" className="font-mono">{formatCurrency(invoice.tax_amount)}</span></div>
                <div className="flex justify-between text-lg font-black bg-blue-600 text-white p-2"><span>الإجمالي:</span> <span dir="ltr" className="font-mono">{formatCurrency(invoice.total_amount)}</span></div>
              </div>
            </div>
          </div>

          {/* Hidden Printable Area for PDF Generation */}
          <div ref={printRef} className="absolute top-0 left-0 w-full z-[-1] opacity-0 pointer-events-none">
            {fullInvoiceData && <PrintableInvoice invoice={fullInvoiceData} />}
          </div>
        </>
      ) : null}
    </Modal>
  );
};

export default InvoiceDetailsModal;

