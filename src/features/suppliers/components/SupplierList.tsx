
import React from 'react';
import { Supplier } from '../types';
import ExcelTable from '../../../ui/common/ExcelTable';
import { formatCurrency } from '../../../core/utils';
import { Edit, Trash2 } from 'lucide-react';
import { cn } from '../../../core/utils';

interface Props {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
}

const SupplierList: React.FC<Props> = ({ suppliers, onEdit, onDelete }) => {
  const columns = [
    { 
        header: 'اسم المورد', 
        /**
         * Fix: Changed row.name_ar to row.name to match database.types.ts schema for parties
         */
        accessor: (row: Supplier) => <span className="font-bold text-gray-800 dark:text-slate-100">{row.name}</span> 
    },
    { header: 'رقم الهاتف', accessor: (row: Supplier) => <span dir="ltr" className="font-mono text-gray-500">{row.phone || 'N/A'}</span>, width: "w-40" },
    { header: 'الفئة', accessor: (row: Supplier) => <span className="text-xs font-bold bg-gray-50 dark:bg-slate-800 px-2 py-1 border dark:border-slate-700">{row.category || 'عام'}</span>, width: "w-32", className: "text-center" },
    { header: 'الحالة', accessor: (row: Supplier) => (
        <span className={cn("px-2 py-1 rounded text-[9px] font-black", row.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
            {row.status === 'active' ? 'نشط' : 'محظور'}
        </span>
    ), className: 'text-center', width: "w-24" },
    { header: 'الرصيد', accessor: (row: Supplier) => (
        <span dir="ltr" className={cn("font-mono font-bold", Number(row.balance) >= 0 ? "text-emerald-600" : "text-rose-600")}>
            {formatCurrency(Number(row.balance))}
        </span>
    ), className: 'text-left', width: "w-40" },
    { header: 'إجراءات', accessor: (row: Supplier) => (
      <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100">
        <button onClick={() => onEdit(row)} className="p-2 text-blue-500 hover:bg-blue-50 rounded"><Edit size={14}/></button>
        <button onClick={() => onDelete(row.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded"><Trash2 size={14}/></button>
      </div>
    ), className: 'text-center', width: "w-24" }
  ];

  return <ExcelTable columns={columns} data={suppliers} colorTheme="blue" />;
};

export default SupplierList;
