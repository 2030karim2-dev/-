
import React, { useState } from 'react';
import { useSuppliers, useSupplierStatement } from '../hooks';
import ExcelTable from '../../../ui/common/ExcelTable';
import { formatCurrency } from '../../../core/utils';
import Button from '../../../ui/base/Button';
import { Printer } from 'lucide-react';
import ShareButton from '../../../ui/common/ShareButton';

const StatementView: React.FC = () => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const { suppliers } = useSuppliers();
  const { data: statement, isLoading } = useSupplierStatement(selectedSupplierId);

  const selectedSupplier = suppliers.find(p => p.id === selectedSupplierId);

  const columns = [
    { header: 'التاريخ', accessor: (row: any) => <span dir="ltr">{row.date}</span>, width: 'w-24' },
    { header: 'المرجع', accessor: (row: any) => <span dir="ltr" className="font-mono">{row.ref}</span>, width: 'w-24' },
    { header: 'البيان', accessor: (row: any) => row.desc },
    { header: 'مدين (+)', accessor: (row: any) => row.debit > 0 ? <span dir="ltr">{formatCurrency(row.debit)}</span> : '-', className: 'text-left' },
    { header: 'دائن (-)', accessor: (row: any) => row.credit > 0 ? <span dir="ltr">{formatCurrency(row.credit)}</span> : '-', className: 'text-left' },
    { header: 'الرصيد', accessor: (row: any) => <span dir="ltr" className="font-mono font-black">{formatCurrency(row.balance)}</span>, className: 'text-left bg-gray-50 dark:bg-slate-800' },
  ];

  return (
    <div className="space-y-3 print-area">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800 flex gap-4 items-center no-print">
        <div className="flex-1">
          <label className="text-xs font-bold text-gray-500">اختر المورد</label>
          <select
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
            className="w-full mt-1 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg py-2 px-3 text-sm font-bold"
          >
            <option value="">-- اختر من القائمة --</option>
            {suppliers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        {selectedSupplierId && selectedSupplier && (
          <div className="flex gap-2 mt-auto">
            <ShareButton
              size="md"
              showLabel
              eventType="supplier_statement"
              title={`مشاركة كشف حساب ${selectedSupplier.name}`}
              message={`📄 كشف حساب مورد: ${selectedSupplier.name}\n━━━━━━━━━━━━━━\n${(statement || []).map((row: any) => `${row.date} | ${row.desc} | مدين: ${formatCurrency(row.debit)} | دائن: ${formatCurrency(row.credit)} | رصيد: ${formatCurrency(row.balance)}`).join('\n')}\n━━━━━━━━━━━━━━\n📊 الرصيد النهائي: ${formatCurrency((statement || []).at(-1)?.balance || 0)}`}
            />
            <Button onClick={() => window.print()} className="" leftIcon={<Printer size={14} />}>
              طباعة الكشف
            </Button>
          </div>
        )}
      </div>

      {selectedSupplierId ? (
        isLoading ? <div className="p-20 text-center">جاري تحميل الكشف...</div> :
          <ExcelTable columns={columns} data={statement || []} title={`كشف حساب: ${selectedSupplier?.name}`} colorTheme={'blue'} />
      ) : (
        <div className="p-20 text-center text-gray-400 border-2 border-dashed rounded-lg bg-gray-50/50">
          يرجى اختيار مورد لعرض كشف الحساب
        </div>
      )}
    </div>
  );
};

export default StatementView;
