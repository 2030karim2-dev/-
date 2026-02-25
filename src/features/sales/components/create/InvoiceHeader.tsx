
import React from 'react';
import { Car, ShieldCheck } from 'lucide-react';

const InvoiceHeader = ({ company }: { company: any }) => {
  return (
    <div className="relative p-3 md:p-4 border-b-2 border-blue-100 dark:border-slate-800 bg-gradient-to-l from-white to-blue-50 dark:from-slate-900 dark:to-slate-950 overflow-hidden">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600"></div>
        
        <div className="flex justify-between items-center gap-2">
            {/* Right Info */}
            <div className="flex-1 text-right">
                <h1 className="text-sm font-black text-blue-900 dark:text-blue-400 leading-none mb-1 uppercase tracking-tight">
                    {company?.name || 'الزهراء لقطع الغيار'}
                </h1>
                <div className="text-[8px] font-black text-slate-500 space-y-0.5">
                    <p>{company?.address || 'المملكة العربية السعودية'}</p>
                    <p className="text-blue-600 font-mono tracking-tighter">VAT ID: {company?.tax_number}</p>
                </div>
            </div>

            {/* Center: The Core Block */}
            <div className="shrink-0 flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20 transform rotate-45 group-hover:rotate-0 transition-transform duration-500">
                    <div className="-rotate-45 group-hover:rotate-0 transition-transform duration-500">
                        <Car size={24} strokeWidth={2.5} />
                    </div>
                </div>
                <span className="text-[7px] font-black text-blue-500 uppercase tracking-[0.4em] mt-2">SMART ERP</span>
            </div>

            {/* Left Info */}
            <div className="flex-1 text-left" dir="ltr">
                <h1 className="text-[11px] font-black text-blue-900 dark:text-blue-400 leading-none mb-1 uppercase tracking-tight">
                    {company?.english_name || 'AL-ZAHRA AUTO PARTS'}
                </h1>
                <div className="text-[8px] font-black text-slate-500 space-y-0.5 uppercase tracking-tighter">
                    <p>OFFICIAL TAX INVOICE</p>
                    <p className="text-emerald-600">ZATCA COMPLIANT</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default InvoiceHeader;
