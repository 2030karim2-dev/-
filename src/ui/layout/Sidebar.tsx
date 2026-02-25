import React from 'react';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import SidebarLogo from './sidebar/SidebarLogo';
import SidebarNav from './sidebar/SidebarNav';
import SidebarFooter from './sidebar/SidebarFooter';
import { useTranslation } from '../../lib/hooks/useTranslation';
import { useI18nStore } from '../../lib/i18nStore';
import { cn } from '../../core/utils';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  toggleSidebar,
  isMobileOpen,
  onCloseMobile
}) => {
  const { t, dir } = useTranslation();

  const ChevronForward = dir === 'rtl' ? ChevronLeft : ChevronRight;
  const ChevronBack = dir === 'rtl' ? ChevronRight : ChevronLeft;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(`
          hidden md:flex flex-col
          fixed inset-y-0 z-20
          bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl h-screen border-gray-200 dark:border-slate-800
          transition-all duration-300 ease-in-out shadow-2xl shadow-gray-200/50 dark:shadow-slate-900/50`,
          dir === 'rtl' ? 'right-0 border-l' : 'left-0 border-r',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        <SidebarLogo isCollapsed={isCollapsed} />

        <div className="flex-1 flex flex-col overflow-hidden border-t dark:border-slate-800">
          <SidebarNav isCollapsed={isCollapsed} />
        </div>

        <SidebarFooter isCollapsed={isCollapsed} />

        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "absolute top-20 bg-slate-900 text-white w-7 h-7 flex items-center justify-center rounded-md shadow-lg hover:bg-black transition-colors z-30",
            dir === 'rtl' ? '-left-3.5' : '-right-3.5'
          )}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronForward size={10} strokeWidth={4} /> : <ChevronBack size={10} strokeWidth={4} />}
        </button>
      </aside>

      {/* Mobile Drawer */}
      <aside
        className={cn(
          `fixed inset-y-0 w-48 bg-white dark:bg-slate-900 h-screen flex flex-col border-gray-200 dark:border-slate-800 z-[100] 
          transform transition-transform duration-300 ease-out md:hidden shadow-2xl`,
          // Fix: In RTL, anchor to Right. In LTR, anchor to Left.
          dir === 'rtl' ? 'right-0 border-l' : 'left-0 border-r',
          // Fix: Slide from Right (+100%) in RTL, Slide from Left (-100%) in LTR
          isMobileOpen ? 'translate-x-0' : (dir === 'rtl' ? 'translate-x-full' : '-translate-x-full')
        )}
      >
        <div className="p-5 border-b dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-950/50">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">AL-ZAHRA ERP</span>
            <span className="text-[8px] font-bold text-gray-400 uppercase">Main Menu</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all active:scale-90"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <SidebarNav isCollapsed={false} />
        </div>

        <div className="bg-gray-50/50 dark:bg-slate-950/30">
          <SidebarFooter isCollapsed={false} />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;