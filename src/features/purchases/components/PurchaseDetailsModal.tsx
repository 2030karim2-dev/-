
import React, { useRef } from 'react';
import { X, Calendar, User, FileText, Printer, Download, Loader2, Package, ShieldCheck, Phone, MapPin, Building2, Wallet, Share2 } from 'lucide-react';
import ShareButton from '../../../ui/common/ShareButton';
import { formatCurrency as shareFmtCur } from '../../../core/utils';
import { usePurchaseDetails } from '../hooks';
import { formatCurrency, formatNumberDisplay } from '../../../core/utils';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../../../features/auth';
import PurchaseInvoicePrintTemplate from './PurchaseInvoicePrintTemplate';
interface PurchaseDetailsModalProps {
    invoiceId: string | null;
    onClose: () => void;
}

const PurchaseDetailsModal: React.FC<PurchaseDetailsModalProps> = ({ invoiceId, onClose }) => {
    const { data: invoice, isLoading } = usePurchaseDetails(invoiceId);
    const { user } = useAuth();
    const printRef = useRef<HTMLDivElement>(null);


    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: ` فاتورة مشتريات #${invoice?.invoice_number}`,
        onAfterPrint: () => console.info('Print success'),
    });

    if (!invoiceId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-5xl my-auto flex flex-col max-h-[90vh] border border-gray-100 dark:border-slate-800 transition-colors">

                {/* Header Actions - No Print */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-t-[2rem] sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/30">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-800 dark:text-slate-100 uppercase tracking-tight">تفاصيل فاتورة الشراء</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                    #{invoice?.invoice_number || '---'}
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-slate-500">{invoice?.issue_date}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ShareButton
                            size="md"
                            elementRef={printRef as React.RefObject<HTMLElement>}
                            title={`مشاركة فاتورة شراء #${invoice?.invoice_number}`}
                            eventType="purchase_invoice"
                            message={`📦 فاتورة شراء #${invoice?.invoice_number || ''}\n━━━━━━━━━━━━━━\n🏢 المورد: ${invoice?.parties?.name || '-'}\n💰 الإجمالي: ${shareFmtCur(invoice?.total_amount || 0)}\n📅 التاريخ: ${invoice?.issue_date || ''}`}
                            className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm"
                        />
                        <button
                            onClick={handlePrint}
                            className="p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-all shadow-sm"
                            title="طباعة"
                        >
                            <Printer size={20} />
                        </button>
                        <button onClick={onClose} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Printable Content */}
                <div ref={printRef} className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white dark:bg-slate-900">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <Loader2 className="animate-spin text-blue-600" size={40} />
                            <p className="text-sm font-bold text-gray-500">جاري تحميل بيانات الفاتورة...</p>
                        </div>
                    ) : invoice ? (
                        <PurchaseInvoicePrintTemplate ref={printRef} invoice={invoice} />
                    ) : (
                        <div className="text-center py-20 text-gray-400 dark:text-slate-600">
                            <FileText size={64} className="mx-auto mb-4 opacity-10" />
                            <p className="text-xl font-bold">لا يمكن العثور على بيانات الفاتورة</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30 rounded-b-[2rem] flex justify-end gap-3 transition-colors">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold rounded-xl border border-gray-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
                    >
                        <Printer size={18} />
                        <span>طباعة</span>
                    </button>

                    <button
                        onClick={async () => {
                            if (!user) {
                                alert('Please login first to use debug features');
                                return;
                            }
                            try {
                                console.info('Debugging Accounting for Invoice:', invoice.invoice_number);
                                const { purchaseAccountingService } = await import('../services/purchaseAccounting');
                                await purchaseAccountingService.handleNewPurchase(
                                    invoice.id,
                                    {
                                        supplierId: invoice.party_id,
                                        invoiceNumber: invoice.invoice_number,
                                        items: [],
                                        issueDate: invoice.issue_date,
                                        status: 'posted',
                                        paymentMethod: invoice.payment_method,
                                        cashAccountId: undefined
                                    },
                                    invoice.company_id,
                                    user.id,
                                    invoice.total_amount
                                );
                                alert('Accounting Run Successfully! Check Ledger.');
                            } catch (err: any) {
                                alert('Error: ' + err.message);
                                console.error(err);
                            }
                        }}
                        className="px-6 py-2.5 text-rose-600 font-bold hover:bg-rose-50 rounded-xl transition-all"
                    >
                        Debug Accounting
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-900 dark:bg-slate-700 text-white font-bold hover:bg-black dark:hover:bg-slate-600 rounded-xl transition-all shadow-lg shadow-gray-900/10"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PurchaseDetailsModal;
