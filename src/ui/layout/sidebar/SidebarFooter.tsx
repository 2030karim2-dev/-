
import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '../../../features/auth/store';
import { useTranslation } from '../../../lib/hooks/useTranslation';

interface SidebarFooterProps {
  isCollapsed: boolean;
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({ isCollapsed }) => {
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();

  const initial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U';
  const name = user?.full_name || user?.email?.split('@')[0] || 'User';
  const role = user?.role || 'Staff';

  return (
    <div className="p-4 border-t border-gray-100 dark:border-slate-800 mt-auto">
      <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center flex-col' : ''} transition-all duration-300`}>
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
          {initial}
        </div>
        
        {!isCollapsed ? (
          <>
            <div className="flex flex-col overflow-hidden animate-in fade-in duration-300">
              <span className="text-sm font-bold text-gray-700 dark:text-slate-200 truncate" title={name}>{name}</span>
              <span className="text-[10px] text-gray-400 dark:text-slate-500 capitalize">{role}</span>
            </div>
            <button
              onClick={logout}
              className="mr-auto p-2 text-gray-400 hover:text-red-500 transition-colors"
              title={t('logout')}
            >
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <button 
            onClick={logout}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors mt-2"
            title={t('logout')}
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SidebarFooter;