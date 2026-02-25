
import React from 'react';
import { cn } from '../../core/utils';

interface ChartBoxProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const ChartBox: React.FC<ChartBoxProps> = ({ title, children, className }) => {
  return (
    <div className={cn("bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800", className)}>
      <h3 className="text-md font-bold text-gray-800 dark:text-slate-200 mb-4">{title}</h3>
      {children}
    </div>
  );
};

export default ChartBox;
