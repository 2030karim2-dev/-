
import React from 'react';
import { useProfitAndLoss } from '../hooks';
import { formatCurrency } from '../../../core/utils';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, PieChart } from 'lucide-react';
import { cn } from '../../../core/utils';
import ShareButton from '../../../ui/common/ShareButton';

const ProfitLossView: React.FC = () => {
   const { data, isLoading } = useProfitAndLoss();

   if (isLoading) return <div className="p-20 text-center animate-pulse">جاري تحليل الأداء المالي...</div>;

   const isProfit = data?.netProfit! >= 0;
   const totalRevenues = data?.revenues.reduce((s: number, r: any) => s + Math.abs(r.netBalance), 0) || 0;
   const totalExpenses = data?.expenses.reduce((s: number, r: any) => s + Math.abs(r.netBalance), 0) || 0;

   return (
      <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
         {/* Compact Hero Stat */}
         <div className={cn(
            "relative overflow-hidden rounded-lg p-4 text-white shadow-xl flex items-center justify-between",
            isProfit ? "bg-slate-900 border-r-4 border-emerald-500" : "bg-rose-900 border-r-4 border-rose-500"
         )}>
            <div className="relative z-10 flex items-center gap-3">
               <div className={cn("p-2 rounded-md", isProfit ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-rose-300")}>
                  <DollarSign size={20} />
               </div>
               <div>
                  <h2 className="text-sm font-black tracking-tight">{isProfit ? 'صافي أرباح الفترة' : 'صافي الخسائر'}</h2>
                  <p className="text-[8px] font-bold opacity-60 flex items-center gap-1">
                     <TrendingUp size={10} /> تحديث مالي لحظي
                  </p>
               </div>
            </div>
            <div className="flex items-center gap-3 relative z-10">
               <ShareButton
                  size="sm"
                  eventType="profit_loss"
                  title="مشاركة تقرير الأرباح"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                  message={`📊 تقرير الأرباح والخسائر\n━━━━━━━━━━━━━━\n📗 إجمالي الإيرادات: ${formatCurrency(totalRevenues)}\n📕 إجمالي المصروفات: ${formatCurrency(totalExpenses)}\n${isProfit ? '✅' : '🔴'} صافي ${isProfit ? 'الربح' : 'الخسارة'}: ${formatCurrency(Math.abs(data?.netProfit || 0))}\n📅 التاريخ: ${new Date().toLocaleDateString('ar-SA')}`}
               />
               <div className="text-left">
                  <span dir="ltr" className={cn("text-xl font-black font-mono tracking-tighter", isProfit ? "text-emerald-400" : "text-rose-400")}>
                     {formatCurrency(Math.abs(data?.netProfit || 0))}
                  </span>
                  <span className="text-[9px] font-bold ml-1 opacity-50">ر.ي</span>
               </div>
            </div>
            <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-white/5 rounded-full blur-2xl"></div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-emerald-50 dark:border-emerald-950 p-3">
               <div className="flex justify-between items-center mb-2 pb-2 border-b dark:border-slate-800">
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">الإيرادات</span>
                  <span dir="ltr" className="text-xs font-black font-mono text-gray-800 dark:text-slate-100">{formatCurrency(data?.totalRevenues || 0)}</span>
               </div>
               <div className="space-y-1">
                  {data?.revenues.slice(0, 3).map(rev => (
                     <div key={rev.id} className="flex justify-between text-[9px] font-bold text-gray-500">
                        <span>{rev.name}</span>
                        <span dir="ltr" className="font-mono">{formatCurrency(Math.abs(rev.netBalance))}</span>
                     </div>
                  ))}
               </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg border border-rose-50 dark:border-rose-950 p-3">
               <div className="flex justify-between items-center mb-2 pb-2 border-b dark:border-slate-800">
                  <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">المصروفات</span>
                  <span dir="ltr" className="text-xs font-black font-mono text-gray-800 dark:text-slate-100">{formatCurrency(data?.totalExpenses || 0)}</span>
               </div>
               <div className="space-y-1">
                  {data?.expenses.slice(0, 3).map(exp => (
                     <div key={exp.id} className="flex justify-between text-[9px] font-bold text-gray-500">
                        <span>{exp.name}</span>
                        <span dir="ltr" className="font-mono">{formatCurrency(Math.abs(exp.netBalance))}</span>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
   );
};

export default ProfitLossView;