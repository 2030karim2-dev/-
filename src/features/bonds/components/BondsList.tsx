import React from 'react';
import { ArrowDownCircle, ArrowUpCircle, Printer } from 'lucide-react';
import MicroListItem from '../../../ui/common/MicroListItem';
import { Bond } from '../types';
import { cn } from '../../../core/utils';
import { formatCurrency } from '../../../core/utils';

interface Props {
    bonds: Bond[];
    isLoading: boolean;
    searchTerm: string;
}

const BondsList: React.FC<Props> = ({ bonds, isLoading, searchTerm }) => {
    const filteredBonds = bonds?.filter(b =>
        b.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.party_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.payment_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="p-20 text-center font-black text-[10px] text-gray-400 uppercase animate-pulse">
                جاري تحميل السندات...
            </div>
        );
    }

    return (
        <div className="flex flex-col divide-y-0 gap-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {filteredBonds?.map((bond) => (
                <MicroListItem
                    key={bond.id}
                    icon={bond.type === 'receipt' ? ArrowDownCircle : ArrowUpCircle}
                    iconColorClass={bond.type === 'receipt' ? "text-emerald-500" : "text-rose-500"}
                    title={bond.description || (bond.type === 'receipt' ? 'سند قبض' : 'سند صرف')}
                    subtitle={`${bond.party_name || bond.account_name} | ${bond.payment_number}`}
                    tags={[
                        { label: bond.date, color: 'slate' },
                        { label: bond.currency_code, color: 'blue' },
                        ...(bond.payment_method ? [{ label: bond.payment_method === 'cash' ? 'نقداً' : bond.payment_method === 'bank' ? 'بنك' : bond.payment_method, color: 'amber' as const }] : [])
                    ]}
                    actions={
                        <div className="flex flex-col items-end gap-1">
                            <span dir="ltr" className={cn("text-sm font-black font-mono leading-none", bond.type === 'receipt' ? "text-emerald-600" : "text-rose-600")}>
                                {bond.type === 'receipt' ? '+' : '-'}{formatCurrency(bond.amount, bond.currency_code)}
                            </span>
                            {bond.currency_code !== 'SAR' && bond.base_amount !== undefined && (
                                <span dir="ltr" className="text-[10px] font-bold text-blue-500 leading-none">
                                    {bond.type === 'receipt' ? '+' : '-'}{formatCurrency(bond.base_amount)}
                                </span>
                            )}
                            <button className="p-1 text-gray-300 hover:text-blue-500 transition-colors mt-auto pt-1 w-full flex justify-end">
                                <Printer size={12} />
                            </button>
                        </div>
                    }
                />
            ))}
            {filteredBonds?.length === 0 && (
                <div className="p-20 text-center text-gray-300 font-black uppercase text-[10px] tracking-widest border-2 border-dashed dark:border-slate-800 mt-4">
                    لا توجد سندات في هذه الفئة
                </div>
            )}
        </div>
    );
};

export default BondsList;
