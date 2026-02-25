
import React from 'react';
import { useProducts } from '../../inventory/hooks';
import { valuationService } from '../../inventory/services/valuationService';
import { formatCurrency } from '../../../core/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Wallet, TrendingUp, ShieldCheck, Box, PieChart, Coins, Target, Activity } from 'lucide-react';
import { useThemeStore } from '@/lib/themeStore';
import { cn } from '@/core/utils';

const InventoryValuationView: React.FC = () => {
  const { products, isLoading } = useProducts();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  if (isLoading) return (
    <div className="h-96 flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-slate-200 dark:border-slate-800">
      <div className="relative">
        <Box size={48} className="text-blue-500 animate-bounce" />
        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
      </div>
      <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">جاري تقييم الأصول المخزنية...</p>
    </div>
  );

  const costValue = valuationService.getTotalValueAtCost(products);
  const marketValue = valuationService.getTotalMarketValue(products);
  const profit = marketValue - costValue;

  const chartData = [
    { name: 'قيمة التكلفة', value: costValue, color: '#3b82f6' },
    { name: 'القيمة السوقية', value: marketValue, color: '#10b981' },
    { name: 'الربح المتوقع', value: profit, color: '#f59e0b' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-500/30 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
          <div className="absolute top-0 right-0 p-6 opacity-20 transform group-hover:rotate-12 transition-transform duration-500">
            <Wallet size={80} />
          </div>
          <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em] mb-3">قيمة المخزون (بالتكلفة)</p>
          <h2 dir="ltr" className="text-4xl font-black font-mono tracking-tighter mb-4">{formatCurrency(costValue)}</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-white/10 px-3 py-1 rounded-full font-bold">إجمالي رأس المال المستثمر</span>
          </div>
          <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-emerald-500/30 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
          <div className="absolute top-0 right-0 p-6 opacity-20 transform group-hover:rotate-12 transition-transform duration-500">
            <Coins size={80} />
          </div>
          <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em] mb-3">القيمة السوقية المتوقعة</p>
          <h2 dir="ltr" className="text-4xl font-black font-mono tracking-tighter mb-4">{formatCurrency(marketValue)}</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-white/10 px-3 py-1 rounded-full font-bold">تقدير سعر البيع الحالي</span>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500 border border-slate-800">
          <div className="absolute bottom-0 right-0 p-6 opacity-10 transform group-hover:-translate-y-2 transition-transform duration-500">
            <TrendingUp size={100} />
          </div>
          <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] mb-3">إجمالي هامش الربح</p>
          <h2 dir="ltr" className="text-4xl font-black font-mono tracking-tighter text-amber-500 mb-4">+{formatCurrency(profit)}</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full font-black">العائد المتوقع على المخزون</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 p-10 flex flex-col lg:flex-row gap-12 items-center shadow-xl">
        <div className="flex-[1.2] w-full h-[320px] relative">
          <div className="absolute top-0 left-0 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">توزيع القيم المالية</div>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={320}>
            <BarChart data={chartData} margin={{ top: 40, right: 20, left: 20, bottom: 0 }}>
              <defs>
                {chartData.map((entry, index) => (
                  <linearGradient key={`barGrad-${index}`} id={`barGrad-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                    <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} dy={5} />
              <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-4 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{payload[0].payload.name}</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white font-mono">{formatCurrency(payload[0].value)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar activeBar={{ opacity: 0.8 }} dataKey="value" radius={[12, 12, 12, 12]} barSize={60}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`url(#barGrad-${index})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-8 w-full">
          <div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl">
                <ShieldCheck className="text-emerald-500" size={24} />
              </div>
              تحليل سلامة المخزون
            </h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
              بناءً على الأرقام الحالية، تبلغ قيمة أصولك المخزنية <span className="text-slate-900 dark:text-white font-black">{formatCurrency(costValue)}</span>.
              إن بيع هذه الكميات بالأسعار المحددة سيولد لك هامش ربح إجمالي قدره <span className="text-emerald-500 font-black font-mono">%{((profit / marketValue) * 100).toFixed(1)}</span>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 group hover:border-blue-500/50 transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <Target className="text-blue-500" size={16} />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الأصناف النشطة</span>
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">{products.length} <span className="text-xs text-slate-400">صنف</span></span>
            </div>
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-200/50 dark:border-slate-700/50 group hover:border-emerald-500/50 transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <Activity className="text-emerald-500" size={16} />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">دقة التقييم</span>
              </div>
              <span className="text-xl font-black text-emerald-500 font-mono">100% <span className="text-xs text-slate-400 italic font-medium">مؤكد</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryValuationView;