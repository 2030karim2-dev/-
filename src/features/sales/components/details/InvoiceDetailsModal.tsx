
import React, { useState, useMemo } from 'react';
import { X, FileText, Loader2, Download, Printer, Share2, FileSpreadsheet, Building2, Phone, MapPin, User, RotateCcw, AlertTriangle, DollarSign, CreditCard, CheckCircle, Clock } from 'lucide-react';
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
import { useFeedbackStore } from '../../../feedback/store';

interface Props {
  invoiceId: string | null;
  onClose: () => void;
  onReturn?: (invoiceId: string, items: any[]) => void;
}

const InvoiceDetailsModal: React.FC<Props> = ({ invoiceId, onClose, onReturn }) => {
  const { data: invoice, isLoading } = useInvoiceDetails(invoiceId);
  const { data: company } = useCompany();
  const { user } = useAuthStore();
  const { showToast } = useFeedbackStore();
  const [isExporting, setIsExporting] = useState(false);
  const [showReturnSection, setShowReturnSection] = useState(false);
  const [returnItems, setReturnItems] = useState<{ [key: string]: number }>({});
  const [showAlert, setShowAlert] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

  // Resizable state
  const [isResizable] = useState(true);
  const [modalSize, setModalSize] = useState<'lg' | 'xl' | '2xl' | '3xl' | 'full'>('3xl');

  const sizeOrder: Array<'lg' | 'xl' | '2xl' | '3xl' | 'full'> = ['lg', 'xl', '2xl', '3xl', 'full'];
  const sizeClasses: Record<string, string> = {
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-5xl',
    full: 'max-w-[98vw]'
  };

  const handleIncreaseSize = () => {
    const currentIndex = sizeOrder.indexOf(modalSize);
    if (currentIndex < sizeOrder.length - 1) setModalSize(sizeOrder[currentIndex + 1]);
  };

  const handleDecreaseSize = () => {
    const currentIndex = sizeOrder.indexOf(modalSize);
    if (currentIndex > 0) setModalSize(sizeOrder[currentIndex - 1]);
  };

  const toggleFullscreen = () => setModalSize(prev => prev === 'full' ? '3xl' : 'full');

  const printRef = React.useRef<HTMLDivElement>(null);

  const issuedByName = user?.full_name || user?.email || 'غير محدد';

  // Calculate payment status
  const paymentInfo = useMemo(() => {
    if (!invoice) return null;
    const paidAmount = invoice.payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
    const remainingAmount = invoice.total_amount - paidAmount;
    return {
      total: invoice.total_amount,
      paid: paidAmount,
      remaining: remainingAmount,
      isPaid: remainingAmount <= 0,
      isPartial: paidAmount > 0 && remainingAmount > 0
    };
  }, [invoice]);

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      await exportToPDF(printRef.current, `فاتورة-${invoice?.invoice_number}`);
      setShowAlert({ type: 'success', message: 'تم تصدير الفاتورة بنجاح' });
    } catch (error) {
      setShowAlert({ type: 'error', message: 'فشل في تصدير الفاتورة' });
    } finally {
      setIsExporting(false);
      setTimeout(() => setShowAlert(null), 3000);
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
    setShowAlert({ type: 'success', message: 'تم تصدير ملف Excel بنجاح' });
    setTimeout(() => setShowAlert(null), 3000);
  };

  const handleReturnSubmit = () => {
    if (!invoice || !onReturn) return;

    const itemsToReturn = Object.entries(returnItems)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => {
        const item = invoice.invoice_items?.find((i: any) => i.id === itemId);
        return {
          ...item,
          quantity: qty,
          returnQuantity: qty,
          unitPrice: item?.unit_price || 0,
          total: (item?.unit_price || 0) * qty
        };
      });

    if (itemsToReturn.length === 0) {
      setShowAlert({ type: 'warning', message: 'يرجى اختيار أصناف للإرجاع' });
      setTimeout(() => setShowAlert(null), 3000);
      return;
    }

    // Show warning if quantity exceeds original
    const invalidItems = itemsToReturn.filter((item: any) => {
      const originalItem = invoice.invoice_items?.find((i: any) => i.id === item.id);
      return (item.returnQuantity || 0) > (originalItem?.quantity || 0);
    });

    if (invalidItems.length > 0) {
      setShowAlert({ type: 'warning', message: 'تحذير: تجاوزت الكمية المتاحة للإرجاع!' });
    } else {
      setShowAlert({ type: 'success', message: 'جاري إنشاء مرتجع...' });
    }

    onReturn(invoice.id, itemsToReturn);
    setTimeout(() => setShowAlert(null), 3000);
  };

  const updateReturnQuantity = (itemId: string, qty: number) => {
    const item = invoice?.invoice_items?.find((i: any) => i.id === itemId);
    const maxQty = item?.quantity || 0;
    setReturnItems(prev => ({
      ...prev,
      [itemId]: Math.min(Math.max(0, qty), maxQty)
    }));
  };

  const totalReturnAmount = useMemo(() => {
    if (!invoice) return 0;
    return Object.entries(returnItems).reduce((sum, [itemId, qty]) => {
      const item = invoice.invoice_items?.find((i: any) => i.id === itemId);
      return sum + (item?.unit_price || 0) * qty;
    }, 0);
  }, [returnItems, invoice]);

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
      size="resizable"
      footer={
        <div className="flex gap-2 w-full flex-wrap">
          <button onClick={onClose} className="flex-1 py-3 text-sm font-bold bg-gray-100 dark:bg-slate-800 rounded-lg uppercase tracking-widest text-gray-600 dark:text-slate-400">إغلاق</button>
          {fullInvoiceData && (
            <>
              <ShareButton
                size="md"
                showLabel
                elementRef={printRef as React.RefObject<HTMLElement>}
                title={`مشاركة فاتورة #${invoice?.invoice_number}`}
                eventType="sale_invoice"
                message={`🧾 فاتورة بيع #${invoice?.invoice_number}\n━━━━━━━━━━━━━━\n👤 العميل: ${invoice?.parties?.name || 'عميل نقدي'}\n💰 الإجمالي: ${shareFmtCur(invoice?.total_amount || 0, invoice?.currency_code || 'SAR')}\n📅 التاريخ: ${invoice?.issue_date}\n📦 عدد الأصناف: ${invoice?.invoice_items?.length || 0}\n👨‍💼 صدرت بواسطة: ${issuedByName}`}
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
              <button
                onClick={() => setShowReturnSection(!showReturnSection)}
                className="flex-1 py-3 text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-colors"
                disabled={invoice?.type === 'return_sale'}
              >
                <RotateCcw size={18} />
                {invoice?.type === 'return_sale' ? 'مرتجع' : 'إرجاع'}
              </button>
            </>
          )}
        </div>
      }
    >
      {/* Alert Messages */}
      {showAlert && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${showAlert.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
          showAlert.type === 'warning' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
            'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
          }`}>
          {showAlert.type === 'success' && <CheckCircle size={18} />}
          {showAlert.type === 'warning' && <AlertTriangle size={18} />}
          {showAlert.type === 'error' && <AlertTriangle size={18} />}
          <span className="text-sm font-bold">{showAlert.message}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-20 text-center flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>
      ) : invoice ? (
        <>
          <div className="p-4 space-y-4">
            {/* Company Info Section with Building Icon */}
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-300 dark:border-slate-600">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-slate-600 text-white rounded-lg">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm">معلومات الشركة</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">الشركة:</span>
                  <span className="text-slate-600 dark:text-slate-400">{company?.name || 'الزهراء سمارت'}</span>
                </div>
                {company?.tax_number && (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">الرقم الضريبي:</span>
                    <span className="text-slate-600 dark:text-slate-400 font-mono">{company.tax_number}</span>
                  </div>
                )}
                {company?.address && (
                  <div className="flex items-center gap-2 col-span-2">
                    <MapPin size={14} className="text-slate-500" />
                    <span className="text-slate-600 dark:text-slate-400">{company.address}</span>
                  </div>
                )}
                {company?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-500" />
                    <span className="text-slate-600 dark:text-slate-400">{company.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Alert Banner */}
            {showReturnSection && (
              <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 mb-2">
                  <RotateCcw size={20} />
                  <h3 className="font-bold">إرجاع جزئي - بنفس السعر</h3>
                </div>
                <p className="text-sm text-rose-600 dark:text-rose-300">
                  يمكنك اختيار أصناف وكميات محددة للإرجاع. سيتم استخدام سعر الفاتورة الأصلي.
                </p>
              </div>
            )}

            {/* Customer Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-600 text-white rounded-lg">
                    <User size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-blue-800 dark:text-blue-200 text-sm">معلومات العميل</h3>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-700 dark:text-blue-300">الاسم:</span>
                    <span className="text-gray-700 dark:text-slate-300">{invoice.parties?.name || 'عميل نقدي'}</span>
                  </div>
                  {invoice.parties?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-blue-500" />
                      <span className="text-gray-700 dark:text-slate-300">{invoice.parties.phone}</span>
                    </div>
                  )}
                  {invoice.parties?.address && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-blue-500" />
                      <span className="text-gray-700 dark:text-slate-300">{invoice.parties.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Info Section */}
              {paymentInfo && (
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-emerald-600 text-white rounded-lg">
                      <DollarSign size={18} />
                    </div>
                    <div>
                      <h3 className="font-black text-emerald-800 dark:text-emerald-200 text-sm">المبالغ</h3>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">الإجمالي:</span>
                      <span className="font-mono font-bold text-gray-700 dark:text-slate-300">
                        {formatCurrency(paymentInfo.total, invoice.currency_code || 'SAR')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">المدفوع:</span>
                      <span className="font-mono font-bold text-green-600">
                        {formatCurrency(paymentInfo.paid, invoice.currency_code || 'SAR')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">المتبقي:</span>
                      <span className={`font-mono font-bold ${paymentInfo.remaining > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                        {formatCurrency(paymentInfo.remaining, invoice.currency_code || 'SAR')}
                      </span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-700">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${paymentInfo.isPaid ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        paymentInfo.isPartial ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {paymentInfo.isPaid ? <CheckCircle size={12} /> : <Clock size={12} />}
                        {paymentInfo.isPaid ? 'مدفوعة' : paymentInfo.isPartial ? 'مدفوعة جزئياً' : 'غير مدفوعة'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Invoice Meta */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                <strong>التاريخ:</strong> {invoice.issue_date}
              </div>
              <div className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                <strong>الحالة:</strong> {invoice.status}
              </div>
              <div className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                <strong>نوع الدفع:</strong> {invoice.payment_method === 'cash' ? 'نقدي' : 'آجل'}
              </div>
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                <strong>صدرت بواسطة:</strong> {issuedByName}
              </div>
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

            {/* Return Section */}
            {showReturnSection && (
              <div className="border-2 border-rose-200 dark:border-rose-800 rounded-xl p-4 bg-rose-50/50 dark:bg-rose-900/10">
                <h3 className="font-black text-rose-700 dark:text-rose-400 mb-3 flex items-center gap-2">
                  <RotateCcw size={18} />
                  اختيار الأصناف للإرجاع
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {invoice.invoice_items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 dark:text-slate-200 text-sm">{item.description}</p>
                        <p className="text-xs text-gray-500">
                          المتوفر: {item.quantity} × {formatCurrency(item.unit_price, invoice.currency_code || 'SAR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={returnItems[item.id] || 0}
                          onChange={(e) => updateReturnQuantity(item.id, parseInt(e.target.value) || 0)}
                          className="w-16 p-2 text-center font-bold border border-gray-200 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white text-sm"
                        />
                        <span className="text-xs text-gray-500">/ {item.quantity}</span>
                      </div>
                      <div className="w-24 text-left">
                        <span className="font-mono font-bold text-rose-600 text-sm">
                          {formatCurrency((returnItems[item.id] || 0) * item.unit_price, invoice.currency_code || 'SAR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-rose-200 dark:border-rose-700 flex justify-between items-center">
                  <span className="font-bold text-rose-700 dark:text-rose-400">إجمالي الإرجاع:</span>
                  <span className="font-mono font-black text-xl text-rose-600">
                    {formatCurrency(totalReturnAmount, invoice.currency_code || 'SAR')}
                  </span>
                </div>
                <button
                  onClick={handleReturnSubmit}
                  className="mt-3 w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw size={18} />
                  تأكيد الإرجاع
                </button>
              </div>
            )}

            {/* Improved Table with Borders */}
            <table className="w-full text-sm border-collapse border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <thead className="bg-gray-100 dark:bg-slate-800 border-b-2 border-gray-300 dark:border-slate-600">
                <tr>
                  <th className="p-3 font-bold text-right border-r border-gray-200 dark:border-slate-700">الصنف</th>
                  <th className="p-3 font-bold text-center border-r border-gray-200 dark:border-slate-700">الكمية</th>
                  <th className="p-3 font-bold text-center border-r border-gray-200 dark:border-slate-700">السعر</th>
                  <th className="p-3 font-bold text-center border-r border-gray-200 dark:border-slate-700">الإجمالي</th>
                  <th className="p-3 font-bold text-center">تاريخ الإرجاع</th>
                </tr>
              </thead>
              <tbody>
                {invoice.invoice_items?.map((item: any, index: number) => (
                  <tr key={item.id} className={`border-b border-gray-200 dark:border-slate-700 ${index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-gray-50 dark:bg-slate-800/50'}`}>
                    <td className="p-3 font-bold border-r border-gray-200 dark:border-slate-700">{item.description}</td>
                    <td className="p-3 text-center border-r border-gray-200 dark:border-slate-700">
                      <span className="inline-flex items-center justify-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-bold">
                        {formatNumberDisplay(item.quantity)}
                      </span>
                    </td>
                    <td className="p-3 text-left font-mono border-r border-gray-200 dark:border-slate-700">
                      {formatCurrency(item.unit_price, invoice.currency_code || 'SAR')}
                    </td>
                    <td className="p-3 text-left font-bold font-mono border-r border-gray-200 dark:border-slate-700">
                      {formatCurrency(item.total, invoice.currency_code || 'SAR')}
                    </td>
                    <td className="p-3 text-center">
                      {item.returned_at ? (
                        <span className="text-xs bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 px-2 py-1 rounded">
                          {item.returned_at}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Section */}
            <div className="flex justify-end pt-4">
              <div className="w-64 space-y-2">
                <div className="flex justify-between font-bold p-2 border-b border-gray-200 dark:border-slate-700">
                  <span>المجموع:</span>
                  <span dir="ltr" className="font-mono">{formatCurrency(invoice.subtotal, invoice.currency_code || 'SAR')}</span>
                </div>
                <div className="flex justify-between font-bold p-2 border-b border-gray-200 dark:border-slate-700">
                  <span>الضريبة:</span>
                  <span dir="ltr" className="font-mono">{formatCurrency(invoice.tax_amount, invoice.currency_code || 'SAR')}</span>
                </div>
                <div className="flex justify-between text-lg font-black bg-blue-600 text-white p-3 rounded-lg">
                  <span>الإجمالي:</span>
                  <span dir="ltr" className="font-mono">{formatCurrency(invoice.total_amount, invoice.currency_code || 'SAR')}</span>
                </div>
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
