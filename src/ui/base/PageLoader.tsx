
import React from 'react';
import { Car } from 'lucide-react';

const PageLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
    <div className="relative flex items-center justify-center w-24 h-24">
      <div className="absolute inset-0 border-4 border-blue-100 dark:border-blue-900/30 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-t-blue-600 rounded-full animate-spin"></div>
      <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-inner">
        <Car size={28} className="text-blue-600 animate-pulse" />
      </div>
    </div>
    <p className="mt-6 text-sm font-bold text-gray-500 dark:text-slate-400">جاري تحميل البيانات...</p>
  </div>
);

export default PageLoader;
