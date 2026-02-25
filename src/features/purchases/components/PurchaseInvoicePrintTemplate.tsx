import React from 'react';
import { User, Building2, Phone, MapPin, Calendar, Package, FileText } from 'lucide-react';
import { formatCurrency, formatNumberDisplay } from '../../../core/utils';

interface PurchaseInvoicePrintTemplateProps {
    invoice: any;
}

const PurchaseInvoicePrintTemplate = React.forwardRef<HTMLDivElement, PurchaseInvoicePrintTemplateProps>(
    ({ invoice }, ref) => {
        if (!invoice) return null;

        return (
            <div ref={ref} className="max-w-4xl mx-auto space-y-8 bg-white dark:bg-slate-900 p-8 text-right font-cairo" dir="rtl">
                {/* Invoice Header Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Supplier Card */}
                    <div className="bg-gray-50/50 dark:bg-slate-800/30 p-6 rounded-3xl border border-gray-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500 mb-4 text-[10px] font-black uppercase tracking-widest border-b border-gray-200 dark:border-slate-700 pb-2">
                            <User size={14} />
                            <span>بيانات المورد</span>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-gray-400 dark:text-slate-500">
                                <Building2 size={24} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-extrabold text-gray-900 dark:text-slate-100 text-lg">
                                    {invoice.party?.name || 'مورد عام / غير محدد'}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                                    <Phone size={12} />
                                    <span dir="ltr">{invoice.party?.phone || 'لا يوجد هاتف'}</span>
                                </div>
                                {invoice.party?.address && (
                                    <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500">
                                        <MapPin size={12} />
                                        <span>{invoice.party.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Invoice Meta Card */}
                    <div className="bg-gray-50/50 dark:bg-slate-800/30 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500 mb-2 text-[10px] font-black uppercase tracking-widest border-b border-gray-200 dark:border-slate-700 pb-2">
                            <Calendar size={14} />
                            <span>معلومات الفاتورة</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold mb-1">تاريخ الإصدار</p>
                                <p dir="ltr" className="font-bold text-gray-800 dark:text-slate-200 font-mono">{invoice.issue_date}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold mb-1">طريقة الدفع</p>
                                <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold ${invoice.payment_method === 'cash'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {invoice.payment_method === 'cash' ? 'نقدي (Cash)' : 'أجل (Credit)'}
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold mb-1">تاريخ الاستحقاق</p>
                                <p dir="ltr" className="font-bold text-gray-800 dark:text-slate-200 font-mono">{invoice.due_date || invoice.issue_date}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold mb-1">الحالة</p>
                                <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold ${invoice.status === 'posted' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {invoice.status === 'posted' ? 'مرحلة (Posted)' : 'مسودة (Draft)'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1 text-gray-800 dark:text-slate-100 border-b-2 border-blue-600 w-fit pb-1">
                        <Package size={18} className="text-blue-600" />
                        <h3 className="font-black uppercase tracking-tight text-sm">البضائع والأصناف</h3>
                    </div>

                    <div className="border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-gray-50 dark:bg-slate-800/80 text-gray-500 dark:text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-gray-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-4 w-12 text-center text-gray-300">#</th>
                                    <th className="p-4">تفاصيل الصنف</th>
                                    <th className="p-4 text-center">الكمية</th>
                                    <th className="p-4 text-left">سعر الوحدة</th>
                                    <th className="p-4 text-left">الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                {invoice.invoice_items?.map((item: any, index: number) => (
                                    <tr key={item.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/30 transition-colors">
                                        <td dir="ltr" className="p-4 text-center text-gray-300 dark:text-slate-600 font-mono text-[10px]">{index + 1}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-gray-800 dark:text-slate-200 text-sm">{item.description || 'بدون وصف'}</div>
                                            {item.product?.sku && (
                                                <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-[10px] text-gray-500 font-mono">
                                                    <span>SKU: {item.product.sku}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td dir="ltr" className="p-4 text-center">
                                            <span className="font-black text-gray-700 dark:text-slate-200 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                                {formatNumberDisplay(item.quantity)}
                                            </span>
                                        </td>
                                        <td dir="ltr" className="p-4 text-left font-mono font-bold text-gray-500 dark:text-slate-400 text-xs">{formatCurrency(item.unit_price)}</td>
                                        <td dir="ltr" className="p-4 text-left font-mono font-black text-blue-600 dark:text-blue-400">{formatCurrency(item.total)}</td>
                                    </tr>
                                ))}
                                {(!invoice.invoice_items || invoice.invoice_items.length === 0) && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-400 text-sm">لا توجد أصناف في هذه الفاتورة</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer / Totals */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-gray-100 dark:border-slate-800 mt-8">
                    {/* Notes */}
                    <div className="md:col-span-2">
                        <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/30 h-full">
                            <h4 className="font-black text-amber-800 dark:text-amber-500 text-[10px] uppercase mb-2 tracking-widest flex items-center gap-2">
                                <FileText size={12} />
                                ملاحظات
                            </h4>
                            <p className="text-amber-900 dark:text-amber-200/80 text-sm leading-relaxed">
                                {invoice.notes || 'لا توجد ملاحظات مرفقة مع هذه الفاتورة.'}
                            </p>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm font-bold text-gray-500 dark:text-slate-500 px-2">
                            <span>المجموع الفرعي</span>
                            <span dir="ltr" className="font-mono">{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold text-gray-500 dark:text-slate-500 px-2">
                            <span>الضريبة (15%)</span>
                            <span dir="ltr" className="font-mono text-rose-500">{formatCurrency(invoice.tax_amount)}</span>
                        </div>
                        <div className="p-0.5 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-xl shadow-blue-500/10">
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-[14px] flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="font-black text-gray-400 dark:text-slate-500 text-[10px] uppercase tracking-widest">الإجمالي النهائي</span>
                                    <span className="text-[10px] text-green-500 font-bold">{invoice.payment_method === 'cash' ? 'مدفوع نقداً' : 'آجل / ذمم'}</span>
                                </div>
                                <span dir="ltr" className="font-black text-2xl text-gray-800 dark:text-white font-mono">{formatCurrency(invoice.total_amount)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signatures Area (Print Only) */}
                <div className="hidden print:flex justify-between mt-12 pt-12 border-t border-gray-200">
                    <div className="text-center w-1/3">
                        <p className="font-bold text-gray-600 mb-12">المشتريات</p>
                        <div className="border-t border-gray-400 w-24 mx-auto"></div>
                    </div>
                    <div className="text-center w-1/3">
                        <p className="font-bold text-gray-600 mb-12">الحسابات</p>
                        <div className="border-t border-gray-400 w-24 mx-auto"></div>
                    </div>
                    <div className="text-center w-1/3">
                        <p className="font-bold text-gray-600 mb-12">المدير العام</p>
                        <div className="border-t border-gray-400 w-24 mx-auto"></div>
                    </div>
                </div>
            </div>
        );
    }
);

PurchaseInvoicePrintTemplate.displayName = 'PurchaseInvoicePrintTemplate';

export default PurchaseInvoicePrintTemplate;
