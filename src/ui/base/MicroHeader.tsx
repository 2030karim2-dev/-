import React from 'react';
import { LucideIcon, ArrowRight, ArrowLeft, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../core/utils';
import { useTranslation } from '../../lib/hooks/useTranslation';

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface MicroHeaderProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  actions?: React.ReactNode;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (id: any) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  extraRow?: React.ReactNode;
}

const MicroHeader: React.FC<MicroHeaderProps> = ({
  title,
  icon: Icon,
  iconColor = "text-blue-600",
  actions,
  tabs,
  activeTab,
  onTabChange,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  extraRow
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { dir } = useTranslation();
  const isRoot = location.pathname === '/';

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <div className="sticky top-0 z-40 bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl border-b border-white/20 dark:border-slate-800 shadow-sm transition-all no-print supports-[backdrop-filter]:bg-white/50">
      <div className="max-w-[1600px] mx-auto">
        {/* Main Row */}
        <div className="flex h-10 md:h-14 items-center justify-between px-2 md:px-5">
          <div className="flex items-center gap-1.5 md:gap-2.5 overflow-hidden">
            {!isRoot && (
              <button onClick={() => navigate(-1)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-transform active:scale-90">
                <BackIcon size={16} className="text-gray-400" />
              </button>
            )}
            <div className="flex items-center gap-1.5 md:gap-2 bg-gray-50/50 dark:bg-slate-900/50 px-2 md:px-3 py-0.5 md:py-1 rounded-full border dark:border-slate-800">
              <Icon className={iconColor} size={12} />
              <h1 className="text-[10px] md:text-xs font-black text-gray-800 dark:text-slate-100 whitespace-nowrap uppercase tracking-tighter">{title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            {actions}
          </div>
        </div>

        {/* Tab Row - Micro Tabs */}
        {tabs && onTabChange && (
          <div className="flex px-2 md:px-4 gap-0.5 md:gap-1 overflow-x-auto no-scrollbar border-t border-gray-100 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-2 md:py-3 text-[9px] md:text-[11px] font-black transition-all border-b-2 -mb-px relative group overflow-hidden',
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50/60 dark:bg-blue-900/20'
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-900/40'
                )}
              >
                <tab.icon size={12} className={cn("md:!w-4 md:!h-4 transition-transform duration-300", activeTab === tab.id ? "scale-110" : "group-hover:scale-110")} />
                <span className="whitespace-nowrap uppercase tracking-widest translate-y-[0.5px]">{tab.label}</span>

                {/* Active Indicator Glow */}
                {activeTab === tab.id && (
                  <span className="absolute inset-0 bg-blue-500/5 pointer-events-none animate-in fade-in duration-300" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Dynamic Search/Filter Row */}
        {(onSearchChange || extraRow) && (
          <div className="p-2 md:p-3 flex items-center gap-2 md:gap-3 bg-gray-50/50 dark:bg-slate-900/30 border-t border-gray-100 dark:border-slate-800">
            {onSearchChange && (
              <div className="relative flex-1 group">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={14} />
                <input
                  type="text"
                  placeholder={searchPlaceholder || "بحث ذكي..."}
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-xl py-1.5 md:py-2.5 pr-10 md:pr-12 pl-4 md:pl-5 text-[10px] md:text-sm font-black md:font-bold outline-none focus:border-blue-500/20 transition-all"
                />
              </div>
            )}
            {extraRow}
          </div>
        )}
      </div>
    </div>
  );
};

export default MicroHeader;
