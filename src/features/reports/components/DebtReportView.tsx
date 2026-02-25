
import React from 'react';
import { useDebtReport } from '../hooks';
import { formatCurrency } from '../../../core/utils';
import { TrendingUp, TrendingDown, Users, Share2 } from 'lucide-react';
import ShareButton from '../../../ui/common/ShareButton';
import ExcelTable from '../../../ui/common/ExcelTable';
import StatCard from '../../../ui/common/StatCard';

const DebtReportView: React.FC = () => {
  const { data, isLoading } = useDebtReport();

  if (isLoading) return <div className="p-20 text-center animate-pulse">جاري إعداد التقرير المالي...</div>;

  const columns = [
    { header: 'الجهة', accessor: (row: any) => <span className="font-bold text-gray-800 dark:text-slate-100">{row.name}</span> },
    { header: 'الرصيد المتبقي', accessor: (row: any) => <span dir="ltr" className={`font-black font-mono text-[10px] px-2 py-0.5 rounded ${row.remaining_amount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{formatCurrency(Math.abs(row.remaining_amount))}</span>, className: 'text-left' },
  ];

  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Mini Summary Cards */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          title="مستحقات لك (عملاء)"
          value={formatCurrency(data?.summary.receivables || 0)}
          icon={TrendingUp}
          colorClass="text-emerald-500"
          iconBgClass="bg-emerald-500"
        />

        <StatCard
          title="التزامات عليك (موردين)"
          value={formatCurrency(data?.summary.payables || 0)}
          icon={TrendingDown}
          colorClass="text-rose-500"
          iconBgClass="bg-rose-500"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-3 border-b dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50">
          <h4 className="font-black text-[9px] text-gray-500 uppercase flex items-center gap-2">
            <Users size={12} className="text-emerald-500" /> تحليل ديون العملاء النشطة
          </h4>
          <ShareButton
            size="sm"
            showLabel
            eventType="debt_report"
            title="مشاركة تقرير الديون"
            message={`📊 تقرير الديون\n━━━━━━━━━━━━━━\n✅ مستحقات (عملاء): ${formatCurrency(data?.summary.receivables || 0)}\n🔴 التزامات (موردين): ${formatCurrency(data?.summary.payables || 0)}\n\n👥 العملاء النشطون:\n${(data?.debts?.filter(d => d.remaining_amount > 0) || []).map((d: any) => `  • ${d.name}: ${formatCurrency(d.remaining_amount)}`).join('\n')}`}
          />
        </div>
        <div className="p-1">
          <ExcelTable columns={columns} data={data?.debts.filter(d => d.remaining_amount > 0) || []} colorTheme="green" />
        </div>
      </div>
    </div>
  );
};

export default DebtReportView;