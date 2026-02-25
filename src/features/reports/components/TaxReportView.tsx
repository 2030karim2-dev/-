
import React from 'react';
import { useVATReport } from '../hooks';
import { formatCurrency } from '../../../core/utils';
import { ShieldCheck, ArrowUpRight, ArrowDownRight, FileText, Landmark } from 'lucide-react';
import StatCard from '../../../ui/common/StatCard';
import { cn } from '../../../core/utils';
import ShareButton from '../../../ui/common/ShareButton';

const TaxReportView: React.FC = () => {
    const today = new Date().toISOString().split('T')[0];
    const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];

    const { data: report, isLoading } = useVATReport(lastMonth, today);

    if (isLoading) return <div className="p-20 text-center font-black text-[10px] text-gray-400 uppercase tracking-widest animate-pulse">Synthesizing VAT Ledger...</div>;

    return (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* High-Density Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Sales VAT (Output)</span>
                        <ArrowUpRight size={14} className="text-emerald-500" />
                    </div>
                    <h3 dir="ltr" className="text-xl font-black font-mono text-emerald-600 leading-none tracking-tighter">
                        {formatCurrency(report?.outputTax || 0)}
                    </h3>
                </div>

                <div className="bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Purchase VAT (Input)</span>
                        <ArrowDownRight size={14} className="text-rose-500" />
                    </div>
                    <h3 dir="ltr" className="text-xl font-black font-mono text-rose-600 leading-none tracking-tighter">
                        {formatCurrency(report?.inputTax || 0)}
                    </h3>
                </div>

                <div className="bg-blue-600 p-4 flex flex-col justify-between shadow-xl shadow-blue-500/10">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[8px] font-black text-white/60 uppercase tracking-widest">Net Tax Payable</span>
                        <Landmark size={14} className="text-white" />
                    </div>
                    <h3 dir="ltr" className="text-xl font-black font-mono text-white leading-none tracking-tighter">
                        {formatCurrency(report?.netTaxPayable || 0)}
                    </h3>
                </div>
            </div>

            <div className="bg-slate-900 p-4 border-r-4 border-emerald-500 flex gap-4 items-center group">
                <div className="p-2 bg-emerald-500 text-white shadow-[2px_2px_0_0_#065f46]">
                    <ShieldCheck size={18} />
                </div>
                <div className="flex-1">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">ZATCA Compliance Alert</h4>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter leading-tight">
                        Tax return readiness: 100%. All invoices signed and archived in neural vault.
                    </p>
                </div>
                <button className="px-4 py-2 bg-white/10 text-white text-[9px] font-black uppercase hover:bg-white/20 transition-all">Generate Filing</button>
                <ShareButton
                    size="sm"
                    eventType="tax_report"
                    title="مشاركة تقرير الضريبة"
                    className="text-white/60 hover:text-white hover:bg-white/10"
                    message={`🧾 تقرير ضريبة القيمة المضافة\n━━━━━━━━━━━━━━\n📤 ضريبة المبيعات (مخرجات): ${formatCurrency(report?.outputTax || 0)}\n📥 ضريبة المشتريات (مدخلات): ${formatCurrency(report?.inputTax || 0)}\n💰 صافي الضريبة المستحقة: ${formatCurrency(report?.netTaxPayable || 0)}\n✅ ZATCA Compliance: Ready\n📅 التاريخ: ${new Date().toLocaleDateString('ar-SA')}`}
                />
            </div>
        </div>
    );
};

export default TaxReportView;