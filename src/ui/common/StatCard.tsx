
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
  } | undefined;
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
    <div className="bg-[var(--app-surface)] p-4 rounded-xl border border-[var(--app-border)] shadow-sm transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:shadow-md hover:border-blue-500/20">
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[var(--app-text-secondary)] leading-none mb-1.5">
            {title}
          </span>
          <h3 className={cn("text-2xl font-bold font-mono leading-none tracking-tight truncate", colorClass)}>
            {value}
          </h3>
        </div>
        <div className={cn("p-2 rounded-lg transition-transform group-hover:scale-110", iconBgClass + " bg-opacity-10")}>
          <Icon size={18} className={colorClass} />
        </div>
      </div>

      {(subtext || trend) && (
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--app-border)]">
          <span className="text-[10px] font-medium text-[var(--app-text-secondary)] truncate max-w-[60%]">
            {subtext}
          </span>
          {trend && (
            <span className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
              trend.isPositive ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800" : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800"
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
