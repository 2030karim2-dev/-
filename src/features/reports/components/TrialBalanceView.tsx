
import React from 'react';
import { useTrialBalance } from '../hooks';
import ExcelTable from '../../../ui/common/ExcelTable';
import { formatCurrency } from '../../../core/utils';
import { Scale, CheckCircle2, AlertCircle } from 'lucide-react';
import ShareButton from '../../../ui/common/ShareButton';

const TrialBalanceView: React.FC = () => {
  const { data, isLoading } = useTrialBalance();

  if (isLoading) return <div className="p-20 text-center animate-pulse">جاري سحب ميزان المراجعة...</div>;

  const columns = [
    { header: 'كود الحساب', accessor: (row: any) => <span className="font-mono text-[10px] text-blue-600 font-black">{row.code}</span>, width: 'w-24' },
    { header: 'اسم الحساب المحاسبي', accessor: (row: any) => <span className="font-bold text-gray-800 dark:text-slate-100">{row.name}</span> },
    { header: 'إجمالي المدين', accessor: (row: any) => <span dir="ltr" className="font-mono font-bold text-emerald-600">{formatCurrency(row.totalDebit)}</span>, className: 'text-left bg-emerald-50/10' },
    { header: 'إجمالي الدائن', accessor: (row: any) => <span dir="ltr" className="font-mono font-bold text-rose-600">{formatCurrency(row.totalCredit)}</span>, className: 'text-left bg-rose-50/10' },
    {
      header: 'الرصيد الصافي',
      accessor: (row: any) => (
        <span dir="ltr" className={`flex items-center gap-1 text-[10px] font-black ${row.netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
          <span>{row.netBalance >= 0 ? 'مدين' : 'دائن'}</span>
          <span className="font-mono">{formatCurrency(Math.abs(row.netBalance))}</span>
        </span>
      ),
      className: 'text-left font-bold bg-gray-50 dark:bg-slate-800'
    },
  ];

  const totalDr = data?.reduce((s: number, r: any) => s + r.totalDebit, 0) || 0;
  const totalCr = data?.reduce((s: number, r: any) => s + r.totalCredit, 0) || 0;
  const isBalanced = Math.abs(totalDr - totalCr) < 0.1;

  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
      <div className={`p-3 rounded-lg flex items-center justify-between border ${isBalanced ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
        <div className="flex items-center gap-2">
          {isBalanced ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <div>
            <h4 className="font-black text-xs">{isBalanced ? 'الميزان متزن محاسبياً' : 'يوجد عدم اتزان في الميزان'}</h4>
            <p className="text-[9px] font-bold opacity-70">إجمالي الحركات المدينة تساوي الدائنة</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ShareButton
            size="sm"
            showLabel
            eventType="trial_balance"
            title="مشاركة ميزان المراجعة"
            message={`⚖️ ميزان المراجعة\n━━━━━━━━━━━━━━\n📊 الحالة: ${isBalanced ? '✅ متزن' : '❌ غير متزن'}\n📗 إجمالي المدين: ${formatCurrency(totalDr)}\n📕 إجمالي الدائن: ${formatCurrency(totalCr)}\n📐 الفرق: ${formatCurrency(Math.abs(totalDr - totalCr))}\n📅 التاريخ: ${new Date().toLocaleDateString('ar-SA')}`}
          />
          <div className="text-left">
            <p className="text-[9px] font-black uppercase opacity-60">الفرق</p>
            <p dir="ltr" className="text-sm font-black font-mono">{formatCurrency(Math.abs(totalDr - totalCr))}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <ExcelTable columns={columns} data={data || []} colorTheme="blue" />
        <div className="p-3 bg-gray-50 dark:bg-slate-800/50 flex justify-between items-center border-t dark:border-slate-800">
          <span className="font-black text-[10px] text-gray-500">إجماليات الميزان</span>
          <div className="flex gap-6">
            <div className="text-left">
              <span className="text-[8px] font-black text-emerald-600 block">إجمالي مدين</span>
              <span dir="ltr" className="text-xs font-black font-mono text-emerald-700">{formatCurrency(totalDr)}</span>
            </div>
            <div className="text-left">
              <span className="text-[8px] font-black text-rose-600 block">إجمالي دائن</span>
              <span dir="ltr" className="text-xs font-black font-mono text-rose-700">{formatCurrency(totalCr)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialBalanceView;
