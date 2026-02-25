
import React, { useState } from 'react';
import { useCustomers, useCustomerStatement } from '../hooks';
import ExcelTable from '../../../ui/common/ExcelTable';
import { formatCurrency } from '../../../core/utils';
import { Search, FileText, Printer, Calendar, ArrowUpRight, ArrowDownRight, CreditCard, Share2 } from 'lucide-react';
import ShareButton from '../../../ui/common/ShareButton';

const StatementView: React.FC<{ type: 'customer' }> = ({ type }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const { customers } = useCustomers();
  const { data: statement, isLoading } = useCustomerStatement(selectedCustomerId);

  const selectedCustomer = customers.find(p => p.id === selectedCustomerId);

  const columns = [
    { header: 'التاريخ', accessor: (row: any) => <span dir="ltr">{row.date}</span>, width: 'w-24' },
    { header: 'المرجع', accessor: (row: any) => <span dir="ltr">{row.ref}</span>, width: 'w-24' },
    { header: 'البيان', accessor: (row: any) => row.desc },
    { header: 'مدين (+)', accessor: (row: any) => row.debit > 0 ? <span dir="ltr">{formatCurrency(row.debit)}</span> : '-', className: 'text-left' },
    { header: 'دائن (-)', accessor: (row: any) => row.credit > 0 ? <span dir="ltr">{formatCurrency(row.credit)}</span> : '-', className: 'text-left' },
    { header: 'الرصيد', accessor: (row: any) => <span dir="ltr">{formatCurrency(row.balance)}</span>, className: 'text-left' },
  ];

  return (
    <div className="space-y-3">
      <div className="bg-white p-4 rounded-xl border flex gap-4 items-center">
        <div className="flex-1">
          <label className="text-xs font-bold text-gray-500">اختر العميل</label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full mt-1 bg-gray-50 border rounded-lg py-2 px-3"
          >
            <option value="">-- اختر من القائمة --</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {selectedCustomerId && selectedCustomer && (
          <div className="flex gap-2 mt-auto">
            <ShareButton
              size="md"
              showLabel
              eventType="customer_statement"
              title={`مشاركة كشف حساب ${selectedCustomer.name}`}
              message={`📄 كشف حساب: ${selectedCustomer.name}\n━━━━━━━━━━━━━━\n${(statement || []).map((row: any) => `${row.date} | ${row.desc} | مدين: ${formatCurrency(row.debit)} | دائن: ${formatCurrency(row.credit)} | رصيد: ${formatCurrency(row.balance)}`).join('\n')}\n━━━━━━━━━━━━━━\n📊 الرصيد النهائي: ${formatCurrency((statement || []).at(-1)?.balance || 0)}`}
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">تصدير PDF</button>
          </div>
        )}
        {!selectedCustomerId && (
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg mt-auto">تصدير PDF</button>
        )}
      </div>

      {selectedCustomerId ? (
        <ExcelTable columns={columns} data={statement || []} title={`كشف حساب: ${selectedCustomer?.name}`} />
      ) : (
        <div className="p-20 text-center text-gray-400">يرجى اختيار عميل لعرض كشف الحساب</div>
      )}
    </div>
  );
};

export default StatementView;
