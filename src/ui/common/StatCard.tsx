
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../core/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  colorClass: string;
  iconBgClass: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtext, 
  icon: Icon, 
  colorClass, 
  iconBgClass,
  trend 
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-none border border-gray-100 dark:border-slate-800 shadow-sm transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:shadow-md hover:border-blue-500/10">
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5 opacity-70">
            {title}
          </span>
          <h3 className={cn("text-2xl font-black font-mono leading-none tracking-tighter truncate", colorClass)}>
            {value}
          </h3>
        </div>
        <div className={cn("p-2 rounded-none transition-transform group-hover:scale-110", iconBgClass + " bg-opacity-10")}>
          <Icon size={18} className={colorClass} />
        </div>
      </div>
      
      {(subtext || trend) && (
        <div className="flex items-center justify-between mt-3 pt-2 border-t dark:border-slate-800/50">
          <span className="text-[8px] font-black text-gray-400 dark:text-slate-500 truncate max-w-[60%] uppercase tracking-tighter">
            {subtext}
          </span>
          {trend && (
            <span className={cn(
              "text-[8px] font-black px-1.5 py-0.5 rounded-none border",
              trend.isPositive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
            )}>
              {trend.isPositive ? '↑' : '↓'} {trend.value.toFixed(0)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
