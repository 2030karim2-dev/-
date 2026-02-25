
import React from 'react';
import { useCurrencyDiffs } from '../hooks';
import { formatCurrency } from '../../../core/utils';
import { RefreshCw, TrendingUp, TrendingDown, Info } from 'lucide-react';
import ExcelTable from '../../../ui/common/ExcelTable';

const CurrencyDiffView: React.FC = () => {
  const { data, isLoading } = useCurrencyDiffs();

  if (isLoading) return <div className="p-20 text-center animate-pulse">جاري جرد أرصدة العملات الأجنبية...</div>;

  const totalDiff = data?.reduce((s: number, a: any) => s + a.unrealizedGain, 0) || 0;

  const columns = [
    { header: 'الحساب', accessor: (row: any) => <span className="font-bold">{row.name}</span> },
    { header: 'العملة', accessor: (row: any) => <span className="font-mono text-indigo-600 font-black">{row.currency_code}</span>, width: 'w-24' },
    { header: 'الرصيد بالعملة', accessor: (row: any) => <span dir="ltr" className="font-mono font-bold">{row.balance.toLocaleString()}</span>, className: 'text-left' },
    {
      header: 'أرباح/خسائر فروق الصرف',
      accessor: (row: any) => (
        <span dir="ltr" className={`font-black font-mono ${row.unrealizedGain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {row.unrealizedGain >= 0 ? '+' : ''}{formatCurrency(row.unrealizedGain)}
        </span>
      ),
      className: 'text-left bg-gray-50/50 dark:bg-slate-800'
    },
  ];

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-400 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="col-span-1 md:col-span-2 bg-white dark:bg-slate-900 p-4 rounded-lg border dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg flex items-center justify-center">
            <RefreshCw size={24} />
          </div>
          <div>
            <h3 className="font-black text-sm text-gray-800 dark:text-slate-100">فروق تحويل العملات</h3>
            <p className="text-[9px] font-bold text-gray-400 leading-relaxed">يتم حساب هذا التقرير بناءً على أسعار الصرف الحالية.</p>
          </div>
        </div>
        <div className={`p-4 rounded-lg border-2 shadow-lg flex flex-col justify-center ${totalDiff >= 0 ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-rose-600 border-rose-500 text-white'}`}>
          <span className="text-[9px] font-black uppercase opacity-70 mb-1 tracking-widest text-center">صافي فروق الصرف</span>
          <p dir="ltr" className="text-xl font-black font-mono text-center">
            {totalDiff >= 0 ? '+' : ''}{formatCurrency(totalDiff)}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-800 overflow-hidden shadow-sm">
        <ExcelTable columns={columns} data={data || []} colorTheme="blue" />
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-800/30 flex gap-2">
        <Info className="text-amber-600" size={16} />
        <p className="text-[9px] font-bold text-amber-800 dark:text-amber-400 leading-relaxed">
          تنبيه: هذه الأرباح/الخسائر "غير محققة" (Unrealized) وتعبر عن القيمة الحالية للأرصدة إذا تم تحويلها اليوم للريال السعودي.
        </p>
      </div>
    </div>
  );
};

export default CurrencyDiffView;